import type { PanelState, DisplayMode } from '../../types';

const STORAGE_KEY_PANEL_STATE = 'zyle_panel_state';

/**
 * 패널 상태를 localStorage에 저장
 */
export function savePanelState(
  displayMode: DisplayMode,
  floatingPosition: { x: number; y: number },
  floatingSize: { width: number; height: number },
  dockWidth: number
): void {
  const state: PanelState = {
    displayMode,
    floatingPosition,
    floatingSize,
    dockWidth,
  };

  try {
    localStorage.setItem(STORAGE_KEY_PANEL_STATE, JSON.stringify(state));
  } catch {
    // localStorage 오류 무시
  }
}

/**
 * localStorage에서 패널 상태 복원
 */
export function restorePanelState(): PanelState | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_PANEL_STATE);
    if (saved) {
      return JSON.parse(saved) as PanelState;
    }
  } catch {
    // 파싱 오류 무시
  }
  return null;
}
