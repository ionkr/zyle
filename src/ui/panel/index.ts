/**
 * 패널 모듈 내보내기
 *
 * analysis-panel.ts를 구조적으로 분리:
 * - types.ts: 패널 관련 타입 정의
 * - panel-storage.ts: localStorage 저장/복원
 * - body-push.ts: Dock 모드 body margin 관리
 * - drag-resize-handler.ts: 드래그/리사이즈 로직
 * - panel-renderer.ts: HTML 렌더링 함수
 */

export * from './types';
export { savePanelState, restorePanelState } from './panel-storage';
export { applyBodyPush, removeBodyPush, updateBodyPushImmediate } from './body-push';
export { DragResizeHandler } from './drag-resize-handler';
export { renderListView, renderDetailView } from './panel-renderer';
