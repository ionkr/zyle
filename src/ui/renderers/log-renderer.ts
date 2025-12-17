import type { LogEntry, AnalysisResult } from '../../types';
import { escapeHtml } from '../../utils/sanitizer';
import { formatTimestamp } from '../../utils/helpers';
import { closeIcon, chevronDownIcon, questionIcon, lightbulbIcon } from '../../icons';
import { getUITranslations } from '../../i18n';

/**
 * 로그 목록 렌더링
 */
export function renderLogList(logs: LogEntry[]): string {
  const ui = getUITranslations();

  if (logs.length === 0) {
    return `
      <div class="zyle-empty">
        <div class="zyle-empty-icon">📋</div>
        <p>${ui.empty.noLogs}</p>
      </div>
    `;
  }

  return `
    <div class="zyle-log-list">
      ${logs
        .slice()
        .reverse()
        .map((log) => renderLogItem(log))
        .join('')}
    </div>
  `;
}

/**
 * 로그 아이템 렌더링
 */
export function renderLogItem(log: LogEntry): string {
  const ui = getUITranslations();

  return `
    <div class="zyle-log-item ${log.level}" data-log-id="${log.id}">
      <div class="zyle-log-header">
        <div class="zyle-log-header-left">
          <span class="zyle-log-level ${log.level}">${log.level}</span>
          <span class="zyle-log-time">${formatTimestamp(log.timestamp)}</span>
        </div>
        <button class="zyle-log-delete" data-action="delete-log" data-log-id="${log.id}" title="${ui.buttons.delete}">
          ${closeIcon(14)}
        </button>
      </div>
      <div class="zyle-log-message">${escapeHtml(log.message)}</div>
    </div>
  `;
}

/**
 * 코드 미리보기 렌더링
 */
export function renderCodePreview(lines: string[], highlightLine: number): string {
  const contextLines = 3;
  const startLine = Math.max(1, highlightLine - contextLines);

  return lines
    .map((line, index) => {
      const lineNumber = startLine + index;
      const isHighlight = lineNumber === highlightLine;
      return `
      <div class="zyle-code-line ${isHighlight ? 'highlight' : ''}">
        <span class="zyle-code-line-number">${lineNumber}</span>
        <span>${escapeHtml(line)}</span>
      </div>
    `;
    })
    .join('');
}

// getSeverityIcon은 icons 모듈에서 re-export
export { getSeverityIcon } from '../../icons';

/**
 * 심각도 라벨 반환
 */
export function getSeverityLabel(severity: string): string {
  const ui = getUITranslations();

  switch (severity) {
    case 'critical':
      return ui.severity.critical;
    case 'high':
      return ui.severity.high;
    case 'medium':
      return ui.severity.medium;
    case 'low':
    default:
      return ui.severity.low;
  }
}

/**
 * 기본 분석 결과 렌더링
 */
export function renderDefaultAnalysis(analysis?: AnalysisResult): string {
  if (!analysis) return '';

  const ui = getUITranslations();
  let html = '';

  if (analysis.possibleCauses.length > 0) {
    html += `
      <div class="zyle-analysis-section zyle-collapsible-list" data-list-type="causes">
        <div class="zyle-analysis-title">
          ${questionIcon(16)}
          ${ui.analysis.possibleCauses}
        </div>
        <ul class="zyle-analysis-list">
          ${analysis.possibleCauses.map((cause) => `<li>${escapeHtml(cause)}</li>`).join('')}
        </ul>
        ${analysis.possibleCauses.length > 3 ? `
          <button class="zyle-toggle-btn" data-action="toggle-list">
            <span class="zyle-toggle-text">${ui.buttons.showMore}</span>
            <span class="zyle-toggle-count">(+${analysis.possibleCauses.length - 3})</span>
            ${chevronDownIcon()}
          </button>
        ` : ''}
      </div>
    `;
  }

  if (analysis.suggestions.length > 0) {
    html += `
      <div class="zyle-analysis-section zyle-collapsible-list" data-list-type="suggestions">
        <div class="zyle-analysis-title">
          ${lightbulbIcon(16)}
          ${ui.analysis.suggestions}
        </div>
        <ul class="zyle-analysis-list">
          ${analysis.suggestions.map((suggestion) => `<li>${escapeHtml(suggestion)}</li>`).join('')}
        </ul>
        ${analysis.suggestions.length > 3 ? `
          <button class="zyle-toggle-btn" data-action="toggle-list">
            <span class="zyle-toggle-text">${ui.buttons.showMore}</span>
            <span class="zyle-toggle-count">(+${analysis.suggestions.length - 3})</span>
            ${chevronDownIcon()}
          </button>
        ` : ''}
      </div>
    `;
  }

  return html;
}
