import type { ButtonPosition, LogLevel } from '../types';
import { getFloatingButtonStyles, getSystemTheme } from './styles';
import { clamp } from '../utils/helpers';
import { getLogoUrl } from '../icons';

/**
 * 드래그 가능한 플로팅 버튼 컴포넌트
 */
export class FloatingButton {
  private container: HTMLDivElement | null = null;
  private shadowRoot: ShadowRoot | null = null;
  private button: HTMLButtonElement | null = null;
  private badge: HTMLSpanElement | null = null;

  private position: { x: number; y: number } = { x: 0, y: 0 };
  private isDragging = false;
  private dragStartPos = { x: 0, y: 0 };
  private dragThreshold = 5;
  private hasMoved = false;

  private theme: 'light' | 'dark';
  private zIndex: number;
  private draggable: boolean;
  private initialPosition: ButtonPosition;

  private onClick: (() => void) | null = null;
  private errorCount = 0;
  private warningCount = 0;

  constructor(options: {
    position: ButtonPosition;
    draggable: boolean;
    theme: 'light' | 'dark' | 'auto';
    zIndex: number;
  }) {
    this.initialPosition = options.position;
    this.draggable = options.draggable;
    this.theme = options.theme === 'auto' ? getSystemTheme() : options.theme;
    this.zIndex = options.zIndex;
  }

  /**
   * 버튼 마운트
   */
  mount(): void {
    if (this.container) return;

    // 컨테이너 생성
    this.container = document.createElement('div');
    this.container.id = 'zyle-floating-button-container';

    // Shadow DOM 생성
    this.shadowRoot = this.container.attachShadow({ mode: 'closed' });

    // 스타일 주입
    const style = document.createElement('style');
    style.textContent = getFloatingButtonStyles(this.theme, this.zIndex);
    this.shadowRoot.appendChild(style);

    // 버튼 생성
    this.button = document.createElement('button');
    this.button.className = 'zyle-floating-button';
    this.button.innerHTML = `
      <span class="icon" style="background-image: url('${getLogoUrl()}');"></span>
    `;

    this.shadowRoot.appendChild(this.button);

    // 초기 위치 설정
    this.setInitialPosition();

    // 이벤트 바인딩
    this.bindEvents();

    // DOM에 추가
    document.body.appendChild(this.container);

    // 시스템 테마 변경 감지
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', this.handleThemeChange);
    }
  }

  /**
   * 버튼 언마운트
   */
  unmount(): void {
    if (!this.container) return;

    // 이벤트 해제
    this.unbindEvents();

    // 테마 변경 리스너 제거
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', this.handleThemeChange);
    }

    // DOM에서 제거
    this.container.remove();
    this.container = null;
    this.shadowRoot = null;
    this.button = null;
    this.badge = null;
  }

  /**
   * 초기 위치 설정
   */
  private setInitialPosition(): void {
    const padding = 20;
    const buttonSize = 56;

    switch (this.initialPosition) {
      case 'top-left':
        this.position = { x: padding, y: padding };
        break;
      case 'top-right':
        this.position = { x: window.innerWidth - buttonSize - padding, y: padding };
        break;
      case 'bottom-left':
        this.position = { x: padding, y: window.innerHeight - buttonSize - padding };
        break;
      case 'bottom-right':
      default:
        this.position = {
          x: window.innerWidth - buttonSize - padding,
          y: window.innerHeight - buttonSize - padding,
        };
    }

    this.updateButtonPosition();
  }

  /**
   * 버튼 위치 업데이트
   */
  private updateButtonPosition(): void {
    if (!this.button) return;

    this.button.style.left = `${this.position.x}px`;
    this.button.style.top = `${this.position.y}px`;
    this.button.style.right = 'auto';
    this.button.style.bottom = 'auto';
  }

  /**
   * 이벤트 바인딩
   */
  private bindEvents(): void {
    if (!this.button) return;

    // 마우스 이벤트
    this.button.addEventListener('mousedown', this.handleMouseDown);
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseup', this.handleMouseUp);

    // 터치 이벤트
    this.button.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    document.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    document.addEventListener('touchend', this.handleTouchEnd);

    // 리사이즈 이벤트
    window.addEventListener('resize', this.handleResize);
  }

  /**
   * 이벤트 해제
   */
  private unbindEvents(): void {
    if (!this.button) return;

    this.button.removeEventListener('mousedown', this.handleMouseDown);
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);

    this.button.removeEventListener('touchstart', this.handleTouchStart);
    document.removeEventListener('touchmove', this.handleTouchMove);
    document.removeEventListener('touchend', this.handleTouchEnd);

    window.removeEventListener('resize', this.handleResize);
  }

  /**
   * 마우스 다운 핸들러
   */
  private handleMouseDown = (e: MouseEvent): void => {
    if (!this.draggable) return;

    e.preventDefault();
    this.startDrag(e.clientX, e.clientY);
  };

  /**
   * 마우스 이동 핸들러
   */
  private handleMouseMove = (e: MouseEvent): void => {
    if (!this.isDragging) return;

    this.drag(e.clientX, e.clientY);
  };

  /**
   * 마우스 업 핸들러
   */
  private handleMouseUp = (): void => {
    this.endDrag();
  };

  /**
   * 터치 시작 핸들러
   */
  private handleTouchStart = (e: TouchEvent): void => {
    if (!this.draggable || e.touches.length !== 1) return;

    const touch = e.touches[0];
    this.startDrag(touch.clientX, touch.clientY);
  };

  /**
   * 터치 이동 핸들러
   */
  private handleTouchMove = (e: TouchEvent): void => {
    if (!this.isDragging || e.touches.length !== 1) return;

    e.preventDefault();
    const touch = e.touches[0];
    this.drag(touch.clientX, touch.clientY);
  };

  /**
   * 터치 종료 핸들러
   */
  private handleTouchEnd = (): void => {
    this.endDrag();
  };

  /**
   * 드래그 시작
   */
  private startDrag(clientX: number, clientY: number): void {
    this.isDragging = true;
    this.hasMoved = false;
    this.dragStartPos = { x: clientX, y: clientY };
    this.button?.classList.add('dragging');
  }

  /**
   * 드래그 중
   */
  private drag(clientX: number, clientY: number): void {
    const deltaX = clientX - this.dragStartPos.x;
    const deltaY = clientY - this.dragStartPos.y;

    // 드래그 임계값 체크
    if (Math.abs(deltaX) > this.dragThreshold || Math.abs(deltaY) > this.dragThreshold) {
      this.hasMoved = true;
    }

    if (this.hasMoved) {
      const buttonSize = 56;
      const newX = clamp(this.position.x + deltaX, 0, window.innerWidth - buttonSize);
      const newY = clamp(this.position.y + deltaY, 0, window.innerHeight - buttonSize);

      this.position = { x: newX, y: newY };
      this.updateButtonPosition();

      this.dragStartPos = { x: clientX, y: clientY };
    }
  }

  /**
   * 드래그 종료
   */
  private endDrag(): void {
    if (!this.isDragging) return;

    this.isDragging = false;
    this.button?.classList.remove('dragging');

    // 드래그하지 않았으면 클릭으로 처리
    if (!this.hasMoved && this.onClick) {
      this.onClick();
    }

    // 스냅 처리 (화면 가장자리에 붙이기)
    this.snapToEdge();
  }

  /**
   * 화면 가장자리에 스냅
   */
  private snapToEdge(): void {
    const buttonSize = 56;
    const padding = 20;
    const centerX = this.position.x + buttonSize / 2;

    // 가로 방향 스냅
    if (centerX < window.innerWidth / 2) {
      this.position.x = padding;
    } else {
      this.position.x = window.innerWidth - buttonSize - padding;
    }

    this.updateButtonPosition();
  }

  /**
   * 리사이즈 핸들러
   */
  private handleResize = (): void => {
    const buttonSize = 56;
    const padding = 20;

    // 화면 밖으로 나가지 않도록 조정
    this.position.x = clamp(this.position.x, padding, window.innerWidth - buttonSize - padding);
    this.position.y = clamp(this.position.y, padding, window.innerHeight - buttonSize - padding);

    this.updateButtonPosition();
  };

  /**
   * 테마 변경 핸들러
   */
  private handleThemeChange = (e: MediaQueryListEvent): void => {
    this.theme = e.matches ? 'dark' : 'light';
    this.updateStyles();
  };

  /**
   * 스타일 업데이트
   */
  private updateStyles(): void {
    if (!this.shadowRoot) return;

    const style = this.shadowRoot.querySelector('style');
    if (style) {
      style.textContent = getFloatingButtonStyles(this.theme, this.zIndex);
    }
  }

  /**
   * 클릭 핸들러 설정
   */
  setOnClick(handler: () => void): void {
    this.onClick = handler;
  }

  /**
   * 뱃지 업데이트
   */
  updateBadge(errorCount: number, warningCount: number): void {
    this.errorCount = errorCount;
    this.warningCount = warningCount;

    const total = errorCount + warningCount;

    if (!this.shadowRoot || !this.button) return;

    // 기존 뱃지 제거
    this.badge?.remove();

    if (total > 0) {
      this.badge = document.createElement('span');
      this.badge.className = 'badge';
      this.badge.textContent = total > 99 ? '99+' : String(total);
      this.button.appendChild(this.badge);
    }
  }

  /**
   * 로그 추가 시 뱃지 업데이트
   */
  incrementCount(level: LogLevel): void {
    if (level === 'error') {
      this.errorCount++;
    } else if (level === 'warn') {
      this.warningCount++;
    }

    this.updateBadge(this.errorCount, this.warningCount);
  }

  /**
   * 뱃지 초기화
   */
  clearBadge(): void {
    this.errorCount = 0;
    this.warningCount = 0;
    this.badge?.remove();
    this.badge = null;
  }

  /**
   * 현재 위치 가져오기
   */
  getPosition(): { x: number; y: number } {
    return { ...this.position };
  }

  /**
   * 테마 설정
   */
  setTheme(theme: 'light' | 'dark'): void {
    this.theme = theme;
    this.updateStyles();
  }

  /**
   * 버튼 표시
   */
  show(): void {
    if (this.button) {
      this.button.style.display = '';
    }
  }

  /**
   * 버튼 숨기기
   */
  hide(): void {
    if (this.button) {
      this.button.style.display = 'none';
    }
  }

  /**
   * 버튼 표시 여부 확인
   */
  isHidden(): boolean {
    return this.button?.style.display === 'none';
  }
}
