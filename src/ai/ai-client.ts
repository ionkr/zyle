import type { AIAnalysisResult, AIAnalysisContext } from '../types';
import { buildAnalysisPrompt } from './ai-prompt';
import { encrypt, decrypt } from '../utils/crypto';
import { escapeHtml } from '../utils/sanitizer';
import {
  STORAGE_KEYS,
  API_CONSTANTS,
  AI_MODELS,
  DEFAULT_AI_MODEL,
  type AIModel,
} from '../constants';

/**
 * Anthropic API 클라이언트
 * 브라우저에서 직접 API 호출을 수행합니다.
 */
export class AIClient {
  private apiKey: string | null = null;
  private model: AIModel = DEFAULT_AI_MODEL;
  private isInitialized = false;

  constructor() {
    // 비동기 초기화는 init()에서 처리
  }

  /**
   * 비동기 초기화 (API 키 복호화)
   */
  async init(): Promise<void> {
    if (this.isInitialized) return;

    await this.loadApiKey();
    this.loadModel();
    this.isInitialized = true;
  }

  /**
   * localStorage에서 암호화된 API 키 로드 및 복호화
   */
  private async loadApiKey(): Promise<void> {
    try {
      const encryptedKey = localStorage.getItem(STORAGE_KEYS.API_KEY);
      const iv = localStorage.getItem(STORAGE_KEYS.API_KEY_IV);

      if (encryptedKey && iv) {
        this.apiKey = await decrypt(encryptedKey, iv);
        // 복호화 실패 시 빈 문자열이 반환되므로 체크
        if (!this.apiKey) {
          this.apiKey = null;
        }
      }
    } catch {
      // localStorage 접근 불가 시 무시
      this.apiKey = null;
    }
  }

  /**
   * API 키 암호화 및 저장
   */
  async setApiKey(key: string): Promise<void> {
    this.apiKey = key;
    try {
      const { ciphertext, iv } = await encrypt(key);
      localStorage.setItem(STORAGE_KEYS.API_KEY, ciphertext);
      localStorage.setItem(STORAGE_KEYS.API_KEY_IV, iv);
    } catch {
      // localStorage 접근 불가 시 메모리에만 저장
      console.warn('[Zyle] Failed to save API key to localStorage');
    }
  }

  /**
   * API 키 삭제
   */
  clearApiKey(): void {
    this.apiKey = null;
    try {
      localStorage.removeItem(STORAGE_KEYS.API_KEY);
      localStorage.removeItem(STORAGE_KEYS.API_KEY_IV);
    } catch {
      // localStorage 접근 불가 시 무시
    }
  }

  /**
   * API 키 존재 여부 확인
   */
  hasApiKey(): boolean {
    return !!this.apiKey;
  }

  /**
   * API 키의 마스킹된 버전 반환 (UI 표시용)
   */
  getMaskedApiKey(): string {
    if (!this.apiKey) return '';
    if (this.apiKey.length <= 8) return '****';
    return `${this.apiKey.slice(0, 7)}...${this.apiKey.slice(-4)}`;
  }

  /**
   * localStorage에서 모델 로드
   */
  private loadModel(): void {
    try {
      const savedModel = localStorage.getItem(STORAGE_KEYS.MODEL) as AIModel | null;
      if (savedModel && AI_MODELS.some((m) => m.id === savedModel)) {
        this.model = savedModel;
      }
    } catch {
      // localStorage 접근 불가 시 기본 모델 사용
    }
  }

  /**
   * 모델 설정 및 저장
   */
  setModel(model: AIModel): void {
    this.model = model;
    try {
      localStorage.setItem(STORAGE_KEYS.MODEL, model);
    } catch {
      // localStorage 접근 불가 시 메모리에만 저장
    }
  }

  /**
   * 현재 선택된 모델 반환
   */
  getModel(): AIModel {
    return this.model;
  }

  /**
   * 현재 모델의 API model ID 반환
   */
  private getModelId(): string {
    const modelInfo = AI_MODELS.find((m) => m.id === this.model);
    return modelInfo?.modelId || AI_MODELS[0].modelId;
  }

  /**
   * AI 로그 분석 요청
   */
  async analyze(context: AIAnalysisContext): Promise<AIAnalysisResult> {
    // 초기화되지 않았으면 초기화
    if (!this.isInitialized) {
      await this.init();
    }

    if (!this.apiKey) {
      throw new Error('API key not configured');
    }

    const prompt = buildAnalysisPrompt(context);

    const response = await fetch(API_CONSTANTS.ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': API_CONSTANTS.ANTHROPIC_VERSION,
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: this.getModelId(),
        max_tokens: API_CONSTANTS.MAX_TOKENS,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `API request failed: ${response.status}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    const result = this.parseResponse(data);
    result.modelId = this.getModelId();
    return result;
  }

  /**
   * API 응답 파싱
   */
  private parseResponse(data: { content: Array<{ type: string; text: string }> }): AIAnalysisResult {
    const textContent = data.content.find((c) => c.type === 'text');
    if (!textContent) {
      throw new Error('No text content in response');
    }

    const text = textContent.text;

    // JSON 블록 추출
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        return this.validateResult(parsed);
      } catch {
        // JSON 파싱 실패 시 전체 텍스트에서 시도
      }
    }

    // JSON 블록이 없으면 전체 텍스트에서 JSON 추출 시도
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      try {
        const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
        return this.validateResult(parsed);
      } catch {
        // 파싱 실패
      }
    }

    // 파싱 실패 시 기본 응답 생성
    return {
      errorType: 'Unknown',
      rootCause: text.slice(0, 500),
      possibleCauses: ['AI 응답을 파싱할 수 없습니다.'],
      suggestions: ['원본 AI 응답을 확인해주세요.'],
      confidence: 'low',
    };
  }

  /**
   * 파싱된 결과 유효성 검증 및 XSS 방지
   */
  private validateResult(parsed: Record<string, unknown>): AIAnalysisResult {
    // 문자열 정리 및 길이 제한 (XSS 방지)
    const sanitizeString = (str: unknown, maxLength = 5000): string => {
      const text = String(str || '').slice(0, maxLength);
      return escapeHtml(text);
    };

    // 배열 정리 (최대 20개 항목, 각 500자 제한)
    const sanitizeArray = (arr: unknown, maxItems = 20, maxLength = 500): string[] => {
      if (!Array.isArray(arr)) return [];
      return arr.slice(0, maxItems).map((item) => sanitizeString(item, maxLength));
    };

    return {
      errorType: sanitizeString(parsed.errorType || 'Unknown', 100),
      rootCause: sanitizeString(parsed.rootCause || '알 수 없음', 2000),
      possibleCauses: sanitizeArray(parsed.possibleCauses, 10, 500),
      suggestions: sanitizeArray(parsed.suggestions, 10, 500),
      // codeExample은 escapeHtml 적용하지 않음 (코드 블록으로 렌더링되므로)
      codeExample: parsed.codeExample ? String(parsed.codeExample).slice(0, 3000) : undefined,
      confidence: ['high', 'medium', 'low'].includes(String(parsed.confidence))
        ? (parsed.confidence as 'high' | 'medium' | 'low')
        : 'medium',
    };
  }
}

// AI 모델 목록 재내보내기 (하위 호환성)
export { AI_MODELS, type AIModel } from '../constants';
