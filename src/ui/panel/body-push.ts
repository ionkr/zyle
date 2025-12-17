/**
 * 컨슈머 웹 밀어내기 (body width 조절)
 * Dock 모드에서 패널이 열릴 때 페이지 콘텐츠를 밀어냄
 */
export function applyBodyPush(width: number): void {
  const html = document.documentElement;
  const body = document.body;
  const transition = 'width 300ms ease-out, margin-right 300ms ease-out';

  // html과 body 모두에 스타일 적용 (다양한 레이아웃 대응)
  html.style.transition = transition;
  html.style.overflowX = 'hidden';
  html.style.marginRight = `${width}px`;

  body.style.transition = transition;
  body.style.overflowX = 'hidden';
  body.style.marginRight = `${width}px`;
  // width가 100vw로 설정된 경우를 위해 max-width 제한
  body.style.maxWidth = `calc(100vw - ${width}px)`;
}

/**
 * 컨슈머 웹 밀어내기 해제
 */
export function removeBodyPush(isVisible: boolean, displayMode: 'floating' | 'dock'): void {
  const html = document.documentElement;
  const body = document.body;
  const transition = 'width 300ms ease-out, margin-right 300ms ease-out';

  html.style.transition = transition;
  body.style.transition = transition;

  html.style.marginRight = '';
  body.style.marginRight = '';
  body.style.maxWidth = '';

  // 약간의 지연 후 overflow 복원
  setTimeout(() => {
    if (!isVisible || displayMode !== 'dock') {
      html.style.overflowX = '';
      body.style.overflowX = '';
    }
  }, 300);
}

/**
 * 리사이즈 중 즉각 반영 (transition 없이)
 */
export function updateBodyPushImmediate(width: number): void {
  document.documentElement.style.marginRight = `${width}px`;
  document.body.style.marginRight = `${width}px`;
  document.body.style.maxWidth = `calc(100vw - ${width}px)`;
}
