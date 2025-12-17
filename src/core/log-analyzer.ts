import type { LogEntry, NetworkRequest, AnalysisResult, ErrorPattern } from '../types';
import { SourceMapResolver } from './sourcemap-resolver';
import { NetworkInterceptor } from './network-interceptor';
import { DEFAULT_ERROR_PATTERNS, importPatternsFromJSON, exportPatternsToJSON } from './error-patterns';
import { ANALYSIS_CONSTANTS } from '../constants';

/**
 * 로그 분석 엔진
 * 콘솔 로그와 네트워크 요청을 분석하여 원인을 추론합니다.
 */
export class LogAnalyzer {
  private sourceMapResolver: SourceMapResolver;
  private networkInterceptor: NetworkInterceptor;
  private errorPatterns: ErrorPattern[] = [];

  constructor(sourceMapResolver: SourceMapResolver, networkInterceptor: NetworkInterceptor) {
    this.sourceMapResolver = sourceMapResolver;
    this.networkInterceptor = networkInterceptor;
    this.initErrorPatterns();
  }

  /**
   * 에러 패턴 초기화
   */
  private initErrorPatterns(): void {
    // 기본 에러 패턴 로드
    this.errorPatterns = [...DEFAULT_ERROR_PATTERNS];
  }

  /**
   * 외부 JSON에서 에러 패턴 로드
   */
  loadPatternsFromJSON(json: string): void {
    try {
      const patterns = importPatternsFromJSON(json);
      this.errorPatterns = [...patterns, ...DEFAULT_ERROR_PATTERNS];
    } catch (error) {
      console.warn('[Zyle] Failed to load error patterns from JSON:', error);
    }
  }

  /**
   * URL에서 에러 패턴 로드
   */
  async loadPatternsFromURL(url: string): Promise<void> {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const json = await response.text();
        this.loadPatternsFromJSON(json);
      }
    } catch (error) {
      console.warn('[Zyle] Failed to load error patterns from URL:', error);
    }
  }

  /**
   * 현재 에러 패턴을 JSON으로 내보내기
   */
  exportPatternsToJSON(): string {
    return exportPatternsToJSON(this.errorPatterns);
  }

  /**
   * 로그 엔트리 분석
   */
  async analyze(entry: LogEntry): Promise<AnalysisResult> {
    // 스택 트레이스를 소스맵으로 해석
    const resolvedStackTrace = await this.sourceMapResolver.resolveStackFrames(entry.stackTrace);
    const resolvedEntry = { ...entry, stackTrace: resolvedStackTrace };

    // 에러 패턴 매칭
    const matchedPattern = this.matchErrorPattern(entry.message);

    // 관련 네트워크 요청 찾기
    const relatedNetworkRequests = this.findRelatedNetworkRequests(entry);

    // 코드 컨텍스트 추출
    const codeContext = this.extractCodeContext(resolvedStackTrace);

    // 심각도 결정
    const severity = this.determineSeverity(entry, matchedPattern, relatedNetworkRequests);

    // 원인 및 제안 생성
    const { possibleCauses, suggestions } = this.generateCausesAndSuggestions(
      entry,
      matchedPattern,
      relatedNetworkRequests
    );

    return {
      logEntry: resolvedEntry,
      errorType: matchedPattern?.errorType,
      possibleCauses,
      suggestions,
      relatedNetworkRequests,
      severity,
      codeContext,
    };
  }

  /**
   * 에러 패턴 매칭
   */
  private matchErrorPattern(message: string): ErrorPattern | undefined {
    for (const pattern of this.errorPatterns) {
      if (pattern.pattern.test(message)) {
        return pattern;
      }
    }
    return undefined;
  }

  /**
   * 관련 네트워크 요청 찾기
   */
  private findRelatedNetworkRequests(entry: LogEntry): NetworkRequest[] {
    const related: NetworkRequest[] = [];

    // 타임스탬프 기반으로 최근 요청 찾기
    const requests = this.networkInterceptor.getRequests();
    const timeWindow = ANALYSIS_CONSTANTS.TIME_WINDOW_MS;

    for (const request of requests) {
      const requestTime = request.endTime || request.startTime;

      // 시간 범위 내의 요청인지 확인
      if (Math.abs(entry.timestamp - requestTime) <= timeWindow) {
        // 실패한 요청이거나 에러 메시지에 URL이 포함된 경우
        if (
          request.requestStatus === 'error' ||
          request.requestStatus === 'timeout' ||
          entry.message.includes(request.url) ||
          (request.status && request.status >= 400)
        ) {
          related.push(request);
        }
      }
    }

    return related;
  }

  /**
   * 코드 컨텍스트 추출
   */
  private extractCodeContext(stackTrace: LogEntry['stackTrace']): AnalysisResult['codeContext'] | undefined {
    // 첫 번째 유효한 스택 프레임에서 컨텍스트 추출
    for (const frame of stackTrace) {
      if (frame.original?.source) {
        return {
          fileName: frame.original.fileName,
          lineNumber: frame.original.lineNumber,
          columnNumber: frame.original.columnNumber,
          sourcePreview: frame.original.source.split('\n'),
        };
      }
    }

    // 원본 소스가 없으면 번들된 코드 위치 반환
    const firstFrame = stackTrace[0];
    if (firstFrame) {
      return {
        fileName: firstFrame.fileName,
        lineNumber: firstFrame.lineNumber,
        columnNumber: firstFrame.columnNumber,
        sourcePreview: [],
      };
    }

    return undefined;
  }

  /**
   * 심각도 결정
   */
  private determineSeverity(
    entry: LogEntry,
    matchedPattern: ErrorPattern | undefined,
    relatedNetworkRequests: NetworkRequest[]
  ): AnalysisResult['severity'] {
    // 패턴에 정의된 심각도 사용
    if (matchedPattern) {
      return matchedPattern.severity;
    }

    // 로그 레벨 기반 심각도
    if (entry.level === 'error') {
      // 네트워크 요청 실패가 있으면 더 심각
      if (relatedNetworkRequests.some((r) => r.requestStatus === 'error')) {
        return 'high';
      }
      return 'medium';
    }

    if (entry.level === 'warn') {
      return 'low';
    }

    return 'low';
  }

  /**
   * 원인 및 제안 생성
   */
  private generateCausesAndSuggestions(
    entry: LogEntry,
    matchedPattern: ErrorPattern | undefined,
    relatedNetworkRequests: NetworkRequest[]
  ): { possibleCauses: string[]; suggestions: string[] } {
    const possibleCauses: string[] = [];
    const suggestions: string[] = [];

    // 패턴 기반 원인 및 제안 추가
    if (matchedPattern) {
      possibleCauses.push(...matchedPattern.possibleCauses);
      suggestions.push(...matchedPattern.suggestions);
    }

    // 네트워크 요청 기반 원인 추가
    for (const request of relatedNetworkRequests) {
      if (request.requestStatus === 'error') {
        possibleCauses.push(`네트워크 요청 실패: ${request.method} ${request.url}`);

        if (request.status) {
          if (request.status === 401) {
            suggestions.push('인증 상태를 확인하세요');
          } else if (request.status === 403) {
            suggestions.push('접근 권한을 확인하세요');
          } else if (request.status === 404) {
            suggestions.push(`API 엔드포인트가 존재하는지 확인하세요: ${request.url}`);
          } else if (request.status >= 500) {
            suggestions.push('서버 상태를 확인하세요');
          }
        }
      }

      if (request.requestStatus === 'timeout') {
        possibleCauses.push(`요청 시간 초과: ${request.url}`);
        suggestions.push('서버 응답 시간을 확인하세요');
        suggestions.push('네트워크 연결 상태를 확인하세요');
      }
    }

    // 기본 원인 및 제안 (매칭된 패턴이 없는 경우)
    if (possibleCauses.length === 0) {
      if (entry.level === 'error') {
        possibleCauses.push('예기치 않은 에러가 발생했습니다');
        suggestions.push('스택 트레이스를 확인하세요');
        suggestions.push('입력 데이터를 검증하세요');
      } else if (entry.level === 'warn') {
        possibleCauses.push('잠재적인 문제가 감지되었습니다');
        suggestions.push('경고 메시지를 검토하세요');
      }
    }

    // 중복 제거
    return {
      possibleCauses: [...new Set(possibleCauses)],
      suggestions: [...new Set(suggestions)],
    };
  }

  /**
   * 여러 로그를 한 번에 분석
   */
  async analyzeMultiple(entries: LogEntry[]): Promise<AnalysisResult[]> {
    return Promise.all(entries.map((entry) => this.analyze(entry)));
  }

  /**
   * 에러만 분석
   */
  async analyzeErrors(entries: LogEntry[]): Promise<AnalysisResult[]> {
    const errors = entries.filter((entry) => entry.level === 'error');
    return this.analyzeMultiple(errors);
  }

  /**
   * 커스텀 에러 패턴 추가
   */
  addErrorPattern(pattern: ErrorPattern): void {
    // 기존 패턴 목록 앞에 추가 (우선순위 높게)
    this.errorPatterns.unshift(pattern);
  }

  /**
   * 에러 패턴 제거
   */
  removeErrorPattern(errorType: string): void {
    this.errorPatterns = this.errorPatterns.filter((p) => p.errorType !== errorType);
  }

  /**
   * 모든 에러 패턴 가져오기
   */
  getErrorPatterns(): ErrorPattern[] {
    return [...this.errorPatterns];
  }

  /**
   * 에러 패턴 초기화 (기본값으로 리셋)
   */
  resetErrorPatterns(): void {
    this.initErrorPatterns();
  }
}
