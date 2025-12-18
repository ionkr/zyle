/**
 * 경량 마크다운 파서
 * Zero-dependency로 기본 마크다운 문법을 HTML로 변환
 *
 * 지원 문법:
 * - 헤더 (# ~ ######)
 * - 볼드 (**text**, __text__)
 * - 이탤릭 (*text*, _text_)
 * - 볼드+이탤릭 (***text***)
 * - 인라인 코드 (`code`)
 * - 코드 블록 (```language\ncode\n```)
 * - 링크 ([text](url))
 * - 순서 없는 리스트 (- item, * item)
 * - 순서 있는 리스트 (1. item)
 * - 수평선 (---, ***, ___)
 * - 줄바꿈 보존
 */

import { escapeHtml, sanitizeUrlForHref } from './sanitizer';

/**
 * 마크다운 파싱 옵션
 */
export interface MarkdownOptions {
  /** 링크에 target="_blank" 적용 여부 (기본: true) */
  externalLinks?: boolean;
  /** 줄바꿈을 <br>로 변환할지 여부 (기본: true) */
  preserveLineBreaks?: boolean;
}

/**
 * 코드 블록 정보 (파싱 중간 결과)
 */
interface CodeBlockPlaceholder {
  placeholder: string;
  language: string;
  code: string;
}

/**
 * 인라인 코드 정보 (파싱 중간 결과)
 */
interface InlineCodePlaceholder {
  placeholder: string;
  code: string;
}

// ============================================
// 코드 블록/인라인 코드 처리
// ============================================

/**
 * 코드 블록 추출 (다른 처리에서 보호)
 */
function extractCodeBlocks(text: string): { text: string; blocks: CodeBlockPlaceholder[] } {
  const blocks: CodeBlockPlaceholder[] = [];
  let index = 0;

  // 트리플 백틱 코드 블록 매칭 (언어 지정 선택)
  const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;

  const processedText = text.replace(codeBlockRegex, (_, lang, code) => {
    const placeholder = `__CODEBLOCK_${index++}__`;
    blocks.push({
      placeholder,
      language: lang || '',
      code: code.trimEnd(),
    });
    return placeholder;
  });

  return { text: processedText, blocks };
}

/**
 * 코드 블록 복원
 */
function restoreCodeBlocks(text: string, blocks: CodeBlockPlaceholder[]): string {
  let result = text;

  for (const block of blocks) {
    const langAttr = block.language
      ? ` class="language-${block.language}"`
      : '';
    const html = `<pre class="zyle-md-code-block"><code${langAttr}>${block.code}</code></pre>`;
    result = result.replace(block.placeholder, html);
  }

  return result;
}

/**
 * 인라인 코드 추출 (다른 처리에서 보호)
 */
function extractInlineCode(text: string): { text: string; codes: InlineCodePlaceholder[] } {
  const codes: InlineCodePlaceholder[] = [];
  let index = 0;

  // 백틱으로 감싼 인라인 코드 매칭
  const inlineCodeRegex = /`([^`\n]+)`/g;

  const processedText = text.replace(inlineCodeRegex, (_, code) => {
    const placeholder = `__INLINECODE_${index++}__`;
    codes.push({
      placeholder,
      code,
    });
    return placeholder;
  });

  return { text: processedText, codes };
}

/**
 * 인라인 코드 복원
 */
function restoreInlineCode(text: string, codes: InlineCodePlaceholder[]): string {
  let result = text;

  for (const code of codes) {
    const html = `<code class="zyle-md-inline-code">${code.code}</code>`;
    result = result.replace(code.placeholder, html);
  }

  return result;
}

// ============================================
// 블록 요소 파싱
// ============================================

/**
 * 헤더 처리 (# ~ ######)
 */
function parseHeaders(text: string): string {
  return text.replace(/^(#{1,6})\s+(.+)$/gm, (_, hashes, content) => {
    const level = hashes.length;
    return `<h${level} class="zyle-md-header zyle-md-h${level}">${content.trim()}</h${level}>`;
  });
}

/**
 * 수평선 처리 (---, ***, ___)
 */
function parseHorizontalRules(text: string): string {
  return text.replace(/^[-*_]{3,}\s*$/gm, '<hr class="zyle-md-hr">');
}

/**
 * 순서 없는 리스트 처리 (- item, * item)
 */
function parseUnorderedLists(text: string): string {
  const lines = text.split('\n');
  const result: string[] = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^[\t ]*[-*]\s+(.+)$/);

    if (match) {
      if (!inList) {
        result.push('<ul class="zyle-md-list">');
        inList = true;
      }
      result.push(`<li class="zyle-md-li">${match[1]}</li>`);
    } else {
      if (inList) {
        result.push('</ul>');
        inList = false;
      }
      result.push(line);
    }
  }

  if (inList) {
    result.push('</ul>');
  }

  return result.join('\n');
}

/**
 * 순서 있는 리스트 처리 (1. item, 2. item)
 */
function parseOrderedLists(text: string): string {
  const lines = text.split('\n');
  const result: string[] = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^[\t ]*\d+\.\s+(.+)$/);

    if (match) {
      if (!inList) {
        result.push('<ol class="zyle-md-list zyle-md-ordered">');
        inList = true;
      }
      result.push(`<li class="zyle-md-li">${match[1]}</li>`);
    } else {
      if (inList) {
        result.push('</ol>');
        inList = false;
      }
      result.push(line);
    }
  }

  if (inList) {
    result.push('</ol>');
  }

  return result.join('\n');
}

// ============================================
// 인라인 요소 파싱
// ============================================

/**
 * 볼드/이탤릭 처리
 * 순서: 볼드+이탤릭 → 볼드 → 이탤릭
 */
function parseBoldItalic(text: string): string {
  let result = text;

  // ***bold italic*** 또는 ___bold italic___
  result = result.replace(
    /\*\*\*([^\*]+)\*\*\*/g,
    '<strong class="zyle-md-bold"><em class="zyle-md-italic">$1</em></strong>'
  );
  result = result.replace(
    /___([^_]+)___/g,
    '<strong class="zyle-md-bold"><em class="zyle-md-italic">$1</em></strong>'
  );

  // **bold** 또는 __bold__
  result = result.replace(
    /\*\*([^\*]+)\*\*/g,
    '<strong class="zyle-md-bold">$1</strong>'
  );
  result = result.replace(
    /__([^_]+)__/g,
    '<strong class="zyle-md-bold">$1</strong>'
  );

  // *italic* 또는 _italic_ (단어 중간의 _는 무시하기 위해 경계 체크)
  result = result.replace(
    /\*([^\*\s][^\*]*[^\*\s]|[^\*\s])\*/g,
    '<em class="zyle-md-italic">$1</em>'
  );
  result = result.replace(
    /(?<![a-zA-Z0-9])_([^_\s][^_]*[^_\s]|[^_\s])_(?![a-zA-Z0-9])/g,
    '<em class="zyle-md-italic">$1</em>'
  );

  return result;
}

/**
 * 링크 처리 ([text](url))
 * 보안: 위험한 프로토콜 차단
 */
function parseLinks(text: string, external: boolean): string {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

  return text.replace(linkRegex, (_, linkText, url) => {
    // sanitizeUrlForHref로 URL 검증 (javascript:, vbscript:, data: 차단)
    const safeUrl = sanitizeUrlForHref(url.trim());

    if (!safeUrl) {
      // 위험한 URL은 텍스트만 표시
      return linkText;
    }

    const targetAttr = external ? ' target="_blank" rel="noopener noreferrer"' : '';
    return `<a href="${safeUrl}" class="zyle-md-link"${targetAttr}>${linkText}</a>`;
  });
}

// ============================================
// 줄바꿈 처리
// ============================================

/**
 * 줄바꿈을 <br>로 변환
 * 블록 요소 직후의 줄바꿈은 변환하지 않음
 */
function parseLineBreaks(text: string): string {
  // 블록 요소 태그 패턴
  const blockEndTags = /<\/(pre|ul|ol|li|h[1-6])>/;
  const blockStartTags = /<(pre|ul|ol|li|h[1-6]|hr)[>\s]/;

  const lines = text.split('\n');
  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nextLine = lines[i + 1];

    result.push(line);

    // 마지막 줄이 아니고, 현재 줄이 블록 요소로 끝나지 않고,
    // 다음 줄이 블록 요소로 시작하지 않으면 <br> 추가
    if (
      i < lines.length - 1 &&
      !blockEndTags.test(line) &&
      !blockStartTags.test(nextLine || '') &&
      line.trim() !== '' // 빈 줄은 변환하지 않음
    ) {
      result[result.length - 1] = line + '<br>';
    }
  }

  return result.join('\n');
}

// ============================================
// 메인 파싱 함수
// ============================================

/**
 * 마크다운 텍스트를 안전한 HTML로 변환
 *
 * 보안: HTML 이스케이프 후 마크다운 파싱을 수행하여 XSS 방지
 *
 * @param text 마크다운 텍스트
 * @param options 파싱 옵션
 * @returns 안전한 HTML 문자열
 */
export function parseMarkdown(text: string, options: MarkdownOptions = {}): string {
  const opts = {
    externalLinks: true,
    preserveLineBreaks: true,
    ...options,
  };

  if (!text) {
    return '';
  }

  // 1. 먼저 HTML 이스케이프 (XSS 방지의 핵심!)
  let result = escapeHtml(text);

  // 2. 코드 블록 추출 (다른 처리에서 보호)
  const { text: textWithoutCodeBlocks, blocks } = extractCodeBlocks(result);
  result = textWithoutCodeBlocks;

  // 3. 인라인 코드 추출 (다른 처리에서 보호)
  const { text: textWithoutInlineCode, codes } = extractInlineCode(result);
  result = textWithoutInlineCode;

  // 4. 헤더 처리
  result = parseHeaders(result);

  // 5. 수평선 처리
  result = parseHorizontalRules(result);

  // 6. 리스트 처리 (순서 없는 → 순서 있는)
  result = parseUnorderedLists(result);
  result = parseOrderedLists(result);

  // 7. 볼드/이탤릭 처리
  result = parseBoldItalic(result);

  // 8. 링크 처리
  result = parseLinks(result, opts.externalLinks);

  // 9. 인라인 코드 복원
  result = restoreInlineCode(result, codes);

  // 10. 코드 블록 복원
  result = restoreCodeBlocks(result, blocks);

  // 11. 줄바꿈 처리 (마지막에)
  if (opts.preserveLineBreaks) {
    result = parseLineBreaks(result);
  }

  return result;
}
