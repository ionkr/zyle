import type { ThemeColors } from './colors';

/**
 * 네트워크 관련 스타일
 */
export function getNetworkStyles(themeColors: ThemeColors): string {
  return `
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
  `;
}
