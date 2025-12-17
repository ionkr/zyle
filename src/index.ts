import type {
  ZyleOptions,
  LogEntry,
  NetworkRequest,
  AnalysisResult,
  ZyleEventType,
  ZyleEventHandler,
  ErrorPattern,
  DisplayMode,
  Locale,
} from './types';
import { DEFAULT_OPTIONS } from './types';
import { ConsoleInterceptor } from './core/console-interceptor';
import { NetworkInterceptor } from './core/network-interceptor';
import { SourceMapResolver } from './core/sourcemap-resolver';
import { LogAnalyzer } from './core/log-analyzer';
import { FloatingButton } from './ui/floating-button';
import { AnalysisPanel } from './ui/analysis-panel';
import { AIClient } from './ai/ai-client';
import { generateId } from './utils/helpers';
import {
  initLocale,
  setLocale as setI18nLocale,
  getLocale as getI18nLocale,
  getNetworkTranslations,
} from './i18n';

/**
 * Zyle the Console Analyzer
 * 웹 프론트엔드에 임베딩되어 콘솔 로그를 분석하고 원인을 안내하는 라이브러리
 */
export class Zyle {
  private options: Required<ZyleOptions>;
  private consoleInterceptor: ConsoleInterceptor;
  private networkInterceptor: NetworkInterceptor;
  private sourceMapResolver: SourceMapResolver;
  private logAnalyzer: LogAnalyzer;
  private floatingButton: FloatingButton;
  private analysisPanel: AnalysisPanel;
  private aiClient: AIClient;

  private eventListeners: Map<ZyleEventType, Set<ZyleEventHandler>> = new Map();
  private isInitialized = false;

  constructor(options: ZyleOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };

    // i18n 초기화 (다른 모듈보다 먼저)
    initLocale(this.options.locale);

    // 코어 모듈 초기화
    this.consoleInterceptor = new ConsoleInterceptor(this.options.maxLogs);
    this.networkInterceptor = new NetworkInterceptor(this.options.maxNetworkRequests);
    this.sourceMapResolver = new SourceMapResolver();
    this.logAnalyzer = new LogAnalyzer(this.sourceMapResolver, this.networkInterceptor);

    // UI 컴포넌트 초기화
    this.floatingButton = new FloatingButton({
      position: this.options.position,
      draggable: this.options.draggable,
      theme: this.options.theme,
      zIndex: this.options.zIndex,
    });

    this.analysisPanel = new AnalysisPanel({
      theme: this.options.theme,
      zIndex: this.options.zIndex,
      // 사용자가 명시적으로 지정한 경우에만 전달 (localStorage 복원 값 우선)
      displayMode: options.displayMode,
    });

    // AI 클라이언트 초기화
    this.aiClient = new AIClient();

    // 자동 초기화
    if (this.options.autoInit) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.init());
      } else {
        this.init();
      }
    }
  }

  /**
   * 초기화
   */
  init(): void {
    if (this.isInitialized) return;

    // 콘솔 인터셉터 시작
    if (this.options.captureConsole) {
      this.consoleInterceptor.start();
      this.consoleInterceptor.onLog((entry) => {
        this.handleLogCaptured(entry);
      });
    }

    // 네트워크 인터셉터 시작
    if (this.options.captureNetwork) {
      this.networkInterceptor.start();
      this.networkInterceptor.onRequest((request) => {
        this.handleNetworkRequest(request);
      });
    }

    // 소스맵 리졸버 설정
    this.sourceMapResolver.setEnabled(this.options.sourceMapSupport);

    // UI 마운트
    this.floatingButton.mount();
    this.analysisPanel.mount();

    // AI 클라이언트를 패널에 설정
    this.analysisPanel.setAIClient(this.aiClient);

    // UI 이벤트 핸들러 설정
    this.floatingButton.setOnClick(() => {
      this.togglePanel();
    });

    this.analysisPanel.setOnClose(() => {
      this.emit('panel:close', undefined);
    });

    this.analysisPanel.setOnClear(() => {
      this.clear();
    });

    this.analysisPanel.setOnAnalyze(async (entry) => {
      return this.analyze(entry);
    });

    // 모드 변경 이벤트 연결
    this.analysisPanel.setOnModeChange((mode) => {
      this.emit('mode:change', mode);
    });

    this.isInitialized = true;
  }

  /**
   * 종료
   */
  destroy(): void {
    if (!this.isInitialized) return;

    // 인터셉터 중지
    this.consoleInterceptor.stop();
    this.networkInterceptor.stop();

    // UI 언마운트
    this.floatingButton.unmount();
    this.analysisPanel.unmount();

    // 캐시 정리
    this.sourceMapResolver.clearCache();

    // 이벤트 리스너 정리
    this.eventListeners.clear();

    this.isInitialized = false;
  }

  /**
   * 로그 캡처 핸들러
   */
  private handleLogCaptured(entry: LogEntry): void {
    // 패널에 로그 추가
    this.analysisPanel.addLog(entry);

    // 뱃지 업데이트
    this.floatingButton.incrementCount(entry.level);

    // 이벤트 발생
    this.emit('log:captured', entry);
  }

  /**
   * 네트워크 요청 핸들러
   */
  private handleNetworkRequest(request: NetworkRequest): void {
    // 패널에 네트워크 요청 업데이트
    this.analysisPanel.updateNetworkRequest(request);

    // 이벤트 발생
    if (request.requestStatus === 'pending') {
      this.emit('network:start', request);
    } else {
      this.emit('network:end', request);

      // 네트워크 에러를 콘솔 에러로 자동 추가
      if (request.requestStatus === 'error' || request.requestStatus === 'timeout') {
        this.createNetworkErrorLog(request);
      }
    }
  }

  /**
   * 네트워크 에러를 콘솔 에러 로그로 변환
   */
  private createNetworkErrorLog(request: NetworkRequest): void {
    // 내부 요청은 무시 (source map, Vite HMR 등)
    if (this.isInternalRequest(request.url)) {
      return;
    }

    const errorMessage = this.formatNetworkErrorMessage(request);

    const logEntry: LogEntry = {
      id: generateId(),
      level: 'error',
      message: errorMessage,
      args: [request],
      timestamp: request.endTime || Date.now(),
      stackTrace: [],
      relatedNetworkRequestIds: [request.id],
    };

    // 콘솔 로그처럼 처리
    this.handleLogCaptured(logEntry);
  }

  /**
   * 내부 요청 여부 확인 (로깅에서 제외할 요청)
   */
  private isInternalRequest(url: string): boolean {
    const internalPatterns = [
      /\.map(\?|$)/i,                    // Source map 파일
      /node_modules\/\.vite\//i,         // Vite 내부 요청
      /@vite\//i,                        // Vite HMR
      /__vite_ping/i,                    // Vite ping
      /hot-update\.(js|json)/i,          // HMR 업데이트
    ];

    return internalPatterns.some(pattern => pattern.test(url));
  }

  /**
   * 네트워크 에러 메시지 포맷팅
   */
  private formatNetworkErrorMessage(request: NetworkRequest): string {
    const translations = getNetworkTranslations();
    const url = new URL(request.url, window.location.origin);
    const shortUrl = url.pathname + url.search;

    if (request.requestStatus === 'timeout') {
      return `[${translations.errorMessages.timeout}] ${request.method} ${shortUrl}`;
    }

    if (request.error) {
      const errorName = request.error.name || translations.errorMessages.networkError;
      const errorMsg = request.error.message || translations.errorMessages.unknownError;

      // DNS 에러, 연결 거부 등의 힌트 추가
      if (errorMsg.includes('Failed to fetch')) {
        return `[${translations.errorMessages.networkError}] ${request.method} ${shortUrl} - ${translations.errorMessages.connectionFailed}`;
      }

      return `[${errorName}] ${request.method} ${shortUrl} - ${errorMsg}`;
    }

    // HTTP 에러 (4xx, 5xx)
    if (request.status && request.status >= 400) {
      return `[HTTP ${request.status}] ${request.method} ${shortUrl} - ${request.statusText || translations.errorMessages.error}`;
    }

    return `[${translations.errorMessages.networkError}] ${request.method} ${shortUrl}`;
  }

  /**
   * 패널 토글
   */
  private togglePanel(): void {
    const buttonPos = this.floatingButton.getPosition();
    const wasOpen = this.analysisPanel.isOpen();

    this.analysisPanel.toggle(buttonPos);

    if (wasOpen) {
      this.emit('panel:close', undefined);
    } else {
      this.emit('panel:open', undefined);
    }
  }

  /**
   * 로그 분석
   */
  async analyze(entry: LogEntry): Promise<AnalysisResult> {
    const result = await this.logAnalyzer.analyze(entry);
    this.emit('analysis:complete', result);
    return result;
  }

  /**
   * 모든 로그 분석
   */
  async analyzeAll(): Promise<AnalysisResult[]> {
    const logs = this.consoleInterceptor.getLogs();
    return this.logAnalyzer.analyzeMultiple(logs);
  }

  /**
   * 에러만 분석
   */
  async analyzeErrors(): Promise<AnalysisResult[]> {
    const logs = this.consoleInterceptor.getLogs();
    return this.logAnalyzer.analyzeErrors(logs);
  }

  /**
   * 로그 초기화
   */
  clear(): void {
    this.consoleInterceptor.clear();
    this.networkInterceptor.clear();
    this.floatingButton.clearBadge();
    this.analysisPanel.clear();
  }

  /**
   * 모든 로그 가져오기
   */
  getLogs(): LogEntry[] {
    return this.consoleInterceptor.getLogs();
  }

  /**
   * 모든 네트워크 요청 가져오기
   */
  getNetworkRequests(): NetworkRequest[] {
    return this.networkInterceptor.getRequests();
  }

  /**
   * 실패한 네트워크 요청 가져오기
   */
  getFailedNetworkRequests(): NetworkRequest[] {
    return this.networkInterceptor.getFailedRequests();
  }

  /**
   * 에러 로그 가져오기
   */
  getErrors(): LogEntry[] {
    return this.consoleInterceptor.getErrors();
  }

  /**
   * 경고 로그 가져오기
   */
  getWarnings(): LogEntry[] {
    return this.consoleInterceptor.getWarnings();
  }

  /**
   * 이벤트 리스너 등록
   */
  on<T = unknown>(event: ZyleEventType, handler: ZyleEventHandler<T>): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(handler as ZyleEventHandler);
    return () => this.off(event, handler);
  }

  /**
   * 이벤트 리스너 제거
   */
  off<T = unknown>(event: ZyleEventType, handler: ZyleEventHandler<T>): void {
    this.eventListeners.get(event)?.delete(handler as ZyleEventHandler);
  }

  /**
   * 이벤트 발생
   */
  private emit<T>(event: ZyleEventType, data: T): void {
    this.eventListeners.get(event)?.forEach((handler) => handler(data));
  }

  /**
   * 커스텀 에러 패턴 추가
   */
  addErrorPattern(pattern: ErrorPattern): void {
    this.logAnalyzer.addErrorPattern(pattern);
  }

  /**
   * 에러 패턴 제거
   */
  removeErrorPattern(errorType: string): void {
    this.logAnalyzer.removeErrorPattern(errorType);
  }

  /**
   * 테마 설정
   */
  setTheme(theme: 'light' | 'dark'): void {
    this.floatingButton.setTheme(theme);
    this.analysisPanel.setTheme(theme);
  }

  /**
   * 언어 설정
   */
  setLocale(locale: Locale): void {
    setI18nLocale(locale);
  }

  /**
   * 현재 언어 가져오기
   */
  getLocale(): Locale {
    return getI18nLocale();
  }

  /**
   * 패널 열기
   */
  openPanel(): void {
    if (!this.analysisPanel.isOpen()) {
      this.togglePanel();
    }
  }

  /**
   * 패널 닫기
   */
  closePanel(): void {
    if (this.analysisPanel.isOpen()) {
      this.analysisPanel.hide();
      this.emit('panel:close', undefined);
    }
  }

  /**
   * 패널 표시 모드 설정
   */
  setDisplayMode(mode: DisplayMode): void {
    this.analysisPanel.setDisplayMode(mode);
  }

  /**
   * 패널 표시 모드 가져오기
   */
  getDisplayMode(): DisplayMode {
    return this.analysisPanel.getDisplayMode();
  }

  /**
   * 패널 표시 모드 전환
   */
  toggleDisplayMode(): void {
    this.analysisPanel.toggleDisplayMode();
  }

  /**
   * 초기화 상태 확인
   */
  isActive(): boolean {
    return this.isInitialized;
  }

  /**
   * 통계 가져오기
   */
  getStats(): {
    totalLogs: number;
    logsByLevel: Record<string, number>;
    totalNetworkRequests: number;
    networkRequestsByStatus: Record<string, number>;
  } {
    return {
      totalLogs: this.consoleInterceptor.getLogCount(),
      logsByLevel: this.consoleInterceptor.getLogCountByLevel(),
      totalNetworkRequests: this.networkInterceptor.getRequestCount(),
      networkRequestsByStatus: this.networkInterceptor.getRequestCountByStatus(),
    };
  }
}

// 기본 내보내기
export default Zyle;

// 타입 내보내기
export type {
  ZyleOptions,
  LogEntry,
  NetworkRequest,
  AnalysisResult,
  ZyleEventType,
  ZyleEventHandler,
  ErrorPattern,
  LogLevel,
  ButtonPosition,
  StackFrame,
  NetworkRequestStatus,
  DisplayMode,
  Locale,
} from './types';

// 전역 인스턴스 생성 (UMD 빌드용)
if (typeof window !== 'undefined') {
  (window as unknown as { Zyle: typeof Zyle }).Zyle = Zyle;
}
