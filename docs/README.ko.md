# Zyle Console Analyzer

[English](../README.md)

웹 프론트엔드에 임베딩되어 콘솔 로그를 수집하고, 소스맵 및 네트워크 요청과 연결하여 AI 기반 분석 결과를 표시하는 외부 의존성 없는 라이브러리입니다.

## 주요 기능

- **콘솔 로그 캡처**: `console.log`, `console.error`, `console.warn`, `console.info` 인터셉트
- **전역 에러 감지**: 전역 에러 및 처리되지 않은 Promise rejection 캡처
- **네트워크 요청 모니터링**: `fetch` 및 `XMLHttpRequest` 요청 추적
- **소스맵 지원**: 번들된 코드를 원본 소스 위치로 매핑
- **에러 분석 및 원인 추론**: 에러 패턴 매칭 및 해결 방안 제시
- **AI 기반 분석**: Claude AI 통합으로 상세한 에러 분석 제공
- **드래그 가능한 플로팅 버튼**: 우측 하단에 기본 위치, 드래그로 이동 가능
- **다크모드 지원**: 시스템 설정에 따른 자동 테마 전환
- **다국어 지원(i18n)**: 영어/한국어 지원 및 브라우저 언어 자동 감지

## 설치

```bash
npm install zyle
# 또는
pnpm add zyle
# 또는
yarn add zyle
```

## 사용법

### 기본 사용

```typescript
import Zyle from 'zyle';

// 기본 옵션으로 초기화 (자동 시작)
const zyle = new Zyle();
```

### 옵션 설정

```typescript
const zyle = new Zyle({
  position: 'bottom-right',    // 플로팅 버튼 초기 위치
  draggable: true,             // 드래그 가능 여부
  captureConsole: true,        // 콘솔 로그 캡처
  captureNetwork: true,        // 네트워크 요청 캡처
  sourceMapSupport: true,      // 소스맵 지원
  autoInit: true,              // 자동 초기화
  maxLogs: 100,                // 최대 로그 저장 개수
  maxNetworkRequests: 50,      // 최대 네트워크 요청 저장 개수
  theme: 'auto',               // 'light' | 'dark' | 'auto'
  zIndex: 999999,              // z-index
  locale: 'auto',              // 'en' | 'ko' | 'auto' (브라우저 감지)
  displayMode: 'floating',     // 'floating' | 'docked'
});
```

### 다국어 지원 (i18n)

Zyle은 브라우저 언어 자동 감지와 함께 다국어를 지원합니다:

```typescript
// 브라우저 언어 자동 감지 (기본값)
const zyle = new Zyle();

// 특정 언어로 초기화
const zyle = new Zyle({ locale: 'ko' });

// 런타임에 언어 변경
zyle.setLocale('en');

// 현재 언어 가져오기
const currentLocale = zyle.getLocale(); // 'ko' | 'en'
```

**지원 언어:**
- 영어 (`en`) - 폴백 언어
- 한국어 (`ko`)

### 이벤트 리스닝

```typescript
// 로그 캡처 이벤트
zyle.on('log:captured', (entry) => {
  console.log('새 로그:', entry);
});

// 네트워크 요청 시작
zyle.on('network:start', (request) => {
  console.log('요청 시작:', request.url);
});

// 네트워크 요청 완료
zyle.on('network:end', (request) => {
  console.log('요청 완료:', request.status);
});

// 분석 완료
zyle.on('analysis:complete', (result) => {
  console.log('분석 결과:', result);
});

// 패널 열기/닫기
zyle.on('panel:open', () => console.log('패널 열림'));
zyle.on('panel:close', () => console.log('패널 닫힘'));

// 표시 모드 변경
zyle.on('mode:change', (mode) => console.log('모드 변경:', mode));
```

### 수동 분석

```typescript
// 모든 에러 분석
const errorResults = await zyle.analyzeErrors();

// 모든 로그 분석
const allResults = await zyle.analyzeAll();

// 단일 로그 분석
const logs = zyle.getLogs();
const result = await zyle.analyze(logs[0]);
```

### 커스텀 에러 패턴 추가

```typescript
zyle.addErrorPattern({
  pattern: /MyCustomError/i,
  errorType: 'Custom Error',
  possibleCauses: [
    '커스텀 에러가 발생했습니다',
  ],
  suggestions: [
    '커스텀 에러 처리를 확인하세요',
  ],
  severity: 'high',
});

// 에러 패턴 제거
zyle.removeErrorPattern('Custom Error');
```

### 유틸리티 메서드

```typescript
// 로그 가져오기
const allLogs = zyle.getLogs();
const errors = zyle.getErrors();
const warnings = zyle.getWarnings();

// 네트워크 요청 가져오기
const requests = zyle.getNetworkRequests();
const failedRequests = zyle.getFailedNetworkRequests();

// 통계 가져오기
const stats = zyle.getStats();

// 초기화
zyle.clear();

// 테마 변경
zyle.setTheme('dark');

// 패널 제어
zyle.openPanel();
zyle.closePanel();

// 표시 모드 제어
zyle.setDisplayMode('docked');
zyle.toggleDisplayMode();
const mode = zyle.getDisplayMode();

// 종료
zyle.destroy();
```

## UMD 빌드 사용

```html
<script src="zyle.umd.js"></script>
<script>
  const zyle = new Zyle({
    position: 'bottom-right',
    theme: 'auto',
  });
</script>
```

## 분석 결과 구조

```typescript
interface AnalysisResult {
  logEntry: LogEntry;           // 원본 로그 엔트리
  errorType?: string;           // 에러 타입
  possibleCauses: string[];     // 가능한 원인 목록
  suggestions: string[];        // 해결 방안 목록
  relatedNetworkRequests: NetworkRequest[];  // 관련 네트워크 요청
  severity: 'low' | 'medium' | 'high' | 'critical';  // 심각도
  codeContext?: {               // 코드 컨텍스트
    fileName: string;
    lineNumber: number;
    columnNumber: number;
    sourcePreview: string[];    // 소스 코드 미리보기
  };
}
```

## 지원되는 에러 패턴

- **Network Error**: 네트워크 연결 오류, CORS 오류
- **Type Error**: null/undefined 접근, 함수 호출 오류
- **Reference Error**: 선언되지 않은 변수 참조
- **Syntax Error**: JSON 파싱 오류, 구문 오류
- **Range Error**: 무한 재귀, 배열 범위 초과
- **React Error**: Hook 규칙 위반, 컴포넌트 렌더링 오류
- **Async Error**: Promise rejection, async 함수 오류
- **HTTP Errors**: 401, 403, 404, 500 등

## 프로젝트 구조

```
src/
├── index.ts              # 메인 진입점
├── types/                # TypeScript 타입 정의
├── constants.ts          # 설정 상수
├── core/                 # 코어 모듈
│   ├── console-interceptor.ts
│   ├── network-interceptor.ts
│   ├── sourcemap-resolver.ts
│   ├── log-analyzer.ts
│   ├── error-patterns.ts
│   └── network/          # 네트워크 인터셉터 모듈
├── ui/                   # UI 컴포넌트
│   ├── floating-button.ts
│   ├── analysis-panel.ts
│   ├── ai-settings-modal.ts
│   ├── panel/            # 패널 모듈
│   ├── renderers/        # 컨텐츠 렌더러
│   └── styles/           # CSS-in-JS 스타일
├── ai/                   # AI 통합
│   ├── ai-client.ts
│   └── ai-prompt.ts
├── i18n/                 # 다국어 지원
│   ├── types.ts
│   ├── i18n-service.ts
│   ├── index.ts
│   └── locales/
│       ├── en.ts         # 영어 번역
│       └── ko.ts         # 한국어 번역
├── icons/                # SVG 아이콘
└── utils/                # 유틸리티 함수
```

## 개발

```bash
# 의존성 설치
pnpm install

# 개발 서버 실행
pnpm dev

# 빌드
pnpm build

# 타입 체크
pnpm typecheck
```

## 데모 실행

```bash
# 빌드 후 데모 페이지 확인
pnpm build
pnpm preview
# 브라우저에서 http://localhost:4173/demo/ 접속
```

또는 빌드된 파일을 직접 사용:

```bash
# demo/index.html을 로컬 서버로 실행
npx serve .
# 브라우저에서 http://localhost:3000/demo/ 접속
```

## 라이선스

MIT
