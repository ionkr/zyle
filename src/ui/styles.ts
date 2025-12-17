/**
 * UI 스타일 정의
 * Shadow DOM 내에서 사용되는 인라인 스타일
 */

export const colors = {
  light: {
    background: '#ffffff',
    backgroundSecondary: '#f5f5f5',
    backgroundHover: '#e8e8e8',
    text: '#1a1a1a',
    textSecondary: '#666666',
    border: '#e0e0e0',
    error: '#e53935',
    errorBg: '#ffebee',
    warning: '#fb8c00',
    warningBg: '#fff3e0',
    info: '#1e88e5',
    infoBg: '#e3f2fd',
    success: '#43a047',
    successBg: '#e8f5e9',
    accent: '#6366f1',
    accentHover: '#4f46e5',
  },
  dark: {
    background: '#1e1e1e',
    backgroundSecondary: '#2d2d2d',
    backgroundHover: '#3d3d3d',
    text: '#f5f5f5',
    textSecondary: '#a0a0a0',
    border: '#404040',
    error: '#ef5350',
    errorBg: '#2d1f1f',
    warning: '#ffa726',
    warningBg: '#2d2518',
    info: '#42a5f5',
    infoBg: '#1f262d',
    success: '#66bb6a',
    successBg: '#1f2d1f',
    accent: '#818cf8',
    accentHover: '#6366f1',
  },
};

/**
 * 테마별 색상 가져오기
 */
export function getThemeColors(theme: 'light' | 'dark'): typeof colors.light {
  return colors[theme];
}

/**
 * 시스템 다크모드 감지
 */
export function getSystemTheme(): 'light' | 'dark' {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

/**
 * 공통 스타일
 */
export const commonStyles = `
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  :host {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    font-size: 14px;
    line-height: 1.5;
  }

  button {
    cursor: pointer;
    border: none;
    background: none;
    font-family: inherit;
    font-size: inherit;
  }

  .scrollbar-thin::-webkit-scrollbar {
    width: 6px;
  }

  .scrollbar-thin::-webkit-scrollbar-track {
    background: transparent;
  }

  .scrollbar-thin::-webkit-scrollbar-thumb {
    background-color: rgba(128, 128, 128, 0.4);
    border-radius: 3px;
  }
`;

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
      0% {
        transform: scale(0);
      }
      50% {
        transform: scale(1.2);
      }
      100% {
        transform: scale(1);
      }
    }
  `;
}

/**
 * 분석 패널 스타일
 */
export function getAnalysisPanelStyles(theme: 'light' | 'dark', zIndex: number): string {
  const themeColors = getThemeColors(theme);

  return `
    ${commonStyles}

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

    .zyle-panel-content {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      position: relative;
    }

    .zyle-panel-content:has(.zyle-ai-loading-overlay) {
      overflow: hidden;
    }

    .zyle-log-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .zyle-log-item {
      padding: 12px;
      border-radius: 8px;
      background: ${themeColors.backgroundSecondary};
      border-left: 4px solid ${themeColors.border};
      cursor: pointer;
      transition: background 0.15s;
    }

    .zyle-log-item:hover {
      background: ${themeColors.backgroundHover};
    }

    .zyle-log-item.error {
      border-left-color: ${themeColors.error};
      background: ${themeColors.errorBg};
    }

    .zyle-log-item.warn {
      border-left-color: ${themeColors.warning};
      background: ${themeColors.warningBg};
    }

    .zyle-log-item.info {
      border-left-color: ${themeColors.info};
      background: ${themeColors.infoBg};
    }

    .zyle-log-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .zyle-log-header-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .zyle-log-delete {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border-radius: 4px;
      color: ${themeColors.textSecondary};
      opacity: 0;
      transition: opacity 0.15s, background 0.15s, color 0.15s;
    }

    .zyle-log-item:hover .zyle-log-delete {
      opacity: 1;
    }

    .zyle-log-delete:hover {
      background: ${themeColors.backgroundHover};
      color: ${themeColors.error};
    }

    .zyle-log-level {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      padding: 2px 8px;
      border-radius: 4px;
      color: white;
    }

    .zyle-log-level.error {
      background: ${themeColors.error};
    }

    .zyle-log-level.warn {
      background: ${themeColors.warning};
    }

    .zyle-log-level.info {
      background: ${themeColors.info};
    }

    .zyle-log-level.log,
    .zyle-log-level.debug {
      background: ${themeColors.textSecondary};
    }

    .zyle-log-time {
      font-size: 12px;
      color: ${themeColors.textSecondary};
    }

    .zyle-log-message {
      font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
      font-size: 13px;
      word-break: break-word;
      white-space: pre-wrap;
      max-height: 60px;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .zyle-analysis {
      // padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .zyle-analysis-section {
    }

    .zyle-analysis-title {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .zyle-analysis-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .zyle-analysis-list li {
      padding: 8px 12px;
      border-radius: 6px;
      background: ${themeColors.backgroundSecondary};
      font-size: 13px;
    }

    .zyle-code-preview {
      margin-top: 12px;
      padding: 12px;
      border-radius: 8px;
      background: ${theme === 'dark' ? '#0d0d0d' : '#fafafa'};
      font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
      font-size: 12px;
      overflow-x: auto;
    }

    .zyle-code-line {
      display: flex;
      gap: 12px;
      line-height: 1.6;
    }

    .zyle-code-line-number {
      color: ${themeColors.textSecondary};
      min-width: 40px;
      text-align: right;
      user-select: none;
    }

    .zyle-code-line.highlight {
      background: ${themeColors.errorBg};
      margin: 0 -12px;
      padding: 0 12px;
    }

    .zyle-severity {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }

    .zyle-severity.low {
      background: ${themeColors.infoBg};
      color: ${themeColors.info};
    }

    .zyle-severity.medium {
      background: ${themeColors.warningBg};
      color: ${themeColors.warning};
    }

    .zyle-severity.high {
      background: ${themeColors.errorBg};
      color: ${themeColors.error};
    }

    .zyle-severity.critical {
      background: ${themeColors.error};
      color: white;
    }

    /* Error Type 카드 */
    .zyle-error-type-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 10px;
      transition: transform 0.15s ease;
    }

    .zyle-error-type-card.low {
      background: linear-gradient(135deg, ${themeColors.infoBg}, ${theme === 'dark' ? 'rgba(30, 136, 229, 0.08)' : 'rgba(30, 136, 229, 0.05)'});
      border: 1px solid ${theme === 'dark' ? 'rgba(30, 136, 229, 0.3)' : 'rgba(30, 136, 229, 0.2)'};
    }

    .zyle-error-type-card.medium {
      background: linear-gradient(135deg, ${themeColors.warningBg}, ${theme === 'dark' ? 'rgba(251, 140, 0, 0.08)' : 'rgba(251, 140, 0, 0.05)'});
      border: 1px solid ${theme === 'dark' ? 'rgba(251, 140, 0, 0.3)' : 'rgba(251, 140, 0, 0.2)'};
    }

    .zyle-error-type-card.high {
      background: linear-gradient(135deg, ${themeColors.errorBg}, ${theme === 'dark' ? 'rgba(239, 83, 80, 0.08)' : 'rgba(239, 83, 80, 0.05)'});
      border: 1px solid ${theme === 'dark' ? 'rgba(239, 83, 80, 0.3)' : 'rgba(239, 83, 80, 0.2)'};
    }

    .zyle-error-type-card.critical {
      background: linear-gradient(135deg, ${themeColors.error}, ${theme === 'dark' ? '#c62828' : '#d32f2f'});
      border: none;
      color: white;
    }

    .zyle-error-type-icon {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      flex-shrink: 0;
    }

    .zyle-error-type-card.low .zyle-error-type-icon {
      background: ${themeColors.info};
      color: white;
    }

    .zyle-error-type-card.medium .zyle-error-type-icon {
      background: ${themeColors.warning};
      color: white;
    }

    .zyle-error-type-card.high .zyle-error-type-icon {
      background: ${themeColors.error};
      color: white;
    }

    .zyle-error-type-card.critical .zyle-error-type-icon {
      background: rgba(255, 255, 255, 0.2);
      color: white;
    }

    .zyle-error-type-icon svg {
      width: 20px;
      height: 20px;
    }

    .zyle-error-type-content {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .zyle-error-type-label {
      font-size: 15px;
      font-weight: 600;
      color: ${themeColors.text};
    }

    .zyle-error-type-card.critical .zyle-error-type-label {
      color: white;
    }

    .zyle-error-type-severity {
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .zyle-error-type-card.low .zyle-error-type-severity {
      color: ${themeColors.info};
    }

    .zyle-error-type-card.medium .zyle-error-type-severity {
      color: ${themeColors.warning};
    }

    .zyle-error-type-card.high .zyle-error-type-severity {
      color: ${themeColors.error};
    }

    .zyle-error-type-card.critical .zyle-error-type-severity {
      color: rgba(255, 255, 255, 0.85);
    }

    .zyle-network-item {
      padding: 12px;
      border-radius: 8px;
      background: ${themeColors.backgroundSecondary};
      margin-bottom: 8px;
    }

    .zyle-network-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .zyle-network-method {
      font-size: 11px;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 4px;
      background: ${themeColors.accent};
      color: white;
    }

    .zyle-network-status {
      font-size: 12px;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .zyle-network-status.success {
      background: ${themeColors.successBg};
      color: ${themeColors.success};
    }

    .zyle-network-status.error {
      background: ${themeColors.errorBg};
      color: ${themeColors.error};
    }

    .zyle-network-url {
      font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
      font-size: 12px;
      word-break: break-all;
      color: ${themeColors.textSecondary};
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

    /* 리사이즈 핸들 */
    .zyle-resize-handle {
      position: absolute;
      z-index: 10;
    }

    .zyle-resize-n {
      top: 0;
      left: 8px;
      right: 8px;
      height: 6px;
      cursor: ns-resize;
    }

    .zyle-resize-s {
      bottom: 0;
      left: 8px;
      right: 8px;
      height: 6px;
      cursor: ns-resize;
    }

    .zyle-resize-e {
      right: 0;
      top: 8px;
      bottom: 8px;
      width: 6px;
      cursor: ew-resize;
    }

    .zyle-resize-w {
      left: 0;
      top: 8px;
      bottom: 8px;
      width: 6px;
      cursor: ew-resize;
    }

    .zyle-resize-ne {
      top: 0;
      right: 0;
      width: 12px;
      height: 12px;
      cursor: nesw-resize;
    }

    .zyle-resize-nw {
      top: 0;
      left: 0;
      width: 12px;
      height: 12px;
      cursor: nwse-resize;
    }

    .zyle-resize-se {
      bottom: 0;
      right: 0;
      width: 12px;
      height: 12px;
      cursor: nwse-resize;
    }

    .zyle-resize-sw {
      bottom: 0;
      left: 0;
      width: 12px;
      height: 12px;
      cursor: nesw-resize;
    }

    .zyle-resize-handle:hover {
      background: rgba(99, 102, 241, 0.1);
    }

    /* AI 버튼 스타일 */
    .zyle-ai-button {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: ${themeColors.textSecondary};
      transition: all 0.2s ease;
      position: relative;
      cursor: pointer;
    }

    .zyle-ai-button:hover {
      background: ${themeColors.backgroundHover};
      color: ${themeColors.accent};
      transform: scale(1.05);
    }

    .zyle-ai-button svg {
      width: 20px;
      height: 20px;
      animation: sparkle-pulse 2s ease-in-out infinite;
    }

    .zyle-ai-button:hover svg {
      filter: drop-shadow(0 0 4px ${themeColors.accent});
    }

    .zyle-ai-button.loading svg {
      animation: sparkle-spin 1s linear infinite;
    }

    .zyle-ai-button.loading {
      pointer-events: none;
      color: ${themeColors.accent};
    }

    @keyframes sparkle-pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.7;
      }
    }

    @keyframes sparkle-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* AI 분석 결과 스타일 */
    .zyle-ai-result {
      animation: dissolve-in 0.4s ease-out forwards;
    }

    .zyle-ai-result.removing {
      animation: dissolve-out 0.3s ease-in forwards;
    }

    @keyframes dissolve-in {
      0% {
        opacity: 0;
        transform: translateY(10px);
        filter: blur(4px);
      }
      100% {
        opacity: 1;
        transform: translateY(0);
        filter: blur(0);
      }
    }

    @keyframes dissolve-out {
      0% {
        opacity: 1;
        transform: translateY(0);
        filter: blur(0);
      }
      100% {
        opacity: 0;
        transform: translateY(-10px);
        filter: blur(4px);
      }
    }

    .zyle-ai-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 500;
      background: linear-gradient(135deg, #8B5CF6, #6366F1);
      color: white;
    }

    .zyle-ai-badge svg {
      width: 12px;
      height: 12px;
      animation: none;
    }

    .zyle-ai-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .zyle-confidence {
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
    }

    .zyle-confidence.high {
      background: ${themeColors.successBg};
      color: ${themeColors.success};
    }

    .zyle-confidence.medium {
      background: ${themeColors.warningBg};
      color: ${themeColors.warning};
    }

    .zyle-confidence.low {
      background: ${themeColors.errorBg};
      color: ${themeColors.error};
    }

    .zyle-ai-root-cause {
      padding: 12px;
      border-radius: 8px;
      background: ${themeColors.backgroundSecondary};
      margin-bottom: 16px;
    }

    .zyle-ai-root-cause strong {
      display: block;
      margin-bottom: 8px;
      font-size: 13px;
      color: ${themeColors.textSecondary};
    }

    .zyle-ai-root-cause p {
      font-size: 14px;
      line-height: 1.6;
    }

    /* 비개발자용 결과 카드 */
    .zyle-ai-summary-card {
      background: linear-gradient(135deg, ${theme === 'dark' ? '#2d2d3d' : '#f8f9ff'}, ${theme === 'dark' ? '#1e1e2e' : '#f0f4ff'});
      border: 1px solid ${theme === 'dark' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)'};
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 16px;
    }

    .zyle-ai-summary-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .zyle-ai-summary-title {
      font-size: 14px;
      font-weight: 600;
      color: ${themeColors.accent};
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .zyle-ai-summary-title svg {
      width: 16px;
      height: 16px;
    }

    .zyle-ai-summary-content {
      font-size: 15px;
      line-height: 1.6;
      color: ${themeColors.text};
      margin-bottom: 16px;
    }

    .zyle-ai-copy-section {
      background: ${themeColors.backgroundSecondary};
      border-radius: 8px;
      padding: 12px;
      margin-top: 12px;
    }

    .zyle-ai-copy-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .zyle-ai-copy-label {
      font-size: 12px;
      color: ${themeColors.textSecondary};
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .zyle-ai-copy-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      color: white;
      background: ${themeColors.accent};
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .zyle-ai-copy-btn:hover {
      background: ${themeColors.accentHover};
      transform: translateY(-1px);
    }

    .zyle-ai-copy-btn.copied {
      background: ${themeColors.success};
    }

    .zyle-ai-copy-btn svg {
      width: 14px;
      height: 14px;
    }

    .zyle-ai-copy-content {
      font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
      font-size: 11px;
      line-height: 1.5;
      color: ${themeColors.textSecondary};
      white-space: pre-wrap;
      word-break: break-word;
      max-height: 120px;
      overflow-y: auto;
      padding: 8px;
      background: ${theme === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)'};
      border-radius: 4px;
    }

    .zyle-ai-action-hint {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: ${theme === 'dark' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.08)'};
      border-radius: 8px;
      font-size: 13px;
      color: ${themeColors.text};
      margin-top: 16px;
    }

    .zyle-ai-action-hint svg {
      width: 20px;
      height: 20px;
      color: ${themeColors.accent};
      flex-shrink: 0;
    }

    /* AI 로딩 오버레이 */
    .zyle-ai-loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: ${theme === 'dark' ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)'};
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 10;
      animation: fade-in 0.3s ease;
    }

    .zyle-ai-loading-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 32px;
      max-width: 400px;
    }

    .zyle-ai-loading-icon {
      width: 64px;
      height: 64px;
      margin-bottom: 24px;
      color: ${themeColors.accent};
      animation: sparkle-float 2s ease-in-out infinite;
    }

    .zyle-ai-loading-icon svg {
      width: 100%;
      height: 100%;
      filter: drop-shadow(0 0 12px ${themeColors.accent});
    }

    @keyframes sparkle-float {
      0%, 100% {
        transform: translateY(0) scale(1);
        filter: drop-shadow(0 0 12px ${themeColors.accent});
      }
      50% {
        transform: translateY(-8px) scale(1.05);
        filter: drop-shadow(0 0 20px ${themeColors.accent});
      }
    }

    .zyle-ai-loading-title {
      font-size: 18px;
      font-weight: 600;
      color: ${themeColors.text};
      margin-bottom: 8px;
    }

    .zyle-ai-loading-message {
      font-size: 14px;
      color: ${themeColors.textSecondary};
      line-height: 1.5;
      margin-bottom: 24px;
      word-break: keep-all;
    }

    .zyle-ai-loading-steps {
      display: flex;
      flex-direction: column;
      
      align-items: center;
      gap: 8px;
      width: 100%;
    }

    .zyle-ai-loading-step {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: ${themeColors.textSecondary};
      opacity: 0.5;
      transition: opacity 0.3s ease;
    }

    .zyle-ai-loading-step.active {
      opacity: 1;
      color: ${themeColors.text};
    }

    .zyle-ai-loading-step.completed {
      opacity: 1;
      color: ${themeColors.success};
    }

    .zyle-ai-loading-step-icon {
      width: 16px;
      height: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .zyle-ai-loading-step.active .zyle-ai-loading-step-icon {
      animation: pulse 1s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }

    /* 기존 간단 로딩 (폴백) */
    .zyle-ai-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px;
      gap: 16px;
      color: ${themeColors.textSecondary};
    }

    .zyle-ai-loading-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid ${themeColors.border};
      border-top-color: ${themeColors.accent};
      border-radius: 50%;
      animation: spinner-rotate 1s linear infinite;
    }

    @keyframes spinner-rotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* AI 에러 상태 */
    .zyle-ai-error {
      padding: 16px;
      border-radius: 8px;
      background: ${themeColors.errorBg};
      border: 1px solid ${themeColors.error};
      color: ${themeColors.error};
    }

    .zyle-ai-error-content {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .zyle-ai-error-content strong {
      font-size: 14px;
    }

    .zyle-ai-error-content p {
      font-size: 13px;
      opacity: 0.9;
    }

    .zyle-ai-error-actions {
      display: flex;
      gap: 8px;
      margin-top: 8px;
    }

    .zyle-ai-error-actions button {
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      transition: background 0.15s;
    }

    .zyle-ai-error-actions .zyle-btn-retry {
      background: ${themeColors.error};
      color: white;
    }

    .zyle-ai-error-actions .zyle-btn-retry:hover {
      opacity: 0.9;
    }

    .zyle-ai-error-actions .zyle-btn-settings {
      background: transparent;
      border: 1px solid ${themeColors.error};
      color: ${themeColors.error};
    }

    /* API 키 설정 모달 */
    .zyle-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: ${zIndex + 1};
      animation: fade-in 0.2s ease;
    }

    @keyframes fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .zyle-modal {
      width: 400px;
      max-width: 90vw;
      background: ${themeColors.background};
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      animation: modal-slide-in 0.3s ease;
    }

    @keyframes modal-slide-in {
      from {
        opacity: 0;
        transform: translateY(-20px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .zyle-modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid ${themeColors.border};
    }

    .zyle-modal-header h3 {
      font-size: 16px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      white-space: nowrap;
    }

    .zyle-modal-header h3 svg {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }

    .zyle-modal-close {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      color: ${themeColors.textSecondary};
      transition: background 0.15s, color 0.15s;
    }

    .zyle-modal-close:hover {
      background: ${themeColors.backgroundHover};
      color: ${themeColors.text};
    }

    .zyle-modal-body {
      padding: 20px;
    }

    .zyle-modal-body label {
      display: block;
    }

    .zyle-modal-body label span {
      display: block;
      margin-bottom: 8px;
      font-size: 13px;
      font-weight: 500;
      color: ${themeColors.textSecondary};
    }

    .zyle-api-key-input {
      width: 100%;
      padding: 12px;
      border: 1px solid ${themeColors.border};
      border-radius: 8px;
      font-size: 14px;
      background: ${themeColors.backgroundSecondary};
      color: ${themeColors.text};
      transition: border-color 0.15s, box-shadow 0.15s;
    }

    .zyle-api-key-input:focus {
      outline: none;
      border-color: ${themeColors.accent};
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }

    .zyle-api-key-hint {
      margin-top: 12px;
      font-size: 12px;
      color: ${themeColors.textSecondary};
      line-height: 1.5;
    }

    .zyle-api-key-hint a {
      color: ${themeColors.accent};
      text-decoration: none;
    }

    .zyle-api-key-hint a:hover {
      text-decoration: underline;
    }

    .zyle-modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding: 16px 20px;
      border-top: 1px solid ${themeColors.border};
    }

    .zyle-btn-cancel {
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      color: ${themeColors.textSecondary};
      transition: background 0.15s, color 0.15s;
    }

    .zyle-btn-cancel:hover {
      background: ${themeColors.backgroundHover};
      color: ${themeColors.text};
    }

    .zyle-btn-save {
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      background: ${themeColors.accent};
      color: white;
      transition: background 0.15s;
    }

    .zyle-btn-save:hover {
      background: ${themeColors.accentHover};
    }

    .zyle-btn-save:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .zyle-api-key-current {
      margin-top: 12px;
      padding: 8px 12px;
      border-radius: 6px;
      background: ${themeColors.backgroundSecondary};
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .zyle-api-key-current span {
      font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
      color: ${themeColors.textSecondary};
    }

    .zyle-btn-clear-key {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      color: ${themeColors.error};
      transition: background 0.15s;
    }

    .zyle-btn-clear-key:hover {
      background: ${themeColors.errorBg};
    }

    /* 설정 버튼 */
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

    /* 모델 선택 */
    .zyle-model-select {
      width: 100%;
      padding: 12px;
      border: 1px solid ${themeColors.border};
      border-radius: 8px;
      font-size: 14px;
      background: ${themeColors.backgroundSecondary};
      color: ${themeColors.text};
      cursor: pointer;
      transition: border-color 0.15s, box-shadow 0.15s;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='${theme === 'dark' ? '%23a0a0a0' : '%23666666'}'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 12px center;
      padding-right: 40px;
    }

    .zyle-model-select:focus {
      outline: none;
      border-color: ${themeColors.accent};
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }

    .zyle-model-select:hover {
      border-color: ${themeColors.accent};
    }

    .zyle-model-hint {
      margin-top: 8px;
      font-size: 12px;
      color: ${themeColors.textSecondary};
      line-height: 1.5;
    }

    /* 접기/펼치기 리스트 스타일 */
    .zyle-collapsible-list {
      position: relative;
    }

    .zyle-collapsible-list .zyle-analysis-list li {
      display: none;
    }

    .zyle-collapsible-list .zyle-analysis-list li:nth-child(-n+3) {
      display: block;
    }

    .zyle-collapsible-list.expanded .zyle-analysis-list li {
      display: block;
    }

    .zyle-toggle-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      width: 100%;
      padding: 8px 12px;
      margin-top: 8px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      color: ${themeColors.accent};
      background: transparent;
      border: 1px dashed ${themeColors.border};
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .zyle-toggle-btn:hover {
      background: ${themeColors.backgroundSecondary};
      border-color: ${themeColors.accent};
    }

    .zyle-toggle-btn svg {
      width: 14px;
      height: 14px;
      transition: transform 0.2s ease;
    }

    .zyle-collapsible-list.expanded .zyle-toggle-btn svg {
      transform: rotate(180deg);
    }

    .zyle-toggle-btn .zyle-toggle-count {
      color: ${themeColors.textSecondary};
      font-weight: 400;
    }

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
