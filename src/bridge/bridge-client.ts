/**
 * Zyle Bridge Client
 *
 * @absmartly/claude-code-bridge 서버와 통신하여 Claude CLI로 AI 분석을 수행하는 클라이언트
 * - Messages API + SSE Stream을 통한 요청/응답
 * - Conversation 기능으로 추가 질문 지원
 */

import type { AIAnalysisContext, AIAnalysisResult } from '../types';
import { buildAnalysisPrompt } from '../ai/ai-prompt';

const DEFAULT_PORT = 19960;
const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_TIMEOUT = 120000; // 120초

/**
 * 대화 메시지
 */
export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

/**
 * 대화 상태
 */
export interface ConversationState {
  id: string;
  logId: string;
  messages: ConversationMessage[];
}

/**
 * Bridge 상태 정보
 */
export interface BridgeStatus {
  available: boolean;
  version?: string;
  authenticated?: boolean;
  error?: string;
}

/**
 * Health 엔드포인트 응답 타입
 */
interface HealthResponse {
  ok?: boolean;
  status?: string;
  authenticated?: boolean;
  version?: string;
  error?: string;
}

/**
 * SSE 이벤트 데이터 타입
 */
interface SSEEventData {
  type?: string;
  data?: string;
  text?: string;
  content?: string;
  error?: string;
}

/**
 * Bridge Client 옵션
 */
export interface BridgeClientOptions {
  /** Bridge 서버 포트 (기본: 19960) */
  port?: number;
  /** Bridge 서버 호스트 (기본: 127.0.0.1) */
  host?: string;
  /** 요청 타임아웃 (기본: 120초) */
  timeout?: number;
}

/**
 * Zyle Bridge Client
 *
 * @absmartly/claude-code-bridge 서버와 통신하여 Claude CLI로 분석 요청을 보내는 클라이언트
 */
export class ZyleBridgeClient {
  private options: Required<BridgeClientOptions>;
  private baseUrl: string;
  private currentConversation: ConversationState | null = null;
  private activeEventSource: EventSource | null = null;

  constructor(options: BridgeClientOptions = {}) {
    this.options = {
      port: options.port ?? DEFAULT_PORT,
      host: options.host ?? DEFAULT_HOST,
      timeout: options.timeout ?? DEFAULT_TIMEOUT,
    };
    this.baseUrl = `http://${this.options.host}:${this.options.port}`;
  }

  /**
   * 포트 설정 업데이트
   */
  setPort(port: number): void {
    this.options.port = port;
    this.baseUrl = `http://${this.options.host}:${port}`;
  }

  /**
   * 현재 포트 가져오기
   */
  getPort(): number {
    return this.options.port;
  }

  // ============================================
  // 상태 확인
  // ============================================

  /**
   * 서버 실행 여부 확인
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await this.fetchJson<HealthResponse>('/health');
      return response.ok === true || response.status === 'ok';
    } catch {
      return false;
    }
  }

  /**
   * 상세 상태 확인 (서버 + Claude CLI 인증)
   */
  async getStatus(): Promise<BridgeStatus> {
    try {
      const healthResponse = await this.fetchJson<HealthResponse>('/health');

      const isOk = healthResponse.ok === true || healthResponse.status === 'ok';
      if (!isOk) {
        return {
          available: false,
          error: 'Server not healthy',
        };
      }

      if ('authenticated' in healthResponse) {
        return {
          available: true,
          authenticated: healthResponse.authenticated,
        };
      }

      const authStatus = await this.getAuthStatus();
      return {
        available: true,
        authenticated: authStatus.authenticated,
        error: authStatus.error,
      };
    } catch (error) {
      return {
        available: false,
        error:
          error instanceof Error ? error.message : 'Bridge server not running',
      };
    }
  }

  /**
   * Claude CLI 인증 상태 확인
   */
  async getAuthStatus(): Promise<{ authenticated: boolean; error?: string }> {
    try {
      try {
        const healthResponse = await this.fetchJson<HealthResponse>('/health');
        if ('authenticated' in healthResponse) {
          return {
            authenticated: healthResponse.authenticated === true,
          };
        }
      } catch {
        // /health 실패 시 /auth/status 시도
      }

      const response = await this.fetchJson<{
        authenticated: boolean;
        error?: string;
      }>('/auth/status');

      return {
        authenticated: response.authenticated,
        error: response.error,
      };
    } catch (error) {
      return {
        authenticated: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to check auth status',
      };
    }
  }

  // ============================================
  // 대화 관리
  // ============================================

  /**
   * 새 대화 시작
   */
  async startConversation(logId: string): Promise<string> {
    const response = await this.fetchJson<{
      id?: string;
      session_id?: string;
      conversationId?: string;
    }>('/conversations', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const conversationId =
      response.id || response.session_id || response.conversationId;
    if (!conversationId) {
      throw new Error('Server did not return conversation ID');
    }

    this.currentConversation = {
      id: conversationId,
      logId,
      messages: [],
    };

    return conversationId;
  }

  /**
   * 현재 대화 가져오기
   */
  getConversation(): ConversationState | null {
    return this.currentConversation;
  }

  /**
   * 대화 초기화
   */
  resetConversation(): void {
    this.disconnectStream();
    this.currentConversation = null;
  }

  // ============================================
  // 메시지 전송 (Messages API + SSE Stream)
  // ============================================

  /**
   * 메시지 전송 및 응답 받기
   *
   * 1. POST /conversations/:id/messages 로 메시지 전송
   * 2. GET /conversations/:id/stream 으로 SSE 연결하여 응답 수신
   * 3. 완료 이벤트 수신 시 Promise resolve
   */
  async sendMessage(content: string): Promise<string> {
    if (!this.currentConversation) {
      throw new Error('No active conversation. Call startConversation first.');
    }

    const conversationId = this.currentConversation.id;

    // 사용자 메시지 추가
    this.currentConversation.messages.push({
      role: 'user',
      content,
      timestamp: Date.now(),
    });

    // 1. 메시지 전송 (응답은 success만 옴)
    await this.fetchJson<{ success: boolean }>(
      `/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        body: JSON.stringify({ content }),
      }
    );

    // 2. SSE 스트림 연결하여 응답 대기
    const responseText = await this.waitForStreamResponse(conversationId);

    // 3. 어시스턴트 메시지 추가
    this.currentConversation.messages.push({
      role: 'assistant',
      content: responseText,
      timestamp: Date.now(),
    });

    return responseText;
  }

  /**
   * SSE 스트림에서 응답 대기
   */
  private waitForStreamResponse(conversationId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const streamUrl = `${this.baseUrl}/conversations/${conversationId}/stream`;
      let accumulatedText = '';
      let timeoutId: ReturnType<typeof setTimeout>;

      // 기존 스트림 정리
      this.disconnectStream();

      // 타임아웃 설정
      timeoutId = setTimeout(() => {
        this.disconnectStream();
        if (accumulatedText) {
          resolve(accumulatedText);
        } else {
          reject(new Error('Stream response timeout'));
        }
      }, this.options.timeout);

      try {
        const eventSource = new EventSource(streamUrl);
        this.activeEventSource = eventSource;

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as SSEEventData;

            // 텍스트 이벤트 (다양한 형식 지원)
            if (
              data.type === 'text' ||
              data.type === 'content' ||
              data.type === 'assistant_message'
            ) {
              const text = data.data || data.text || data.content || '';
              accumulatedText += text;
            }

            // 완료 이벤트
            if (
              data.type === 'done' ||
              data.type === 'end' ||
              data.type === 'complete'
            ) {
              clearTimeout(timeoutId);
              this.disconnectStream();
              resolve(accumulatedText);
            }

            // 에러 이벤트
            if (data.type === 'error') {
              clearTimeout(timeoutId);
              this.disconnectStream();
              reject(new Error(data.error || 'Stream error'));
            }
          } catch {
            // JSON 파싱 실패 시 raw 텍스트로 처리
            accumulatedText += event.data;
          }
        };

        eventSource.onerror = () => {
          clearTimeout(timeoutId);
          this.disconnectStream();

          // 에러 발생 시에도 축적된 텍스트가 있으면 성공으로 처리
          if (accumulatedText) {
            resolve(accumulatedText);
          } else {
            reject(new Error('Stream connection failed'));
          }
        };
      } catch (error) {
        clearTimeout(timeoutId);
        reject(
          error instanceof Error ? error : new Error('Failed to connect stream')
        );
      }
    });
  }

  /**
   * 스트림 연결 해제
   */
  private disconnectStream(): void {
    if (this.activeEventSource) {
      this.activeEventSource.close();
      this.activeEventSource = null;
    }
  }

  /**
   * AI 분석 요청
   */
  async analyze(context: AIAnalysisContext): Promise<AIAnalysisResult> {
    // 서버 확인
    const available = await this.isAvailable();
    if (!available) {
      throw new Error(
        'Bridge server is not running. Please start the server first.'
      );
    }

    // 인증 확인
    const authStatus = await this.getAuthStatus();
    if (!authStatus.authenticated) {
      throw new Error(
        'Claude CLI is not authenticated. Please run "claude login" first.'
      );
    }

    // 대화가 없으면 시작
    if (!this.currentConversation) {
      await this.startConversation(context.logEntry.id);
    }

    // 프롬프트 생성 및 전송
    const prompt = buildAnalysisPrompt(context);
    const responseText = await this.sendMessage(prompt);

    return this.parseResponse(responseText);
  }

  /**
   * 추가 질문
   */
  async askFollowUp(question: string): Promise<string> {
    if (!this.currentConversation) {
      throw new Error('No active conversation. Analyze a log first.');
    }

    return this.sendMessage(question);
  }

  // ============================================
  // 내부 헬퍼
  // ============================================

  /**
   * HTTP JSON 요청 헬퍼
   */
  private async fetchJson<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.options.timeout
    );

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          (errorData as { error?: string }).error || `HTTP ${response.status}`
        );
      }

      return (await response.json()) as T;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Claude CLI 응답 파싱
   */
  private parseResponse(text: string): AIAnalysisResult {
    // JSON 블록 추출
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]) as Record<string, unknown>;
        return this.validateResult(parsed);
      } catch {
        // JSON 파싱 실패 시 계속 진행
      }
    }

    // JSON 블록이 없으면 전체 텍스트에서 JSON 추출 시도
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      try {
        const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1)) as Record<
          string,
          unknown
        >;
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
      modelId: 'claude-cli',
    };
  }

  /**
   * 파싱된 결과 유효성 검증
   */
  private validateResult(parsed: Record<string, unknown>): AIAnalysisResult {
    const sanitizeString = (str: unknown, maxLength = 5000): string => {
      return String(str || '').slice(0, maxLength);
    };

    const sanitizeArray = (
      arr: unknown,
      maxItems = 20,
      maxLength = 500
    ): string[] => {
      if (!Array.isArray(arr)) return [];
      return arr
        .slice(0, maxItems)
        .map((item) => sanitizeString(item, maxLength));
    };

    return {
      errorType: sanitizeString(parsed.errorType || 'Unknown', 100),
      rootCause: sanitizeString(parsed.rootCause || '알 수 없음', 2000),
      possibleCauses: sanitizeArray(parsed.possibleCauses, 10, 500),
      suggestions: sanitizeArray(parsed.suggestions, 10, 500),
      codeExample: parsed.codeExample
        ? String(parsed.codeExample).slice(0, 3000)
        : undefined,
      confidence: ['high', 'medium', 'low'].includes(String(parsed.confidence))
        ? (parsed.confidence as 'high' | 'medium' | 'low')
        : 'medium',
      modelId: 'claude-cli',
    };
  }

  /**
   * 리소스 정리
   */
  destroy(): void {
    this.disconnectStream();
    this.currentConversation = null;
  }
}

/**
 * 싱글톤 인스턴스
 */
let bridgeClientInstance: ZyleBridgeClient | null = null;

/**
 * Bridge Client 싱글톤 가져오기
 */
export function getBridgeClient(
  options?: BridgeClientOptions
): ZyleBridgeClient {
  if (!bridgeClientInstance) {
    bridgeClientInstance = new ZyleBridgeClient(options);
  }
  return bridgeClientInstance;
}

/**
 * Bridge Client 인스턴스 정리
 */
export function destroyBridgeClient(): void {
  if (bridgeClientInstance) {
    bridgeClientInstance.destroy();
    bridgeClientInstance = null;
  }
}
