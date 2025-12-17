import { commonStyles } from './common';
import { getThemeColors } from './colors';

/**
 * 플로팅 버튼 스타일
 */
export function getFloatingButtonStyles(theme: 'light' | 'dark', zIndex: number): string {
  const themeColors = getThemeColors(theme);

  return `
    ${commonStyles}

    .zyle-floating-button {
      position: fixed;
      z-index: ${zIndex};
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: ${themeColors.accent};
      color: white;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s, background 0.2s;
      user-select: none;
      touch-action: none;
    }

    .zyle-floating-button:hover {
      background: ${themeColors.accentHover};
      transform: scale(1.05);
      box-shadow: 0 6px 16px rgba(99, 102, 241, 0.5);
    }

    .zyle-floating-button:active {
      transform: scale(0.95);
    }

    .zyle-floating-button.dragging {
      cursor: grabbing;
      transform: scale(1.1);
      box-shadow: 0 8px 20px rgba(99, 102, 241, 0.6);
    }

    .zyle-floating-button .icon {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
    }

    .zyle-floating-button .icon svg {
      width: 100%;
      height: 100%;
      fill: currentColor;
    }

    .zyle-floating-button .badge {
      position: absolute;
      top: -4px;
      right: -4px;
      min-width: 20px;
      height: 20px;
      padding: 0 6px;
      border-radius: 10px;
      background: ${themeColors.error};
      color: white;
      font-size: 12px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: badge-pop 0.3s ease;
    }

    @keyframes badge-pop {
      0% { transform: scale(0); }
      50% { transform: scale(1.2); }
      100% { transform: scale(1); }
    }
  `;
}
