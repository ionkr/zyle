import type { NetworkRequest } from '../../types';
import { escapeHtml } from '../../utils/sanitizer';
import { getUITranslations, getNetworkTranslations } from '../../i18n';

/**
 * 네트워크 목록 렌더링
 */
export function renderNetworkList(requests: NetworkRequest[]): string {
  const ui = getUITranslations();
  const failedRequests = requests.filter(
    (r) => r.requestStatus === 'error' || r.requestStatus === 'timeout'
  );

  if (failedRequests.length === 0) {
    return `
      <div class="zyle-empty">
        <div class="zyle-empty-icon">🌐</div>
        <p>${ui.empty.noNetwork}</p>
      </div>
    `;
  }

  return failedRequests
    .slice()
    .reverse()
    .map((req) => renderNetworkItem(req))
    .join('');
}

/**
 * 네트워크 아이템 렌더링
 */
export function renderNetworkItem(request: NetworkRequest): string {
  const ui = getUITranslations();
  const duration = request.endTime ? request.endTime - request.startTime : 0;
  const isError = request.requestStatus === 'error' || request.requestStatus === 'timeout';
  const statusClass = isError ? 'error' : request.status && request.status >= 400 ? 'error' : 'success';

  return `
    <div class="zyle-network-item" data-request-id="${request.id}">
      <div class="zyle-network-header">
        <span class="zyle-network-method">${request.method}</span>
        ${
          request.status
            ? `<span class="zyle-network-status ${statusClass}">${request.status}</span>`
            : isError
              ? `<span class="zyle-network-status error">ERR</span>`
              : ''
        }
        ${duration > 0 ? `<span style="font-size: 12px; opacity: 0.7;">${duration}ms</span>` : ''}
        <span class="zyle-network-toggle" style="margin-left: auto; cursor: pointer; font-size: 10px;">▼ ${ui.buttons.details}</span>
      </div>
      <div class="zyle-network-url">${escapeHtml(request.url)}</div>
      ${
        request.error
          ? `<div style="margin-top: 8px; color: var(--error); font-size: 12px; font-weight: 500;">${escapeHtml(request.error.message)}</div>`
          : ''
      }
      <div class="zyle-network-details" style="display: none; margin-top: 12px; font-size: 12px; border-top: 1px solid var(--border); padding-top: 12px;">
        ${renderNetworkDetails(request)}
      </div>
    </div>
  `;
}

/**
 * 네트워크 상세 정보 렌더링
 */
export function renderNetworkDetails(request: NetworkRequest): string {
  const net = getNetworkTranslations();
  const sections: string[] = [];

  // 기본 정보
  sections.push(`
    <div style="margin-bottom: 12px;">
      <div style="font-weight: 600; margin-bottom: 4px; color: var(--text-primary);">${net.general}</div>
      <div style="background: var(--bg-secondary); padding: 8px; border-radius: 4px; font-family: monospace; font-size: 11px; overflow: hidden;">
        <div style="word-break: break-all;"><span style="opacity: 0.7;">${net.url}:</span> ${escapeHtml(request.url)}</div>
        <div><span style="opacity: 0.7;">${net.method}:</span> ${request.method}</div>
        <div><span style="opacity: 0.7;">${net.status}:</span> ${request.status || 'N/A'} ${request.statusText || ''}</div>
        <div><span style="opacity: 0.7;">${net.duration}:</span> ${request.endTime ? request.endTime - request.startTime : 0}ms</div>
        <div><span style="opacity: 0.7;">${net.time}:</span> ${new Date(request.startTime).toLocaleTimeString()}</div>
      </div>
    </div>
  `);

  // 요청 헤더
  if (request.requestHeaders && Object.keys(request.requestHeaders).length > 0) {
    sections.push(`
      <div style="margin-bottom: 12px;">
        <div style="font-weight: 600; margin-bottom: 4px; color: var(--text-primary);">${net.requestHeaders}</div>
        <div style="background: var(--bg-secondary); padding: 8px; border-radius: 4px; font-family: monospace; font-size: 11px; max-height: 100px; overflow-y: auto;">
          ${Object.entries(request.requestHeaders)
            .map(([key, value]) => `<div><span style="opacity: 0.7;">${escapeHtml(key)}:</span> ${escapeHtml(String(value))}</div>`)
            .join('')}
        </div>
      </div>
    `);
  }

  // 요청 바디
  if (request.requestBody) {
    const bodyStr = formatBody(request.requestBody);
    sections.push(`
      <div style="margin-bottom: 12px;">
        <div style="font-weight: 600; margin-bottom: 4px; color: var(--text-primary);">${net.requestBody}</div>
        <pre style="background: var(--bg-secondary); padding: 8px; border-radius: 4px; font-family: monospace; font-size: 11px; max-height: 150px; overflow: auto; margin: 0; white-space: pre-wrap; word-break: break-all;">${escapeHtml(bodyStr)}</pre>
      </div>
    `);
  }

  // 응답 헤더
  if (request.responseHeaders && Object.keys(request.responseHeaders).length > 0) {
    sections.push(`
      <div style="margin-bottom: 12px;">
        <div style="font-weight: 600; margin-bottom: 4px; color: var(--text-primary);">${net.responseHeaders}</div>
        <div style="background: var(--bg-secondary); padding: 8px; border-radius: 4px; font-family: monospace; font-size: 11px; max-height: 100px; overflow-y: auto;">
          ${Object.entries(request.responseHeaders)
            .map(([key, value]) => `<div><span style="opacity: 0.7;">${escapeHtml(key)}:</span> ${escapeHtml(String(value))}</div>`)
            .join('')}
        </div>
      </div>
    `);
  }

  // 응답 바디
  if (request.responseBody) {
    const bodyStr = formatBody(request.responseBody);
    sections.push(`
      <div style="margin-bottom: 12px;">
        <div style="font-weight: 600; margin-bottom: 4px; color: var(--text-primary);">${net.responseBody}</div>
        <pre style="background: var(--bg-secondary); padding: 8px; border-radius: 4px; font-family: monospace; font-size: 11px; max-height: 200px; overflow: auto; margin: 0; white-space: pre-wrap; word-break: break-all;">${escapeHtml(bodyStr)}</pre>
      </div>
    `);
  }

  // 에러 정보
  if (request.error) {
    sections.push(`
      <div style="margin-bottom: 12px;">
        <div style="font-weight: 600; margin-bottom: 4px; color: var(--error);">${net.errorDetails}</div>
        <div style="background: rgba(239, 68, 68, 0.1); padding: 8px; border-radius: 4px; font-family: monospace; font-size: 11px; color: var(--error); max-height: 150px; overflow: auto;">
          <div><span style="opacity: 0.7;">${net.name}:</span> ${escapeHtml(request.error.name || 'Error')}</div>
          <div style="word-break: break-all;"><span style="opacity: 0.7;">${net.message}:</span> ${escapeHtml(request.error.message)}</div>
          ${request.error.stack ? `<div style="margin-top: 8px; opacity: 0.8; font-size: 10px; white-space: pre-wrap; word-break: break-all;">${escapeHtml(request.error.stack)}</div>` : ''}
        </div>
      </div>
    `);
  }

  return sections.join('');
}

/**
 * 요청/응답 바디 포맷팅
 */
export function formatBody(body: unknown): string {
  if (typeof body === 'string') {
    try {
      const parsed = JSON.parse(body);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return body;
    }
  }
  if (body instanceof FormData) {
    const entries: string[] = [];
    body.forEach((value, key) => {
      entries.push(`${key}: ${value}`);
    });
    return entries.join('\n');
  }
  try {
    return JSON.stringify(body, null, 2);
  } catch {
    return String(body);
  }
}
