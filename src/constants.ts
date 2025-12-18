/**
 * UI 상수
 */
export const UI_CONSTANTS = {
  // 플로팅 버튼
  BUTTON_SIZE: 56,
  BUTTON_PADDING: 20,
  DRAG_THRESHOLD: 5,

  // 분석 패널
  PANEL_DEFAULT_WIDTH: 450,
  PANEL_DEFAULT_HEIGHT: 500,
  PANEL_MIN_WIDTH: 300,
  PANEL_MIN_HEIGHT: 200,
  PANEL_MAX_WIDTH: 1200,
  PANEL_MAX_HEIGHT: 900,
  PANEL_PADDING: 16,

  // 뱃지
  BADGE_MAX_COUNT: 99,
} as const;

/**
 * 분석 관련 상수
 */
export const ANALYSIS_CONSTANTS = {
  // 시간 윈도우 (네트워크 요청 연관 분석용)
  TIME_WINDOW_MS: 2000,

  // 코드 컨텍스트 라인 수
  CODE_CONTEXT_LINES: 3,

  // 기본 최대 저장 개수
  DEFAULT_MAX_LOGS: 100,
  DEFAULT_MAX_NETWORK_REQUESTS: 50,
} as const;

/**
 * 소스맵 관련 상수
 */
export const SOURCEMAP_CONSTANTS = {
  // VLQ 디코딩
  VLQ_BASE: 64,
  VLQ_BASE_SHIFT: 5,
  VLQ_BASE_MASK: 63, // VLQ_BASE - 1
  VLQ_CONTINUATION_BIT: 64, // VLQ_BASE

  // Base64 문자열
  BASE64_CHARS: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
} as const;

/**
 * 스토리지 키
 */
export const STORAGE_KEYS = {
  API_KEY: 'zyle_anthropic_api_key',
  API_KEY_IV: 'zyle_anthropic_api_key_iv',
  MODEL: 'zyle_anthropic_model',
  AI_PROVIDER: 'zyle_ai_provider',
  BRIDGE_PORT: 'zyle_bridge_port',
} as const;

/**
 * Bridge 관련 상수
 */
export const BRIDGE_CONSTANTS = {
  DEFAULT_PORT: 19960,
  DEFAULT_HOST: '127.0.0.1',
  DEFAULT_TIMEOUT: 120000, // 2분
  COMMAND: 'npx @absmartly/claude-code-bridge --port',
} as const;

/**
 * API 관련 상수
 */
export const API_CONSTANTS = {
  ANTHROPIC_URL: 'https://api.anthropic.com/v1/messages',
  ANTHROPIC_VERSION: '2023-06-01',
  MAX_TOKENS: 2048,
} as const;

/**
 * 민감 정보 필터링 패턴
 */
export const SENSITIVE_PATTERNS = {
  // 필터링할 헤더 이름 (소문자)
  HEADERS: [
    'authorization',
    'cookie',
    'set-cookie',
    'x-api-key',
    'x-auth-token',
    'x-access-token',
    'x-csrf-token',
    'x-xsrf-token',
    'proxy-authorization',
  ],

  // 필터링할 바디 필드 이름
  BODY_FIELDS: [
    'password',
    'passwd',
    'secret',
    'token',
    'accessToken',
    'access_token',
    'refreshToken',
    'refresh_token',
    'apiKey',
    'api_key',
    'privateKey',
    'private_key',
    'creditCard',
    'credit_card',
    'cardNumber',
    'card_number',
    'cvv',
    'ssn',
    'socialSecurityNumber',
  ],

  // 마스킹 문자열
  MASK: '[FILTERED]',
} as const;

/**
 * AI Provider 설정
 */
export const AI_PROVIDERS = [
  {
    id: 'anthropic-api',
    name: 'Anthropic API',
    description: 'Direct API call (requires API key)',
    requiresApiKey: true,
  },
  {
    id: 'claude-bridge',
    name: 'Claude CLI (Bridge App)',
    description: 'Local Claude CLI via Bridge App',
    requiresApiKey: false,
  },
] as const;

export type AIProvider = (typeof AI_PROVIDERS)[number]['id'];

export const DEFAULT_AI_PROVIDER: AIProvider = 'anthropic-api';

/**
 * AI 모델 설정
 */
export const AI_MODELS = [
  { id: 'claude-sonnet-4-5', name: 'Claude Sonnet 4.5', modelId: 'claude-sonnet-4-5' },
  { id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5', modelId: 'claude-haiku-4-5' },
  { id: 'claude-opus-4-5', name: 'Claude Opus 4.5', modelId: 'claude-opus-4-5' },
] as const;

export type AIModel = (typeof AI_MODELS)[number]['id'];

export const DEFAULT_AI_MODEL: AIModel = 'claude-sonnet-4-5';
