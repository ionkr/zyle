import type { ThemeColors } from './colors';

/**
 * 모달 스타일
 */
export function getModalStyles(themeColors: ThemeColors, theme: 'light' | 'dark', zIndex: number): string {
  return `
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

    /* Provider 선택 */
    .zyle-provider-select {
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

    .zyle-provider-select:focus {
      outline: none;
      border-color: ${themeColors.accent};
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }

    .zyle-provider-select:hover {
      border-color: ${themeColors.accent};
    }

    .zyle-provider-hint {
      margin-top: 8px;
      margin-bottom: 16px;
      font-size: 12px;
      color: ${themeColors.textSecondary};
      line-height: 1.5;
    }

    .zyle-provider-settings {
      padding-top: 8px;
      border-top: 1px solid ${themeColors.border};
      margin-top: 8px;
    }

    /* Bridge 상태 표시 */
    .zyle-bridge-status {
      margin-top: 8px;
    }

    .zyle-bridge-status-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
    }

    .zyle-bridge-status-indicator.checking {
      background: ${themeColors.backgroundSecondary};
      color: ${themeColors.textSecondary};
    }

    .zyle-bridge-status-indicator.checking .status-icon {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .zyle-bridge-status-indicator.success {
      background: ${theme === 'dark' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.1)'};
      color: ${theme === 'dark' ? '#4ade80' : '#16a34a'};
    }

    .zyle-bridge-status-indicator.warning {
      background: ${theme === 'dark' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(234, 179, 8, 0.1)'};
      color: ${theme === 'dark' ? '#facc15' : '#ca8a04'};
    }

    .zyle-bridge-status-indicator.error {
      background: ${themeColors.errorBg};
      color: ${themeColors.error};
    }

    .zyle-bridge-status-indicator .status-icon {
      font-size: 16px;
      display: inline-block;
    }

    .zyle-bridge-install-guide {
      margin-top: 12px;
      padding: 12px;
      border-radius: 8px;
      background: ${themeColors.backgroundSecondary};
      font-size: 12px;
      line-height: 1.6;
    }

    .zyle-bridge-install-guide strong {
      display: block;
      margin-bottom: 8px;
      color: ${themeColors.text};
    }

    .zyle-bridge-install-guide ol {
      margin: 0;
      padding-left: 20px;
      color: ${themeColors.textSecondary};
    }

    .zyle-bridge-install-guide li {
      margin-bottom: 4px;
    }

    .zyle-bridge-install-guide code {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      background: ${theme === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.05)'};
      font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
      font-size: 11px;
      word-break: break-all;
    }

    /* Bridge 명령어 박스 */
    .zyle-bridge-command-box {
      display: flex;
      align-items: stretch;
      gap: 8px;
      margin-top: 6px;
      padding: 10px 12px;
      border-radius: 8px;
      background: ${theme === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.05)'};
      border: 1px solid ${themeColors.border};
    }

    .zyle-bridge-command-box code {
      flex: 1;
      font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
      font-size: 12px;
      color: ${themeColors.text};
      word-break: break-all;
      line-height: 1.5;
    }

    .zyle-copy-btn {
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      color: ${themeColors.accent};
      background: transparent;
      border: 1px solid ${themeColors.accent};
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .zyle-copy-btn:hover {
      background: ${themeColors.accent};
      color: white;
    }

    .zyle-copy-btn.copied {
      background: ${theme === 'dark' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)'};
      border-color: ${theme === 'dark' ? '#4ade80' : '#16a34a'};
      color: ${theme === 'dark' ? '#4ade80' : '#16a34a'};
    }

    /* Bridge 상태 상세 정보 */
    .zyle-bridge-status-details {
      margin-top: 12px;
    }

    .zyle-command-section {
      margin-bottom: 12px;
    }

    .zyle-command-label {
      font-size: 12px;
      color: ${themeColors.textSecondary};
      margin-bottom: 6px;
    }

    /* Bridge 액션 버튼 그룹 */
    .zyle-bridge-actions {
      display: flex;
      gap: 8px;
      margin-top: 16px;
    }

    .zyle-btn-retry-status {
      padding: 10px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      background: ${themeColors.backgroundSecondary};
      color: ${themeColors.text};
      cursor: pointer;
      transition: background 0.15s;
      border: 1px solid ${themeColors.border};
    }

    .zyle-btn-retry-status:hover {
      background: ${themeColors.backgroundHover};
    }

    /* 포트 설정 */
    .zyle-port-input-row {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-bottom: 16px;
    }

    .zyle-port-input {
      width: 100px;
      padding: 10px 12px;
      border: 1px solid ${themeColors.border};
      border-radius: 8px;
      font-size: 14px;
      font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
      background: ${themeColors.backgroundSecondary};
      color: ${themeColors.text};
      text-align: center;
    }

    .zyle-port-input:focus {
      outline: none;
      border-color: ${themeColors.accent};
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }

    .zyle-btn-test-connection {
      padding: 10px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      background: ${themeColors.backgroundSecondary};
      color: ${themeColors.text};
      cursor: pointer;
      transition: background 0.15s;
      border: 1px solid ${themeColors.border};
      white-space: nowrap;
    }

    .zyle-btn-test-connection:hover {
      background: ${themeColors.backgroundHover};
    }

    .zyle-btn-test-connection:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .zyle-connection-status {
      font-size: 12px;
      color: ${themeColors.textSecondary};
      margin-left: 4px;
    }

    .zyle-connection-status.connected {
      color: ${theme === 'dark' ? '#4ade80' : '#16a34a'};
    }

    .zyle-connection-status.testing {
      color: ${themeColors.warning};
    }

    .zyle-connection-status.disconnected {
      color: ${themeColors.error};
    }

    /* 준비 완료 상태 */
    .zyle-bridge-ready-message {
      font-size: 12px;
      color: ${themeColors.textSecondary};
      margin-top: 8px;
    }
  `;
}
