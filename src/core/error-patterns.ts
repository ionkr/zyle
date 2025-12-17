import type { ErrorPattern } from '../types';
import { getErrorTranslations } from '../i18n';

/**
 * 에러 패턴 키 타입
 */
export type ErrorPatternKey =
  | 'networkConnection'
  | 'httpClient'
  | 'httpServer'
  | 'networkTimeout'
  | 'cors'
  | 'typeError'
  | 'referenceError'
  | 'syntaxError'
  | 'rangeError'
  | 'reactError'
  | 'asyncError'
  | 'authError'
  | 'authzError'
  | 'notFoundError'
  | 'serverError'
  | 'deprecationWarning';

/**
 * 에러 패턴 정의 (정적 데이터)
 */
interface ErrorPatternDefinition {
  pattern: RegExp;
  errorType: string;
  translationKey: ErrorPatternKey;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * 에러 패턴 정의 (번역 없이)
 */
const ERROR_PATTERN_DEFINITIONS: ErrorPatternDefinition[] = [
  {
    pattern: /\[Network Error\].*서버에 연결할 수 없습니다|Failed to fetch|net::ERR_NAME_NOT_RESOLVED|net::ERR_CONNECTION_REFUSED|Cannot connect to server/i,
    errorType: 'Network Connection Error',
    translationKey: 'networkConnection',
    severity: 'critical',
  },
  {
    pattern: /\[HTTP 4\d{2}\]/i,
    errorType: 'HTTP Client Error',
    translationKey: 'httpClient',
    severity: 'high',
  },
  {
    pattern: /\[HTTP 5\d{2}\]/i,
    errorType: 'HTTP Server Error',
    translationKey: 'httpServer',
    severity: 'critical',
  },
  {
    pattern: /\[Network Timeout\]|timeout|ETIMEDOUT|net::ERR_TIMED_OUT/i,
    errorType: 'Network Timeout',
    translationKey: 'networkTimeout',
    severity: 'high',
  },
  {
    pattern: /CORS|Cross-Origin|Access-Control-Allow/i,
    errorType: 'CORS Error',
    translationKey: 'cors',
    severity: 'high',
  },
  {
    pattern: /TypeError|Cannot read propert(y|ies) of (undefined|null)|is not a function|is not defined/i,
    errorType: 'Type Error',
    translationKey: 'typeError',
    severity: 'high',
  },
  {
    pattern: /ReferenceError|is not defined/i,
    errorType: 'Reference Error',
    translationKey: 'referenceError',
    severity: 'high',
  },
  {
    pattern: /SyntaxError|Unexpected token|JSON\.parse/i,
    errorType: 'Syntax Error',
    translationKey: 'syntaxError',
    severity: 'high',
  },
  {
    pattern: /RangeError|Maximum call stack|Invalid array length/i,
    errorType: 'Range Error',
    translationKey: 'rangeError',
    severity: 'critical',
  },
  {
    pattern: /React|useState|useEffect|hook|render|component/i,
    errorType: 'React Error',
    translationKey: 'reactError',
    severity: 'medium',
  },
  {
    pattern: /Unhandled Promise|async|await|Promise/i,
    errorType: 'Async Error',
    translationKey: 'asyncError',
    severity: 'medium',
  },
  {
    pattern: /401|Unauthorized/i,
    errorType: 'Authentication Error',
    translationKey: 'authError',
    severity: 'medium',
  },
  {
    pattern: /403|Forbidden/i,
    errorType: 'Authorization Error',
    translationKey: 'authzError',
    severity: 'medium',
  },
  {
    pattern: /404|Not Found/i,
    errorType: 'Not Found Error',
    translationKey: 'notFoundError',
    severity: 'medium',
  },
  {
    pattern: /500|Internal Server Error/i,
    errorType: 'Server Error',
    translationKey: 'serverError',
    severity: 'high',
  },
  {
    pattern: /deprecated|warning|warn/i,
    errorType: 'Deprecation Warning',
    translationKey: 'deprecationWarning',
    severity: 'low',
  },
];

/**
 * 현재 로케일에 맞는 에러 패턴 가져오기
 */
export function getDefaultErrorPatterns(): ErrorPattern[] {
  const translations = getErrorTranslations();

  return ERROR_PATTERN_DEFINITIONS.map((def) => {
    const translation = translations[def.translationKey];
    return {
      pattern: def.pattern,
      errorType: def.errorType,
      possibleCauses: translation?.possibleCauses || [],
      suggestions: translation?.suggestions || [],
      severity: def.severity,
    };
  });
}

/**
 * 에러 패턴을 직렬화 가능한 형태로 변환
 * (외부 JSON 저장/로드용)
 */
export interface SerializableErrorPattern {
  patternSource: string;
  patternFlags: string;
  errorType: string;
  possibleCauses: string[];
  suggestions: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * ErrorPattern을 직렬화 가능한 형태로 변환
 */
export function serializePattern(pattern: ErrorPattern): SerializableErrorPattern {
  return {
    patternSource: pattern.pattern.source,
    patternFlags: pattern.pattern.flags,
    errorType: pattern.errorType,
    possibleCauses: pattern.possibleCauses,
    suggestions: pattern.suggestions,
    severity: pattern.severity,
  };
}

/**
 * 직렬화된 패턴을 ErrorPattern으로 변환
 */
export function deserializePattern(serialized: SerializableErrorPattern): ErrorPattern {
  return {
    pattern: new RegExp(serialized.patternSource, serialized.patternFlags),
    errorType: serialized.errorType,
    possibleCauses: serialized.possibleCauses,
    suggestions: serialized.suggestions,
    severity: serialized.severity,
  };
}

/**
 * 여러 패턴을 JSON 문자열로 내보내기
 */
export function exportPatternsToJSON(patterns: ErrorPattern[]): string {
  return JSON.stringify(patterns.map(serializePattern), null, 2);
}

/**
 * JSON 문자열에서 패턴 가져오기
 */
export function importPatternsFromJSON(json: string): ErrorPattern[] {
  const serialized: SerializableErrorPattern[] = JSON.parse(json);
  return serialized.map(deserializePattern);
}
