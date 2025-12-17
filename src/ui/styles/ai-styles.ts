import type { ThemeColors } from './colors';

/**
 * AI 관련 스타일
 */
export function getAIStyles(themeColors: ThemeColors, theme: 'light' | 'dark'): string {
  return `
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
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
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

    @keyframes fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `;
}
