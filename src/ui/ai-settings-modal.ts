import { AIClient, AI_MODELS, type AIModel } from '../ai/ai-client';
import { sparkleIcon } from '../icons';

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

  constructor(shadowRoot: ShadowRoot, aiClient: AIClient) {
    this.shadowRoot = shadowRoot;
    this.aiClient = aiClient;
  }

  /**
   * 모달 표시
   */
  show(onSave?: () => void): void {
    if (this.modalElement) {
      this.hide();
    }

    this.onSave = onSave || null;

    this.modalElement = document.createElement('div');
    this.modalElement.className = 'zyle-modal-overlay';
    this.modalElement.innerHTML = this.renderModal();

    this.shadowRoot.appendChild(this.modalElement);
    this.bindEvents();

    // 입력 필드에 포커스
    const input = this.modalElement.querySelector(
      '.zyle-api-key-input'
    ) as HTMLInputElement;
    if (input) {
      setTimeout(() => input.focus(), 100);
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
    const maskedKey = this.aiClient.getMaskedApiKey();
    const hasKey = this.aiClient.hasApiKey();
    const currentModel = this.aiClient.getModel();

    return `
      <div class="zyle-modal">
        <div class="zyle-modal-header">
          <h3>
            ${getSparkleIcon()}
            AI 분석 설정
          </h3>
          <button class="zyle-modal-close" data-action="close">×</button>
        </div>
        <div class="zyle-modal-body">
          <label>
            <span>Anthropic API Key</span>
            <input
              type="password"
              class="zyle-api-key-input"
              placeholder="sk-ant-api03-..."
              autocomplete="off"
            />
          </label>
          ${
            hasKey
              ? `
            <div class="zyle-api-key-current">
              <span>현재: ${maskedKey}</span>
              <button class="zyle-btn-clear-key" data-action="clear-key">삭제</button>
            </div>
          `
              : ''
          }
          <p class="zyle-api-key-hint">
            API 키는 브라우저 로컬 스토리지에 저장됩니다.<br/>
            <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer">
              Anthropic Console에서 API 키 발급받기 →
            </a>
          </p>

          <label style="margin-top: 20px;">
            <span>AI 모델</span>
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
            Sonnet은 빠르고 경제적, Opus는 가장 정확한 분석을 제공합니다.
          </p>
        </div>
        <div class="zyle-modal-footer">
          <button class="zyle-btn-cancel" data-action="cancel">취소</button>
          <button class="zyle-btn-save" data-action="save" ${hasKey ? '' : 'disabled'}>저장</button>
        </div>
      </div>
    `;
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
      }
    });

    // 입력 필드 이벤트
    const input = this.modalElement.querySelector(
      '.zyle-api-key-input'
    ) as HTMLInputElement;
    const saveBtn = this.modalElement.querySelector(
      '[data-action="save"]'
    ) as HTMLButtonElement;

    if (input && saveBtn) {
      input.addEventListener('input', () => {
        const hasValue = input.value.trim().length > 0;
        const hasExistingKey = this.aiClient.hasApiKey();
        saveBtn.disabled = !hasValue && !hasExistingKey;
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
  }

  /**
   * 저장 처리
   */
  private handleSave(): void {
    if (!this.modalElement) return;

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
