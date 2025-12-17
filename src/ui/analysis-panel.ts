import type {
  LogEntry,
  AnalysisResult,
  NetworkRequest,
  AIAnalysisResult,
  AIAnalysisState,
  AIAnalysisContext,
  DisplayMode,
} from '../types';
import { getAnalysisPanelStyles, getSystemTheme } from './styles';
import { checkIcon } from '../icons';
import { AIClient } from '../ai/ai-client';
import { AISettingsModal } from './ai-settings-modal';

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

      this.panel.innerHTML = renderDetailView(
        log,
        analysis,
        this.aiAnalysisState,
        aiResult,
        this.aiError,
        this.networkRequests
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
          this.selectedLogId = null;
          this.aiAnalysisState = 'idle';
          this.aiError = null;
          this.renderPanel();
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
   * 로그 선택
   */
  private async selectLog(logId: string): Promise<void> {
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
  }

  /**
   * 로그 추가
   */
  addLog(entry: LogEntry): void {
    this.logs.push(entry);
    this.logsById.set(entry.id, entry);

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
   * 개별 로그 삭제
   */
  deleteLog(logId: string): void {
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
   * 렌더링 debounce
   */
  private renderPanelDebounced(): void {
    if (this.renderDebounceTimer) {
      clearTimeout(this.renderDebounceTimer);
    }
    this.renderDebounceTimer = setTimeout(() => {
      this.renderPanel();
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

    if (!this.aiClient.hasApiKey()) {
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

      const result = await this.aiClient.analyze(context);
      this.aiAnalysisResults.set(this.selectedLogId, result);
      this.aiAnalysisState = 'success';
    } catch (error) {
      this.aiAnalysisState = 'error';
      this.aiError = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    }

    this.renderPanel();
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
