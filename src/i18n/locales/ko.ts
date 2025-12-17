import type { Translations } from '../types';

/**
 * Korean translations
 */
export const ko: Translations = {
  ui: {
    tabs: {
      all: 'All',
      errors: 'Errors',
      warnings: 'Warnings',
      network: 'Network',
    },
    buttons: {
      clear: '모두 삭제',
      settings: '설정',
      close: '닫기',
      back: '목록으로 돌아가기',
      dockMode: 'Dock 모드로 전환',
      floatMode: '플로팅 모드로 전환',
      delete: '삭제',
      details: '상세',
      showMore: '더보기',
      showLess: '접기',
      copy: '복사하기',
      retry: '다시 시도',
      checkSettings: '설정 확인',
      cancel: '취소',
      save: '저장',
    },
    empty: {
      noLogs: 'No logs captured yet',
      noNetwork: 'No failed network requests',
    },
    analysis: {
      analyzing: 'Analyzing...',
      possibleCauses: 'Possible Causes',
      suggestions: 'Suggestions',
      sourceCode: 'Source Code',
      relatedNetwork: 'Related Network Requests',
      stackTrace: 'Stack Trace',
    },
    severity: {
      critical: '심각',
      high: '높음',
      medium: '보통',
      low: '낮음',
    },
  },
  ai: {
    title: 'AI 분석',
    analyzed: 'AI가 문제를 분석했어요',
    copyForDeveloper: '개발자에게 전달할 내용',
    copyHint: '위 내용을 복사해서 개발자에게 전달해주세요. 문제 해결에 도움이 됩니다.',
    detailedAnalysis: '상세 분석',
    possibleCauses: '가능한 원인',
    solutions: '해결 방법',
    codeExample: '수정 코드 예시',
    loading: {
      title: 'AI가 분석 중이에요',
      subtitle: '잠시만 기다려주세요.\n문제의 원인과 해결 방법을 찾고 있어요.',
      step1: '에러 정보 수집',
      step2: '원인 분석 중...',
      step3: '해결 방법 생성',
    },
    error: {
      title: 'AI 분석 실패',
      retry: '다시 시도',
      checkSettings: '설정 확인',
    },
    settings: {
      title: 'AI 분석 설정',
      apiKey: 'Anthropic API Key',
      apiKeyPlaceholder: 'sk-ant-api03-...',
      apiKeyHint: 'API 키는 브라우저 로컬 스토리지에 저장됩니다.',
      apiKeyLink: 'Anthropic Console에서 API 키 발급받기 →',
      currentKey: '현재',
      deleteKey: '삭제',
      model: 'AI 모델',
      modelHint: 'Sonnet은 빠르고 경제적, Opus는 가장 정확한 분석을 제공합니다.',
    },
    report: {
      title: '에러 리포트',
      errorType: '에러 유형',
      errorMessage: '에러 메시지',
      analysisResult: 'AI 분석 결과',
      analysisModel: '분석 모델',
      rootCause: '문제 원인',
      possibleCauses: '가능한 원인',
      solutions: '해결 방법',
      codeExample: '수정 코드 예시',
      stackTrace: '스택 트레이스',
      networkInfo: '네트워크 요청 정보',
      request: '요청',
      url: 'URL',
      status: '상태',
      requestStatus: '요청 상태',
      requestHeaders: '요청 헤더',
      responseHeaders: '응답 헤더',
      requestBody: '요청 바디',
      responseBody: '응답 바디',
      error: '에러',
      unknown: '알 수 없음',
      none: '없음',
    },
  },
  network: {
    general: 'General',
    requestHeaders: 'Request Headers',
    requestBody: 'Request Body',
    responseHeaders: 'Response Headers',
    responseBody: 'Response Body',
    errorDetails: 'Error Details',
    url: 'URL',
    method: 'Method',
    status: 'Status',
    duration: 'Duration',
    time: 'Time',
    name: 'Name',
    message: 'Message',
    timeout: 'Network Timeout',
    connectionError: '서버에 연결할 수 없습니다 (DNS 실패, 서버 다운, CORS 등)',
    errorMessages: {
      timeout: '네트워크 타임아웃',
      networkError: '네트워크 에러',
      unknownError: '알 수 없는 에러',
      connectionFailed: '서버에 연결할 수 없습니다 (DNS 실패, 서버 다운, CORS 등)',
      error: '에러',
    },
  },
  errors: {
    networkConnection: {
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
    },
    httpClient: {
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
    },
    httpServer: {
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
    },
    networkTimeout: {
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
    },
    cors: {
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
    },
    typeError: {
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
    },
    referenceError: {
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
    },
    syntaxError: {
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
    },
    rangeError: {
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
    },
    reactError: {
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
    },
    asyncError: {
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
    },
    authError: {
      possibleCauses: [
        '인증 토큰이 유효하지 않거나 만료되었습니다',
        '로그인이 필요합니다',
        '권한이 없습니다',
      ],
      suggestions: [
        '로그인 상태를 확인하세요',
        '인증 토큰을 갱신하세요',
        '사용자 권한을 확인하세요',
      ],
    },
    authzError: {
      possibleCauses: [
        '해당 리소스에 대한 권한이 없습니다',
        '접근이 금지된 리소스입니다',
      ],
      suggestions: [
        '사용자 권한을 확인하세요',
        '관리자에게 문의하세요',
      ],
    },
    notFoundError: {
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
    },
    serverError: {
      possibleCauses: [
        '서버 내부에서 에러가 발생했습니다',
        '백엔드 로직에 문제가 있습니다',
      ],
      suggestions: [
        '서버 로그를 확인하세요',
        '백엔드 개발자에게 문의하세요',
        '요청 데이터가 올바른지 확인하세요',
      ],
    },
    deprecationWarning: {
      possibleCauses: [
        '더 이상 사용되지 않는 API를 사용하고 있습니다',
        '향후 버전에서 제거될 기능입니다',
      ],
      suggestions: [
        '권장되는 대체 API로 마이그레이션하세요',
        '라이브러리 문서를 확인하세요',
      ],
    },
  },
  prompt: {
    systemRole: '당신은 웹 프론트엔드 에러 분석 전문가입니다. 다음 콘솔 로그를 분석하고 JSON 형식으로 응답해주세요.',
    logTarget: '분석 대상 로그',
    level: '레벨',
    message: '메시지',
    timestamp: '타임스탬프',
    additionalArgs: '추가 인자',
    noArgs: '추가 인자 없음',
    stackTrace: '스택 트레이스',
    noStackTrace: '스택 트레이스 없음',
    relatedNetwork: '관련 네트워크 요청',
    noNetwork: '관련 네트워크 요청 없음',
    codeContext: '코드 컨텍스트',
    noCodeContext: '코드 컨텍스트 없음',
    file: '파일',
    instructions: {
      title: '분석 지침',
      step1: '에러의 근본 원인을 파악하세요.',
      step2: '가능한 모든 원인을 나열하세요.',
      step3: '구체적이고 실행 가능한 해결 방법을 제시하세요.',
      step4: '해당되는 경우 수정 코드 예시를 제공하세요.',
      step5: '분석의 신뢰도를 평가하세요.',
    },
    responseFormat: '응답 형식 (반드시 JSON 형식으로 응답)',
    responseNote: '중요: possibleCauses와 suggestions 배열의 각 항목에 번호(1., 2. 등)를 포함하지 마세요. 번호는 자동으로 추가됩니다.',
    languageInstruction: '한국어로 응답해주세요.',
  },
};
