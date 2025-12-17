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

/**
 * AI 분석 결과 렌더링 (비개발자 친화적)
 */
export function renderAIAnalysisResult(result: AIAnalysisResult, log?: LogEntry, networkRequests: NetworkRequest[] = []): string {
  const copyText = generateCopyText(result, log, networkRequests);

  return `
    <div class="zyle-ai-result">
      <!-- 비개발자용 요약 카드 -->
      <div class="zyle-ai-summary-card">
        <div class="zyle-ai-summary-header">
          <span class="zyle-ai-summary-title">
            ${sparkleIcon()}
            AI가 문제를 분석했어요
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
              개발자에게 전달할 내용
            </span>
            <button class="zyle-ai-copy-btn" data-action="copy-report" data-copy-text="${escapeHtmlAttr(copyText)}">
              ${copyIcon(14)}
              복사하기
            </button>
          </div>
          <div class="zyle-ai-copy-content">${escapeHtml(copyText)}</div>
        </div>

        <div class="zyle-ai-action-hint">
          ${infoIcon()}
          <span>위 내용을 복사해서 개발자에게 전달해주세요. 문제 해결에 도움이 됩니다.</span>
        </div>
      </div>

      <!-- 상세 분석 결과 (접을 수 있음) -->
      <div class="zyle-analysis-section">
        <div class="zyle-ai-header">
          <span class="zyle-ai-badge">
            ${sparkleIcon()}
            상세 분석
          </span>
        </div>

        ${result.possibleCauses.length > 0 ? `
          <div class="zyle-collapsible-list" data-list-type="causes">
            <div class="zyle-analysis-title" style="margin-top: 12px;">
              ${questionIcon(16)}
              가능한 원인
            </div>
            <ul class="zyle-analysis-list">
              ${result.possibleCauses.map((cause) => `<li>${escapeHtml(cause)}</li>`).join('')}
            </ul>
            ${result.possibleCauses.length > 3 ? `
              <button class="zyle-toggle-btn" data-action="toggle-list">
                <span class="zyle-toggle-text">더보기</span>
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
              해결 방법
            </div>
            <ul class="zyle-analysis-list">
              ${result.suggestions.map((suggestion) => `<li>${escapeHtml(suggestion)}</li>`).join('')}
            </ul>
            ${result.suggestions.length > 3 ? `
              <button class="zyle-toggle-btn" data-action="toggle-list">
                <span class="zyle-toggle-text">더보기</span>
                <span class="zyle-toggle-count">(+${result.suggestions.length - 3})</span>
                ${chevronDownIcon()}
              </button>
            ` : ''}
          </div>
        ` : ''}

        ${result.codeExample ? `
          <div class="zyle-analysis-title" style="margin-top: 16px;">
            ${codeIcon(16)}
            수정 코드 예시
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
  const timestamp = log ? new Date(log.timestamp).toLocaleString() : new Date().toLocaleString();
  const lines: string[] = [
    `[에러 리포트] ${timestamp}`,
    '',
    `에러 유형: ${result.errorType || '알 수 없음'}`,
    `에러 메시지: ${log?.message || '없음'}`,
    '',
    `== AI 분석 결과 ==`,
    `분석 모델: ${result.modelId || '알 수 없음'}`,
    `문제 원인: ${result.rootCause}`,
    '',
  ];

  if (result.possibleCauses.length > 0) {
    lines.push('가능한 원인:');
    result.possibleCauses.forEach((cause, i) => {
      lines.push(`  ${i + 1}. ${cause}`);
    });
    lines.push('');
  }

  if (result.suggestions.length > 0) {
    lines.push('해결 방법:');
    result.suggestions.forEach((suggestion, i) => {
      lines.push(`  ${i + 1}. ${suggestion}`);
    });
    lines.push('');
  }

  if (result.codeExample) {
    lines.push('수정 코드 예시:');
    lines.push(result.codeExample);
    lines.push('');
  }

  if (log?.stackTrace && log.stackTrace.length > 0) {
    lines.push('스택 트레이스:');
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
      lines.push('== 네트워크 요청 정보 ==');
      relatedRequests.forEach((req, index) => {
        if (index > 0) lines.push('');
        lines.push(`[요청 ${index + 1}]`);
        lines.push(`  URL: ${req.method} ${req.url}`);
        lines.push(`  상태: ${req.status || 'N/A'} ${req.statusText || ''}`);
        lines.push(`  요청 상태: ${req.requestStatus}`);

        if (req.requestHeaders && Object.keys(req.requestHeaders).length > 0) {
          lines.push('  요청 헤더:');
          Object.entries(req.requestHeaders).slice(0, 5).forEach(([key, value]) => {
            lines.push(`    ${key}: ${value}`);
          });
        }

        if (req.responseHeaders && Object.keys(req.responseHeaders).length > 0) {
          lines.push('  응답 헤더:');
          Object.entries(req.responseHeaders).slice(0, 5).forEach(([key, value]) => {
            lines.push(`    ${key}: ${value}`);
          });
        }

        if (req.requestBody) {
          const bodyStr = typeof req.requestBody === 'string'
            ? req.requestBody
            : JSON.stringify(req.requestBody, null, 2);
          lines.push(`  요청 바디: ${bodyStr.slice(0, 500)}${bodyStr.length > 500 ? '...' : ''}`);
        }

        if (req.responseBody) {
          const bodyStr = typeof req.responseBody === 'string'
            ? req.responseBody
            : JSON.stringify(req.responseBody, null, 2);
          lines.push(`  응답 바디: ${bodyStr.slice(0, 500)}${bodyStr.length > 500 ? '...' : ''}`);
        }

        if (req.error) {
          lines.push(`  에러: ${req.error.message || req.error}`);
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
  return `
    <div class="zyle-ai-loading-overlay">
      <div class="zyle-ai-loading-content">
        <div class="zyle-ai-loading-icon">
          ${sparkleIcon()}
        </div>
        <div class="zyle-ai-loading-title">AI가 분석 중이에요</div>
        <div class="zyle-ai-loading-message">
          잠시만 기다려주세요.<br/>
          문제의 원인과 해결 방법을 찾고 있어요.
        </div>
        <div class="zyle-ai-loading-steps">
          <div class="zyle-ai-loading-step completed">
            <span class="zyle-ai-loading-step-icon">
              ${checkIcon(16)}
            </span>
            <span>에러 정보 수집</span>
          </div>
          <div class="zyle-ai-loading-step active">
            <span class="zyle-ai-loading-step-icon">
              ${dotIcon(16)}
            </span>
            <span>원인 분석 중...</span>
          </div>
          <div class="zyle-ai-loading-step">
            <span class="zyle-ai-loading-step-icon">
              ${dotIcon(16)}
            </span>
            <span>해결 방법 생성</span>
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
  return `
    <div class="zyle-ai-error">
      <div class="zyle-ai-error-content">
        <strong>AI 분석 실패</strong>
        <p>${escapeHtml(error)}</p>
        <div class="zyle-ai-error-actions">
          <button class="zyle-btn-retry" data-action="ai-retry">다시 시도</button>
          <button class="zyle-btn-settings" data-action="ai-settings">설정 확인</button>
        </div>
      </div>
    </div>
    ${defaultAnalysisHtml}
  `;
}
