import type { AIAnalysisContext } from '../types';

/**
 * AI 분석 프롬프트 생성
 */
export function buildAnalysisPrompt(context: AIAnalysisContext): string {
  const { logEntry, stackTrace, networkRequests, codeContext } = context;

  const timestamp = new Date(logEntry.timestamp).toISOString();

  const stackTraceStr =
    stackTrace.length > 0
      ? stackTrace
          .map((frame) => {
            const location = frame.original
              ? `${frame.original.fileName}:${frame.original.lineNumber}:${frame.original.columnNumber}`
              : `${frame.fileName}:${frame.lineNumber}:${frame.columnNumber}`;
            return `at ${frame.functionName || '<anonymous>'} (${location})`;
          })
          .join('\n')
      : '스택 트레이스 없음';

  const networkStr =
    networkRequests.length > 0
      ? networkRequests
          .map((req) => {
            const status = req.status ?? 'pending';
            const duration =
              req.endTime && req.startTime
                ? `${req.endTime - req.startTime}ms`
                : '-';
            return `${req.method} ${req.url} → ${status} (${req.requestStatus}, ${duration})`;
          })
          .join('\n')
      : '관련 네트워크 요청 없음';

  const codeContextStr = codeContext
    ? `파일: ${codeContext.fileName}:${codeContext.lineNumber}
\`\`\`javascript
${codeContext.sourcePreview.join('\n')}
\`\`\``
    : '코드 컨텍스트 없음';

  const argsStr =
    logEntry.args.length > 0
      ? logEntry.args
          .map((arg) => {
            try {
              return JSON.stringify(arg, null, 2);
            } catch {
              return String(arg);
            }
          })
          .join('\n')
      : '추가 인자 없음';

  return `당신은 웹 프론트엔드 에러 분석 전문가입니다. 다음 콘솔 로그를 분석하고 JSON 형식으로 응답해주세요.

## 분석 대상 로그
- **레벨**: ${logEntry.level}
- **메시지**: ${logEntry.message}
- **타임스탬프**: ${timestamp}

## 추가 인자
${argsStr}

## 스택 트레이스
${stackTraceStr}

## 관련 네트워크 요청
${networkStr}

## 코드 컨텍스트
${codeContextStr}

## 분석 지침
1. 에러의 근본 원인을 파악하세요.
2. 가능한 모든 원인을 나열하세요.
3. 구체적이고 실행 가능한 해결 방법을 제시하세요.
4. 해당되는 경우 수정 코드 예시를 제공하세요.
5. 분석의 신뢰도를 평가하세요.

## 응답 형식 (반드시 JSON 형식으로 응답)
\`\`\`json
{
  "errorType": "에러 유형 (예: TypeError, NetworkError, SyntaxError 등)",
  "rootCause": "근본 원인에 대한 상세하고 명확한 설명",
  "possibleCauses": [
    "구체적인 원인 설명 (번호 없이)",
    "다른 가능한 원인 설명"
  ],
  "suggestions": [
    "구체적인 해결 단계 설명 (번호 없이)",
    "다른 해결 방법 설명"
  ],
  "codeExample": "수정 코드 예시 (해당되는 경우에만, 없으면 생략)",
  "confidence": "high | medium | low"
}
\`\`\`

**중요**: possibleCauses와 suggestions 배열의 각 항목에 번호(1., 2. 등)를 포함하지 마세요. 번호는 자동으로 추가됩니다.

한국어로 응답해주세요.`;
}
