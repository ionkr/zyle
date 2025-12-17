import type { ThemeColors } from './colors';

/**
 * 패널 기본 레이아웃 스타일
 */
export function getPanelBaseStyles(themeColors: ThemeColors, zIndex: number): string {
  return `
    .zyle-panel {
      position: fixed;
      right: 20px;
      bottom: 80px;
      z-index: ${zIndex - 1};
      width: 450px;
      height: 500px;
      min-width: 300px;
      min-height: 200px;
      border-radius: 12px;
      background: ${themeColors.background};
      color: ${themeColors.text};
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      opacity: 0;
      transition: opacity 0.2s;
      pointer-events: none;
    }

    .zyle-panel.visible {
      opacity: 1;
      pointer-events: auto;
    }

    .zyle-panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      border-bottom: 1px solid ${themeColors.border};
      cursor: move;
      user-select: none;
    }

    .zyle-panel-title {
      font-size: 16px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .zyle-panel-close {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: ${themeColors.textSecondary};
      transition: background 0.15s, color 0.15s;
    }

    .zyle-panel-close:hover {
      background: ${themeColors.backgroundHover};
      color: ${themeColors.text};
    }

    .zyle-header-back {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: ${themeColors.textSecondary};
      transition: background 0.15s, color 0.15s;
      cursor: pointer;
    }

    .zyle-header-back:hover {
      background: ${themeColors.backgroundHover};
      color: ${themeColors.text};
    }

    .zyle-panel-content {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      position: relative;
    }

    .zyle-panel-content:has(.zyle-ai-loading-overlay) {
      overflow: hidden;
    }

    .zyle-empty {
      text-align: center;
      padding: 40px 20px;
      color: ${themeColors.textSecondary};
    }

    .zyle-empty-icon {
      font-size: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .zyle-back-button {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 13px;
      color: ${themeColors.textSecondary};
      margin-bottom: 16px;
      transition: background 0.15s, color 0.15s;
    }

    .zyle-back-button:hover {
      background: ${themeColors.backgroundHover};
      color: ${themeColors.text};
    }

    .zyle-clear-button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      color: ${themeColors.textSecondary};
      transition: background 0.15s, color 0.15s;
    }

    .zyle-clear-button:hover {
      background: ${themeColors.backgroundHover};
      color: ${themeColors.error};
    }

    .zyle-settings-button {
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

    .zyle-settings-button:hover {
      background: ${themeColors.backgroundHover};
      color: ${themeColors.accent};
      transform: rotate(30deg);
    }

    .zyle-settings-button svg {
      width: 20px;
      height: 20px;
    }
  `;
}

/**
 * 탭 스타일
 */
export function getTabStyles(themeColors: ThemeColors): string {
  return `
    .zyle-panel-tabs {
      display: flex;
      gap: 4px;
      padding: 8px 16px;
      border-bottom: 1px solid ${themeColors.border};
    }

    .zyle-tab {
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      color: ${themeColors.textSecondary};
      transition: background 0.15s, color 0.15s;
    }

    .zyle-tab:hover {
      background: ${themeColors.backgroundHover};
    }

    .zyle-tab.active {
      background: ${themeColors.accent};
      color: white;
    }
  `;
}
