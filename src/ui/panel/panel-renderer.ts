import type {
  LogEntry,
  AnalysisResult,
  NetworkRequest,
  AIAnalysisResult,
  DisplayMode,
  AIAnalysisState,
} from '../../types';
import type { TabType } from './types';
import type { BridgeStatus, ConversationState } from '../../bridge/bridge-client';
import { formatTimestamp } from '../../utils/helpers';
import { escapeHtml, escapeHtmlAttr } from '../../utils/sanitizer';
import { getSparkleIcon } from '../ai-settings-modal';
import {
  deleteIcon,
  settingsIcon,
  closeIcon,
  backIcon,
  codeIcon,
  globeIcon,
  listIcon,
  createLogoElement,
  dockIcon,
  floatIcon,
} from '../../icons';
import { getUITranslations } from '../../i18n';

import * as LogRenderer from '../renderers/log-renderer';
import * as NetworkRenderer from '../renderers/network-renderer';
import * as AIRenderer from '../renderers/ai-renderer';

/**
 * 목록 뷰 렌더링
 */
export function renderListView(
  logs: LogEntry[],
  networkRequests: NetworkRequest[],
  currentTab: TabType,
  displayMode: DisplayMode
): string {
  const filteredLogs = getFilteredLogs(logs, currentTab);
  const ui = getUITranslations();

  return `
    <div class="zyle-panel-header">
      <span class="zyle-panel-title">
        ${createLogoElement(20)}
        Zyle
      </span>
      <div style="display: flex; gap: 8px; align-items: center;">
        <button class="zyle-mode-toggle" data-action="toggle-mode" title="${displayMode === 'floating' ? ui.buttons.dockMode : ui.buttons.floatMode}">
          ${displayMode === 'floating' ? dockIcon(18) : floatIcon(18)}
        </button>
        <button class="zyle-clear-button" data-action="clear" title="${ui.buttons.clear}">
          ${deleteIcon(18)}
        </button>
        <button class="zyle-settings-button" data-action="settings" title="${ui.buttons.settings}">
          ${settingsIcon(20)}
        </button>
        <button class="zyle-panel-close" data-action="close">
          ${closeIcon(20)}
        </button>
      </div>
    </div>
    <div class="zyle-panel-tabs">
      <button class="zyle-tab ${currentTab === 'all' ? 'active' : ''}" data-tab="all">
        ${ui.tabs.all} (${logs.length})
      </button>
      <button class="zyle-tab ${currentTab === 'errors' ? 'active' : ''}" data-tab="errors">
        ${ui.tabs.errors} (${logs.filter((l) => l.level === 'error').length})
      </button>
      <button class="zyle-tab ${currentTab === 'warnings' ? 'active' : ''}" data-tab="warnings">
        ${ui.tabs.warnings} (${logs.filter((l) => l.level === 'warn').length})
      </button>
      <button class="zyle-tab ${currentTab === 'network' ? 'active' : ''}" data-tab="network">
        ${ui.tabs.network} (${networkRequests.filter((r) => r.requestStatus === 'error' || r.requestStatus === 'timeout').length})
      </button>
    </div>
    <div class="zyle-panel-content scrollbar-thin">
      ${currentTab === 'network' ? NetworkRenderer.renderNetworkList(networkRequests) : LogRenderer.renderLogList(filteredLogs)}
    </div>
    ${renderResizeHandles()}
  `;
}

/**
 * 상세 뷰 렌더링 옵션
 */
export interface DetailViewOptions {
  log: LogEntry;
  analysis: AnalysisResult | undefined;
  aiAnalysisState: AIAnalysisState;
  aiResult: AIAnalysisResult | undefined;
  aiError: string | null;
  networkRequests: NetworkRequest[];
  // Bridge 관련 옵션
  isBridgeMode?: boolean;
  bridgeStatus?: BridgeStatus | null;
  conversation?: ConversationState | null;
  bridgePort?: number;
}

/**
 * 상세 뷰 렌더링
 */
export function renderDetailView(
  log: LogEntry,
  analysis: AnalysisResult | undefined,
  aiAnalysisState: AIAnalysisState,
  aiResult: AIAnalysisResult | undefined,
  aiError: string | null,
  networkRequests: NetworkRequest[],
  bridgeOptions?: {
    isBridgeMode: boolean;
    bridgeStatus: BridgeStatus | null;
    conversation: ConversationState | null;
    bridgePort: number;
  }
): string {
  const ui = getUITranslations();
  const isBridgeMode = bridgeOptions?.isBridgeMode ?? false;

  // 로딩 중일 때 오버레이 표시
  const showLoadingOverlay = aiAnalysisState === 'loading';

  return `
    <div class="zyle-panel-header">
      <div style="display: flex; align-items: center; gap: 8px; overflow: hidden; flex: 1; min-width: 0;">
        <button class="zyle-header-back" data-action="back" title="${ui.buttons.back}">
          ${backIcon(20)}
        </button>
        <span class="zyle-log-level ${log.level}" style="flex-shrink: 0;">${log.level.toUpperCase()}</span>
        <span class="zyle-panel-title" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtmlAttr(log.message)}">${escapeHtml(log.message)}</span>
      </div>
      <div style="display: flex; align-items: center; gap: 4px;">
        <button class="zyle-ai-button ${aiAnalysisState === 'loading' ? 'loading' : ''}" data-action="ai-analyze" title="${ui.buttons.settings}">
          ${getSparkleIcon()}
        </button>
        <button class="zyle-panel-close" data-action="close">
          ${closeIcon(20)}
        </button>
      </div>
    </div>
    <div class="zyle-panel-content scrollbar-thin" style="position: relative;">
      ${
        isBridgeMode
          ? renderBridgeLogDetail(log, analysis, aiResult, aiError, aiAnalysisState, networkRequests, bridgeOptions!)
          : renderLogDetail(log, analysis, aiResult, aiError, aiAnalysisState, networkRequests)
      }
      ${showLoadingOverlay ? AIRenderer.renderLoadingOverlay() : ''}
    </div>
    ${renderResizeHandles()}
  `;
}

/**
 * 로그 상세 렌더링
 */
function renderLogDetail(
  log: LogEntry,
  analysis: AnalysisResult | undefined,
  aiResult: AIAnalysisResult | undefined,
  aiError: string | null,
  aiAnalysisState: string,
  networkRequests: NetworkRequest[]
): string {
  const ui = getUITranslations();

  return `
    <div class="zyle-analysis">
      <div class="zyle-log-item ${log.level}" style="cursor: default;">
        <div class="zyle-log-header">
          <span class="zyle-log-level ${log.level}">${log.level}</span>
          <span class="zyle-log-time">${formatTimestamp(log.timestamp)}</span>
        </div>
        <div class="zyle-log-message" style="max-height: none;">${escapeHtml(log.message)}</div>
      </div>

      ${analysis ? `
        ${analysis.errorType ? `
          <div class="zyle-error-type-card ${analysis.severity}">
            <div class="zyle-error-type-icon">
              ${LogRenderer.getSeverityIcon(analysis.severity)}
            </div>
            <div class="zyle-error-type-content">
              <span class="zyle-error-type-label">${analysis.errorType}</span>
              <span class="zyle-error-type-severity">${LogRenderer.getSeverityLabel(analysis.severity)}</span>
            </div>
          </div>
        ` : ''}

        ${renderAnalysisOrAI(log.id, analysis, aiResult, aiError, aiAnalysisState, networkRequests)}

        ${analysis.codeContext?.sourcePreview && analysis.codeContext.sourcePreview.length > 0 ? `
          <div class="zyle-analysis-section">
            <div class="zyle-analysis-title">
              ${codeIcon(16)}
              ${ui.analysis.sourceCode} (${escapeHtml(analysis.codeContext.fileName)}:${analysis.codeContext.lineNumber})
            </div>
            <div class="zyle-code-preview">
              ${LogRenderer.renderCodePreview(analysis.codeContext.sourcePreview, analysis.codeContext.lineNumber)}
            </div>
          </div>
        ` : ''}

        ${analysis.relatedNetworkRequests.length > 0 ? `
          <div class="zyle-analysis-section">
            <div class="zyle-analysis-title">
              ${globeIcon(16)}
              ${ui.analysis.relatedNetwork}
            </div>
            ${analysis.relatedNetworkRequests.map((req) => NetworkRenderer.renderNetworkItem(req)).join('')}
          </div>
        ` : ''}
      ` : `
        <div class="zyle-empty" style="padding: 20px;">
          <p>${ui.analysis.analyzing}</p>
        </div>
      `}

      ${log.stackTrace.length > 0 ? `
        <div class="zyle-analysis-section">
          <div class="zyle-analysis-title">
            ${listIcon(16)}
            ${ui.analysis.stackTrace}
          </div>
          <div class="zyle-code-preview">
            ${log.stackTrace.map((frame) => {
              const location = frame.original
                ? `${frame.original.fileName}:${frame.original.lineNumber}:${frame.original.columnNumber}`
                : `${frame.fileName}:${frame.lineNumber}:${frame.columnNumber}`;
              return `<div class="zyle-code-line">
                <span style="color: var(--text-secondary);">at</span>
                <span>${frame.functionName}</span>
                <span style="opacity: 0.7;">(${location})</span>
              </div>`;
            }).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * AI 분석 또는 기본 분석 결과 렌더링
 */
function renderAnalysisOrAI(
  _logId: string,
  analysis: AnalysisResult | undefined,
  aiResult: AIAnalysisResult | undefined,
  aiError: string | null,
  aiAnalysisState: string,
  networkRequests: NetworkRequest[]
): string {
  // AI 분석 에러
  if (aiAnalysisState === 'error' && aiError) {
    return AIRenderer.renderAIError(aiError, LogRenderer.renderDefaultAnalysis(analysis));
  }

  // AI 분석 결과가 있는 경우
  if (aiResult) {
    // log 객체를 찾기 위한 로직은 상위에서 처리
    return AIRenderer.renderAIAnalysisResult(aiResult, undefined, networkRequests);
  }

  // 기본 분석 결과
  return LogRenderer.renderDefaultAnalysis(analysis);
}

/**
 * 필터링된 로그 가져오기
 */
function getFilteredLogs(logs: LogEntry[], currentTab: TabType): LogEntry[] {
  switch (currentTab) {
    case 'errors':
      return logs.filter((l) => l.level === 'error');
    case 'warnings':
      return logs.filter((l) => l.level === 'warn');
    default:
      return logs;
  }
}

/**
 * Bridge 모드 로그 상세 렌더링
 */
function renderBridgeLogDetail(
  log: LogEntry,
  analysis: AnalysisResult | undefined,
  aiResult: AIAnalysisResult | undefined,
  aiError: string | null,
  aiAnalysisState: AIAnalysisState,
  networkRequests: NetworkRequest[],
  bridgeOptions: {
    isBridgeMode: boolean;
    bridgeStatus: BridgeStatus | null;
    conversation: ConversationState | null;
    bridgePort: number;
  }
): string {
  const ui = getUITranslations();

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
        analysis?.errorType
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

      ${AIRenderer.renderBridgeAISection(
        aiAnalysisState,
        bridgeOptions.bridgeStatus,
        bridgeOptions.conversation,
        aiResult,
        aiError,
        log,
        networkRequests,
        bridgeOptions.bridgePort
      )}

      ${
        analysis?.codeContext?.sourcePreview && analysis.codeContext.sourcePreview.length > 0
          ? `
        <div class="zyle-analysis-section">
          <div class="zyle-analysis-title">
            ${codeIcon(16)}
            ${ui.analysis.sourceCode} (${escapeHtml(analysis.codeContext.fileName)}:${analysis.codeContext.lineNumber})
          </div>
          <div class="zyle-code-preview">
            ${LogRenderer.renderCodePreview(analysis.codeContext.sourcePreview, analysis.codeContext.lineNumber)}
          </div>
        </div>
      `
          : ''
      }

      ${
        analysis?.relatedNetworkRequests && analysis.relatedNetworkRequests.length > 0
          ? `
        <div class="zyle-analysis-section">
          <div class="zyle-analysis-title">
            ${globeIcon(16)}
            ${ui.analysis.relatedNetwork}
          </div>
          ${analysis.relatedNetworkRequests.map((req) => NetworkRenderer.renderNetworkItem(req)).join('')}
        </div>
      `
          : ''
      }

      ${
        log.stackTrace.length > 0
          ? `
        <div class="zyle-analysis-section">
          <div class="zyle-analysis-title">
            ${listIcon(16)}
            ${ui.analysis.stackTrace}
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
 * 리사이즈 핸들 렌더링
 */
function renderResizeHandles(): string {
  return `
    <div class="zyle-resize-handle zyle-resize-n" data-resize="n"></div>
    <div class="zyle-resize-handle zyle-resize-s" data-resize="s"></div>
    <div class="zyle-resize-handle zyle-resize-e" data-resize="e"></div>
    <div class="zyle-resize-handle zyle-resize-w" data-resize="w"></div>
    <div class="zyle-resize-handle zyle-resize-ne" data-resize="ne"></div>
    <div class="zyle-resize-handle zyle-resize-nw" data-resize="nw"></div>
    <div class="zyle-resize-handle zyle-resize-se" data-resize="se"></div>
    <div class="zyle-resize-handle zyle-resize-sw" data-resize="sw"></div>
  `;
}
