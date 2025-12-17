import type { ThemeColors } from './colors';

/**
 * 리사이즈 핸들 스타일
 */
export function getResizeStyles(_themeColors: ThemeColors): string {
  return `
    /* 리사이즈 핸들 */
    .zyle-resize-handle {
      position: absolute;
      z-index: 10;
    }

    .zyle-resize-n {
      top: 0;
      left: 8px;
      right: 8px;
      height: 6px;
      cursor: ns-resize;
    }

    .zyle-resize-s {
      bottom: 0;
      left: 8px;
      right: 8px;
      height: 6px;
      cursor: ns-resize;
    }

    .zyle-resize-e {
      right: 0;
      top: 8px;
      bottom: 8px;
      width: 6px;
      cursor: ew-resize;
    }

    .zyle-resize-w {
      left: 0;
      top: 8px;
      bottom: 8px;
      width: 6px;
      cursor: ew-resize;
    }

    .zyle-resize-ne {
      top: 0;
      right: 0;
      width: 12px;
      height: 12px;
      cursor: nesw-resize;
    }

    .zyle-resize-nw {
      top: 0;
      left: 0;
      width: 12px;
      height: 12px;
      cursor: nwse-resize;
    }

    .zyle-resize-se {
      bottom: 0;
      right: 0;
      width: 12px;
      height: 12px;
      cursor: nwse-resize;
    }

    .zyle-resize-sw {
      bottom: 0;
      left: 0;
      width: 12px;
      height: 12px;
      cursor: nesw-resize;
    }

    .zyle-resize-handle:hover {
      background: rgba(99, 102, 241, 0.1);
    }
  `;
}
