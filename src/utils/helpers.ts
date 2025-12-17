/**
 * 유니크 ID 생성
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 타임스탬프 포맷팅
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const timeStr = date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const ms = String(date.getMilliseconds()).padStart(3, '0');
  return `${timeStr}.${ms}`;
}

/**
 * 객체를 안전하게 문자열로 변환
 */
export function safeStringify(obj: unknown, maxLength = 1000): string {
  try {
    if (obj === undefined) return 'undefined';
    if (obj === null) return 'null';
    if (typeof obj === 'function') return obj.toString();
    if (obj instanceof Error) {
      return `${obj.name}: ${obj.message}`;
    }
    const str = JSON.stringify(obj, getCircularReplacer(), 2);
    return str.length > maxLength ? str.slice(0, maxLength) + '...' : str;
  } catch {
    return String(obj);
  }
}

/**
 * 순환 참조 처리를 위한 replacer
 */
function getCircularReplacer() {
  const seen = new WeakSet();
  return (_key: string, value: unknown) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }
    return value;
  };
}

/**
 * 스택 트레이스 문자열 파싱
 */
export function parseStackTrace(stack: string | undefined): Array<{
  fileName: string;
  lineNumber: number;
  columnNumber: number;
  functionName: string;
  source: string;
}> {
  if (!stack) return [];

  const frames: Array<{
    fileName: string;
    lineNumber: number;
    columnNumber: number;
    functionName: string;
    source: string;
  }> = [];

  const lines = stack.split('\n');

  for (const line of lines) {
    // Chrome/Edge 형식: "    at functionName (fileName:line:column)"
    // Firefox 형식: "functionName@fileName:line:column"
    const chromeMatch = line.match(/^\s*at\s+(?:(.+?)\s+\()?(.+):(\d+):(\d+)\)?$/);
    const firefoxMatch = line.match(/^(.*)@(.+):(\d+):(\d+)$/);

    const match = chromeMatch || firefoxMatch;

    if (match) {
      frames.push({
        functionName: match[1] || '<anonymous>',
        fileName: match[2],
        lineNumber: parseInt(match[3], 10),
        columnNumber: parseInt(match[4], 10),
        source: line.trim(),
      });
    }
  }

  return frames;
}

/**
 * 디바운스 함수
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * 스로틀 함수
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * DOM 요소 생성 헬퍼
 */
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attributes?: Record<string, string>,
  children?: (HTMLElement | string)[]
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);

  if (attributes) {
    for (const [key, value] of Object.entries(attributes)) {
      if (key === 'className') {
        element.className = value;
      } else if (key === 'style') {
        element.setAttribute('style', value);
      } else {
        element.setAttribute(key, value);
      }
    }
  }

  if (children) {
    for (const child of children) {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else {
        element.appendChild(child);
      }
    }
  }

  return element;
}

/**
 * 클램프 함수 (값을 최소/최대 범위 내로 제한)
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
