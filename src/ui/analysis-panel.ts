import type {
  LogEntry,
  AnalysisResult,
  NetworkRequest,
  AIAnalysisResult,
  AIAnalysisState,
  AIAnalysisContext,
  DisplayMode,
  PanelState,
} from '../types';
import { getAnalysisPanelStyles, getSystemTheme } from './styles';
import { formatTimestamp, clamp } from '../utils/helpers';
import { escapeHtml, escapeHtmlAttr } from '../utils/sanitizer';
import { AIClient } from '../ai/ai-client';
import { AISettingsModal, getSparkleIcon } from './ai-settings-modal';
import {
  deleteIcon,
  settingsIcon,
  closeIcon,
  backIcon,
  codeIcon,
  globeIcon,
  listIcon,
  checkIcon,
  createLogoElement,
  dockIcon,
  floatIcon,
} from '../icons';

// 렌더러 유틸리티 모듈
import * as LogRenderer from './renderers/log-renderer';
import * as NetworkRenderer from './renderers/network-renderer';
import * as AIRenderer from './renderers/ai-renderer';

type TabType = 'all' | 'errors' | 'warnings' | 'network';

/**
 * 로그 분석 결과 표시 패널 컴포넌트
 */
export class AnalysisPanel {
  private container: HTMLDivElement | null = null;
  private shadowRoot: ShadowRoot | null = null;
  private panel: HTMLDivElement | null = null;

  private theme: 'light' | 'dark';
  private zIndex: number;
  private isVisible = false;

  private logs: LogEntry[] = [];
  private logsById: Map<string, LogEntry> = new Map(); // O(1) 검색용 인덱스
  private analysisResults: Map<string, AnalysisResult> = new Map();
  private networkRequests: NetworkRequest[] = [];
  private networkRequestsById: Map<string, NetworkRequest> = new Map(); // O(1) 검색용 인덱스

  private currentTab: TabType = 'all';
  private selectedLogId: string | null = null;

  private onClose: (() => void) | null = null;
  private onClear: (() => void) | null = null;
  private onAnalyze: ((entry: LogEntry) => Promise<AnalysisResult>) | null = null;

  // AI 분석 관련 상태
  private aiClient: AIClient | null = null;
  private aiSettingsModal: AISettingsModal | null = null;
  private aiAnalysisState: AIAnalysisState = 'idle';
  private aiAnalysisResults: Map<string, AIAnalysisResult> = new Map();
  private aiError: string | null = null;

  // Dock 모드 관련 상태
  private displayMode: DisplayMode = 'floating';
  private dockWidth = 400;
  private onModeChange: ((mode: DisplayMode) => void) | null = null;

  // Dock 모드 상수
  private readonly DOCK_MIN_WIDTH = 320;
  private readonly DOCK_MAX_WIDTH = 600;
  private readonly STORAGE_KEY_PANEL_STATE = 'zyle_panel_state';

  // 드래그 관련 상태
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private panelStartX = 0;
  private panelStartY = 0;

  // 리사이즈 관련 상태
  private isResizing = false;
  private resizeDirection = '';
  private resizeStartX = 0;
  private resizeStartY = 0;
  private panelStartWidth = 0;
  private panelStartHeight = 0;

  // 패널 위치/크기
  private panelPosition = { x: 0, y: 0 };
  private panelSize = { width: 450, height: 500 };
  private minSize = { width: 300, height: 200 };
  private maxSize = { width: 1200, height: 900 };

  // 이벤트 핸들러 참조 (메모리 누수 방지)
  private panelClickHandler: ((e: MouseEvent) => void) | null = null;
  private panelMouseDownHandler: ((e: MouseEvent) => void) | null = null;

  // 렌더링 debounce
  private renderDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly RENDER_DEBOUNCE_MS = 50;

  constructor(options: { theme: 'light' | 'dark' | 'auto'; zIndex: number; displayMode?: DisplayMode }) {
    this.theme = options.theme === 'auto' ? getSystemTheme() : options.theme;
    this.zIndex = options.zIndex;

    // localStorage에서 패널 상태 복원
    this.restorePanelState();

    // 옵션으로 받은 displayMode가 있으면 적용 (복원된 값보다 우선)
    if (options.displayMode) {
      this.displayMode = options.displayMode;
    }

    // 바운드 메서드
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
  }

  /**
   * 패널 마운트
   */
  mount(): void {
    if (this.container) return;

    // 컨테이너 생성
    this.container = document.createElement('div');
    this.container.id = 'zyle-analysis-panel-container';

    // Shadow DOM 생성
    this.shadowRoot = this.container.attachShadow({ mode: 'closed' });

    // 스타일 주입
    const style = document.createElement('style');
    style.textContent = getAnalysisPanelStyles(this.theme, this.zIndex);
    this.shadowRoot.appendChild(style);

    // 패널 생성
    this.panel = document.createElement('div');
    this.panel.className = `zyle-panel ${this.displayMode === 'dock' ? 'dock-mode' : 'floating-mode'}`;

    this.renderPanel();

    this.shadowRoot.appendChild(this.panel);

    // DOM에 추가
    document.body.appendChild(this.container);

    // 전역 마우스 이벤트 (드래그/리사이즈용)
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseup', this.handleMouseUp);

    // 시스템 테마 변경 감지
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', this.handleThemeChange);
    }
  }

  /**
   * 패널 언마운트
   */
  unmount(): void {
    if (!this.container) return;

    // 전역 마우스 이벤트 제거
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);

    // 테마 변경 리스너 제거
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', this.handleThemeChange);
    }

    // body push 해제
    this.removeBodyPush();

    // DOM에서 제거
    this.container.remove();
    this.container = null;
    this.shadowRoot = null;
    this.panel = null;
  }

  /**
   * 패널 상태 저장
   */
  private savePanelState(): void {
    const state: PanelState = {
      displayMode: this.displayMode,
      floatingPosition: this.panelPosition,
      floatingSize: this.panelSize,
      dockWidth: this.dockWidth,
    };

    try {
      localStorage.setItem(this.STORAGE_KEY_PANEL_STATE, JSON.stringify(state));
    } catch {
      // localStorage 오류 무시
    }
  }

  /**
   * 패널 상태 복원
   */
  private restorePanelState(): void {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY_PANEL_STATE);
      if (saved) {
        const state: PanelState = JSON.parse(saved);
        this.displayMode = state.displayMode || 'floating';
        if (state.floatingPosition) this.panelPosition = state.floatingPosition;
        if (state.floatingSize) this.panelSize = state.floatingSize;
        if (state.dockWidth) this.dockWidth = state.dockWidth;
      }
    } catch {
      // 파싱 오류 무시
    }
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
    this.savePanelState();
    this.onModeChange?.(mode);

    // UI 업데이트 (모드 전환 버튼 아이콘 갱신)
    this.renderPanel();
  }

  /**
   * 현재 표시 모드 반환
   */
  getDisplayMode(): DisplayMode {
    return this.displayMode;
  }

  /**
   * 모드 변경 콜백 설정
   */
  setOnModeChange(handler: (mode: DisplayMode) => void): void {
    this.onModeChange = handler;
  }

  /**
   * 패널 모드에 따른 스타일 적용
   */
  private updatePanelMode(): void {
    if (!this.panel) return;

    // 클래스 토글
    this.panel.classList.toggle('dock-mode', this.displayMode === 'dock');
    this.panel.classList.toggle('floating-mode', this.displayMode === 'floating');

    if (this.displayMode === 'dock') {
      // Dock 모드: 고정 위치, 전체 높이
      this.panel.style.position = 'fixed';
      this.panel.style.top = '0';
      this.panel.style.right = '0';
      this.panel.style.bottom = '0';
      this.panel.style.left = 'auto';
      this.panel.style.width = `${this.dockWidth}px`;
      this.panel.style.height = '100vh';
      this.panel.style.borderRadius = '0';

      // 컨슈머 웹 밀어내기 (visible 상태일 때만)
      if (this.isVisible) {
        this.applyBodyPush(this.dockWidth);
      }
    } else {
      // 플로팅 모드: 기존 로직
      this.panel.style.borderRadius = '12px';
      this.panel.style.height = `${this.panelSize.height}px`;
      this.applyPanelTransform();

      // 밀어내기 해제
      this.removeBodyPush();
    }
  }

  /**
   * 컨슈머 웹 밀어내기 (body width 조절)
   */
  private applyBodyPush(width: number): void {
    const html = document.documentElement;
    const body = document.body;
    const transition = 'width 300ms ease-out, margin-right 300ms ease-out';

    // html과 body 모두에 스타일 적용 (다양한 레이아웃 대응)
    html.style.transition = transition;
    html.style.overflowX = 'hidden';
    html.style.marginRight = `${width}px`;

    body.style.transition = transition;
    body.style.overflowX = 'hidden';
    body.style.marginRight = `${width}px`;
    // width가 100vw로 설정된 경우를 위해 max-width 제한
    body.style.maxWidth = `calc(100vw - ${width}px)`;
  }

  /**
   * 컨슈머 웹 밀어내기 해제
   */
  private removeBodyPush(): void {
    const html = document.documentElement;
    const body = document.body;
    const transition = 'width 300ms ease-out, margin-right 300ms ease-out';

    html.style.transition = transition;
    body.style.transition = transition;

    html.style.marginRight = '';
    body.style.marginRight = '';
    body.style.maxWidth = '';

    // 약간의 지연 후 overflow 복원
    setTimeout(() => {
      if (!this.isVisible || this.displayMode !== 'dock') {
        html.style.overflowX = '';
        body.style.overflowX = '';
      }
    }, 300);
  }

  /**
   * 패널 렌더링
   */
  private renderPanel(): void {
    if (!this.panel) return;

    if (this.selectedLogId) {
      this.renderDetailView();
    } else {
      this.renderListView();
    }
  }

  /**
   * 목록 뷰 렌더링
   */
  private renderListView(): void {
    if (!this.panel) return;

    const filteredLogs = this.getFilteredLogs();

    this.panel.innerHTML = `
      <div class="zyle-panel-header">
        <span class="zyle-panel-title">
          ${createLogoElement(20)}
          Zyle
        </span>
        <div style="display: flex; gap: 8px; align-items: center;">
          <button class="zyle-mode-toggle" data-action="toggle-mode" title="${this.displayMode === 'floating' ? 'Dock 모드로 전환' : '플로팅 모드로 전환'}">
            ${this.displayMode === 'floating' ? dockIcon(18) : floatIcon(18)}
          </button>
          <button class="zyle-clear-button" data-action="clear" title="모두 삭제">
            ${deleteIcon(18)}
          </button>
          <button class="zyle-settings-button" data-action="settings" title="설정">
            ${settingsIcon(20)}
          </button>
          <button class="zyle-panel-close" data-action="close">
            ${closeIcon(20)}
          </button>
        </div>
      </div>
      <div class="zyle-panel-tabs">
        <button class="zyle-tab ${this.currentTab === 'all' ? 'active' : ''}" data-tab="all">
          All (${this.logs.length})
        </button>
        <button class="zyle-tab ${this.currentTab === 'errors' ? 'active' : ''}" data-tab="errors">
          Errors (${this.logs.filter((l) => l.level === 'error').length})
        </button>
        <button class="zyle-tab ${this.currentTab === 'warnings' ? 'active' : ''}" data-tab="warnings">
          Warnings (${this.logs.filter((l) => l.level === 'warn').length})
        </button>
        <button class="zyle-tab ${this.currentTab === 'network' ? 'active' : ''}" data-tab="network">
          Network (${this.networkRequests.filter((r) => r.requestStatus === 'error' || r.requestStatus === 'timeout').length})
        </button>
      </div>
      <div class="zyle-panel-content scrollbar-thin">
        ${this.currentTab === 'network' ? NetworkRenderer.renderNetworkList(this.networkRequests) : LogRenderer.renderLogList(filteredLogs)}
      </div>
      <!-- 리사이즈 핸들 -->
      <div class="zyle-resize-handle zyle-resize-n" data-resize="n"></div>
      <div class="zyle-resize-handle zyle-resize-s" data-resize="s"></div>
      <div class="zyle-resize-handle zyle-resize-e" data-resize="e"></div>
      <div class="zyle-resize-handle zyle-resize-w" data-resize="w"></div>
      <div class="zyle-resize-handle zyle-resize-ne" data-resize="ne"></div>
      <div class="zyle-resize-handle zyle-resize-nw" data-resize="nw"></div>
      <div class="zyle-resize-handle zyle-resize-se" data-resize="se"></div>
      <div class="zyle-resize-handle zyle-resize-sw" data-resize="sw"></div>
    `;

    this.bindPanelEvents();
  }

  /**
   * 상세 뷰 렌더링 (O(1) 검색)
   */
  private renderDetailView(): void {
    if (!this.panel || !this.selectedLogId) return;

    const log = this.logsById.get(this.selectedLogId);
    const analysis = this.analysisResults.get(this.selectedLogId);

    if (!log) {
      this.selectedLogId = null;
      this.renderListView();
      return;
    }

    this.panel.innerHTML = `
      <div class="zyle-panel-header">
        <div style="display: flex; align-items: center; gap: 8px; overflow: hidden; flex: 1; min-width: 0;">
          <button class="zyle-header-back" data-action="back" title="Back to list">
            ${backIcon(20)}
          </button>
          <span class="zyle-log-level ${log.level}" style="flex-shrink: 0;">${log.level.toUpperCase()}</span>
          <span class="zyle-panel-title" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtmlAttr(log.message)}">${this.truncateMessage(log.message, 40)}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 4px;">
          <button class="zyle-ai-button ${this.aiAnalysisState === 'loading' ? 'loading' : ''}" data-action="ai-analyze" title="AI 분석">
            ${getSparkleIcon()}
          </button>
          <button class="zyle-panel-close" data-action="close">
            ${closeIcon(20)}
          </button>
        </div>
      </div>
      <div class="zyle-panel-content scrollbar-thin" style="position: relative;">
        ${this.renderLogDetail(log, analysis)}
        ${this.aiAnalysisState === 'loading' && this.selectedLogId === log.id ? AIRenderer.renderLoadingOverlay() : ''}
      </div>
      <!-- 리사이즈 핸들 -->
      <div class="zyle-resize-handle zyle-resize-n" data-resize="n"></div>
      <div class="zyle-resize-handle zyle-resize-s" data-resize="s"></div>
      <div class="zyle-resize-handle zyle-resize-e" data-resize="e"></div>
      <div class="zyle-resize-handle zyle-resize-w" data-resize="w"></div>
      <div class="zyle-resize-handle zyle-resize-ne" data-resize="ne"></div>
      <div class="zyle-resize-handle zyle-resize-nw" data-resize="nw"></div>
      <div class="zyle-resize-handle zyle-resize-se" data-resize="se"></div>
      <div class="zyle-resize-handle zyle-resize-sw" data-resize="sw"></div>
    `;

    this.bindPanelEvents();
  }

  /**
   * 로그 상세 렌더링
   */
  private renderLogDetail(log: LogEntry, analysis?: AnalysisResult): string {
    return `
      <div class="zyle-analysis">
        <div class="zyle-log-item ${log.level}" style="cursor: default;">
          <div class="zyle-log-header">
            <span class="zyle-log-level ${log.level}">${log.level}</span>
            <span class="zyle-log-time">${formatTimestamp(log.timestamp)}</span>
          </div>
          <div class="zyle-log-message" style="max-height: none;">${escapeHtml(log.message)}</div>
        </div>

        ${
          analysis ? `
          ${
            analysis.errorType
              ? `
            <div class="zyle-error-type-card ${analysis.severity}">
              <div class="zyle-error-type-icon">
                ${LogRenderer.getSeverityIcon(analysis.severity)}
              </div>
              <div class="zyle-error-type-content">
                <span class="zyle-error-type-label">${analysis.errorType}</span>
                <span class="zyle-error-type-severity">${LogRenderer.getSeverityLabel(analysis.severity)}</span>
              </div>
            </div>
          `
              : ''
          }

          ${this.renderAnalysisOrAI(log.id, analysis)}

          ${
            analysis.codeContext?.sourcePreview && analysis.codeContext.sourcePreview.length > 0
              ? `
            <div class="zyle-analysis-section">
              <div class="zyle-analysis-title">
                ${codeIcon(16)}
                Source Code (${escapeHtml(analysis.codeContext.fileName)}:${analysis.codeContext.lineNumber})
              </div>
              <div class="zyle-code-preview">
                ${LogRenderer.renderCodePreview(analysis.codeContext.sourcePreview, analysis.codeContext.lineNumber)}
              </div>
            </div>
          `
              : ''
          }

          ${
            analysis.relatedNetworkRequests.length > 0
              ? `
            <div class="zyle-analysis-section">
              <div class="zyle-analysis-title">
                ${globeIcon(16)}
                Related Network Requests
              </div>
              ${analysis.relatedNetworkRequests.map((req) => NetworkRenderer.renderNetworkItem(req)).join('')}
            </div>
          `
              : ''
          }
        `
            : `
          <div class="zyle-empty" style="padding: 20px;">
            <p>Analyzing...</p>
          </div>
        `
        }

        ${
          log.stackTrace.length > 0
            ? `
          <div class="zyle-analysis-section">
            <div class="zyle-analysis-title">
              ${listIcon(16)}
              Stack Trace
            </div>
            <div class="zyle-code-preview">
              ${log.stackTrace
                .map((frame) => {
                  const location = frame.original
                    ? `${frame.original.fileName}:${frame.original.lineNumber}:${frame.original.columnNumber}`
                    : `${frame.fileName}:${frame.lineNumber}:${frame.columnNumber}`;
                  return `<div class="zyle-code-line">
                  <span style="color: var(--text-secondary);">at</span>
                  <span>${frame.functionName}</span>
                  <span style="opacity: 0.7;">(${location})</span>
                </div>`;
                })
                .join('')}
            </div>
          </div>
        `
            : ''
        }
      </div>
    `;
  }

  /**
   * 패널 이벤트 바인딩 (이벤트 위임 패턴, 메모리 누수 방지)
   */
  private bindPanelEvents(): void {
    if (!this.panel) return;

    // 기존 리스너 제거 (메모리 누수 방지)
    if (this.panelClickHandler) {
      this.panel.removeEventListener('click', this.panelClickHandler);
    }
    if (this.panelMouseDownHandler) {
      this.panel.removeEventListener('mousedown', this.panelMouseDownHandler);
    }

    // 새 핸들러 바인딩 및 저장
    this.panelClickHandler = this.handlePanelClick.bind(this);
    this.panelMouseDownHandler = this.handlePanelMouseDown.bind(this);

    // 클릭 이벤트 위임 - 단일 리스너로 모든 클릭 이벤트 처리
    this.panel.addEventListener('click', this.panelClickHandler);

    // 마우스다운 이벤트 위임 - 드래그/리사이즈 처리
    this.panel.addEventListener('mousedown', this.panelMouseDownHandler);
  }

  /**
   * 패널 클릭 이벤트 핸들러 (이벤트 위임)
   */
  private handlePanelClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;

    // data-action 속성을 가진 가장 가까운 요소 찾기
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
          if (deleteLogId) {
            this.deleteLog(deleteLogId);
          }
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

    // data-tab 속성 처리
    const tabElement = target.closest('[data-tab]') as HTMLElement | null;
    if (tabElement) {
      this.currentTab = tabElement.dataset.tab as TabType;
      this.renderPanel();
      return;
    }

    // 네트워크 토글 처리
    const networkToggle = target.closest('.zyle-network-toggle') as HTMLElement | null;
    if (networkToggle) {
      e.stopPropagation();
      this.handleNetworkToggle(networkToggle);
      return;
    }

    // 로그 아이템 클릭 (삭제 버튼이 아닌 경우)
    const logItem = target.closest('[data-log-id]') as HTMLElement | null;
    if (logItem && !target.closest('[data-action="delete-log"]')) {
      const logId = logItem.dataset.logId;
      if (logId) {
        this.selectLog(logId);
      }
    }
  }

  /**
   * 패널 마우스다운 이벤트 핸들러 (드래그/리사이즈)
   */
  private handlePanelMouseDown(e: MouseEvent): void {
    const target = e.target as HTMLElement;

    // 리사이즈 핸들 처리
    const resizeHandle = target.closest('[data-resize]') as HTMLElement | null;
    if (resizeHandle) {
      const direction = resizeHandle.dataset.resize || '';

      // Dock 모드에서는 왼쪽(w) 방향만 허용
      if (this.displayMode === 'dock' && direction !== 'w') {
        return;
      }

      this.syncPanelRect();

      this.isResizing = true;
      this.resizeDirection = direction;
      this.resizeStartX = e.clientX;
      this.resizeStartY = e.clientY;
      this.panelStartWidth = this.displayMode === 'dock' ? this.dockWidth : this.panelSize.width;
      this.panelStartHeight = this.panelSize.height;
      this.panelStartX = this.panelPosition.x;
      this.panelStartY = this.panelPosition.y;

      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // 헤더 드래그 처리 (Dock 모드에서는 비활성화)
    if (this.displayMode === 'dock') return;

    const header = target.closest('.zyle-panel-header') as HTMLElement | null;
    if (header && !target.closest('button')) {
      this.syncPanelRect();

      this.isDragging = true;
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;
      this.panelStartX = this.panelPosition.x;
      this.panelStartY = this.panelPosition.y;

      e.preventDefault();
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
      btn.innerHTML = `
        ${checkIcon(14)}
        복사됨!
      `;

      setTimeout(() => {
        btn.classList.remove('copied');
        btn.innerHTML = originalHtml;
      }, 2000);
    } catch {
      // 클립보드 API 실패 시 폴백
      const textarea = document.createElement('textarea');
      textarea.value = copyText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  }

  /**
   * 네트워크 상세 토글 처리
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
   * 리스트 접기/펼치기 토글 처리
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
   * 패널의 실제 위치/크기를 내부 상태와 동기화
   */
  private syncPanelRect(): void {
    if (!this.panel) return;

    const rect = this.panel.getBoundingClientRect();
    this.panelPosition.x = rect.left;
    this.panelPosition.y = rect.top;
    this.panelSize.width = rect.width;
    this.panelSize.height = rect.height;
  }

  /**
   * 마우스 이동 핸들러 (드래그/리사이즈)
   */
  private handleMouseMove(e: MouseEvent): void {
    if (this.isDragging) {
      const deltaX = e.clientX - this.dragStartX;
      const deltaY = e.clientY - this.dragStartY;

      this.panelPosition.x = clamp(
        this.panelStartX + deltaX,
        0,
        window.innerWidth - this.panelSize.width
      );
      this.panelPosition.y = clamp(
        this.panelStartY + deltaY,
        0,
        window.innerHeight - this.panelSize.height
      );

      this.applyPanelTransform();
    }

    if (this.isResizing) {
      const deltaX = e.clientX - this.resizeStartX;
      const deltaY = e.clientY - this.resizeStartY;

      // Dock 모드: 너비만 조절
      if (this.displayMode === 'dock') {
        if (this.resizeDirection === 'w') {
          const newWidth = clamp(
            this.panelStartWidth - deltaX,
            this.DOCK_MIN_WIDTH,
            this.DOCK_MAX_WIDTH
          );
          this.dockWidth = newWidth;
          this.panel!.style.width = `${newWidth}px`;
          // 컨슈머 웹 margin도 함께 조절 (리사이즈 중에는 transition 없이)
          document.documentElement.style.marginRight = `${newWidth}px`;
          document.body.style.marginRight = `${newWidth}px`;
          document.body.style.maxWidth = `calc(100vw - ${newWidth}px)`;
          this.savePanelState();
        }
        return;
      }

      // 플로팅 모드: 기존 로직
      let newWidth = this.panelStartWidth;
      let newHeight = this.panelStartHeight;
      let newX = this.panelStartX;
      let newY = this.panelStartY;

      // 방향에 따른 리사이즈 계산
      if (this.resizeDirection.includes('e')) {
        newWidth = clamp(this.panelStartWidth + deltaX, this.minSize.width, this.maxSize.width);
      }
      if (this.resizeDirection.includes('w')) {
        const widthDelta = clamp(this.panelStartWidth - deltaX, this.minSize.width, this.maxSize.width) - this.panelStartWidth;
        newWidth = this.panelStartWidth + widthDelta;
        newX = this.panelStartX - widthDelta;
      }
      if (this.resizeDirection.includes('s')) {
        newHeight = clamp(this.panelStartHeight + deltaY, this.minSize.height, this.maxSize.height);
      }
      if (this.resizeDirection.includes('n')) {
        const heightDelta = clamp(this.panelStartHeight - deltaY, this.minSize.height, this.maxSize.height) - this.panelStartHeight;
        newHeight = this.panelStartHeight + heightDelta;
        newY = this.panelStartY - heightDelta;
      }

      // 화면 경계 체크
      newX = clamp(newX, 0, window.innerWidth - newWidth);
      newY = clamp(newY, 0, window.innerHeight - newHeight);

      this.panelSize.width = newWidth;
      this.panelSize.height = newHeight;
      this.panelPosition.x = newX;
      this.panelPosition.y = newY;

      this.applyPanelTransform();
    }
  }

  /**
   * 마우스 업 핸들러
   */
  private handleMouseUp(): void {
    this.isDragging = false;
    this.isResizing = false;
    this.resizeDirection = '';
  }

  /**
   * 패널 위치/크기 적용
   */
  private applyPanelTransform(): void {
    if (!this.panel) return;

    this.panel.style.left = `${this.panelPosition.x}px`;
    this.panel.style.top = `${this.panelPosition.y}px`;
    this.panel.style.width = `${this.panelSize.width}px`;
    this.panel.style.height = `${this.panelSize.height}px`;
    this.panel.style.right = 'auto';
    this.panel.style.bottom = 'auto';
  }

  /**
   * 로그 선택 (O(1) 검색)
   */
  private async selectLog(logId: string): Promise<void> {
    this.selectedLogId = logId;

    // 분석 결과가 없으면 분석 실행 (Map으로 O(1) 검색)
    if (!this.analysisResults.has(logId) && this.onAnalyze) {
      const log = this.logsById.get(logId);
      if (log) {
        this.renderPanel(); // 로딩 상태 표시
        const result = await this.onAnalyze(log);
        this.analysisResults.set(logId, result);
      }
    }

    this.renderPanel();
  }

  /**
   * 필터링된 로그 가져오기
   */
  private getFilteredLogs(): LogEntry[] {
    switch (this.currentTab) {
      case 'errors':
        return this.logs.filter((l) => l.level === 'error');
      case 'warnings':
        return this.logs.filter((l) => l.level === 'warn');
      default:
        return this.logs;
    }
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
   * 메시지 이스케이프 처리
   * @deprecated truncate 기능 제거됨, escapeHtml 직접 사용 권장
   */
  private truncateMessage(message: string, _maxLength?: number): string {
    return escapeHtml(message);
  }

  /**
   * 패널 표시
   */
  show(buttonPosition: { x: number; y: number }): void {
    if (!this.panel) return;

    this.isVisible = true;

    // Dock 모드일 때
    if (this.displayMode === 'dock') {
      this.updatePanelMode();
      this.panel.classList.add('visible');
      this.applyBodyPush(this.dockWidth);
      this.renderPanel();
      return;
    }

    // 플로팅 모드: 패널 위치 계산
    const panelWidth = 420;
    const panelHeight = Math.min(500, window.innerHeight - 100);
    const padding = 16;

    let x: number;
    let y: number;

    // 버튼 위치에 따라 패널 위치 결정
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

    // 화면 밖으로 나가지 않도록 조정
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

    // Dock 모드일 때 밀어내기 해제
    if (this.displayMode === 'dock') {
      this.removeBodyPush();
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
   * 로그 추가 (Map 인덱스 동기화)
   */
  addLog(entry: LogEntry): void {
    this.logs.push(entry);
    this.logsById.set(entry.id, entry); // O(1) 검색용 인덱스

    // 표시 중이면 다시 렌더링 (debounce 적용)
    if (this.isVisible && !this.selectedLogId) {
      this.renderPanelDebounced();
    }
  }

  /**
   * 렌더링 debounce (짧은 시간 내 다수 로그 발생 시 최적화)
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
   * 네트워크 요청 추가/업데이트 (Map 인덱스 사용으로 O(1) 검색)
   */
  updateNetworkRequest(request: NetworkRequest): void {
    const existing = this.networkRequestsById.get(request.id);
    if (existing) {
      // 기존 요청 업데이트 (배열에서 찾아서 교체)
      const index = this.networkRequests.indexOf(existing);
      if (index >= 0) {
        this.networkRequests[index] = request;
      }
    } else {
      this.networkRequests.push(request);
    }
    this.networkRequestsById.set(request.id, request);

    // 표시 중이고 네트워크 탭이면 다시 렌더링 (debounce 적용)
    if (this.isVisible && this.currentTab === 'network' && !this.selectedLogId) {
      this.renderPanelDebounced();
    }
  }

  /**
   * 초기화 (Map 인덱스도 정리)
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
   * 개별 로그 삭제 (Map 인덱스 동기화)
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

      // 현재 선택된 로그가 삭제된 경우 선택 해제
      if (this.selectedLogId === logId) {
        this.selectedLogId = null;
      }

      if (this.isVisible) {
        this.renderPanel();
      }
    }
  }

  /**
   * 콜백 설정
   */
  setOnClose(handler: () => void): void {
    this.onClose = handler;
  }

  setOnClear(handler: () => void): void {
    this.onClear = handler;
  }

  setOnAnalyze(handler: (entry: LogEntry) => Promise<AnalysisResult>): void {
    this.onAnalyze = handler;
  }

  /**
   * 테마 설정
   */
  setTheme(theme: 'light' | 'dark'): void {
    this.theme = theme;
    this.updateStyles();
  }

  /**
   * 표시 상태 확인
   */
  isOpen(): boolean {
    return this.isVisible;
  }

  /**
   * AI Client 설정
   */
  setAIClient(client: AIClient): void {
    this.aiClient = client;
    if (this.shadowRoot) {
      this.aiSettingsModal = new AISettingsModal(this.shadowRoot, client);
    }
  }

  /**
   * AI 분석 또는 기본 분석 결과 렌더링 (O(1) 검색)
   */
  private renderAnalysisOrAI(logId: string, analysis?: AnalysisResult): string {
    const aiResult = this.aiAnalysisResults.get(logId);
    const log = this.logsById.get(logId);

    // AI 분석 에러
    if (this.aiAnalysisState === 'error' && this.selectedLogId === logId && this.aiError) {
      return AIRenderer.renderAIError(this.aiError, LogRenderer.renderDefaultAnalysis(analysis));
    }

    // AI 분석 결과가 있는 경우
    if (aiResult) {
      return AIRenderer.renderAIAnalysisResult(aiResult, log, this.networkRequests);
    }

    // 기본 분석 결과
    return LogRenderer.renderDefaultAnalysis(analysis);
  }

  /**
   * AI 분석 실행
   */
  private async handleAIAnalyze(): Promise<void> {
    if (!this.selectedLogId || !this.aiClient) return;

    // API 키가 없으면 설정 모달 표시
    if (!this.aiClient.hasApiKey()) {
      this.aiSettingsModal?.show(() => {
        // 저장 후 다시 분석 시도
        this.handleAIAnalyze();
      });
      return;
    }

    const log = this.logsById.get(this.selectedLogId);
    const analysis = this.analysisResults.get(this.selectedLogId);

    if (!log) return;

    // 이미 분석 결과가 있으면 스킵
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
}
