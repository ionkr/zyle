import { clamp } from '../../utils/helpers';
import type { DragState, ResizeState, PanelGeometry } from './types';
import type { DisplayMode } from '../../types';

/**
 * 드래그/리사이즈 핸들러
 * 패널의 드래그 이동 및 리사이즈 로직을 관리
 */
export class DragResizeHandler {
  private dragState: DragState = {
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    panelStartX: 0,
    panelStartY: 0,
  };

  private resizeState: ResizeState = {
    isResizing: false,
    resizeDirection: '',
    resizeStartX: 0,
    resizeStartY: 0,
    panelStartWidth: 0,
    panelStartHeight: 0,
    panelStartX: 0,
    panelStartY: 0,
  };

  private geometry: PanelGeometry;
  private dockWidth: number;

  // Dock 모드 상수
  private readonly DOCK_MIN_WIDTH = 320;
  private readonly DOCK_MAX_WIDTH = 600;

  constructor(geometry: PanelGeometry, dockWidth: number) {
    this.geometry = geometry;
    this.dockWidth = dockWidth;
  }

  /**
   * 드래그 시작
   */
  startDrag(clientX: number, clientY: number): void {
    this.dragState.isDragging = true;
    this.dragState.dragStartX = clientX;
    this.dragState.dragStartY = clientY;
    this.dragState.panelStartX = this.geometry.position.x;
    this.dragState.panelStartY = this.geometry.position.y;
  }

  /**
   * 리사이즈 시작
   */
  startResize(clientX: number, clientY: number, direction: string, displayMode: DisplayMode): void {
    this.resizeState.isResizing = true;
    this.resizeState.resizeDirection = direction;
    this.resizeState.resizeStartX = clientX;
    this.resizeState.resizeStartY = clientY;
    this.resizeState.panelStartWidth = displayMode === 'dock' ? this.dockWidth : this.geometry.size.width;
    this.resizeState.panelStartHeight = this.geometry.size.height;
    this.resizeState.panelStartX = this.geometry.position.x;
    this.resizeState.panelStartY = this.geometry.position.y;
  }

  /**
   * 드래그 처리
   */
  handleDrag(clientX: number, clientY: number): { x: number; y: number } | null {
    if (!this.dragState.isDragging) return null;

    const deltaX = clientX - this.dragState.dragStartX;
    const deltaY = clientY - this.dragState.dragStartY;

    const newX = clamp(
      this.dragState.panelStartX + deltaX,
      0,
      window.innerWidth - this.geometry.size.width
    );
    const newY = clamp(
      this.dragState.panelStartY + deltaY,
      0,
      window.innerHeight - this.geometry.size.height
    );

    this.geometry.position.x = newX;
    this.geometry.position.y = newY;

    return { x: newX, y: newY };
  }

  /**
   * 플로팅 모드 리사이즈 처리
   */
  handleFloatingResize(clientX: number, clientY: number): PanelGeometry | null {
    if (!this.resizeState.isResizing) return null;

    const deltaX = clientX - this.resizeState.resizeStartX;
    const deltaY = clientY - this.resizeState.resizeStartY;

    let newWidth = this.resizeState.panelStartWidth;
    let newHeight = this.resizeState.panelStartHeight;
    let newX = this.resizeState.panelStartX;
    let newY = this.resizeState.panelStartY;

    const direction = this.resizeState.resizeDirection;

    // 방향에 따른 리사이즈 계산
    if (direction.includes('e')) {
      newWidth = clamp(this.resizeState.panelStartWidth + deltaX, this.geometry.minSize.width, this.geometry.maxSize.width);
    }
    if (direction.includes('w')) {
      const widthDelta = clamp(this.resizeState.panelStartWidth - deltaX, this.geometry.minSize.width, this.geometry.maxSize.width) - this.resizeState.panelStartWidth;
      newWidth = this.resizeState.panelStartWidth + widthDelta;
      newX = this.resizeState.panelStartX - widthDelta;
    }
    if (direction.includes('s')) {
      newHeight = clamp(this.resizeState.panelStartHeight + deltaY, this.geometry.minSize.height, this.geometry.maxSize.height);
    }
    if (direction.includes('n')) {
      const heightDelta = clamp(this.resizeState.panelStartHeight - deltaY, this.geometry.minSize.height, this.geometry.maxSize.height) - this.resizeState.panelStartHeight;
      newHeight = this.resizeState.panelStartHeight + heightDelta;
      newY = this.resizeState.panelStartY - heightDelta;
    }

    // 화면 경계 체크
    newX = clamp(newX, 0, window.innerWidth - newWidth);
    newY = clamp(newY, 0, window.innerHeight - newHeight);

    this.geometry.size.width = newWidth;
    this.geometry.size.height = newHeight;
    this.geometry.position.x = newX;
    this.geometry.position.y = newY;

    return this.geometry;
  }

  /**
   * Dock 모드 리사이즈 처리
   */
  handleDockResize(clientX: number): number | null {
    if (!this.resizeState.isResizing || this.resizeState.resizeDirection !== 'w') {
      return null;
    }

    const deltaX = clientX - this.resizeState.resizeStartX;
    const newWidth = clamp(
      this.resizeState.panelStartWidth - deltaX,
      this.DOCK_MIN_WIDTH,
      this.DOCK_MAX_WIDTH
    );

    this.dockWidth = newWidth;
    return newWidth;
  }

  /**
   * 드래그/리사이즈 종료
   */
  end(): void {
    this.dragState.isDragging = false;
    this.resizeState.isResizing = false;
    this.resizeState.resizeDirection = '';
  }

  /**
   * 드래그 중인지 확인
   */
  isDragging(): boolean {
    return this.dragState.isDragging;
  }

  /**
   * 리사이즈 중인지 확인
   */
  isResizing(): boolean {
    return this.resizeState.isResizing;
  }

  /**
   * 현재 geometry 반환
   */
  getGeometry(): PanelGeometry {
    return this.geometry;
  }

  /**
   * geometry 동기화
   */
  syncGeometry(x: number, y: number, width: number, height: number): void {
    this.geometry.position.x = x;
    this.geometry.position.y = y;
    this.geometry.size.width = width;
    this.geometry.size.height = height;
  }

  /**
   * dock width 반환
   */
  getDockWidth(): number {
    return this.dockWidth;
  }

  /**
   * dock width 설정
   */
  setDockWidth(width: number): void {
    this.dockWidth = width;
  }
}
