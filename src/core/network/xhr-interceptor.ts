import type { NetworkRequest } from '../../types';
import { generateId } from '../../utils/helpers';
import { isDevToolsRequest } from './types';

export interface XHRInterceptorCallbacks {
  processHeaders: (headers: Record<string, string> | undefined) => Record<string, string>;
  processBody: (body: unknown) => unknown;
  addRequest: (request: NetworkRequest) => void;
  updateRequest: (request: NetworkRequest) => void;
  parseXHRHeaders: (headersString: string) => Record<string, string>;
}

/**
 * XMLHttpRequest 인터셉터
 */
export function createXHRInterceptor(
  callbacks: XHRInterceptorCallbacks,
  filterDevToolsRequests: boolean
): {
  install: () => void;
  restore: () => void;
} {
  let originalOpen: typeof XMLHttpRequest.prototype.open | null = null;
  let originalSend: typeof XMLHttpRequest.prototype.send | null = null;

  function install(): void {
    // open 메서드 인터셉트
    originalOpen = XMLHttpRequest.prototype.open;
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

      return originalOpen!.call(this, method, url, async, username ?? undefined, password ?? undefined);
    };

    // send 메서드 인터셉트
    originalSend = XMLHttpRequest.prototype.send;
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
      if (filterDevToolsRequests && isDevToolsRequest(url)) {
        return originalSend!.call(this, body);
      }

      if (requestId) {
        // 요청 시작 기록
        const request: NetworkRequest = {
          id: requestId,
          method: method.toUpperCase(),
          url,
          startTime: Date.now(),
          requestHeaders: {},
          requestBody: callbacks.processBody(body),
          requestStatus: 'pending',
        };

        callbacks.addRequest(request);

        // 이벤트 리스너 추가
        xhr.addEventListener('load', function () {
          request.endTime = Date.now();
          request.status = xhr.status;
          request.statusText = xhr.statusText;
          request.responseHeaders = callbacks.processHeaders(callbacks.parseXHRHeaders(xhr.getAllResponseHeaders()));
          request.requestStatus = xhr.status >= 200 && xhr.status < 300 ? 'success' : 'error';

          // 응답 바디 캡처
          try {
            if (xhr.responseType === '' || xhr.responseType === 'text') {
              const contentType = xhr.getResponseHeader('content-type') || '';
              if (contentType.includes('application/json')) {
                request.responseBody = callbacks.processBody(JSON.parse(xhr.responseText));
              } else {
                request.responseBody = xhr.responseText;
              }
            } else if (xhr.responseType === 'json') {
              request.responseBody = callbacks.processBody(xhr.response);
            }
          } catch {
            // 응답 바디 파싱 실패 무시
          }

          callbacks.updateRequest(request);
        });

        xhr.addEventListener('error', function () {
          request.endTime = Date.now();
          request.error = new Error('Network error');
          request.requestStatus = 'error';
          callbacks.updateRequest(request);
        });

        xhr.addEventListener('timeout', function () {
          request.endTime = Date.now();
          request.error = new Error('Request timeout');
          request.requestStatus = 'timeout';
          callbacks.updateRequest(request);
        });

        xhr.addEventListener('abort', function () {
          request.endTime = Date.now();
          request.requestStatus = 'aborted';
          callbacks.updateRequest(request);
        });
      }

      return originalSend!.call(this, body);
    };
  }

  function restore(): void {
    if (originalOpen) {
      XMLHttpRequest.prototype.open = originalOpen;
      originalOpen = null;
    }

    if (originalSend) {
      XMLHttpRequest.prototype.send = originalSend;
      originalSend = null;
    }
  }

  return { install, restore };
}
