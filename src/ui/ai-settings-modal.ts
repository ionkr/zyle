import { AIClient, AI_MODELS, type AIModel } from '../ai/ai-client';
import {
  AI_PROVIDERS,
  STORAGE_KEYS,
  DEFAULT_AI_PROVIDER,
  BRIDGE_CONSTANTS,
  type AIProvider,
} from '../constants';
import { escapeHtml, escapeHtmlAttr } from '../utils/sanitizer';
import { sparkleIcon } from '../icons';
import { getAITranslations, getUITranslations } from '../i18n';
import {
  getBridgeClient,
  type BridgeStatus,
} from '../bridge/bridge-client';

/**
 * 반짝이는 별 아이콘 SVG
 * @deprecated icons 모듈의 sparkleIcon 사용 권장
 */
export function getSparkleIcon(): string {
  return sparkleIcon();
}

/**
 * API 키 설정 모달 클래스
 */
export class AISettingsModal {
  private modalElement: HTMLDivElement | null = null;
  private aiClient: AIClient;
  private shadowRoot: ShadowRoot;
  private onSave: (() => void) | null = null;
  private currentProvider: AIProvider;
  private bridgeStatus: BridgeStatus | null = null;
  private bridgePort: number;
  private connectionTestStatus: 'idle' | 'testing' | 'connected' | 'disconnected' = 'idle';

  constructor(shadowRoot: ShadowRoot, aiClient: AIClient) {
    this.shadowRoot = shadowRoot;
    this.aiClient = aiClient;
    this.currentProvider = this.loadProvider();
    this.bridgePort = this.loadBridgePort();
  }

  /**
   * 저장된 Bridge 포트 로드
   */
  private loadBridgePort(): number {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BRIDGE_PORT);
      if (saved) {
        const port = parseInt(saved, 10);
        if (!isNaN(port) && port > 0 && port <= 65535) {
          return port;
        }
      }
    } catch {
      // localStorage 접근 불가 시 무시
    }
    return BRIDGE_CONSTANTS.DEFAULT_PORT;
  }

  /**
   * Bridge 포트 저장
   */
  private saveBridgePort(port: number): void {
    this.bridgePort = port;
    try {
      localStorage.setItem(STORAGE_KEYS.BRIDGE_PORT, port.toString());
      // Bridge 클라이언트 포트도 업데이트
      const client = getBridgeClient();
      client.setPort(port);
    } catch {
      // localStorage 접근 불가 시 무시
    }
  }

  /**
   * 저장된 Provider 로드
   */
  private loadProvider(): AIProvider {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AI_PROVIDER) as AIProvider | null;
      if (saved && AI_PROVIDERS.some((p) => p.id === saved)) {
        return saved;
      }
    } catch {
      // localStorage 접근 불가 시 무시
    }
    return DEFAULT_AI_PROVIDER;
  }

  /**
   * Provider 저장
   */
  private saveProvider(provider: AIProvider): void {
    this.currentProvider = provider;
    try {
      localStorage.setItem(STORAGE_KEYS.AI_PROVIDER, provider);
    } catch {
      // localStorage 접근 불가 시 무시
    }
  }

  /**
   * 현재 Provider 반환
   */
  getProvider(): AIProvider {
    return this.currentProvider;
  }

  /**
   * 모달 표시
   */
  async show(onSave?: () => void): Promise<void> {
    if (this.modalElement) {
      this.hide();
    }

    this.onSave = onSave || null;

    this.modalElement = document.createElement('div');
    this.modalElement.className = 'zyle-modal-overlay';
    this.modalElement.innerHTML = this.renderModal();

    this.shadowRoot.appendChild(this.modalElement);
    this.bindEvents();

    // Bridge 상태 확인 (비동기)
    if (this.currentProvider === 'claude-bridge') {
      this.checkBridgeStatus();
    }

    // 입력 필드에 포커스
    const input = this.modalElement.querySelector(
      '.zyle-api-key-input'
    ) as HTMLInputElement;
    if (input && this.currentProvider === 'anthropic-api') {
      setTimeout(() => input.focus(), 100);
    }
  }

  /**
   * Bridge 상태 확인
   */
  private async checkBridgeStatus(): Promise<void> {
    if (!this.modalElement) return;

    const statusEl = this.modalElement.querySelector('.zyle-bridge-status');
    if (!statusEl) return;

    try {
      const client = getBridgeClient();
      this.bridgeStatus = await client.getStatus();
      this.updateBridgeStatusUI();
    } catch (error) {
      this.bridgeStatus = {
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      this.updateBridgeStatusUI();
    }
  }

  /**
   * Bridge 상태 UI 업데이트
   */
  private updateBridgeStatusUI(): void {
    if (!this.modalElement || !this.bridgeStatus) return;

    const statusEl = this.modalElement.querySelector('.zyle-bridge-status');
    if (!statusEl) return;

    const ai = getAITranslations();
    const bridge = ai.settings.bridge;
    const status = this.bridgeStatus;

    let statusHtml = '';
    let statusClass = '';

    if (!status.available) {
      statusClass = 'error';
      statusHtml = `<span class="status-icon">✗</span> ${bridge.notRunning}`;
    } else if (!status.authenticated) {
      statusClass = 'warning';
      statusHtml = `<span class="status-icon">!</span> ${bridge.claudeCliMissing}`;
    } else {
      statusClass = 'success';
      statusHtml = `<span class="status-icon">✓</span> ${bridge.ready}`;
    }

    let detailsHtml = '';
    if (!status.available) {
      detailsHtml = this.renderNotRunningDetails();
    } else if (!status.authenticated) {
      detailsHtml = this.renderAuthRequiredDetails();
    } else {
      detailsHtml = this.renderReadyDetails();
    }

    statusEl.innerHTML = `
      <div class="zyle-bridge-status-indicator ${statusClass}">
        ${statusHtml}
      </div>
      ${detailsHtml}
    `;

    // 저장 버튼 활성화/비활성화
    this.updateSaveButtonState();
  }

  /**
   * 서버 미실행 시 상세 안내 렌더링
   */
  private renderNotRunningDetails(): string {
    const ai = getAITranslations();
    const bridge = ai.settings.bridge;
    const command = `${BRIDGE_CONSTANTS.COMMAND} ${this.bridgePort}`;
    const loginCommand = bridge.notAuthenticated.loginCommand;

    return `
      <div class="zyle-bridge-status-details">
        <div class="zyle-command-section">
          <div class="zyle-command-label">${bridge.notRunningGuide.command}</div>
          <div class="zyle-bridge-command-box">
            <code>${escapeHtml(command)}</code>
            <button
              class="zyle-copy-btn"
              data-action="copy-bridge-command"
              data-command="${escapeHtmlAttr(command)}"
            >
              ${bridge.notRunningGuide.copy}
            </button>
          </div>
        </div>

        <div class="zyle-command-section">
          <div class="zyle-command-label">${bridge.notAuthenticated.command}</div>
          <div class="zyle-bridge-command-box">
            <code>${escapeHtml(loginCommand)}</code>
            <button
              class="zyle-copy-btn"
              data-action="copy-bridge-command"
              data-command="${escapeHtmlAttr(loginCommand)}"
            >
              ${bridge.notRunningGuide.copy}
            </button>
          </div>
        </div>

        <div class="zyle-bridge-actions">
          <button class="zyle-btn-retry-status" data-action="retry-bridge-status">
            🔄 ${bridge.notRunningGuide.retry}
          </button>
        </div>
      </div>
    `;
  }

  /**
   * 인증 필요 시 상세 안내 렌더링
   */
  private renderAuthRequiredDetails(): string {
    const ai = getAITranslations();
    const bridge = ai.settings.bridge;
    const loginCommand = bridge.notAuthenticated.loginCommand;

    return `
      <div class="zyle-bridge-status-details">
        <div class="zyle-bridge-ready-message">
          ${bridge.statusMessages.serverRunning}
        </div>

        <div class="zyle-command-section" style="margin-top: 12px;">
          <div class="zyle-command-label">${bridge.notAuthenticated.command}</div>
          <div class="zyle-bridge-command-box">
            <code>${escapeHtml(loginCommand)}</code>
            <button
              class="zyle-copy-btn"
              data-action="copy-bridge-command"
              data-command="${escapeHtmlAttr(loginCommand)}"
            >
              ${bridge.notRunningGuide.copy}
            </button>
          </div>
        </div>

        <div class="zyle-bridge-actions">
          <button class="zyle-btn-retry-status" data-action="retry-bridge-status">
            🔄 ${bridge.notRunningGuide.retry}
          </button>
        </div>
      </div>
    `;
  }

  /**
   * 준비 완료 시 상세 정보 렌더링
   */
  private renderReadyDetails(): string {
    const ai = getAITranslations();
    const bridge = ai.settings.bridge;

    return `
      <div class="zyle-bridge-status-details">
        <div class="zyle-bridge-ready-message">
          ${bridge.statusMessages.allReady}
        </div>
      </div>
    `;
  }

  /**
   * 연결 상태 텍스트 반환
   */
  private getConnectionStatusText(): string {
    const ai = getAITranslations();
    const portSettings = ai.settings.bridge.portSettings;

    switch (this.connectionTestStatus) {
      case 'testing':
        return portSettings.testing;
      case 'connected':
        return `✓ ${portSettings.connected}`;
      case 'disconnected':
        return `✗ ${portSettings.disconnected}`;
      default:
        return '';
    }
  }

  /**
   * 명령어 복사 처리
   */
  private async handleCopyCommand(command: string, button: HTMLElement): Promise<void> {
    const ai = getAITranslations();
    const bridge = ai.settings.bridge;

    try {
      await navigator.clipboard.writeText(command);

      // 버튼 텍스트 변경
      const originalText = button.textContent;
      button.textContent = bridge.notRunningGuide.copied;
      button.classList.add('copied');

      // 2초 후 복원
      setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove('copied');
      }, 2000);
    } catch (err) {
      console.error('Failed to copy command:', err);
    }
  }

  /**
   * 연결 테스트 처리
   */
  private async handleTestConnection(): Promise<void> {
    if (!this.modalElement) return;

    this.connectionTestStatus = 'testing';
    this.updateConnectionStatusUI();

    try {
      const client = getBridgeClient();
      client.setPort(this.bridgePort);
      const status = await client.getStatus();

      this.connectionTestStatus = status.available ? 'connected' : 'disconnected';
      this.bridgeStatus = status;
      this.updateConnectionStatusUI();
      this.updateBridgeStatusUI();
    } catch (error) {
      this.connectionTestStatus = 'disconnected';
      this.bridgeStatus = {
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      this.updateConnectionStatusUI();
      this.updateBridgeStatusUI();
    }
  }

  /**
   * 연결 상태 UI 업데이트
   */
  private updateConnectionStatusUI(): void {
    if (!this.modalElement) return;

    const statusEl = this.modalElement.querySelector('.zyle-connection-status');
    if (statusEl) {
      statusEl.className = `zyle-connection-status ${this.connectionTestStatus}`;
      statusEl.textContent = this.getConnectionStatusText();
    }

    const testBtn = this.modalElement.querySelector('[data-action="test-connection"]') as HTMLButtonElement;
    if (testBtn) {
      testBtn.disabled = this.connectionTestStatus === 'testing';
    }
  }

  /**
   * 포트 변경 처리
   */
  private handlePortChange(value: string): void {
    const port = parseInt(value, 10);
    if (!isNaN(port) && port > 0 && port <= 65535) {
      this.bridgePort = port;
      this.connectionTestStatus = 'idle';
      this.updateConnectionStatusUI();
    }
  }

  /**
   * 모달 숨기기
   */
  hide(): void {
    if (this.modalElement) {
      this.modalElement.remove();
      this.modalElement = null;
    }
    this.onSave = null;
  }

  /**
   * 모달 HTML 렌더링
   */
  private renderModal(): string {
    const ai = getAITranslations();
    const ui = getUITranslations();
    const maskedKey = this.aiClient.getMaskedApiKey();
    const hasKey = this.aiClient.hasApiKey();
    const currentModel = this.aiClient.getModel();
    const isApiProvider = this.currentProvider === 'anthropic-api';

    return `
      <div class="zyle-modal">
        <div class="zyle-modal-header">
          <h3>
            ${getSparkleIcon()}
            ${ai.settings.title}
          </h3>
          <button class="zyle-modal-close" data-action="close">×</button>
        </div>
        <div class="zyle-modal-body">
          <label>
            <span>${ai.settings.provider}</span>
            <select class="zyle-provider-select">
              ${AI_PROVIDERS.map(
                (provider) => `
                <option value="${provider.id}" ${this.currentProvider === provider.id ? 'selected' : ''}>
                  ${provider.name}
                </option>
              `
              ).join('')}
            </select>
          </label>
          <p class="zyle-provider-hint">
            ${ai.settings.providerHint}
          </p>

          <!-- Anthropic API 설정 -->
          <div class="zyle-provider-settings zyle-provider-anthropic" style="${isApiProvider ? '' : 'display: none;'}">
            <label>
              <span>${ai.settings.apiKey}</span>
              <input
                type="password"
                class="zyle-api-key-input"
                placeholder="${ai.settings.apiKeyPlaceholder}"
                autocomplete="off"
              />
            </label>
            ${
              hasKey
                ? `
              <div class="zyle-api-key-current">
                <span>${ai.settings.currentKey}: ${maskedKey}</span>
                <button class="zyle-btn-clear-key" data-action="clear-key">${ai.settings.deleteKey}</button>
              </div>
            `
                : ''
            }
            <p class="zyle-api-key-hint">
              ${ai.settings.apiKeyHint}<br/>
              <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer">
                ${ai.settings.apiKeyLink}
              </a>
            </p>

            <label style="margin-top: 20px;">
              <span>${ai.settings.model}</span>
              <select class="zyle-model-select">
                ${AI_MODELS.map(
                  (model) => `
                  <option value="${model.id}" ${currentModel === model.id ? 'selected' : ''}>
                    ${model.name}
                  </option>
                `
                ).join('')}
              </select>
            </label>
            <p class="zyle-model-hint">
              ${ai.settings.modelHint}
            </p>
          </div>

          <!-- Claude Bridge 설정 -->
          <div class="zyle-provider-settings zyle-provider-bridge" style="${isApiProvider ? 'display: none;' : ''}">
            <label>
              <span>${ai.settings.bridge.portSettings.label}</span>
            </label>
            <div class="zyle-port-input-row">
              <input
                type="number"
                class="zyle-port-input"
                value="${this.bridgePort}"
                placeholder="${ai.settings.bridge.portSettings.placeholder}"
                min="1"
                max="65535"
                data-input="bridge-port"
              />
              <button class="zyle-btn-test-connection" data-action="test-connection">
                ${ai.settings.bridge.portSettings.testConnection}
              </button>
              <span class="zyle-connection-status ${this.connectionTestStatus}">
                ${this.getConnectionStatusText()}
              </span>
            </div>

            <label>
              <span>${ai.settings.bridge.status}</span>
            </label>
            <div class="zyle-bridge-status">
              <div class="zyle-bridge-status-indicator checking">
                <span class="status-icon">⟳</span> ${ai.settings.bridge.checking}
              </div>
            </div>
          </div>
        </div>
        <div class="zyle-modal-footer">
          <button class="zyle-btn-cancel" data-action="cancel">${ui.buttons.cancel}</button>
          <button class="zyle-btn-save" data-action="save" ${this.canSave() ? '' : 'disabled'}>${ui.buttons.save}</button>
        </div>
      </div>
    `;
  }

  /**
   * 저장 가능 여부 확인
   */
  private canSave(): boolean {
    if (this.currentProvider === 'anthropic-api') {
      return this.aiClient.hasApiKey();
    } else {
      // Bridge provider: 상태 확인 전에는 일단 활성화
      if (!this.bridgeStatus) return true;
      return this.bridgeStatus.available &&
             this.bridgeStatus.authenticated === true;
    }
  }

  /**
   * 저장 버튼 상태 업데이트
   */
  private updateSaveButtonState(): void {
    if (!this.modalElement) return;
    const saveBtn = this.modalElement.querySelector('[data-action="save"]') as HTMLButtonElement;
    if (saveBtn) {
      saveBtn.disabled = !this.canSave();
    }
  }

  /**
   * 이벤트 바인딩
   */
  private bindEvents(): void {
    if (!this.modalElement) return;

    // 오버레이 클릭 시 닫기
    this.modalElement.addEventListener('click', (e) => {
      if (e.target === this.modalElement) {
        this.hide();
      }
    });

    // 버튼 클릭 이벤트
    this.modalElement.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const action = target.closest('[data-action]')?.getAttribute('data-action');

      switch (action) {
        case 'close':
        case 'cancel':
          this.hide();
          break;
        case 'save':
          this.handleSave();
          break;
        case 'clear-key':
          this.handleClearKey();
          break;
        case 'copy-bridge-command': {
          const button = target.closest('[data-action]') as HTMLElement;
          const command = button?.getAttribute('data-command');
          if (command && button) {
            this.handleCopyCommand(command, button);
          }
          break;
        }
        case 'retry-bridge-status':
          this.checkBridgeStatus();
          break;
        case 'test-connection':
          this.handleTestConnection();
          break;
      }
    });

    // Provider 선택 변경 이벤트
    const providerSelect = this.modalElement.querySelector(
      '.zyle-provider-select'
    ) as HTMLSelectElement;

    if (providerSelect) {
      providerSelect.addEventListener('change', () => {
        this.currentProvider = providerSelect.value as AIProvider;
        this.handleProviderChange();
      });
    }

    // 입력 필드 이벤트
    const input = this.modalElement.querySelector(
      '.zyle-api-key-input'
    ) as HTMLInputElement;
    const saveBtn = this.modalElement.querySelector(
      '[data-action="save"]'
    ) as HTMLButtonElement;

    if (input && saveBtn) {
      input.addEventListener('input', () => {
        if (this.currentProvider === 'anthropic-api') {
          const hasValue = input.value.trim().length > 0;
          const hasExistingKey = this.aiClient.hasApiKey();
          saveBtn.disabled = !hasValue && !hasExistingKey;
        }
      });

      // Enter 키로 저장
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !saveBtn.disabled) {
          this.handleSave();
        }
        // Escape 키로 닫기
        if (e.key === 'Escape') {
          this.hide();
        }
      });
    }

    // 포트 입력 필드 이벤트
    const portInput = this.modalElement.querySelector(
      '[data-input="bridge-port"]'
    ) as HTMLInputElement;

    if (portInput) {
      portInput.addEventListener('input', () => {
        this.handlePortChange(portInput.value);
      });

      portInput.addEventListener('blur', () => {
        // blur 시 포트 저장
        const port = parseInt(portInput.value, 10);
        if (!isNaN(port) && port > 0 && port <= 65535) {
          this.saveBridgePort(port);
        }
      });
    }
  }

  /**
   * Provider 변경 처리
   */
  private handleProviderChange(): void {
    if (!this.modalElement) return;

    const anthropicSettings = this.modalElement.querySelector(
      '.zyle-provider-anthropic'
    ) as HTMLElement;
    const bridgeSettings = this.modalElement.querySelector(
      '.zyle-provider-bridge'
    ) as HTMLElement;

    if (this.currentProvider === 'anthropic-api') {
      anthropicSettings.style.display = '';
      bridgeSettings.style.display = 'none';
      this.updateSaveButtonState();
    } else {
      anthropicSettings.style.display = 'none';
      bridgeSettings.style.display = '';
      // Bridge 상태 확인
      this.bridgeStatus = null;
      this.checkBridgeStatus();
    }
  }

  /**
   * 저장 처리
   */
  private handleSave(): void {
    if (!this.modalElement) return;

    // Provider 저장
    this.saveProvider(this.currentProvider);

    if (this.currentProvider === 'anthropic-api') {
      // API 키 저장
      const input = this.modalElement.querySelector(
        '.zyle-api-key-input'
      ) as HTMLInputElement;
      const value = input?.value.trim();

      if (value) {
        this.aiClient.setApiKey(value);
      }

      // 모델 저장
      const modelSelect = this.modalElement.querySelector(
        '.zyle-model-select'
      ) as HTMLSelectElement;
      if (modelSelect) {
        this.aiClient.setModel(modelSelect.value as AIModel);
      }
    } else if (this.currentProvider === 'claude-bridge') {
      // Bridge 포트 저장
      this.saveBridgePort(this.bridgePort);
    }

    this.hide();

    if (this.onSave) {
      this.onSave();
    }
  }

  /**
   * API 키 삭제 처리
   */
  private handleClearKey(): void {
    this.aiClient.clearApiKey();

    // 모달 다시 렌더링
    if (this.modalElement) {
      const modal = this.modalElement.querySelector('.zyle-modal');
      if (modal) {
        modal.outerHTML = this.renderModal().trim().match(/<div class="zyle-modal">[\s\S]*<\/div>$/)?.[0] || '';
        this.bindEvents();
      }
    }
  }
}
