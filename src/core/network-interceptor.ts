import type { NetworkRequest, NetworkRequestStatus } from '../types';
import { sanitizeHeaders, sanitizeBody, type SanitizeOptions } from '../utils/sanitizer';
import { ANALYSIS_CONSTANTS } from '../constants';

// 분리된 네트워크 모듈
import { type NetworkInterceptorOptions } from './network/types';
import { createFetchInterceptor } from './network/fetch-interceptor';
import { createXHRInterceptor } from './network/xhr-interceptor';

// 하위 호환성을 위해 re-export
export type { NetworkInterceptorOptions } from './network/types';

/**
 * 네트워크 요청 인터셉터
 * fetch와 XMLHttpRequest를 오버라이드하여 네트워크 요청을 캡처합니다.
 *
 * 리팩토링: 핵심 로직을 network/ 디렉토리로 분리
 * - types.ts: 타입 및 URL 패턴 정의
 * - fetch-interceptor.ts: Fetch API 인터셉션
 * - xhr-interceptor.ts: XHR 인터셉션
 */
export class NetworkInterceptor {
  private requests: Map<string, NetworkRequest> = new Map();
  private maxRequests: number;
  private isIntercepting = false;
  private listeners: Set<(request: NetworkRequest) => void> = new Set();

  // 민감 정보 필터링 설정
  private sanitizeEnabled: boolean;
  private sanitizeOptions: SanitizeOptions;

  // 개발 도구 요청 필터링
  private filterDevToolsRequests: boolean;

  // 인터셉터 인스턴스
  private fetchInterceptor: ReturnType<typeof createFetchInterceptor> | null = null;
  private xhrInterceptor: ReturnType<typeof createXHRInterceptor> | null = null;

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

    // 콜백 객체 생성
    const callbacks = {
      processHeaders: this.processHeaders.bind(this),
      processBody: this.processBody.bind(this),
      addRequest: this.addRequest.bind(this),
      updateRequest: this.updateRequest.bind(this),
      extractHeaders: this.extractHeaders.bind(this),
      parseXHRHeaders: this.parseXHRHeaders.bind(this),
    };

    // Fetch 인터셉터 설치
    this.fetchInterceptor = createFetchInterceptor(callbacks, this.filterDevToolsRequests);
    this.fetchInterceptor.install();

    // XHR 인터셉터 설치
    this.xhrInterceptor = createXHRInterceptor(callbacks, this.filterDevToolsRequests);
    this.xhrInterceptor.install();

    this.isIntercepting = true;
  }

  /**
   * 네트워크 인터셉트 중지
   */
  stop(): void {
    if (!this.isIntercepting) return;

    this.fetchInterceptor?.restore();
    this.fetchInterceptor = null;

    this.xhrInterceptor?.restore();
    this.xhrInterceptor = null;

    this.isIntercepting = false;
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

    // 최대 개수 초과 시 오래된 요청 제거
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
