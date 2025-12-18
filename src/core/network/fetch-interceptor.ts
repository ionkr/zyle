import type { NetworkRequest } from '../../types';
import { generateId } from '../../utils/helpers';
import { isDevToolsRequest } from './types';

export interface FetchInterceptorCallbacks {
  processHeaders: (headers: Record<string, string> | undefined) => Record<string, string>;
  processBody: (body: unknown) => unknown;
  addRequest: (request: NetworkRequest) => void;
  updateRequest: (request: NetworkRequest) => void;
  extractHeaders: (headers?: HeadersInit | Headers) => Record<string, string>;
}

/**
 * Fetch API 인터셉터
 */
export function createFetchInterceptor(
  callbacks: FetchInterceptorCallbacks,
  filterDevToolsRequests: boolean
): {
  install: () => void;
  restore: () => void;
} {
  let originalFetch: typeof fetch | null = null;

  function install(): void {
    originalFetch = window.fetch.bind(window);

    window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      const url = input instanceof Request ? input.url : input.toString();

      // 개발 도구 요청 필터링
      if (filterDevToolsRequests && isDevToolsRequest(url)) {
        return originalFetch!(input, init);
      }

      const requestId = generateId();
      const method = init?.method || (input instanceof Request ? input.method : 'GET');

      // 요청 시작 기록
      const request: NetworkRequest = {
        id: requestId,
        method: method.toUpperCase(),
        url,
        startTime: Date.now(),
        requestHeaders: callbacks.processHeaders(callbacks.extractHeaders(init?.headers)),
        requestBody: callbacks.processBody(init?.body),
        requestStatus: 'pending',
      };

      callbacks.addRequest(request);

      try {
        const response = await originalFetch!(input, init);

        // 응답 기록
        request.endTime = Date.now();
        request.status = response.status;
        request.statusText = response.statusText;
        request.responseHeaders = callbacks.processHeaders(callbacks.extractHeaders(response.headers));
        request.requestStatus = response.ok ? 'success' : 'error';

        // 응답 바디 캡처 (복제해서 읽기)
        const clonedResponse = response.clone();
        try {
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            request.responseBody = callbacks.processBody(await clonedResponse.json());
          } else if (contentType.includes('text/')) {
            request.responseBody = await clonedResponse.text();
          }
        } catch {
          // 응답 바디 파싱 실패 무시
        }

        callbacks.updateRequest(request);

        return response;
      } catch (error) {
        // 에러 기록
        request.endTime = Date.now();
        request.error = error instanceof Error ? error : new Error(String(error));
        request.requestStatus = error instanceof DOMException && error.name === 'AbortError' ? 'aborted' : 'error';

        callbacks.updateRequest(request);

        throw error;
      }
    };
  }

  function restore(): void {
    if (originalFetch) {
      window.fetch = originalFetch;
      originalFetch = null;
    }
  }

  return { install, restore };
}
