import type { SanitizeOptions } from '../../utils/sanitizer';

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
export const DEV_TOOLS_URL_PATTERNS = [
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
 * URL이 개발 도구 요청인지 확인
 */
export function isDevToolsRequest(url: string): boolean {
  return DEV_TOOLS_URL_PATTERNS.some((pattern) => pattern.test(url));
}
