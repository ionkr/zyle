# Zyle

[![npm version](https://img.shields.io/npm/v/zyle.svg)](https://www.npmjs.com/package/zyle)
[![npm downloads](https://img.shields.io/npm/dm/zyle.svg)](https://www.npmjs.com/package/zyle)
[![bundle size](https://img.shields.io/bundlephobia/minzip/zyle)](https://bundlephobia.com/package/zyle)
[![license](https://img.shields.io/npm/l/zyle.svg)](https://github.com/anthropics/zyle/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg)](https://www.npmjs.com/package/zyle)

[한국어 문서](./docs/README.ko.md)

A zero-dependency library that embeds into web frontends to capture console logs, connect them with source maps and network requests, and display analysis results with AI-powered insights.

## Features

- **Console Log Capture**: Intercepts `console.log`, `console.error`, `console.warn`, `console.info`
- **Global Error Detection**: Captures global errors and unhandled Promise rejections
- **Network Request Monitoring**: Tracks `fetch` and `XMLHttpRequest` requests
- **Source Map Support**: Maps bundled code to original source locations
- **Error Analysis & Root Cause Detection**: Pattern matching with suggested solutions
- **AI-Powered Analysis**: Claude AI integration for detailed error analysis
  - **Anthropic API**: Direct API calls with your API key
  - **Claude Code Bridge**: Use Claude CLI via local bridge server (supports conversations)
- **Draggable Floating Button**: Default position at bottom-right, drag to reposition
- **Dark Mode Support**: Automatic theme switching based on system settings
- **Internationalization (i18n)**: English and Korean support with browser language detection

## Installation

```bash
npm install zyle
# or
pnpm add zyle
# or
yarn add zyle
```

## Usage

### Basic Usage

```typescript
import Zyle from 'zyle';

// Initialize with default options (auto-start)
const zyle = new Zyle();
```

### Configuration Options

```typescript
const zyle = new Zyle({
  position: 'bottom-right',    // Initial floating button position
  draggable: true,             // Enable drag functionality
  captureConsole: true,        // Capture console logs
  captureNetwork: true,        // Capture network requests
  sourceMapSupport: true,      // Enable source map support
  autoInit: true,              // Auto-initialize on creation
  maxLogs: 100,                // Maximum logs to store
  maxNetworkRequests: 50,      // Maximum network requests to store
  theme: 'auto',               // 'light' | 'dark' | 'auto'
  zIndex: 999999,              // z-index value
  locale: 'auto',              // 'en' | 'ko' | 'auto' (browser detection)
  displayMode: 'floating',     // 'floating' | 'docked'
});
```

### Internationalization (i18n)

Zyle supports multiple languages with automatic browser language detection:

```typescript
// Auto-detect browser language (default)
const zyle = new Zyle();

// Initialize with specific language
const zyle = new Zyle({ locale: 'en' });

// Change language at runtime
zyle.setLocale('ko');

// Get current language
const currentLocale = zyle.getLocale(); // 'ko' | 'en'
```

**Supported Languages:**
- English (`en`) - Fallback language
- Korean (`ko`)

### Event Listening

```typescript
// Log capture event
zyle.on('log:captured', (entry) => {
  console.log('New log:', entry);
});

// Network request start
zyle.on('network:start', (request) => {
  console.log('Request started:', request.url);
});

// Network request complete
zyle.on('network:end', (request) => {
  console.log('Request completed:', request.status);
});

// Analysis complete
zyle.on('analysis:complete', (result) => {
  console.log('Analysis result:', result);
});

// Panel open/close
zyle.on('panel:open', () => console.log('Panel opened'));
zyle.on('panel:close', () => console.log('Panel closed'));

// Display mode change
zyle.on('mode:change', (mode) => console.log('Mode changed:', mode));
```

### AI Analysis Providers

Zyle supports two AI providers for log analysis:

#### 1. Anthropic API (Direct)

Use Claude API directly with your API key:
- Click the settings icon in the analysis panel
- Select "Anthropic API" as provider
- Enter your API key (encrypted and stored locally)
- Choose model: Claude Sonnet 4.5, Haiku 4.5, or Opus 4.5

#### 2. Claude Code Bridge

Use Claude CLI via local bridge server for conversation support:

```bash
# Start the bridge server
npx @anthropic-ai/claude-code-bridge --port 19960
```

- Select "Claude Code Bridge" as provider in settings
- Supports follow-up questions and conversation history
- Real-time streaming responses via SSE
- Requires Claude CLI authentication (`claude login`)

### Manual Analysis

```typescript
// Analyze all errors
const errorResults = await zyle.analyzeErrors();

// Analyze all logs
const allResults = await zyle.analyzeAll();

// Analyze single log
const logs = zyle.getLogs();
const result = await zyle.analyze(logs[0]);
```

### Custom Error Patterns

```typescript
zyle.addErrorPattern({
  pattern: /MyCustomError/i,
  errorType: 'Custom Error',
  possibleCauses: [
    'A custom error occurred',
  ],
  suggestions: [
    'Check your custom error handling',
  ],
  severity: 'high',
});

// Remove error pattern
zyle.removeErrorPattern('Custom Error');
```

### Utility Methods

```typescript
// Get logs
const allLogs = zyle.getLogs();
const errors = zyle.getErrors();
const warnings = zyle.getWarnings();

// Get network requests
const requests = zyle.getNetworkRequests();
const failedRequests = zyle.getFailedNetworkRequests();

// Get statistics
const stats = zyle.getStats();

// Clear all data
zyle.clear();

// Theme control
zyle.setTheme('dark');

// Panel control
zyle.openPanel();
zyle.closePanel();

// Display mode control
zyle.setDisplayMode('docked');
zyle.toggleDisplayMode();
const mode = zyle.getDisplayMode();

// Destroy instance
zyle.destroy();
```

## UMD Build Usage

```html
<script src="zyle.umd.js"></script>
<script>
  const zyle = new Zyle({
    position: 'bottom-right',
    theme: 'auto',
  });
</script>
```

## Analysis Result Structure

```typescript
interface AnalysisResult {
  logEntry: LogEntry;           // Original log entry
  errorType?: string;           // Error type
  possibleCauses: string[];     // Possible causes list
  suggestions: string[];        // Suggested solutions list
  relatedNetworkRequests: NetworkRequest[];  // Related network requests
  severity: 'low' | 'medium' | 'high' | 'critical';  // Severity level
  codeContext?: {               // Code context
    fileName: string;
    lineNumber: number;
    columnNumber: number;
    sourcePreview: string[];    // Source code preview
  };
}
```

## Supported Error Patterns

- **Network Error**: Network connection errors, CORS errors
- **Type Error**: null/undefined access, function call errors
- **Reference Error**: Undefined variable reference
- **Syntax Error**: JSON parsing errors, syntax errors
- **Range Error**: Infinite recursion, array out of bounds
- **React Error**: Hook rule violations, component rendering errors
- **Async Error**: Promise rejection, async function errors
- **HTTP Errors**: 401, 403, 404, 500, etc.

## Project Structure

```
src/
├── index.ts              # Main entry point
├── types/                # TypeScript type definitions
├── constants.ts          # Configuration constants
├── core/                 # Core modules
│   ├── console-interceptor.ts
│   ├── network-interceptor.ts
│   ├── sourcemap-resolver.ts
│   ├── log-analyzer.ts
│   ├── error-patterns.ts
│   └── network/          # Network interceptor modules
├── ui/                   # UI components
│   ├── floating-button.ts
│   ├── analysis-panel.ts
│   ├── ai-settings-modal.ts
│   ├── panel/            # Panel modules
│   ├── renderers/        # Content renderers
│   └── styles/           # CSS-in-JS styles
├── ai/                   # AI integration (Anthropic API)
│   ├── ai-client.ts
│   └── ai-prompt.ts
├── bridge/               # Claude Code Bridge integration
│   └── bridge-client.ts  # Bridge server HTTP/SSE client
├── i18n/                 # Internationalization
│   ├── types.ts
│   ├── i18n-service.ts
│   ├── index.ts
│   └── locales/
│       ├── en.ts         # English translations
│       └── ko.ts         # Korean translations
├── icons/                # SVG icons
│   ├── action.ts         # Action icons (analyze, copy)
│   ├── logo.ts           # Zyle logo
│   ├── status.ts         # Status icons (error, warning)
│   ├── ui.ts             # UI icons (close, settings)
│   └── index.ts          # Icon exports
└── utils/                # Utility functions
    ├── helpers.ts        # General helpers
    ├── sanitizer.ts      # XSS defense & filtering
    ├── crypto.ts         # API key encryption
    └── markdown-parser.ts # Markdown to HTML parser
```

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build
pnpm build

# Type check
pnpm typecheck
```

## Demo

```bash
# Build and preview demo page
pnpm build
pnpm preview
# Open http://localhost:4173/demo/ in browser
```

Or use the built files directly:

```bash
# Run demo/index.html with local server
npx serve .
# Open http://localhost:3000/demo/ in browser
```

## License

MIT
