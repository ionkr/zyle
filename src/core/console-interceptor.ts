import type { LogLevel, LogEntry, StackFrame } from '../types';
import { generateId, parseStackTrace, safeStringify } from '../utils/helpers';
import { sanitizeBody } from '../utils/sanitizer';

type ConsoleMethod = 'log' | 'info' | 'warn' | 'error' | 'debug';

/**
 * 콘솔 로그 인터셉터
 * 브라우저의 console 메서드를 오버라이드하여 로그를 캡처합니다.
 */
export class ConsoleInterceptor {
  private originalMethods: Map<ConsoleMethod, (...args: unknown[]) => void> = new Map();
  private logs: LogEntry[] = [];
  private maxLogs: number;
  private isIntercepting = false;
  private listeners: Set<(entry: LogEntry) => void> = new Set();

  constructor(maxLogs = 100) {
    this.maxLogs = maxLogs;
  }

  /**
   * 콘솔 인터셉트 시작
   */
  start(): void {
    if (this.isIntercepting) return;

    const methods: ConsoleMethod[] = ['log', 'info', 'warn', 'error', 'debug'];

    for (const method of methods) {
      // 원본 메서드 저장
      this.originalMethods.set(method, console[method].bind(console));

      // 새로운 메서드로 오버라이드
      console[method] = (...args: unknown[]) => {
        this.captureLog(method as LogLevel, args);
        // 원본 메서드 호출
        this.originalMethods.get(method)?.(...args);
      };
    }

    // 전역 에러 핸들러
    window.addEventListener('error', this.handleGlobalError);
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);

    this.isIntercepting = true;
  }

  /**
   * 콘솔 인터셉트 중지
   */
  stop(): void {
    if (!this.isIntercepting) return;

    // 원본 메서드 복원
    for (const [method, original] of this.originalMethods.entries()) {
      console[method] = original;
    }
    this.originalMethods.clear();

    // 이벤트 리스너 제거
    window.removeEventListener('error', this.handleGlobalError);
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);

    this.isIntercepting = false;
  }

  /**
   * 로그 캡처
   */
  private captureLog(level: LogLevel, args: unknown[]): void {
    // 스택 트레이스 생성
    const stackString = new Error().stack;
    const stackFrames = parseStackTrace(stackString);

    // 인터셉터 자체 호출을 제외
    const filteredFrames = this.filterInternalFrames(stackFrames);

    const message = args
      .map((arg) => {
        if (typeof arg === 'string') return arg;
        if (arg instanceof Error) return `${arg.name}: ${arg.message}`;
        return safeStringify(arg);
      })
      .join(' ');

    const entry: LogEntry = {
      id: generateId(),
      level,
      message,
      args: args.map((arg) => {
        if (arg instanceof Error) {
          return {
            name: arg.name,
            message: arg.message,
            stack: arg.stack,
          };
        }
        // 민감 정보 필터링 적용 (password, token, api_key 등)
        return sanitizeBody(arg, { filterBody: true });
      }),
      timestamp: Date.now(),
      stackTrace: filteredFrames,
    };

    this.addLog(entry);
  }

  /**
   * 전역 에러 핸들러
   */
  private handleGlobalError = (event: ErrorEvent): void => {
    const stackFrames = parseStackTrace(event.error?.stack);

    const entry: LogEntry = {
      id: generateId(),
      level: 'error',
      message: event.message,
      args: [
        {
          name: event.error?.name || 'Error',
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      ],
      timestamp: Date.now(),
      stackTrace: stackFrames,
    };

    this.addLog(entry);
  };

  /**
   * 처리되지 않은 Promise rejection 핸들러
   */
  private handleUnhandledRejection = (event: PromiseRejectionEvent): void => {
    const reason = event.reason;
    const stackFrames = reason instanceof Error ? parseStackTrace(reason.stack) : [];

    const entry: LogEntry = {
      id: generateId(),
      level: 'error',
      message:
        reason instanceof Error
          ? `Unhandled Promise Rejection: ${reason.message}`
          : `Unhandled Promise Rejection: ${safeStringify(reason)}`,
      args: [reason],
      timestamp: Date.now(),
      stackTrace: stackFrames,
    };

    this.addLog(entry);
  };

  /**
   * 내부 프레임 필터링 (인터셉터 코드 제외)
   */
  private filterInternalFrames(frames: StackFrame[]): StackFrame[] {
    return frames.filter((frame) => {
      // 인터셉터 관련 파일 제외
      if (frame.fileName.includes('console-interceptor')) return false;
      // Error 생성 관련 프레임 제외
      if (frame.functionName === 'captureLog') return false;
      // 오버라이드된 console 메서드 제외
      if (frame.source.includes('console.') && frames.indexOf(frame) < 2) return false;
      return true;
    });
  }

  /**
   * 로그 추가 (최적화: slice 사용)
   */
  private addLog(entry: LogEntry): void {
    this.logs.push(entry);

    // 최대 개수 초과 시 오래된 로그 제거 (slice 사용으로 O(1) amortized)
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // 리스너에게 알림
    for (const listener of this.listeners) {
      listener(entry);
    }
  }

  /**
   * 로그 변경 리스너 등록
   */
  onLog(callback: (entry: LogEntry) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * 모든 로그 가져오기
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * 특정 레벨의 로그만 가져오기
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter((log) => log.level === level);
  }

  /**
   * 에러 로그만 가져오기
   */
  getErrors(): LogEntry[] {
    return this.getLogsByLevel('error');
  }

  /**
   * 경고 로그만 가져오기
   */
  getWarnings(): LogEntry[] {
    return this.getLogsByLevel('warn');
  }

  /**
   * 로그 초기화
   */
  clear(): void {
    this.logs = [];
  }

  /**
   * 인터셉트 상태 확인
   */
  isActive(): boolean {
    return this.isIntercepting;
  }

  /**
   * 로그 개수
   */
  getLogCount(): number {
    return this.logs.length;
  }

  /**
   * 레벨별 로그 개수
   */
  getLogCountByLevel(): Record<LogLevel, number> {
    const counts: Record<LogLevel, number> = {
      log: 0,
      info: 0,
      warn: 0,
      error: 0,
      debug: 0,
    };

    for (const log of this.logs) {
      counts[log.level]++;
    }

    return counts;
  }
}
