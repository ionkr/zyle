/**
 * 지원 언어 타입
 */
export type Locale = 'ko' | 'en';

/**
 * 심각도 레벨 타입
 */
export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low';

/**
 * UI 번역 키
 */
export interface UITranslations {
  tabs: {
    all: string;
    errors: string;
    warnings: string;
    network: string;
  };
  buttons: {
    clear: string;
    settings: string;
    close: string;
    back: string;
    dockMode: string;
    floatMode: string;
    delete: string;
    details: string;
    showMore: string;
    showLess: string;
    copy: string;
    retry: string;
    checkSettings: string;
    cancel: string;
    save: string;
  };
  empty: {
    noLogs: string;
    noNetwork: string;
  };
  analysis: {
    analyzing: string;
    possibleCauses: string;
    suggestions: string;
    sourceCode: string;
    relatedNetwork: string;
    stackTrace: string;
  };
  severity: {
    critical: string;
    high: string;
    medium: string;
    low: string;
  };
}

/**
 * AI 관련 번역 키
 */
export interface AITranslations {
  title: string;
  analyzed: string;
  copyForDeveloper: string;
  copyHint: string;
  detailedAnalysis: string;
  possibleCauses: string;
  solutions: string;
  codeExample: string;
  loading: {
    title: string;
    subtitle: string;
    step1: string;
    step2: string;
    step3: string;
  };
  error: {
    title: string;
    retry: string;
    checkSettings: string;
  };
  settings: {
    title: string;
    provider: string;
    providerHint: string;
    apiKey: string;
    apiKeyPlaceholder: string;
    apiKeyHint: string;
    apiKeyLink: string;
    currentKey: string;
    deleteKey: string;
    model: string;
    modelHint: string;
    bridge: {
      status: string;
      checking: string;
      running: string;
      notRunning: string;
      claudeCliMissing: string;
      ready: string;
      installGuide: string;
      installBridgeApp: string;
      installClaudeCli: string;
      portSettings: {
        label: string;
        placeholder: string;
        testConnection: string;
        connected: string;
        disconnected: string;
        testing: string;
      };
      notRunningGuide: {
        title: string;
        description: string;
        command: string;
        copy: string;
        copied: string;
        retry: string;
        settings: string;
      };
      notAuthenticated: {
        title: string;
        description: string;
        command: string;
        loginCommand: string;
      };
      statusMessages: {
        serverRunning: string;
        allReady: string;
      };
    };
  };
  followUp: {
    placeholder: string;
    send: string;
    loading: string;
  };
  conversation: {
    you: string;
    assistant: string;
    newConversation: string;
  };
  report: {
    title: string;
    errorType: string;
    errorMessage: string;
    analysisResult: string;
    analysisModel: string;
    rootCause: string;
    possibleCauses: string;
    solutions: string;
    codeExample: string;
    stackTrace: string;
    networkInfo: string;
    request: string;
    url: string;
    status: string;
    requestStatus: string;
    requestHeaders: string;
    responseHeaders: string;
    requestBody: string;
    responseBody: string;
    error: string;
    unknown: string;
    none: string;
  };
}

/**
 * 네트워크 관련 번역 키
 */
export interface NetworkTranslations {
  general: string;
  requestHeaders: string;
  requestBody: string;
  responseHeaders: string;
  responseBody: string;
  errorDetails: string;
  url: string;
  method: string;
  status: string;
  duration: string;
  time: string;
  name: string;
  message: string;
  timeout: string;
  connectionError: string;
  errorMessages: {
    timeout: string;
    networkError: string;
    unknownError: string;
    connectionFailed: string;
    error: string;
  };
}

/**
 * 에러 패턴 번역 키
 */
export interface ErrorPatternTranslation {
  possibleCauses: string[];
  suggestions: string[];
}

/**
 * 에러 패턴 번역 맵
 */
export interface ErrorPatternsTranslations {
  networkConnection: ErrorPatternTranslation;
  httpClient: ErrorPatternTranslation;
  httpServer: ErrorPatternTranslation;
  networkTimeout: ErrorPatternTranslation;
  cors: ErrorPatternTranslation;
  typeError: ErrorPatternTranslation;
  referenceError: ErrorPatternTranslation;
  syntaxError: ErrorPatternTranslation;
  rangeError: ErrorPatternTranslation;
  reactError: ErrorPatternTranslation;
  asyncError: ErrorPatternTranslation;
  authError: ErrorPatternTranslation;
  authzError: ErrorPatternTranslation;
  notFoundError: ErrorPatternTranslation;
  serverError: ErrorPatternTranslation;
  deprecationWarning: ErrorPatternTranslation;
}

/**
 * AI 프롬프트 번역 키
 */
export interface PromptTranslations {
  systemRole: string;
  logTarget: string;
  level: string;
  message: string;
  timestamp: string;
  additionalArgs: string;
  noArgs: string;
  stackTrace: string;
  noStackTrace: string;
  relatedNetwork: string;
  noNetwork: string;
  codeContext: string;
  noCodeContext: string;
  file: string;
  instructions: {
    title: string;
    step1: string;
    step2: string;
    step3: string;
    step4: string;
    step5: string;
  };
  responseFormat: string;
  responseNote: string;
  languageInstruction: string;
}

/**
 * 전체 번역 구조
 */
export interface Translations {
  ui: UITranslations;
  ai: AITranslations;
  network: NetworkTranslations;
  errors: ErrorPatternsTranslations;
  prompt: PromptTranslations;
}
