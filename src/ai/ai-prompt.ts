import type { AIAnalysisContext } from '../types';
import { getPromptTranslations } from '../i18n';

/**
 * AI 분석 프롬프트 생성
 */
export function buildAnalysisPrompt(context: AIAnalysisContext): string {
  const { logEntry, stackTrace, networkRequests, codeContext } = context;
  const prompt = getPromptTranslations();

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
      : prompt.noStackTrace;

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
      : prompt.noNetwork;

  const codeContextStr = codeContext
    ? `${prompt.file}: ${codeContext.fileName}:${codeContext.lineNumber}
\`\`\`javascript
${codeContext.sourcePreview.join('\n')}
\`\`\``
    : prompt.noCodeContext;

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
      : prompt.noArgs;

  return `${prompt.systemRole}

## ${prompt.logTarget}
- **${prompt.level}**: ${logEntry.level}
- **${prompt.message}**: ${logEntry.message}
- **${prompt.timestamp}**: ${timestamp}

## ${prompt.additionalArgs}
${argsStr}

## ${prompt.stackTrace}
${stackTraceStr}

## ${prompt.relatedNetwork}
${networkStr}

## ${prompt.codeContext}
${codeContextStr}

## ${prompt.instructions.title}
1. ${prompt.instructions.step1}
2. ${prompt.instructions.step2}
3. ${prompt.instructions.step3}
4. ${prompt.instructions.step4}
5. ${prompt.instructions.step5}

## ${prompt.responseFormat}
\`\`\`json
{
  "errorType": "Error type (e.g., TypeError, NetworkError, SyntaxError, etc.)",
  "rootCause": "Detailed and clear explanation of the root cause",
  "possibleCauses": [
    "Specific cause explanation (without numbers)",
    "Another possible cause explanation"
  ],
  "suggestions": [
    "Specific solution step explanation (without numbers)",
    "Another solution explanation"
  ],
  "codeExample": "Code fix example (only if applicable, otherwise omit)",
  "confidence": "high | medium | low"
}
\`\`\`

**${prompt.responseNote}**

${prompt.languageInstruction}`;
}
