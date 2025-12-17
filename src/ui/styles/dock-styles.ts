import type { ThemeColors } from './colors';

/**
 * Dock 모드 스타일
 */
export function getDockStyles(themeColors: ThemeColors): string {
  return `
    /* ========================================
       Dock 모드 스타일
       ======================================== */

    /* Dock 모드 패널 */
    .zyle-panel.dock-mode {
      position: fixed !important;
      top: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      left: auto !important;
      height: 100vh !important;
      width: 400px;
      border-radius: 0 !important;
      box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15);
      transform: translateX(0);
      transition: transform 300ms ease-out, width 200ms ease;
    }

    .zyle-panel.dock-mode:not(.visible) {
      transform: translateX(100%);
    }

    /* Dock 모드에서 헤더 드래그 비활성화 */
    .zyle-panel.dock-mode .zyle-panel-header {
      cursor: default;
    }

    /* Dock 모드 콘텐츠 높이 */
    .zyle-panel.dock-mode .zyle-panel-content {
      height: calc(100vh - 120px);
    }

    /* Dock 모드 리사이즈 핸들 (왼쪽만) */
    .zyle-panel.dock-mode .zyle-resize-handle {
      display: none;
    }

    .zyle-panel.dock-mode .zyle-resize-w {
      display: block;
      width: 8px;
      cursor: ew-resize;
      background: transparent;
      transition: background 0.2s;
    }

    .zyle-panel.dock-mode .zyle-resize-w:hover {
      background: ${themeColors.accent}40;
    }

    /* 플로팅 모드 스타일 (명시적) */
    .zyle-panel.floating-mode {
      border-radius: 12px;
    }

    /* 모드 전환 버튼 */
    .zyle-mode-toggle {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: ${themeColors.textSecondary};
      transition: all 0.2s ease;
      cursor: pointer;
    }

    .zyle-mode-toggle:hover {
      background: ${themeColors.backgroundHover};
      color: ${themeColors.accent};
    }

    .zyle-mode-toggle svg {
      width: 18px;
      height: 18px;
    }

    /* 전환 애니메이션 */
    .zyle-panel.transitioning {
      transition: all 300ms ease-out !important;
    }

    /* Dock 모드 슬라이드 인 애니메이션 */
    @keyframes dock-slide-in {
      from {
        transform: translateX(100%);
      }
      to {
        transform: translateX(0);
      }
    }

    .zyle-panel.dock-mode.visible {
      animation: dock-slide-in 300ms ease-out forwards;
    }
  `;
}
