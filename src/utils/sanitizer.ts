import { SENSITIVE_PATTERNS } from '../constants';

/**
 * 민감 정보 필터링 및 XSS 방어 유틸리티
 * 네트워크 요청/응답에서 민감한 정보를 마스킹하고,
 * HTML 출력 시 XSS 공격을 방지합니다.
 */

// ============================================
// XSS 방어 유틸리티
// ============================================

/**
 * HTML 특수 문자를 이스케이프하여 XSS 공격 방지
 * innerHTML 사용 시 반드시 이 함수를 통해 이스케이프
 */
export function escapeHtml(text: string | number | null | undefined): string {
  if (text === null || text === undefined) return '';

  const str = String(text);
  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
  };

  return str.replace(/[&<>"'`=/]/g, (char) => htmlEscapeMap[char] || char);
}

/**
 * HTML 속성값 이스케이프 (data-* 속성 등에 사용)
 * 따옴표로 감싸진 속성값에 안전하게 사용
 */
export function escapeHtmlAttr(text: string | number | null | undefined): string {
  if (text === null || text === undefined) return '';

  const str = String(text);
  // 속성값에서 위험한 문자들을 모두 이스케이프
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\\/g, '&#x5C;')
    .replace(/\n/g, '&#x0A;')
    .replace(/\r/g, '&#x0D;');
}

/**
 * JavaScript 문자열에서 사용할 수 있도록 이스케이프
 * 인라인 이벤트 핸들러나 스크립트 내부 문자열에 사용 (권장하지 않음)
 */
export function escapeJsString(text: string | null | undefined): string {
  if (text === null || text === undefined) return '';

  return text
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/<\/script/gi, '<\\/script');
}

/**
 * URL을 안전하게 검증하고 sanitize
 * 화이트리스트 방식으로 안전한 프로토콜만 허용
 */
export function sanitizeUrlForHref(url: string | null | undefined): string {
  if (!url) return '';

  const trimmed = url.trim();
  if (!trimmed) return '';

  // 허용 프로토콜 화이트리스트 (안전한 프로토콜만 허용)
  const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:'];

  try {
    // 상대 URL 처리
    const urlObj = new URL(trimmed, window.location.origin);

    // 프로토콜이 화이트리스트에 있는지 확인
    if (!allowedProtocols.includes(urlObj.protocol)) {
      return '';
    }

    return trimmed;
  } catch {
    // URL 파싱 실패 시 (잘못된 URL)
    // 상대 경로는 허용 (/, ./, ../ 로 시작하는 경우)
    if (/^\.{0,2}\//.test(trimmed)) {
      return trimmed;
    }
    return '';
  }
}

/**
 * 사용자 입력 텍스트를 HTML에 안전하게 렌더링
 * 줄바꿈을 <br>로 변환
 */
export function textToSafeHtml(text: string | null | undefined): string {
  if (!text) return '';

  return escapeHtml(text).replace(/\n/g, '<br>');
}

/**
 * HTML 태그 제거 (plain text 추출)
 */
export function stripHtmlTags(html: string | null | undefined): string {
  if (!html) return '';

  // DOM을 사용한 안전한 태그 제거
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

/**
 * 안전한 HTML 요소 생성 헬퍼
 * innerHTML 대신 사용하여 XSS 방지
 */
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  options?: {
    className?: string;
    textContent?: string;
    attributes?: Record<string, string>;
    children?: (HTMLElement | string)[];
  }
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName);

  if (options?.className) {
    element.className = options.className;
  }

  if (options?.textContent) {
    element.textContent = options.textContent;
  }

  if (options?.attributes) {
    for (const [key, value] of Object.entries(options.attributes)) {
      element.setAttribute(key, value);
    }
  }

  if (options?.children) {
    for (const child of options.children) {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else {
        element.appendChild(child);
      }
    }
  }

  return element;
}

// ============================================
// 민감 정보 필터링 유틸리티
// ============================================

/**
 * 민감 정보 필터링 옵션
 */
export interface SanitizeOptions {
  /** 헤더 필터링 여부 */
  filterHeaders?: boolean;
  /** 바디 필터링 여부 */
  filterBody?: boolean;
  /** 추가로 필터링할 헤더 이름 */
  additionalHeaders?: string[];
  /** 추가로 필터링할 바디 필드 이름 */
  additionalBodyFields?: string[];
  /** 커스텀 마스킹 문자열 */
  maskString?: string;
}

const defaultOptions: Required<SanitizeOptions> = {
  filterHeaders: true,
  filterBody: true,
  additionalHeaders: [],
  additionalBodyFields: [],
  maskString: SENSITIVE_PATTERNS.MASK,
};

/**
 * 헤더 객체에서 민감 정보 필터링
 */
export function sanitizeHeaders(
  headers: Record<string, string> | undefined,
  options: SanitizeOptions = {}
): Record<string, string> | undefined {
  if (!headers) return headers;

  const opts = { ...defaultOptions, ...options };
  if (!opts.filterHeaders) return headers;

  const sensitiveHeaders = new Set([
    ...SENSITIVE_PATTERNS.HEADERS,
    ...opts.additionalHeaders.map((h) => h.toLowerCase()),
  ]);

  const sanitized: Record<string, string> = {};

  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveHeaders.has(lowerKey)) {
      sanitized[key] = opts.maskString;
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * 바디 객체에서 민감 정보 필터링 (재귀적)
 */
export function sanitizeBody(body: unknown, options: SanitizeOptions = {}): unknown {
  if (body === null || body === undefined) return body;

  const opts = { ...defaultOptions, ...options };
  if (!opts.filterBody) return body;

  const sensitiveFields = new Set([
    ...SENSITIVE_PATTERNS.BODY_FIELDS,
    ...opts.additionalBodyFields,
  ]);

  // 문자열인 경우 JSON 파싱 시도
  if (typeof body === 'string') {
    try {
      const parsed = JSON.parse(body);
      const sanitized = sanitizeBody(parsed, options);
      return JSON.stringify(sanitized);
    } catch {
      // JSON이 아닌 일반 문자열 - 그대로 반환
      return body;
    }
  }

  // 배열인 경우 각 요소 재귀 처리
  if (Array.isArray(body)) {
    return body.map((item) => sanitizeBody(item, options));
  }

  // 객체인 경우 각 필드 검사
  if (typeof body === 'object') {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(body)) {
      // 필드 이름이 민감 정보 패턴과 일치하는지 검사
      const isSensitive =
        sensitiveFields.has(key) ||
        sensitiveFields.has(toCamelCase(key)) ||
        sensitiveFields.has(toSnakeCase(key)) ||
        containsSensitivePattern(key, sensitiveFields);

      if (isSensitive) {
        sanitized[key] = opts.maskString;
      } else if (typeof value === 'object' && value !== null) {
        // 중첩 객체 재귀 처리
        sanitized[key] = sanitizeBody(value, options);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  return body;
}

/**
 * 네트워크 요청 전체 sanitize
 */
export function sanitizeNetworkRequest<T extends {
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  requestBody?: unknown;
  responseBody?: unknown;
}>(request: T, options: SanitizeOptions = {}): T {
  return {
    ...request,
    requestHeaders: sanitizeHeaders(request.requestHeaders, options),
    responseHeaders: sanitizeHeaders(request.responseHeaders, options),
    requestBody: sanitizeBody(request.requestBody, options),
    responseBody: sanitizeBody(request.responseBody, options),
  };
}

/**
 * camelCase로 변환
 */
function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * snake_case로 변환
 */
function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * 필드 이름에 민감 패턴이 포함되어 있는지 검사
 */
function containsSensitivePattern(fieldName: string, sensitiveFields: Set<string>): boolean {
  const lowerField = fieldName.toLowerCase();

  for (const pattern of sensitiveFields) {
    if (lowerField.includes(pattern.toLowerCase())) {
      return true;
    }
  }

  return false;
}

/**
 * URL에서 민감 쿼리 파라미터 필터링
 */
export function sanitizeUrl(url: string, options: SanitizeOptions = {}): string {
  const opts = { ...defaultOptions, ...options };
  if (!opts.filterBody) return url;

  try {
    const urlObj = new URL(url, window.location.origin);
    const sensitiveParams = new Set([
      'token',
      'access_token',
      'refresh_token',
      'api_key',
      'apikey',
      'key',
      'secret',
      'password',
      'auth',
      ...opts.additionalBodyFields,
    ]);

    for (const [key] of urlObj.searchParams) {
      if (sensitiveParams.has(key.toLowerCase())) {
        urlObj.searchParams.set(key, opts.maskString);
      }
    }

    return urlObj.toString();
  } catch {
    return url;
  }
}
