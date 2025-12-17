/**
 * 상태(Status) 관련 아이콘
 */

/** 원 안 체크마크 (성공/완료) 아이콘 */
export const circleCheckIcon = (size?: number): string => {
  const sizeAttr = size ? `width="${size}" height="${size}"` : '';
  return `
  <svg ${sizeAttr} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
  </svg>`;
};

/** 원 안 느낌표 (에러) 아이콘 */
export const circleExclamationIcon = (): string => `
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
  </svg>`;

/** 삼각형 경고 아이콘 */
export const triangleWarningIcon = (): string => `
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
  </svg>`;

/** 정보 아이콘 (원 안 i) */
export const infoIcon = (): string => `
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
  </svg>`;

/** 물음표 아이콘 */
export const questionIcon = (size = 16): string => `
  <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"/>
  </svg>`;

/** 원형 점 (진행 중 표시용) 아이콘 */
export const dotIcon = (size = 16): string => `
  <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="4"/>
  </svg>`;

/**
 * 심각도에 따른 아이콘 반환
 */
export function getSeverityIcon(severity: string): string {
  switch (severity) {
    case 'critical':
      return circleCheckIcon();
    case 'high':
      return circleExclamationIcon();
    case 'medium':
      return triangleWarningIcon();
    case 'low':
    default:
      return infoIcon();
  }
}
