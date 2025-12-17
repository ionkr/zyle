/**
 * 콘솔 로그 레벨
 */
export type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

/**
 * 패널 표시 모드
 */
export type DisplayMode = 'floating' | 'dock';

/**
 * 패널 상태 (저장용)
 */
export interface PanelState {
  displayMode: DisplayMode;
  floatingPosition?: { x: number; y: number };
  floatingSize?: { width: number; height: number };
  dockWidth?: number;
}

/**
 * 스택 프레임 정보
 */
export interface StackFrame {
  fileName: string;
  lineNumber: number;
  columnNumber: number;
  functionName: string;
  source: string;
  // 소스맵으로 해석된 원본 정보
  original?: {
    fileName: string;
    lineNumber: number;
    columnNumber: number;
    source?: string;
  };
}

/**
 * 콘솔 로그 엔트리
 */
export interface LogEntry {
  id: string;
  level: LogLevel;
  message: string;
  args: unknown[];
  timestamp: number;
  stackTrace: StackFrame[];
  // 연관된 네트워크 요청 ID
  relatedNetworkRequestIds?: string[];
}

/**
 * 네트워크 요청 상태
 */
export type NetworkRequestStatus = 'pending' | 'success' | 'error' | 'timeout' | 'aborted';

/**
 * 네트워크 요청 엔트리
 */
export interface NetworkRequest {
  id: string;
  method: string;
  url: string;
  startTime: number;
  endTime?: number;
  status?: number;
  statusText?: string;
  requestHeaders: Record<string, string>;
  responseHeaders?: Record<string, string>;
  requestBody?: unknown;
  responseBody?: unknown;
  error?: Error;
  requestStatus: NetworkRequestStatus;
}

/**
 * 로그 분석 결과
 */
export interface AnalysisResult {
  logEntry: LogEntry;
  errorType?: string;
  possibleCauses: string[];
  suggestions: string[];
  relatedNetworkRequests: NetworkRequest[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  codeContext?: {
    fileName: string;
    lineNumber: number;
    columnNumber: number;
    sourcePreview: string[];
  };
}

/**
 * 플로팅 버튼 위치
 */
export type ButtonPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

/**
 * 지원 언어 타입
 */
export type Locale = 'ko' | 'en';

/**
 * 라이브러리 설정 옵션
 */
export interface ZyleOptions {
  /** 플로팅 버튼 초기 위치 */
  position?: ButtonPosition;
  /** 드래그 가능 여부 */
  draggable?: boolean;
  /** 콘솔 로그 캡처 여부 */
  captureConsole?: boolean;
  /** 네트워크 요청 캡처 여부 */
  captureNetwork?: boolean;
  /** 소스맵 지원 여부 */
  sourceMapSupport?: boolean;
  /** 자동 초기화 여부 */
  autoInit?: boolean;
  /** 최대 로그 저장 개수 */
  maxLogs?: number;
  /** 최대 네트워크 요청 저장 개수 */
  maxNetworkRequests?: number;
  /** 패널 테마 */
  theme?: 'light' | 'dark' | 'auto';
  /** 커스텀 z-index */
  zIndex?: number;
  /** 패널 표시 모드 */
  displayMode?: DisplayMode;
  /** 언어 설정 ('auto'는 브라우저 언어 자동 감지) */
  locale?: Locale | 'auto';
}

/**
 * 기본 설정값
 */
export const DEFAULT_OPTIONS: Required<ZyleOptions> = {
  position: 'bottom-right',
  draggable: true,
  captureConsole: true,
  captureNetwork: true,
  sourceMapSupport: true,
  autoInit: true,
  maxLogs: 100,
  maxNetworkRequests: 50,
  theme: 'auto',
  zIndex: 999999,
  displayMode: 'floating',
  locale: 'auto',
};

/**
 * 이벤트 타입
 */
export type ZyleEventType =
  | 'log:captured'
  | 'network:start'
  | 'network:end'
  | 'analysis:complete'
  | 'panel:open'
  | 'panel:close'
  | 'mode:change';

/**
 * 이벤트 핸들러
 */
export type ZyleEventHandler<T = unknown> = (data: T) => void;

/**
 * 에러 패턴 매칭을 위한 규칙
 */
export interface ErrorPattern {
  pattern: RegExp;
  errorType: string;
  possibleCauses: string[];
  suggestions: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * AI 분석 결과
 */
export interface AIAnalysisResult {
  errorType: string;
  rootCause: string;
  possibleCauses: string[];
  suggestions: string[];
  codeExample?: string;
  confidence: 'high' | 'medium' | 'low';
  modelId?: string;
}

/**
 * AI 분석 상태
 */
export type AIAnalysisState = 'idle' | 'loading' | 'success' | 'error';

/**
 * AI 분석 컨텍스트
 */
export interface AIAnalysisContext {
  logEntry: LogEntry;
  stackTrace: StackFrame[];
  networkRequests: NetworkRequest[];
  codeContext?: {
    fileName: string;
    lineNumber: number;
    columnNumber: number;
    sourcePreview: string[];
  };
}
