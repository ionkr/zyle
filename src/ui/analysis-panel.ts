import type {
  LogEntry,
  AnalysisResult,
  NetworkRequest,
  AIAnalysisResult,
  AIAnalysisState,
  AIAnalysisContext,
  DisplayMode,
  ConversationState,
  BridgeStatus,
} from '../types';
import { getAnalysisPanelStyles, getSystemTheme } from './styles';
import { checkIcon } from '../icons';
import { AIClient } from '../ai/ai-client';
import { AISettingsModal } from './ai-settings-modal';
import { getBridgeClient } from '../bridge/bridge-client';
import { BRIDGE_CONSTANTS } from '../constants';
import { getAITranslations } from '../i18n';

// 분리된 패널 모듈
import type { TabType, AnalysisPanelOptions } from './panel/types';
import { savePanelState, restorePanelState } from './panel/panel-storage';
import { applyBodyPush, removeBodyPush, updateBodyPushImmediate } from './panel/body-push';
import { DragResizeHandler } from './panel/drag-resize-handler';
import { renderListView, renderDetailView } from './panel/panel-renderer';

/**
 * 로그 분석 결과 표시 패널 컴포넌트
 *
 * 리팩토링: 핵심 로직을 panel/ 디렉토리로 분리
 * - types.ts: 패널 관련 타입 정의
 * - panel-storage.ts: 상태 저장/복원
 * - body-push.ts: Dock 모드 body 밀어내기
 * - drag-resize-handler.ts: 드래그/리사이즈
 * - panel-renderer.ts: HTML 렌더링
 */
export class AnalysisPanel {
  private container: HTMLDivElement | null = null;
  private shadowRoot: ShadowRoot | null = null;
  private panel: HTMLDivElement | null = null;

  private theme: 'light' | 'dark';
  private zIndex: number;
  private isVisible = false;

  // 데이터 저장소
  private logs: LogEntry[] = [];
  private logsById: Map<string, LogEntry> = new Map();
  private analysisResults: Map<string, AnalysisResult> = new Map();
  private networkRequests: NetworkRequest[] = [];
  private networkRequestsById: Map<string, NetworkRequest> = new Map();

  // UI 상태
  private currentTab: TabType = 'all';
  private selectedLogId: string | null = null;

  // 콜백
  private onClose: (() => void) | null = null;
  private onClear: (() => void) | null = null;
  private onAnalyze: ((entry: LogEntry) => Promise<AnalysisResult>) | null = null;
  private onModeChange: ((mode: DisplayMode) => void) | null = null;

  // AI 분석 관련
  private aiClient: AIClient | null = null;
  private aiSettingsModal: AISettingsModal | null = null;
  private aiAnalysisState: AIAnalysisState = 'idle';
  private aiAnalysisResults: Map<string, AIAnalysisResult> = new Map();
  private aiError: string | null = null;

  // Bridge 관련 상태
  private bridgeStatus: BridgeStatus | null = null;
  private conversations: Map<string, ConversationState> = new Map();
  private bridgePort: number = BRIDGE_CONSTANTS.DEFAULT_PORT;

  // 표시 모드
  private displayMode: DisplayMode = 'floating';
  private dockWidth = 400;

  // 드래그/리사이즈 핸들러
  private dragResizeHandler: DragResizeHandler;

  // 이벤트 핸들러 참조
  private panelClickHandler: ((e: MouseEvent) => void) | null = null;
  private panelMouseDownHandler: ((e: MouseEvent) => void) | null = null;
  private boundHandleMouseMove: (e: MouseEvent) => void;
  private boundHandleMouseUp: () => void;

  // 렌더링 debounce
  private renderDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly RENDER_DEBOUNCE_MS = 50;

  // 새로 추가된 로그 ID 추적 (애니메이션용)
  private newLogIds: Set<string> = new Set();

  constructor(options: AnalysisPanelOptions) {
    this.theme = options.theme === 'auto' ? getSystemTheme() : options.theme;
    this.zIndex = options.zIndex;

    // 상태 복원
    const savedState = restorePanelState();
    if (savedState) {
      this.displayMode = savedState.displayMode || 'floating';
      if (savedState.dockWidth) this.dockWidth = savedState.dockWidth;
    }

    // 옵션으로 받은 displayMode가 있으면 적용
    if (options.displayMode) {
      this.displayMode = options.displayMode;
    }

    // 드래그/리사이즈 핸들러 초기화
    this.dragResizeHandler = new DragResizeHandler(
      {
        position: savedState?.floatingPosition || { x: 0, y: 0 },
        size: savedState?.floatingSize || { width: 450, height: 500 },
        minSize: { width: 300, height: 200 },
        maxSize: { width: 1200, height: 900 },
      },
      this.dockWidth
    );

    // 바운드 메서드
    this.boundHandleMouseMove = this.handleMouseMove.bind(this);
    this.boundHandleMouseUp = this.handleMouseUp.bind(this);
  }

  /**
   * 패널 마운트
   */
  mount(): void {
    if (this.container) return;

    this.container = document.createElement('div');
    this.container.id = 'zyle-analysis-panel-container';

    this.shadowRoot = this.container.attachShadow({ mode: 'closed' });

    const style = document.createElement('style');
    style.textContent = getAnalysisPanelStyles(this.theme, this.zIndex);
    this.shadowRoot.appendChild(style);

    this.panel = document.createElement('div');
    this.panel.className = `zyle-panel ${this.displayMode === 'dock' ? 'dock-mode' : 'floating-mode'}`;

    this.renderPanel();

    this.shadowRoot.appendChild(this.panel);
    document.body.appendChild(this.container);

    document.addEventListener('mousemove', this.boundHandleMouseMove);
    document.addEventListener('mouseup', this.boundHandleMouseUp);

    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', this.handleThemeChange);
    }
  }

  /**
   * 패널 언마운트
   */
  unmount(): void {
    if (!this.container) return;

    document.removeEventListener('mousemove', this.boundHandleMouseMove);
    document.removeEventListener('mouseup', this.boundHandleMouseUp);

    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', this.handleThemeChange);
    }

    removeBodyPush(this.isVisible, this.displayMode);

    this.container.remove();
    this.container = null;
    this.shadowRoot = null;
    this.panel = null;
  }

  /**
   * 패널 렌더링
   */
  private renderPanel(): void {
    if (!this.panel) return;

    if (this.selectedLogId) {
      const log = this.logsById.get(this.selectedLogId);
      if (!log) {
        this.selectedLogId = null;
        this.renderPanel();
        return;
      }

      const analysis = this.analysisResults.get(this.selectedLogId);
      const aiResult = this.aiAnalysisResults.get(this.selectedLogId);
      const provider = this.aiSettingsModal?.getProvider() || 'anthropic-api';
      const isBridgeMode = provider === 'claude-bridge';

      // Bridge 모드일 때 추가 옵션 전달
      const bridgeOptions = isBridgeMode
        ? {
            isBridgeMode: true,
            bridgeStatus: this.bridgeStatus,
            conversation: this.conversations.get(this.selectedLogId) || getBridgeClient({ port: this.bridgePort }).getConversation(),
            bridgePort: this.bridgePort,
          }
        : undefined;

      this.panel.innerHTML = renderDetailView(
        log,
        analysis,
        this.aiAnalysisState,
        aiResult,
        this.aiError,
        this.networkRequests,
        bridgeOptions
      );
    } else {
      this.panel.innerHTML = renderListView(
        this.logs,
        this.networkRequests,
        this.currentTab,
        this.displayMode
      );
    }

    this.bindPanelEvents();
  }

  /**
   * 패널 이벤트 바인딩
   */
  private bindPanelEvents(): void {
    if (!this.panel) return;

    if (this.panelClickHandler) {
      this.panel.removeEventListener('click', this.panelClickHandler);
    }
    if (this.panelMouseDownHandler) {
      this.panel.removeEventListener('mousedown', this.panelMouseDownHandler);
    }

    this.panelClickHandler = this.handlePanelClick.bind(this);
    this.panelMouseDownHandler = this.handlePanelMouseDown.bind(this);

    this.panel.addEventListener('click', this.panelClickHandler);
    this.panel.addEventListener('mousedown', this.panelMouseDownHandler);
  }

  /**
   * 클릭 이벤트 핸들러
   */
  private handlePanelClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;

    const actionElement = target.closest('[data-action]') as HTMLElement | null;
    if (actionElement) {
      const action = actionElement.dataset.action;

      switch (action) {
        case 'close':
          this.hide();
          this.onClose?.();
          break;

        case 'clear':
          this.clear();
          this.onClear?.();
          break;

        case 'delete-log':
          e.stopPropagation();
          const deleteLogId = actionElement.dataset.logId;
          if (deleteLogId) this.deleteLog(deleteLogId);
          break;

        case 'back':
          this.navigateBack();
          break;

        case 'ai-analyze':
          this.handleAIAnalyze();
          break;

        case 'ai-retry':
          if (this.selectedLogId) {
            this.aiAnalysisResults.delete(this.selectedLogId);
          }
          this.handleAIAnalyze();
          break;

        case 'ai-settings':
        case 'settings':
          this.aiSettingsModal?.show();
          break;

        case 'copy-report':
          this.handleCopyReport(actionElement as HTMLButtonElement);
          break;

        case 'toggle-list':
          e.stopPropagation();
          this.handleToggleList(actionElement);
          break;

        case 'toggle-mode':
          this.toggleDisplayMode();
          break;

        case 'send-followup':
          this.handleSendFollowUp();
          break;

        case 'bridge-retry':
          this.bridgeStatus = null;
          this.handleAIAnalyze();
          break;

        case 'copy-command':
          this.handleCopyCommand(actionElement as HTMLButtonElement);
          break;
      }

      return;
    }

    const tabElement = target.closest('[data-tab]') as HTMLElement | null;
    if (tabElement) {
      this.currentTab = tabElement.dataset.tab as TabType;
      this.renderPanel();
      return;
    }

    const networkToggle = target.closest('.zyle-network-toggle') as HTMLElement | null;
    if (networkToggle) {
      e.stopPropagation();
      this.handleNetworkToggle(networkToggle);
      return;
    }

    const logItem = target.closest('[data-log-id]') as HTMLElement | null;
    if (logItem && !target.closest('[data-action="delete-log"]')) {
      const logId = logItem.dataset.logId;
      if (logId) this.selectLog(logId);
    }
  }

  /**
   * 마우스다운 이벤트 핸들러
   */
  private handlePanelMouseDown(e: MouseEvent): void {
    const target = e.target as HTMLElement;

    const resizeHandle = target.closest('[data-resize]') as HTMLElement | null;
    if (resizeHandle) {
      const direction = resizeHandle.dataset.resize || '';

      if (this.displayMode === 'dock' && direction !== 'w') {
        return;
      }

      this.syncPanelRect();
      this.dragResizeHandler.startResize(e.clientX, e.clientY, direction, this.displayMode);

      e.preventDefault();
      e.stopPropagation();
      return;
    }

    if (this.displayMode === 'dock') return;

    const header = target.closest('.zyle-panel-header') as HTMLElement | null;
    if (header && !target.closest('button')) {
      this.syncPanelRect();
      this.dragResizeHandler.startDrag(e.clientX, e.clientY);
      e.preventDefault();
    }
  }

  /**
   * 마우스 이동 핸들러
   */
  private handleMouseMove(e: MouseEvent): void {
    if (this.dragResizeHandler.isDragging()) {
      const result = this.dragResizeHandler.handleDrag(e.clientX, e.clientY);
      if (result) {
        this.applyPanelTransform();
      }
    }

    if (this.dragResizeHandler.isResizing()) {
      if (this.displayMode === 'dock') {
        const newWidth = this.dragResizeHandler.handleDockResize(e.clientX);
        if (newWidth !== null) {
          this.dockWidth = newWidth;
          this.panel!.style.width = `${newWidth}px`;
          updateBodyPushImmediate(newWidth);
          this.saveState();
        }
      } else {
        const geometry = this.dragResizeHandler.handleFloatingResize(e.clientX, e.clientY);
        if (geometry) {
          this.applyPanelTransform();
        }
      }
    }
  }

  /**
   * 마우스 업 핸들러
   */
  private handleMouseUp(): void {
    this.dragResizeHandler.end();
  }

  /**
   * 패널 위치/크기 동기화
   */
  private syncPanelRect(): void {
    if (!this.panel) return;

    const rect = this.panel.getBoundingClientRect();
    this.dragResizeHandler.syncGeometry(rect.left, rect.top, rect.width, rect.height);
  }

  /**
   * 패널 위치/크기 적용
   */
  private applyPanelTransform(): void {
    if (!this.panel) return;

    const geometry = this.dragResizeHandler.getGeometry();
    this.panel.style.left = `${geometry.position.x}px`;
    this.panel.style.top = `${geometry.position.y}px`;
    this.panel.style.width = `${geometry.size.width}px`;
    this.panel.style.height = `${geometry.size.height}px`;
    this.panel.style.right = 'auto';
    this.panel.style.bottom = 'auto';
  }

  /**
   * 표시 모드 전환
   */
  toggleDisplayMode(): void {
    const newMode = this.displayMode === 'floating' ? 'dock' : 'floating';
    this.setDisplayMode(newMode);
  }

  /**
   * 표시 모드 설정
   */
  setDisplayMode(mode: DisplayMode): void {
    if (this.displayMode === mode) return;

    this.displayMode = mode;
    this.updatePanelMode();
    this.saveState();
    this.onModeChange?.(mode);
    this.renderPanel();
  }

  /**
   * 패널 모드에 따른 스타일 적용
   */
  private updatePanelMode(): void {
    if (!this.panel) return;

    this.panel.classList.toggle('dock-mode', this.displayMode === 'dock');
    this.panel.classList.toggle('floating-mode', this.displayMode === 'floating');

    if (this.displayMode === 'dock') {
      this.panel.style.position = 'fixed';
      this.panel.style.top = '0';
      this.panel.style.right = '0';
      this.panel.style.bottom = '0';
      this.panel.style.left = 'auto';
      this.panel.style.width = `${this.dockWidth}px`;
      this.panel.style.height = '100vh';
      this.panel.style.borderRadius = '0';

      if (this.isVisible) {
        applyBodyPush(this.dockWidth);
      }
    } else {
      this.panel.style.borderRadius = '12px';
      const geometry = this.dragResizeHandler.getGeometry();
      this.panel.style.height = `${geometry.size.height}px`;
      this.applyPanelTransform();
      removeBodyPush(this.isVisible, this.displayMode);
    }
  }

  /**
   * 상태 저장
   */
  private saveState(): void {
    const geometry = this.dragResizeHandler.getGeometry();
    savePanelState(
      this.displayMode,
      geometry.position,
      geometry.size,
      this.dockWidth
    );
  }

  /**
   * 패널 표시
   */
  show(buttonPosition: { x: number; y: number }): void {
    if (!this.panel) return;

    this.isVisible = true;

    if (this.displayMode === 'dock') {
      this.updatePanelMode();
      this.panel.classList.add('visible');
      applyBodyPush(this.dockWidth);
      this.renderPanel();
      return;
    }

    const panelWidth = 420;
    const panelHeight = Math.min(500, window.innerHeight - 100);
    const padding = 16;

    let x: number;
    let y: number;

    if (buttonPosition.x > window.innerWidth / 2) {
      x = buttonPosition.x - panelWidth - padding;
    } else {
      x = buttonPosition.x + 72;
    }

    if (buttonPosition.y > window.innerHeight / 2) {
      y = buttonPosition.y - panelHeight + 56;
    } else {
      y = buttonPosition.y;
    }

    x = Math.max(16, Math.min(x, window.innerWidth - panelWidth - 16));
    y = Math.max(16, Math.min(y, window.innerHeight - panelHeight - 16));

    this.panel.style.left = `${x}px`;
    this.panel.style.top = `${y}px`;
    this.panel.classList.add('visible');

    this.renderPanel();
  }

  /**
   * 패널 숨기기
   */
  hide(): void {
    if (!this.panel) return;

    this.isVisible = false;
    this.panel.classList.remove('visible');
    this.selectedLogId = null;

    if (this.displayMode === 'dock') {
      removeBodyPush(this.isVisible, this.displayMode);
    }
  }

  /**
   * 토글
   */
  toggle(buttonPosition: { x: number; y: number }): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show(buttonPosition);
    }
  }

  /**
   * 로그 선택 - 트랜지션 적용
   */
  private async selectLog(logId: string): Promise<void> {
    // 트랜지션 애니메이션 적용
    const content = this.panel?.querySelector('.zyle-panel-content');
    if (content) {
      const currentView = content.querySelector('.zyle-log-list, .zyle-analysis');
      if (currentView) {
        currentView.classList.add('zyle-view', 'slide-out-left');
        await this.waitForAnimation(250);
      }
    }

    this.selectedLogId = logId;

    if (!this.analysisResults.has(logId) && this.onAnalyze) {
      const log = this.logsById.get(logId);
      if (log) {
        this.renderPanel();
        const result = await this.onAnalyze(log);
        this.analysisResults.set(logId, result);
      }
    }

    this.renderPanel();

    // 새 뷰에 슬라이드 인 애니메이션 적용
    const newContent = this.panel?.querySelector('.zyle-panel-content');
    if (newContent) {
      const newView = newContent.querySelector('.zyle-analysis');
      if (newView) {
        newView.classList.add('zyle-view', 'slide-in-right');
      }
    }
  }

  /**
   * 뒤로 가기 - 트랜지션 적용
   */
  private async navigateBack(): Promise<void> {
    // 트랜지션 애니메이션 적용
    const content = this.panel?.querySelector('.zyle-panel-content');
    if (content) {
      const currentView = content.querySelector('.zyle-analysis');
      if (currentView) {
        currentView.classList.add('zyle-view', 'slide-out-right');
        await this.waitForAnimation(250);
      }
    }

    this.selectedLogId = null;
    this.aiAnalysisState = 'idle';
    this.aiError = null;
    this.renderPanel();

    // 새 뷰에 슬라이드 인 애니메이션 적용
    const newContent = this.panel?.querySelector('.zyle-panel-content');
    if (newContent) {
      const newView = newContent.querySelector('.zyle-log-list');
      if (newView) {
        newView.classList.add('zyle-view', 'slide-in-left');
      }
    }
  }

  /**
   * 애니메이션 대기
   */
  private waitForAnimation(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 로그 추가
   */
  addLog(entry: LogEntry): void {
    this.logs.push(entry);
    this.logsById.set(entry.id, entry);
    this.newLogIds.add(entry.id); // 애니메이션용 추적

    if (this.isVisible && !this.selectedLogId) {
      this.renderPanelDebounced();
    }
  }

  /**
   * 네트워크 요청 업데이트
   */
  updateNetworkRequest(request: NetworkRequest): void {
    const existing = this.networkRequestsById.get(request.id);
    if (existing) {
      const index = this.networkRequests.indexOf(existing);
      if (index >= 0) {
        this.networkRequests[index] = request;
      }
    } else {
      this.networkRequests.push(request);
    }
    this.networkRequestsById.set(request.id, request);

    if (this.isVisible && this.currentTab === 'network' && !this.selectedLogId) {
      this.renderPanelDebounced();
    }
  }

  /**
   * 초기화
   */
  clear(): void {
    this.logs = [];
    this.logsById.clear();
    this.analysisResults.clear();
    this.networkRequests = [];
    this.networkRequestsById.clear();
    this.selectedLogId = null;

    if (this.isVisible) {
      this.renderPanel();
    }
  }

  /**
   * 개별 로그 삭제 - 트랜지션 적용
   */
  deleteLog(logId: string): void {
    const log = this.logsById.get(logId);
    if (!log) return;

    // 삭제 애니메이션 적용
    const logElement = this.panel?.querySelector(`[data-log-id="${logId}"]`);
    if (logElement && this.isVisible) {
      logElement.classList.add('item-exit');

      // 애니메이션 완료 후 실제 삭제
      setTimeout(() => {
        this.removeLogFromState(logId);
      }, 250);
    } else {
      // 패널이 안 보이면 즉시 삭제
      this.removeLogFromState(logId);
    }
  }

  /**
   * 렌더링 debounce
   */
  private renderPanelDebounced(): void {
    if (this.renderDebounceTimer) {
      clearTimeout(this.renderDebounceTimer);
    }
    this.renderDebounceTimer = setTimeout(() => {
      this.renderPanel();
      this.applyNewLogAnimations();
      this.renderDebounceTimer = null;
    }, this.RENDER_DEBOUNCE_MS);
  }

  /**
   * 테마 변경 핸들러
   */
  private handleThemeChange = (e: MediaQueryListEvent): void => {
    this.theme = e.matches ? 'dark' : 'light';
    this.updateStyles();
  };

  /**
   * 스타일 업데이트
   */
  private updateStyles(): void {
    if (!this.shadowRoot) return;

    const style = this.shadowRoot.querySelector('style');
    if (style) {
      style.textContent = getAnalysisPanelStyles(this.theme, this.zIndex);
    }
  }

  /**
   * 리포트 복사 처리
   */
  private async handleCopyReport(btn: HTMLButtonElement): Promise<void> {
    const copyText = btn.dataset.copyText || '';

    try {
      await navigator.clipboard.writeText(copyText);
      btn.classList.add('copied');
      const originalHtml = btn.innerHTML;
      btn.innerHTML = `${checkIcon(14)} 복사됨!`;

      setTimeout(() => {
        btn.classList.remove('copied');
        btn.innerHTML = originalHtml;
      }, 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = copyText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  }

  /**
   * 네트워크 상세 토글
   */
  private handleNetworkToggle(toggle: HTMLElement): void {
    const networkItem = toggle.closest('.zyle-network-item');
    if (networkItem) {
      const details = networkItem.querySelector('.zyle-network-details') as HTMLElement;
      if (details) {
        const isHidden = details.style.display === 'none';
        details.style.display = isHidden ? 'block' : 'none';
        toggle.textContent = isHidden ? '▲ 접기' : '▼ 상세';
      }
    }
  }

  /**
   * 새로 추가된 로그에 애니메이션 적용
   */
  private applyNewLogAnimations(): void {
    if (this.newLogIds.size === 0) return;

    this.newLogIds.forEach(logId => {
      const logElement = this.panel?.querySelector(`[data-log-id="${logId}"]`);
      if (logElement) {
        logElement.classList.add('item-enter');
      }
    });

    this.newLogIds.clear();
  }

  /**
   * 로그 상태에서 제거 (내부 헬퍼)
   */
  private removeLogFromState(logId: string): void {
    const log = this.logsById.get(logId);
    if (log) {
      const index = this.logs.indexOf(log);
      if (index !== -1) {
        this.logs.splice(index, 1);
      }
      this.logsById.delete(logId);
      this.analysisResults.delete(logId);
      this.aiAnalysisResults.delete(logId);

      if (this.selectedLogId === logId) {
        this.selectedLogId = null;
      }

      if (this.isVisible) {
        this.renderPanel();
      }
    }
  }

  /**
   * 리스트 접기/펼치기 토글
   */
  private handleToggleList(toggleBtn: HTMLElement): void {
    const collapsibleList = toggleBtn.closest('.zyle-collapsible-list');
    if (collapsibleList) {
      const isExpanded = collapsibleList.classList.toggle('expanded');
      const toggleText = toggleBtn.querySelector('.zyle-toggle-text');
      if (toggleText) {
        toggleText.textContent = isExpanded ? '접기' : '더보기';
      }
    }
  }

  /**
   * AI 분석 실행
   */
  private async handleAIAnalyze(): Promise<void> {
    if (!this.selectedLogId || !this.aiClient) return;

    const provider = this.aiSettingsModal?.getProvider() || 'anthropic-api';

    // Provider에 따른 설정 확인
    if (provider === 'anthropic-api' && !this.aiClient.hasApiKey()) {
      this.aiSettingsModal?.show(() => {
        this.handleAIAnalyze();
      });
      return;
    }

    const log = this.logsById.get(this.selectedLogId);
    const analysis = this.analysisResults.get(this.selectedLogId);

    if (!log) return;

    if (this.aiAnalysisResults.has(this.selectedLogId)) {
      return;
    }

    this.aiAnalysisState = 'loading';
    this.aiError = null;
    this.renderPanel();

    try {
      const context: AIAnalysisContext = {
        logEntry: log,
        stackTrace: log.stackTrace,
        networkRequests: analysis?.relatedNetworkRequests || [],
        codeContext: analysis?.codeContext,
      };

      let result: AIAnalysisResult;

      if (provider === 'claude-bridge') {
        // Bridge를 통한 Claude CLI 분석 (스트리밍)
        result = await this.handleBridgeAnalyze(context);
      } else {
        // Anthropic API 직접 호출
        result = await this.aiClient.analyze(context);
        this.aiAnalysisResults.set(this.selectedLogId!, result);
        this.aiAnalysisState = 'success';
      }
    } catch (error) {
      this.aiAnalysisState = 'error';
      this.aiError = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    }

    this.renderPanel();
  }

  /**
   * Bridge를 통한 AI 분석
   */
  private async handleBridgeAnalyze(context: AIAnalysisContext): Promise<AIAnalysisResult> {
    const bridgeClient = getBridgeClient({ port: this.bridgePort });

    // 서버 상태 확인
    this.bridgeStatus = await bridgeClient.getStatus();
    if (!this.bridgeStatus.available) {
      this.aiAnalysisState = 'error';
      this.renderPanel();
      throw new Error('Bridge server not running');
    }

    // 인증 상태 확인
    if (!this.bridgeStatus.authenticated) {
      this.aiAnalysisState = 'error';
      this.renderPanel();
      throw new Error('Claude CLI not authenticated');
    }

    // 기존 대화 초기화하고 새로 시작
    bridgeClient.resetConversation();

    // 분석 요청 및 결과 대기
    const result = await bridgeClient.analyze(context);

    // 대화 상태 저장
    const conversation = bridgeClient.getConversation();
    if (conversation && this.selectedLogId) {
      this.conversations.set(this.selectedLogId, conversation);
    }

    // 결과 저장 및 상태 업데이트
    this.aiAnalysisResults.set(this.selectedLogId!, result);
    this.aiAnalysisState = 'success';
    this.renderPanel();

    return result;
  }

  /**
   * 추가 질문 전송
   */
  private async handleSendFollowUp(): Promise<void> {
    if (!this.selectedLogId) return;

    const input = this.panel?.querySelector('[data-input="followup"]') as HTMLInputElement;
    if (!input || !input.value.trim()) return;

    const question = input.value.trim();
    input.value = '';

    const provider = this.aiSettingsModal?.getProvider() || 'anthropic-api';

    // Anthropic API는 추가 질문 미지원
    if (provider !== 'claude-bridge') {
      return;
    }

    const bridgeClient = getBridgeClient({ port: this.bridgePort });

    // 대화가 없으면 무시
    if (!bridgeClient.getConversation()) {
      return;
    }

    this.aiAnalysisState = 'loading';
    this.renderPanel();

    try {
      // 추가 질문 전송 및 응답 대기
      await bridgeClient.askFollowUp(question);

      // 대화 상태 저장
      const conversation = bridgeClient.getConversation();
      if (conversation) {
        this.conversations.set(this.selectedLogId!, conversation);
      }

      this.aiAnalysisState = 'success';
      this.renderPanel();
    } catch (error) {
      this.aiError = error instanceof Error ? error.message : 'Unknown error';
      this.aiAnalysisState = 'error';
      this.renderPanel();
    }
  }

  /**
   * 명령어 복사 처리
   */
  private async handleCopyCommand(btn: HTMLButtonElement): Promise<void> {
    const command = btn.dataset.command || '';
    const ai = getAITranslations();

    try {
      await navigator.clipboard.writeText(command);
      btn.classList.add('copied');
      const originalText = btn.textContent;
      btn.textContent = ai.settings.bridge.notRunningGuide.copied;

      setTimeout(() => {
        btn.classList.remove('copied');
        btn.textContent = originalText;
      }, 2000);
    } catch {
      // 폴백
      const textarea = document.createElement('textarea');
      textarea.value = command;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  }

  // === Public API ===

  setOnClose(handler: () => void): void {
    this.onClose = handler;
  }

  setOnClear(handler: () => void): void {
    this.onClear = handler;
  }

  setOnAnalyze(handler: (entry: LogEntry) => Promise<AnalysisResult>): void {
    this.onAnalyze = handler;
  }

  setOnModeChange(handler: (mode: DisplayMode) => void): void {
    this.onModeChange = handler;
  }

  setTheme(theme: 'light' | 'dark'): void {
    this.theme = theme;
    this.updateStyles();
  }

  isOpen(): boolean {
    return this.isVisible;
  }

  getDisplayMode(): DisplayMode {
    return this.displayMode;
  }

  setAIClient(client: AIClient): void {
    this.aiClient = client;
    if (this.shadowRoot) {
      this.aiSettingsModal = new AISettingsModal(this.shadowRoot, client);
    }
  }
}
