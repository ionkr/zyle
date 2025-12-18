/**
 * 컨슈머 웹 밀어내기 (body width 조절)
 * Dock 모드에서 패널이 열릴 때 페이지 콘텐츠를 밀어냄
 */
export function applyBodyPush(width: number): void {
  const body = document.body;

  body.style.transition = 'margin-right 300ms ease-out, max-width 300ms ease-out';
  body.style.overflowX = 'hidden';
  body.style.marginRight = `${width}px`;
  // width가 100vw로 설정된 경우를 위해 max-width 제한
  body.style.maxWidth = `calc(100vw - ${width}px)`;
}

/**
 * 컨슈머 웹 밀어내기 해제
 */
export function removeBodyPush(isVisible: boolean, displayMode: 'floating' | 'dock'): void {
  const body = document.body;

  body.style.transition = 'margin-right 300ms ease-out, max-width 300ms ease-out';
  body.style.marginRight = '';
  body.style.maxWidth = '';

  // 약간의 지연 후 overflow 복원
  setTimeout(() => {
    if (!isVisible || displayMode !== 'dock') {
      body.style.overflowX = '';
    }
  }, 300);
}

/**
 * 리사이즈 중 즉각 반영 (transition 없이)
 */
export function updateBodyPushImmediate(width: number): void {
  document.body.style.marginRight = `${width}px`;
  document.body.style.maxWidth = `calc(100vw - ${width}px)`;
}
