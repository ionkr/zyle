import type { LogEntry, AIAnalysisResult, NetworkRequest } from '../../types';
import { escapeHtml, escapeHtmlAttr } from '../../utils/sanitizer';
import {
  copyIcon,
  checkIcon,
  chevronDownIcon,
  infoIcon,
  questionIcon,
  lightbulbIcon,
  codeIcon,
  dotIcon, sparkleIcon,
} from '../../icons';
import { getAITranslations, getUITranslations } from '../../i18n';

/**
 * AI 분석 결과 렌더링 (비개발자 친화적)
 */
export function renderAIAnalysisResult(result: AIAnalysisResult, log?: LogEntry, networkRequests: NetworkRequest[] = []): string {
  const ai = getAITranslations();
  const ui = getUITranslations();
  const copyText = generateCopyText(result, log, networkRequests);

  return `
    <div class="zyle-ai-result">
      <!-- 비개발자용 요약 카드 -->
      <div class="zyle-ai-summary-card">
        <div class="zyle-ai-summary-header">
          <span class="zyle-ai-summary-title">
            ${sparkleIcon()}
            ${ai.analyzed}
          </span>
        </div>
        <div class="zyle-ai-summary-content">
          ${escapeHtml(result.rootCause)}
        </div>

        <!-- 개발자에게 전달하기 섹션 -->
        <div class="zyle-ai-copy-section">
          <div class="zyle-ai-copy-header">
            <span class="zyle-ai-copy-label">
              ${copyIcon(14)}
              ${ai.copyForDeveloper}
            </span>
            <button class="zyle-ai-copy-btn" data-action="copy-report" data-copy-text="${escapeHtmlAttr(copyText)}">
              ${copyIcon(14)}
              ${ui.buttons.copy}
            </button>
          </div>
          <div class="zyle-ai-copy-content">${escapeHtml(copyText)}</div>
        </div>

        <div class="zyle-ai-action-hint">
          ${infoIcon()}
          <span>${ai.copyHint}</span>
        </div>
      </div>

      <!-- 상세 분석 결과 (접을 수 있음) -->
      <div class="zyle-analysis-section">
        <div class="zyle-ai-header">
          <span class="zyle-ai-badge">
            ${sparkleIcon()}
            ${ai.detailedAnalysis}
          </span>
        </div>

        ${result.possibleCauses.length > 0 ? `
          <div class="zyle-collapsible-list" data-list-type="causes">
            <div class="zyle-analysis-title" style="margin-top: 12px;">
              ${questionIcon(16)}
              ${ai.possibleCauses}
            </div>
            <ul class="zyle-analysis-list">
              ${result.possibleCauses.map((cause) => `<li>${escapeHtml(cause)}</li>`).join('')}
            </ul>
            ${result.possibleCauses.length > 3 ? `
              <button class="zyle-toggle-btn" data-action="toggle-list">
                <span class="zyle-toggle-text">${ui.buttons.showMore}</span>
                <span class="zyle-toggle-count">(+${result.possibleCauses.length - 3})</span>
                ${chevronDownIcon()}
              </button>
            ` : ''}
          </div>
        ` : ''}

        ${result.suggestions.length > 0 ? `
          <div class="zyle-collapsible-list" data-list-type="suggestions">
            <div class="zyle-analysis-title" style="margin-top: 16px;">
              ${lightbulbIcon(16)}
              ${ai.solutions}
            </div>
            <ul class="zyle-analysis-list">
              ${result.suggestions.map((suggestion) => `<li>${escapeHtml(suggestion)}</li>`).join('')}
            </ul>
            ${result.suggestions.length > 3 ? `
              <button class="zyle-toggle-btn" data-action="toggle-list">
                <span class="zyle-toggle-text">${ui.buttons.showMore}</span>
                <span class="zyle-toggle-count">(+${result.suggestions.length - 3})</span>
                ${chevronDownIcon()}
              </button>
            ` : ''}
          </div>
        ` : ''}

        ${result.codeExample ? `
          <div class="zyle-analysis-title" style="margin-top: 16px;">
            ${codeIcon(16)}
            ${ai.codeExample}
          </div>
          <div class="zyle-code-preview">
            <pre style="margin: 0; white-space: pre-wrap; word-break: break-word;">${escapeHtml(result.codeExample)}</pre>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

/**
 * 개발자에게 전달할 텍스트 생성
 */
export function generateCopyText(result: AIAnalysisResult, log?: LogEntry, networkRequests: NetworkRequest[] = []): string {
  const ai = getAITranslations();
  const timestamp = log ? new Date(log.timestamp).toLocaleString() : new Date().toLocaleString();
  const lines: string[] = [
    `[${ai.report.title}] ${timestamp}`,
    '',
    `${ai.report.errorType}: ${result.errorType || ai.report.unknown}`,
    `${ai.report.errorMessage}: ${log?.message || ai.report.none}`,
    '',
    `== ${ai.report.analysisResult} ==`,
    `${ai.report.analysisModel}: ${result.modelId || ai.report.unknown}`,
    `${ai.report.rootCause}: ${result.rootCause}`,
    '',
  ];

  if (result.possibleCauses.length > 0) {
    lines.push(`${ai.report.possibleCauses}:`);
    result.possibleCauses.forEach((cause, i) => {
      lines.push(`  ${i + 1}. ${cause}`);
    });
    lines.push('');
  }

  if (result.suggestions.length > 0) {
    lines.push(`${ai.report.solutions}:`);
    result.suggestions.forEach((suggestion, i) => {
      lines.push(`  ${i + 1}. ${suggestion}`);
    });
    lines.push('');
  }

  if (result.codeExample) {
    lines.push(`${ai.report.codeExample}:`);
    lines.push(result.codeExample);
    lines.push('');
  }

  if (log?.stackTrace && log.stackTrace.length > 0) {
    lines.push(`${ai.report.stackTrace}:`);
    log.stackTrace.slice(0, 5).forEach((frame) => {
      const location = frame.original
        ? `${frame.original.fileName}:${frame.original.lineNumber}`
        : `${frame.fileName}:${frame.lineNumber}`;
      lines.push(`  at ${frame.functionName || '<anonymous>'} (${location})`);
    });
    lines.push('');
  }

  // 네트워크 에러인 경우 관련 요청/응답 정보 포함
  if (isNetworkError(result.errorType) && log?.relatedNetworkRequestIds?.length) {
    const relatedRequests = networkRequests.filter((req) =>
      log.relatedNetworkRequestIds?.includes(req.id)
    );

    if (relatedRequests.length > 0) {
      lines.push(`== ${ai.report.networkInfo} ==`);
      relatedRequests.forEach((req, index) => {
        if (index > 0) lines.push('');
        lines.push(`[${ai.report.request} ${index + 1}]`);
        lines.push(`  ${ai.report.url}: ${req.method} ${req.url}`);
        lines.push(`  ${ai.report.status}: ${req.status || 'N/A'} ${req.statusText || ''}`);
        lines.push(`  ${ai.report.requestStatus}: ${req.requestStatus}`);

        if (req.requestHeaders && Object.keys(req.requestHeaders).length > 0) {
          lines.push(`  ${ai.report.requestHeaders}:`);
          Object.entries(req.requestHeaders).slice(0, 5).forEach(([key, value]) => {
            lines.push(`    ${key}: ${value}`);
          });
        }

        if (req.responseHeaders && Object.keys(req.responseHeaders).length > 0) {
          lines.push(`  ${ai.report.responseHeaders}:`);
          Object.entries(req.responseHeaders).slice(0, 5).forEach(([key, value]) => {
            lines.push(`    ${key}: ${value}`);
          });
        }

        if (req.requestBody) {
          const bodyStr = typeof req.requestBody === 'string'
            ? req.requestBody
            : JSON.stringify(req.requestBody, null, 2);
          lines.push(`  ${ai.report.requestBody}: ${bodyStr.slice(0, 500)}${bodyStr.length > 500 ? '...' : ''}`);
        }

        if (req.responseBody) {
          const bodyStr = typeof req.responseBody === 'string'
            ? req.responseBody
            : JSON.stringify(req.responseBody, null, 2);
          lines.push(`  ${ai.report.responseBody}: ${bodyStr.slice(0, 500)}${bodyStr.length > 500 ? '...' : ''}`);
        }

        if (req.error) {
          lines.push(`  ${ai.report.error}: ${req.error.message || req.error}`);
        }
      });
      lines.push('');
    }
  }

  return lines.join('\n');
}

/**
 * 네트워크 관련 에러 타입인지 확인
 */
export function isNetworkError(errorType?: string): boolean {
  if (!errorType) return false;
  const networkErrorTypes = [
    'network',
    'fetch',
    'xhr',
    'http',
    'api',
    'cors',
    'timeout',
    'connection',
  ];
  const lowerType = errorType.toLowerCase();
  return networkErrorTypes.some((type) => lowerType.includes(type));
}

/**
 * 로딩 오버레이 렌더링
 */
export function renderLoadingOverlay(): string {
  const ai = getAITranslations();

  return `
    <div class="zyle-ai-loading-overlay">
      <div class="zyle-ai-loading-content">
        <div class="zyle-ai-loading-icon">
          ${sparkleIcon()}
        </div>
        <div class="zyle-ai-loading-title">${ai.loading.title}</div>
        <div class="zyle-ai-loading-message">
          ${ai.loading.subtitle.replace('\n', '<br/>')}
        </div>
        <div class="zyle-ai-loading-steps">
          <div class="zyle-ai-loading-step completed">
            <span class="zyle-ai-loading-step-icon">
              ${checkIcon(16)}
            </span>
            <span>${ai.loading.step1}</span>
          </div>
          <div class="zyle-ai-loading-step active">
            <span class="zyle-ai-loading-step-icon">
              ${dotIcon(16)}
            </span>
            <span>${ai.loading.step2}</span>
          </div>
          <div class="zyle-ai-loading-step">
            <span class="zyle-ai-loading-step-icon">
              ${dotIcon(16)}
            </span>
            <span>${ai.loading.step3}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * AI 분석 에러 렌더링
 */
export function renderAIError(error: string, defaultAnalysisHtml: string): string {
  const ai = getAITranslations();

  return `
    <div class="zyle-ai-error">
      <div class="zyle-ai-error-content">
        <strong>${ai.error.title}</strong>
        <p>${escapeHtml(error)}</p>
        <div class="zyle-ai-error-actions">
          <button class="zyle-btn-retry" data-action="ai-retry">${ai.error.retry}</button>
          <button class="zyle-btn-settings" data-action="ai-settings">${ai.error.checkSettings}</button>
        </div>
      </div>
    </div>
    ${defaultAnalysisHtml}
  `;
}
