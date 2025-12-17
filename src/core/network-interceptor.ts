import type { NetworkRequest, NetworkRequestStatus } from '../types';
import { generateId } from '../utils/helpers';
import { sanitizeHeaders, sanitizeBody, type SanitizeOptions } from '../utils/sanitizer';
import { ANALYSIS_CONSTANTS } from '../constants';

/**
 * 네트워크 인터셉터 옵션
 */
export interface NetworkInterceptorOptions {
  /** 최대 요청 저장 개수 */
  maxRequests?: number;
  /** 민감 정보 필터링 활성화 */
  sanitize?: boolean;
  /** 민감 정보 필터링 옵션 */
  sanitizeOptions?: SanitizeOptions;
  /** 개발 도구 요청 필터링 (소스맵, HMR 등) - 기본값 true */
  filterDevToolsRequests?: boolean;
}

/**
 * 개발 도구 관련 URL 패턴 (필터링 대상)
 */
const DEV_TOOLS_URL_PATTERNS = [
  /\.map(\?.*)?$/i, // 소스맵 파일
  /node_modules\/\.vite\//i, // Vite 개발 의존성
  /__vite_ping/i, // Vite HMR ping
  /\/@vite\//i, // Vite 내부 요청
  /\/@react-refresh/i, // React Fast Refresh
  /hot-update\.(js|json)/i, // Webpack HMR
  /__webpack_hmr/i, // Webpack HMR
  /sockjs-node/i, // 개발 서버 WebSocket
];

/**
 * 네트워크 요청 인터셉터
 * fetch와 XMLHttpRequest를 오버라이드하여 네트워크 요청을 캡처합니다.
 */
export class NetworkInterceptor {
  private originalFetch: typeof fetch | null = null;
  private originalXHROpen: typeof XMLHttpRequest.prototype.open | null = null;
  private originalXHRSend: typeof XMLHttpRequest.prototype.send | null = null;
  private requests: Map<string, NetworkRequest> = new Map();
  private maxRequests: number;
  private isIntercepting = false;
  private listeners: Set<(request: NetworkRequest) => void> = new Set();

  // 민감 정보 필터링 설정
  private sanitizeEnabled: boolean;
  private sanitizeOptions: SanitizeOptions;

  // 개발 도구 요청 필터링
  private filterDevToolsRequests: boolean;

  constructor(options: NetworkInterceptorOptions | number = {}) {
    // 하위 호환성: 숫자 파라미터는 maxRequests로 처리
    const opts = typeof options === 'number' ? { maxRequests: options } : options;

    this.maxRequests = opts.maxRequests ?? ANALYSIS_CONSTANTS.DEFAULT_MAX_NETWORK_REQUESTS;
    this.sanitizeEnabled = opts.sanitize ?? true;
    this.sanitizeOptions = opts.sanitizeOptions ?? {};
    this.filterDevToolsRequests = opts.filterDevToolsRequests ?? true;
  }

  /**
   * 개발 도구 요청 필터링 설정
   */
  setFilterDevToolsRequests(enabled: boolean): void {
    this.filterDevToolsRequests = enabled;
  }

  /**
   * URL이 개발 도구 요청인지 확인
   */
  private isDevToolsRequest(url: string): boolean {
    return DEV_TOOLS_URL_PATTERNS.some((pattern) => pattern.test(url));
  }

  /**
   * 민감 정보 필터링 설정
   */
  setSanitizeEnabled(enabled: boolean): void {
    this.sanitizeEnabled = enabled;
  }

  /**
   * 민감 정보 필터링 옵션 설정
   */
  setSanitizeOptions(options: SanitizeOptions): void {
    this.sanitizeOptions = options;
  }

  /**
   * 네트워크 인터셉트 시작
   */
  start(): void {
    if (this.isIntercepting) return;

    this.interceptFetch();
    this.interceptXHR();

    this.isIntercepting = true;
  }

  /**
   * 네트워크 인터셉트 중지
   */
  stop(): void {
    if (!this.isIntercepting) return;

    // 원본 fetch 복원
    if (this.originalFetch) {
      window.fetch = this.originalFetch;
      this.originalFetch = null;
    }

    // 원본 XHR 복원
    if (this.originalXHROpen) {
      XMLHttpRequest.prototype.open = this.originalXHROpen;
      this.originalXHROpen = null;
    }

    if (this.originalXHRSend) {
      XMLHttpRequest.prototype.send = this.originalXHRSend;
      this.originalXHRSend = null;
    }

    this.isIntercepting = false;
  }

  /**
   * fetch API 인터셉트
   */
  private interceptFetch(): void {
    this.originalFetch = window.fetch.bind(window);
    const self = this;

    window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      const url = input instanceof Request ? input.url : input.toString();

      // 개발 도구 요청 필터링
      if (self.filterDevToolsRequests && self.isDevToolsRequest(url)) {
        return self.originalFetch!(input, init);
      }

      const requestId = generateId();
      const method = init?.method || (input instanceof Request ? input.method : 'GET');

      // 요청 시작 기록
      const request: NetworkRequest = {
        id: requestId,
        method: method.toUpperCase(),
        url,
        startTime: Date.now(),
        requestHeaders: self.processHeaders(self.extractHeaders(init?.headers)),
        requestBody: self.processBody(init?.body),
        requestStatus: 'pending',
      };

      self.addRequest(request);

      try {
        const response = await self.originalFetch!(input, init);

        // 응답 기록
        request.endTime = Date.now();
        request.status = response.status;
        request.statusText = response.statusText;
        request.responseHeaders = self.processHeaders(self.extractHeaders(response.headers));
        request.requestStatus = response.ok ? 'success' : 'error';

        // 응답 바디 캡처 (복제해서 읽기)
        const clonedResponse = response.clone();
        try {
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            request.responseBody = self.processBody(await clonedResponse.json());
          } else if (contentType.includes('text/')) {
            request.responseBody = await clonedResponse.text();
          }
        } catch {
          // 응답 바디 파싱 실패 무시
        }

        self.updateRequest(request);

        return response;
      } catch (error) {
        // 에러 기록
        request.endTime = Date.now();
        request.error = error instanceof Error ? error : new Error(String(error));
        request.requestStatus = error instanceof DOMException && error.name === 'AbortError' ? 'aborted' : 'error';

        self.updateRequest(request);

        throw error;
      }
    };
  }

  /**
   * XMLHttpRequest 인터셉트
   */
  private interceptXHR(): void {
    const self = this;

    // open 메서드 인터셉트
    this.originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (
      method: string,
      url: string | URL,
      async: boolean = true,
      username?: string | null,
      password?: string | null
    ): void {
      const xhr = this as XMLHttpRequest & {
        _zyleRequestId?: string;
        _zyleMethod?: string;
        _zyleUrl?: string;
      };

      xhr._zyleRequestId = generateId();
      xhr._zyleMethod = method;
      xhr._zyleUrl = url.toString();

      return self.originalXHROpen!.call(this, method, url, async, username ?? undefined, password ?? undefined);
    };

    // send 메서드 인터셉트
    this.originalXHRSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function (body?: Document | XMLHttpRequestBodyInit | null): void {
      const xhr = this as XMLHttpRequest & {
        _zyleRequestId?: string;
        _zyleMethod?: string;
        _zyleUrl?: string;
      };

      const requestId = xhr._zyleRequestId;
      const method = xhr._zyleMethod || 'GET';
      const url = xhr._zyleUrl || '';

      // 개발 도구 요청 필터링
      if (self.filterDevToolsRequests && self.isDevToolsRequest(url)) {
        return self.originalXHRSend!.call(this, body);
      }

      if (requestId) {
        // 요청 시작 기록
        const request: NetworkRequest = {
          id: requestId,
          method: method.toUpperCase(),
          url,
          startTime: Date.now(),
          requestHeaders: {},
          requestBody: self.processBody(body),
          requestStatus: 'pending',
        };

        self.addRequest(request);

        // 이벤트 리스너 추가
        xhr.addEventListener('load', function () {
          request.endTime = Date.now();
          request.status = xhr.status;
          request.statusText = xhr.statusText;
          request.responseHeaders = self.processHeaders(self.parseXHRHeaders(xhr.getAllResponseHeaders()));
          request.requestStatus = xhr.status >= 200 && xhr.status < 300 ? 'success' : 'error';

          // 응답 바디 캡처
          try {
            if (xhr.responseType === '' || xhr.responseType === 'text') {
              const contentType = xhr.getResponseHeader('content-type') || '';
              if (contentType.includes('application/json')) {
                request.responseBody = self.processBody(JSON.parse(xhr.responseText));
              } else {
                request.responseBody = xhr.responseText;
              }
            } else if (xhr.responseType === 'json') {
              request.responseBody = self.processBody(xhr.response);
            }
          } catch {
            // 응답 바디 파싱 실패 무시
          }

          self.updateRequest(request);
        });

        xhr.addEventListener('error', function () {
          request.endTime = Date.now();
          request.error = new Error('Network error');
          request.requestStatus = 'error';
          self.updateRequest(request);
        });

        xhr.addEventListener('timeout', function () {
          request.endTime = Date.now();
          request.error = new Error('Request timeout');
          request.requestStatus = 'timeout';
          self.updateRequest(request);
        });

        xhr.addEventListener('abort', function () {
          request.endTime = Date.now();
          request.requestStatus = 'aborted';
          self.updateRequest(request);
        });
      }

      return self.originalXHRSend!.call(this, body);
    };
  }

  /**
   * 헤더 처리 (민감 정보 필터링)
   */
  private processHeaders(headers: Record<string, string> | undefined): Record<string, string> {
    if (!headers) return {};
    if (!this.sanitizeEnabled) return headers;
    return sanitizeHeaders(headers, this.sanitizeOptions) ?? {};
  }

  /**
   * 바디 처리 (민감 정보 필터링)
   */
  private processBody(body: unknown): unknown {
    if (!body) return body;
    if (!this.sanitizeEnabled) return body;
    return sanitizeBody(body, this.sanitizeOptions);
  }

  /**
   * 헤더 추출
   */
  private extractHeaders(headers?: HeadersInit | Headers): Record<string, string> {
    const result: Record<string, string> = {};

    if (!headers) return result;

    if (headers instanceof Headers) {
      headers.forEach((value, key) => {
        result[key] = value;
      });
    } else if (Array.isArray(headers)) {
      for (const [key, value] of headers) {
        result[key] = value;
      }
    } else {
      Object.assign(result, headers);
    }

    return result;
  }

  /**
   * XHR 헤더 문자열 파싱
   */
  private parseXHRHeaders(headersString: string): Record<string, string> {
    const result: Record<string, string> = {};
    const lines = headersString.trim().split(/[\r\n]+/);

    for (const line of lines) {
      const parts = line.split(': ');
      const key = parts.shift();
      const value = parts.join(': ');
      if (key) {
        result[key.toLowerCase()] = value;
      }
    }

    return result;
  }

  /**
   * 요청 추가 (최적화: slice 사용)
   */
  private addRequest(request: NetworkRequest): void {
    this.requests.set(request.id, request);

    // 최대 개수 초과 시 오래된 요청 제거 (slice 사용으로 최적화)
    if (this.requests.size > this.maxRequests) {
      const keys = Array.from(this.requests.keys());
      const keysToDelete = keys.slice(0, keys.length - this.maxRequests);
      for (const key of keysToDelete) {
        this.requests.delete(key);
      }
    }

    this.notifyListeners(request);
  }

  /**
   * 요청 업데이트
   */
  private updateRequest(request: NetworkRequest): void {
    this.requests.set(request.id, request);
    this.notifyListeners(request);
  }

  /**
   * 리스너에게 알림
   */
  private notifyListeners(request: NetworkRequest): void {
    for (const listener of this.listeners) {
      listener(request);
    }
  }

  /**
   * 요청 변경 리스너 등록
   */
  onRequest(callback: (request: NetworkRequest) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * 모든 요청 가져오기
   */
  getRequests(): NetworkRequest[] {
    return Array.from(this.requests.values());
  }

  /**
   * 특정 상태의 요청만 가져오기
   */
  getRequestsByStatus(status: NetworkRequestStatus): NetworkRequest[] {
    return this.getRequests().filter((req) => req.requestStatus === status);
  }

  /**
   * 에러 요청만 가져오기
   */
  getFailedRequests(): NetworkRequest[] {
    return this.getRequests().filter((req) => req.requestStatus === 'error' || req.requestStatus === 'timeout');
  }

  /**
   * 특정 URL 패턴에 해당하는 요청 가져오기
   */
  getRequestsByUrlPattern(pattern: RegExp): NetworkRequest[] {
    return this.getRequests().filter((req) => pattern.test(req.url));
  }

  /**
   * ID로 요청 가져오기
   */
  getRequestById(id: string): NetworkRequest | undefined {
    return this.requests.get(id);
  }

  /**
   * 요청 초기화
   */
  clear(): void {
    this.requests.clear();
  }

  /**
   * 인터셉트 상태 확인
   */
  isActive(): boolean {
    return this.isIntercepting;
  }

  /**
   * 요청 개수
   */
  getRequestCount(): number {
    return this.requests.size;
  }

  /**
   * 상태별 요청 개수
   */
  getRequestCountByStatus(): Record<NetworkRequestStatus, number> {
    const counts: Record<NetworkRequestStatus, number> = {
      pending: 0,
      success: 0,
      error: 0,
      timeout: 0,
      aborted: 0,
    };

    for (const request of this.requests.values()) {
      counts[request.requestStatus]++;
    }

    return counts;
  }

  /**
   * 특정 시간 내에 실패한 요청 찾기 (에러와의 연관성 분석용)
   */
  getRecentFailedRequests(withinMs = 1000): NetworkRequest[] {
    const now = Date.now();
    return this.getFailedRequests().filter((req) => {
      const endTime = req.endTime || req.startTime;
      return now - endTime <= withinMs;
    });
  }
}
