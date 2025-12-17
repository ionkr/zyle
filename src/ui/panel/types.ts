import type { LogEntry, AnalysisResult, NetworkRequest, AIAnalysisResult, AIAnalysisState, DisplayMode } from '../../types';

/**
 * 패널 탭 타입
 */
export type TabType = 'all' | 'errors' | 'warnings' | 'network';

/**
 * 패널 옵션
 */
export interface AnalysisPanelOptions {
  theme: 'light' | 'dark' | 'auto';
  zIndex: number;
  displayMode?: DisplayMode;
}

/**
 * 패널 상태
 */
export interface PanelInternalState {
  isVisible: boolean;
  currentTab: TabType;
  selectedLogId: string | null;
  aiAnalysisState: AIAnalysisState;
  aiError: string | null;
}

/**
 * 패널 데이터
 */
export interface PanelData {
  logs: LogEntry[];
  logsById: Map<string, LogEntry>;
  analysisResults: Map<string, AnalysisResult>;
  networkRequests: NetworkRequest[];
  networkRequestsById: Map<string, NetworkRequest>;
  aiAnalysisResults: Map<string, AIAnalysisResult>;
}

/**
 * 드래그 상태
 */
export interface DragState {
  isDragging: boolean;
  dragStartX: number;
  dragStartY: number;
  panelStartX: number;
  panelStartY: number;
}

/**
 * 리사이즈 상태
 */
export interface ResizeState {
  isResizing: boolean;
  resizeDirection: string;
  resizeStartX: number;
  resizeStartY: number;
  panelStartWidth: number;
  panelStartHeight: number;
  panelStartX: number;
  panelStartY: number;
}

/**
 * 패널 크기/위치
 */
export interface PanelGeometry {
  position: { x: number; y: number };
  size: { width: number; height: number };
  minSize: { width: number; height: number };
  maxSize: { width: number; height: number };
}

/**
 * 패널 콜백
 */
export interface PanelCallbacks {
  onClose: (() => void) | null;
  onClear: (() => void) | null;
  onAnalyze: ((entry: LogEntry) => Promise<AnalysisResult>) | null;
  onModeChange: ((mode: DisplayMode) => void) | null;
}
