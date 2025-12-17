import type { StackFrame } from '../types';

interface SourceMapConsumer {
  originalPositionFor(position: {
    line: number;
    column: number;
  }): {
    source: string | null;
    line: number | null;
    column: number | null;
    name: string | null;
  };
  sourceContentFor(source: string): string | null;
  destroy(): void;
}

interface RawSourceMap {
  version: number;
  sources: string[];
  names: string[];
  mappings: string;
  sourcesContent?: string[];
}

/**
 * 소스맵 리졸버
 * 번들된 코드의 위치를 원본 소스 코드 위치로 매핑합니다.
 */
export class SourceMapResolver {
  private sourceMapCache: Map<string, SourceMapConsumer | null> = new Map();
  private sourceMapUrls: Map<string, string> = new Map();
  private isEnabled = true;

  // LRU 캐시 설정
  private readonly MAX_CACHE_SIZE = 50;
  private cacheAccessOrder: string[] = []; // LRU 추적용

  /**
   * 소스맵 지원 활성화/비활성화
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * 스택 프레임을 원본 소스 위치로 해석
   */
  async resolveStackFrame(frame: StackFrame): Promise<StackFrame> {
    if (!this.isEnabled) return frame;

    try {
      const consumer = await this.getSourceMapConsumer(frame.fileName);
      if (!consumer) return frame;

      const originalPosition = consumer.originalPositionFor({
        line: frame.lineNumber,
        column: frame.columnNumber,
      });

      if (originalPosition.source) {
        let sourcePreview: string | undefined;

        try {
          const sourceContent = consumer.sourceContentFor(originalPosition.source);
          if (sourceContent) {
            const lines = sourceContent.split('\n');
            const lineIndex = (originalPosition.line ?? 1) - 1;
            const contextLines = 3;
            const startLine = Math.max(0, lineIndex - contextLines);
            const endLine = Math.min(lines.length, lineIndex + contextLines + 1);
            sourcePreview = lines.slice(startLine, endLine).join('\n');
          }
        } catch {
          // 소스 콘텐츠를 가져올 수 없는 경우 무시
        }

        return {
          ...frame,
          original: {
            fileName: originalPosition.source,
            lineNumber: originalPosition.line ?? 0,
            columnNumber: originalPosition.column ?? 0,
            source: sourcePreview,
          },
        };
      }
    } catch (error) {
      console.warn('[Zyle] Failed to resolve source map:', error);
    }

    return frame;
  }

  /**
   * 여러 스택 프레임을 한 번에 해석
   */
  async resolveStackFrames(frames: StackFrame[]): Promise<StackFrame[]> {
    return Promise.all(frames.map((frame) => this.resolveStackFrame(frame)));
  }

  /**
   * 소스맵 컨슈머 가져오기 (LRU 캐시 사용)
   */
  private async getSourceMapConsumer(fileUrl: string): Promise<SourceMapConsumer | null> {
    // 캐시 확인
    if (this.sourceMapCache.has(fileUrl)) {
      this.updateCacheAccess(fileUrl); // LRU 업데이트
      return this.sourceMapCache.get(fileUrl) ?? null;
    }

    try {
      // 소스맵 URL 찾기
      const sourceMapUrl = await this.findSourceMapUrl(fileUrl);
      if (!sourceMapUrl) {
        this.addToCache(fileUrl, null);
        return null;
      }

      // 소스맵 로드
      const rawSourceMap = await this.loadSourceMap(sourceMapUrl);
      if (!rawSourceMap) {
        this.addToCache(fileUrl, null);
        return null;
      }

      // 소스맵 컨슈머 생성
      const consumer = await this.createSourceMapConsumer(rawSourceMap);
      this.addToCache(fileUrl, consumer);
      return consumer;
    } catch (error) {
      console.warn('[Zyle] Failed to load source map for:', fileUrl, error);
      this.addToCache(fileUrl, null);
      return null;
    }
  }

  /**
   * LRU 캐시에 항목 추가 (최대 크기 초과 시 가장 오래된 항목 제거)
   */
  private addToCache(key: string, value: SourceMapConsumer | null): void {
    // 캐시가 가득 차면 가장 오래된 항목 제거
    if (this.sourceMapCache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.cacheAccessOrder.shift();
      if (oldestKey) {
        const oldConsumer = this.sourceMapCache.get(oldestKey);
        oldConsumer?.destroy();
        this.sourceMapCache.delete(oldestKey);
      }
    }

    this.sourceMapCache.set(key, value);
    this.cacheAccessOrder.push(key);
  }

  /**
   * LRU 캐시 접근 순서 업데이트
   */
  private updateCacheAccess(key: string): void {
    const index = this.cacheAccessOrder.indexOf(key);
    if (index > -1) {
      this.cacheAccessOrder.splice(index, 1);
      this.cacheAccessOrder.push(key);
    }
  }

  /**
   * 파일의 소스맵 URL 찾기
   */
  private async findSourceMapUrl(fileUrl: string): Promise<string | null> {
    // 캐시된 URL 확인
    if (this.sourceMapUrls.has(fileUrl)) {
      return this.sourceMapUrls.get(fileUrl) ?? null;
    }

    // 일반적인 소스맵 URL 패턴 시도
    const possibleUrls = [`${fileUrl}.map`, fileUrl.replace(/\.js$/, '.js.map')];

    for (const url of possibleUrls) {
      try {
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok) {
          this.sourceMapUrls.set(fileUrl, url);
          return url;
        }
      } catch {
        // 다음 URL 시도
      }
    }

    // 파일 내용에서 sourceMappingURL 주석 찾기
    try {
      const response = await fetch(fileUrl);
      if (response.ok) {
        const content = await response.text();
        const match = content.match(/\/\/[#@]\s*sourceMappingURL\s*=\s*(\S+)/);
        if (match) {
          const sourceMapUrl = this.resolveUrl(match[1], fileUrl);
          this.sourceMapUrls.set(fileUrl, sourceMapUrl);
          return sourceMapUrl;
        }
      }
    } catch {
      // 무시
    }

    return null;
  }

  /**
   * 소스맵 로드
   */
  private async loadSourceMap(url: string): Promise<RawSourceMap | null> {
    try {
      // Data URL 처리
      if (url.startsWith('data:')) {
        const base64Match = url.match(/^data:application\/json;base64,(.+)$/);
        if (base64Match) {
          const decoded = atob(base64Match[1]);
          return JSON.parse(decoded);
        }
      }

      const response = await fetch(url);
      if (response.ok) {
        // Content-Type 확인하여 JSON인지 검증
        const contentType = response.headers.get('content-type');
        if (contentType && !contentType.includes('application/json')) {
          // JSON이 아니면 스킵 (JS 파일이 반환되는 경우 등)
          return null;
        }

        // 텍스트로 먼저 읽어서 JSON인지 확인
        const text = await response.text();
        if (!text.startsWith('{')) {
          // JSON이 아니면 스킵
          return null;
        }

        return JSON.parse(text);
      }
    } catch (error) {
      console.warn('[Zyle] Failed to fetch source map:', url, error);
    }

    return null;
  }

  /**
   * 소스맵 컨슈머 생성 (간단한 구현)
   */
  private async createSourceMapConsumer(rawSourceMap: RawSourceMap): Promise<SourceMapConsumer> {
    // source-map 라이브러리 대신 간단한 VLQ 디코딩 구현
    const mappings = this.decodeMappings(rawSourceMap.mappings, rawSourceMap.sources);

    return {
      originalPositionFor(position: {
        line: number;
        column: number;
      }): { source: string | null; line: number | null; column: number | null; name: string | null } {
        const lineIndex = position.line - 1;
        const mapping = mappings.find(
          (m) => m.generatedLine === lineIndex && m.generatedColumn <= position.column
        );

        if (mapping && mapping.originalLine !== undefined) {
          return {
            source: rawSourceMap.sources[mapping.sourceIndex ?? 0],
            line: mapping.originalLine + 1,
            column: mapping.originalColumn ?? 0,
            name: mapping.nameIndex !== undefined ? rawSourceMap.names[mapping.nameIndex] : null,
          };
        }

        return { source: null, line: null, column: null, name: null };
      },

      sourceContentFor(source: string): string | null {
        const index = rawSourceMap.sources.indexOf(source);
        if (index !== -1 && rawSourceMap.sourcesContent) {
          return rawSourceMap.sourcesContent[index] ?? null;
        }
        return null;
      },

      destroy(): void {
        // cleanup
      },
    };
  }

  /**
   * VLQ 매핑 디코딩
   */
  private decodeMappings(
    mappingsStr: string,
    _sources: string[]
  ): Array<{
    generatedLine: number;
    generatedColumn: number;
    sourceIndex?: number;
    originalLine?: number;
    originalColumn?: number;
    nameIndex?: number;
  }> {
    const mappings: Array<{
      generatedLine: number;
      generatedColumn: number;
      sourceIndex?: number;
      originalLine?: number;
      originalColumn?: number;
      nameIndex?: number;
    }> = [];

    const lines = mappingsStr.split(';');

    let generatedColumn = 0;
    let sourceIndex = 0;
    let originalLine = 0;
    let originalColumn = 0;
    let nameIndex = 0;

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      if (!line) continue;

      generatedColumn = 0;
      const segments = line.split(',');

      for (const segment of segments) {
        if (!segment) continue;

        const decoded = this.decodeVLQ(segment);
        if (decoded.length === 0) continue;

        generatedColumn += decoded[0];

        const mapping: (typeof mappings)[0] = {
          generatedLine: lineIndex,
          generatedColumn,
        };

        if (decoded.length >= 4) {
          sourceIndex += decoded[1];
          originalLine += decoded[2];
          originalColumn += decoded[3];

          mapping.sourceIndex = sourceIndex;
          mapping.originalLine = originalLine;
          mapping.originalColumn = originalColumn;

          if (decoded.length >= 5) {
            nameIndex += decoded[4];
            mapping.nameIndex = nameIndex;
          }
        }

        mappings.push(mapping);
      }
    }

    return mappings;
  }

  /**
   * VLQ 디코딩
   */
  private decodeVLQ(str: string): number[] {
    const VLQ_BASE = 64;
    const VLQ_BASE_SHIFT = 5;
    const VLQ_BASE_MASK = VLQ_BASE - 1;
    const VLQ_CONTINUATION_BIT = VLQ_BASE;

    const charToInteger: Record<string, number> = {};
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    for (let i = 0; i < chars.length; i++) {
      charToInteger[chars[i]] = i;
    }

    const decoded: number[] = [];
    let shift = 0;
    let value = 0;

    for (const char of str) {
      const integer = charToInteger[char];
      if (integer === undefined) continue;

      const hasContinuationBit = (integer & VLQ_CONTINUATION_BIT) !== 0;
      const integerWithoutContinuationBit = integer & VLQ_BASE_MASK;

      value += integerWithoutContinuationBit << shift;

      if (hasContinuationBit) {
        shift += VLQ_BASE_SHIFT;
      } else {
        const shouldNegate = (value & 1) === 1;
        value = value >> 1;
        if (shouldNegate) {
          value = -value;
        }
        decoded.push(value);
        value = 0;
        shift = 0;
      }
    }

    return decoded;
  }

  /**
   * 상대 URL을 절대 URL로 변환
   */
  private resolveUrl(relative: string, base: string): string {
    try {
      return new URL(relative, base).href;
    } catch {
      return relative;
    }
  }

  /**
   * 캐시 초기화
   */
  clearCache(): void {
    for (const consumer of this.sourceMapCache.values()) {
      consumer?.destroy();
    }
    this.sourceMapCache.clear();
    this.sourceMapUrls.clear();
    this.cacheAccessOrder = []; // LRU 순서 초기화
  }
}
