import type { ThemeColors } from './colors';

/**
 * 로그 아이템 스타일
 */
export function getLogStyles(themeColors: ThemeColors, theme: 'light' | 'dark'): string {
  return `
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

    /* 분석 섹션 */
    .zyle-analysis {
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

    /* 코드 프리뷰 */
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

    /* Severity 관련 */
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

    /* 접기/펼치기 리스트 */
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
  `;
}
