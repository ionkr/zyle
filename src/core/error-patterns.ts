import type { ErrorPattern } from '../types';

/**
 * 기본 에러 패턴 정의
 * 런타임에 커스텀 패턴을 추가하거나 외부 JSON에서 로드할 수 있습니다.
 */
export const DEFAULT_ERROR_PATTERNS: ErrorPattern[] = [
  // 네트워크 연결 에러 (DNS, 서버 다운 등)
  {
    pattern:
      /\[Network Error\].*서버에 연결할 수 없습니다|Failed to fetch|net::ERR_NAME_NOT_RESOLVED|net::ERR_CONNECTION_REFUSED/i,
    errorType: 'Network Connection Error',
    possibleCauses: [
      'DNS 조회 실패 - 도메인이 존재하지 않거나 잘못되었습니다',
      '서버가 다운되었거나 접근할 수 없습니다',
      '방화벽이나 프록시가 연결을 차단하고 있습니다',
      '네트워크 연결이 끊어졌습니다',
    ],
    suggestions: [
      'URL의 도메인이 올바른지 확인하세요',
      '서버가 실행 중인지 확인하세요',
      '네트워크 연결 상태를 확인하세요',
      '브라우저 개발자 도구의 Network 탭에서 상세 정보를 확인하세요',
    ],
    severity: 'critical',
  },

  // HTTP 4xx 클라이언트 에러
  {
    pattern: /\[HTTP 4\d{2}\]/i,
    errorType: 'HTTP Client Error',
    possibleCauses: [
      '인증 토큰이 만료되었거나 없습니다 (401)',
      '권한이 없는 리소스에 접근했습니다 (403)',
      '요청한 리소스를 찾을 수 없습니다 (404)',
      '요청 데이터 형식이 잘못되었습니다 (400)',
    ],
    suggestions: [
      '인증 상태를 확인하고 필요시 재로그인하세요',
      'API 엔드포인트 URL이 올바른지 확인하세요',
      '요청 파라미터와 바디 형식을 확인하세요',
      'API 문서를 참고하여 필수 헤더가 포함되었는지 확인하세요',
    ],
    severity: 'high',
  },

  // HTTP 5xx 서버 에러
  {
    pattern: /\[HTTP 5\d{2}\]/i,
    errorType: 'HTTP Server Error',
    possibleCauses: [
      '서버 내부 오류가 발생했습니다 (500)',
      '서버가 과부하 상태입니다 (503)',
      '게이트웨이 타임아웃이 발생했습니다 (504)',
      '서버 설정 문제가 있습니다',
    ],
    suggestions: [
      '잠시 후 다시 시도해보세요',
      '서버 로그를 확인하세요',
      '백엔드 팀에 문의하세요',
      '요청 데이터가 서버에서 처리 가능한 형식인지 확인하세요',
    ],
    severity: 'critical',
  },

  // 네트워크 타임아웃
  {
    pattern: /\[Network Timeout\]|timeout|ETIMEDOUT|net::ERR_TIMED_OUT/i,
    errorType: 'Network Timeout',
    possibleCauses: [
      '서버 응답이 너무 느립니다',
      '네트워크 연결이 불안정합니다',
      '요청 데이터가 너무 큽니다',
      '서버가 과부하 상태입니다',
    ],
    suggestions: [
      '타임아웃 시간을 늘려보세요',
      '요청 데이터 크기를 줄여보세요',
      '네트워크 연결 상태를 확인하세요',
      '서버 상태를 모니터링하세요',
    ],
    severity: 'high',
  },

  // CORS 에러
  {
    pattern: /CORS|Cross-Origin|Access-Control-Allow/i,
    errorType: 'CORS Error',
    possibleCauses: [
      '서버에서 CORS 헤더가 설정되지 않았습니다',
      '허용되지 않은 Origin에서 요청했습니다',
      '허용되지 않은 HTTP 메서드를 사용했습니다',
      '커스텀 헤더가 CORS 정책에 의해 차단되었습니다',
    ],
    suggestions: [
      '서버의 CORS 설정을 확인하세요',
      'Access-Control-Allow-Origin 헤더가 올바르게 설정되어 있는지 확인하세요',
      '프록시 서버를 통해 요청하는 것을 고려하세요',
      '개발 환경에서는 CORS 확장 프로그램을 사용해보세요',
    ],
    severity: 'high',
  },

  // 타입 에러
  {
    pattern: /TypeError|Cannot read propert(y|ies) of (undefined|null)|is not a function|is not defined/i,
    errorType: 'Type Error',
    possibleCauses: [
      'null 또는 undefined 값에 접근을 시도했습니다',
      '존재하지 않는 함수를 호출하려 했습니다',
      '변수가 선언되지 않았습니다',
      '비동기 데이터가 아직 로드되지 않았습니다',
    ],
    suggestions: [
      '옵셔널 체이닝(?.)을 사용하여 안전하게 접근하세요',
      '변수가 올바르게 선언되고 초기화되었는지 확인하세요',
      'API 응답 데이터 구조를 확인하세요',
      '비동기 데이터 로딩 상태를 처리하세요',
    ],
    severity: 'high',
  },

  // 참조 에러
  {
    pattern: /ReferenceError|is not defined/i,
    errorType: 'Reference Error',
    possibleCauses: [
      '선언되지 않은 변수를 참조했습니다',
      '스코프 밖의 변수에 접근하려 했습니다',
      '모듈이 올바르게 import되지 않았습니다',
    ],
    suggestions: [
      '변수명에 오타가 없는지 확인하세요',
      '변수가 사용 전에 선언되었는지 확인하세요',
      '필요한 모듈이 import되었는지 확인하세요',
    ],
    severity: 'high',
  },

  // 구문 에러
  {
    pattern: /SyntaxError|Unexpected token|JSON\.parse/i,
    errorType: 'Syntax Error',
    possibleCauses: [
      'JSON 형식이 올바르지 않습니다',
      'JavaScript 구문에 오류가 있습니다',
      'API 응답이 예상과 다른 형식입니다',
    ],
    suggestions: [
      'JSON 데이터 형식을 확인하세요',
      'API 응답 내용을 확인하세요',
      '코드 구문을 검토하세요',
    ],
    severity: 'high',
  },

  // 범위 에러
  {
    pattern: /RangeError|Maximum call stack|Invalid array length/i,
    errorType: 'Range Error',
    possibleCauses: [
      '무한 재귀가 발생했습니다',
      '배열 크기가 허용 범위를 초과했습니다',
      '함수 인자 값이 허용 범위를 벗어났습니다',
    ],
    suggestions: [
      '재귀 함수에 종료 조건이 있는지 확인하세요',
      '무한 루프가 발생하지 않는지 확인하세요',
      '데이터 크기를 제한하세요',
    ],
    severity: 'critical',
  },

  // React 관련 에러
  {
    pattern: /React|useState|useEffect|hook|render|component/i,
    errorType: 'React Error',
    possibleCauses: [
      'Hook 사용 규칙을 위반했습니다',
      '컴포넌트 렌더링 중 에러가 발생했습니다',
      '잘못된 prop 타입이 전달되었습니다',
    ],
    suggestions: [
      'Hook은 컴포넌트 최상위에서만 호출하세요',
      'useEffect의 의존성 배열을 확인하세요',
      'prop 타입을 검증하세요',
    ],
    severity: 'medium',
  },

  // Promise/비동기 에러
  {
    pattern: /Unhandled Promise|async|await|Promise/i,
    errorType: 'Async Error',
    possibleCauses: [
      'Promise가 reject되었지만 처리되지 않았습니다',
      'async 함수에서 예외가 발생했습니다',
      '비동기 작업 중 에러가 발생했습니다',
    ],
    suggestions: [
      'try-catch로 비동기 에러를 처리하세요',
      '.catch()를 사용하여 Promise 에러를 처리하세요',
      '에러 경계(Error Boundary)를 구현하세요',
    ],
    severity: 'medium',
  },

  // HTTP 401 인증 에러
  {
    pattern: /401|Unauthorized/i,
    errorType: 'Authentication Error',
    possibleCauses: [
      '인증 토큰이 유효하지 않거나 만료되었습니다',
      '로그인이 필요합니다',
      '권한이 없습니다',
    ],
    suggestions: ['로그인 상태를 확인하세요', '인증 토큰을 갱신하세요', '사용자 권한을 확인하세요'],
    severity: 'medium',
  },

  // HTTP 403 권한 에러
  {
    pattern: /403|Forbidden/i,
    errorType: 'Authorization Error',
    possibleCauses: ['해당 리소스에 대한 권한이 없습니다', '접근이 금지된 리소스입니다'],
    suggestions: ['사용자 권한을 확인하세요', '관리자에게 문의하세요'],
    severity: 'medium',
  },

  // HTTP 404 에러
  {
    pattern: /404|Not Found/i,
    errorType: 'Not Found Error',
    possibleCauses: [
      '요청한 리소스를 찾을 수 없습니다',
      'API 엔드포인트가 존재하지 않습니다',
      'URL이 잘못되었습니다',
    ],
    suggestions: [
      'URL이 올바른지 확인하세요',
      'API 엔드포인트가 존재하는지 확인하세요',
      '라우팅 설정을 확인하세요',
    ],
    severity: 'medium',
  },

  // HTTP 500 서버 에러
  {
    pattern: /500|Internal Server Error/i,
    errorType: 'Server Error',
    possibleCauses: ['서버 내부에서 에러가 발생했습니다', '백엔드 로직에 문제가 있습니다'],
    suggestions: [
      '서버 로그를 확인하세요',
      '백엔드 개발자에게 문의하세요',
      '요청 데이터가 올바른지 확인하세요',
    ],
    severity: 'high',
  },

  // 일반 경고
  {
    pattern: /deprecated|warning|warn/i,
    errorType: 'Deprecation Warning',
    possibleCauses: [
      '더 이상 사용되지 않는 API를 사용하고 있습니다',
      '향후 버전에서 제거될 기능입니다',
    ],
    suggestions: ['권장되는 대체 API로 마이그레이션하세요', '라이브러리 문서를 확인하세요'],
    severity: 'low',
  },
];

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
