/**
 * 동작(Action) 관련 아이콘
 */

/** 닫기 (X) 아이콘 */
export const closeIcon = (size = 20): string => `
  <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
  </svg>`;

/** 휴지통 (삭제) 아이콘 */
export const deleteIcon = (size = 18): string => `
  <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
  </svg>`;

/** 뒤로가기 화살표 아이콘 */
export const backIcon = (size = 20): string => `
  <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
  </svg>`;

/** 복사 아이콘 */
export const copyIcon = (size = 14): string => `
  <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
  </svg>`;

/** 체크마크 아이콘 */
export const checkIcon = (size = 14): string => `
  <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor">
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
  </svg>`;

/** 아래 화살표 (chevron) 아이콘 */
export const chevronDownIcon = (): string => `
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
  </svg>`;
