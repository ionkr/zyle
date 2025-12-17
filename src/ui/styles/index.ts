/**
 * 스타일 모듈 통합 내보내기
 *
 * 기존 1,656줄의 styles.ts를 12개의 모듈로 분리:
 * - colors.ts: 테마 색상 정의 (~55줄)
 * - common.ts: 공통 스타일 (~35줄)
 * - animations.ts: 애니메이션 키프레임 (~75줄)
 * - floating-button.ts: 플로팅 버튼 (~85줄)
 * - panel-base.ts: 패널 기본 레이아웃 (~165줄)
 * - log-styles.ts: 로그 아이템 (~280줄)
 * - network-styles.ts: 네트워크 (~45줄)
 * - ai-styles.ts: AI 관련 (~320줄)
 * - modal-styles.ts: 모달 (~200줄)
 * - resize-styles.ts: 리사이즈 핸들 (~75줄)
 * - dock-styles.ts: Dock 모드 (~95줄)
 */

// 색상 관련 내보내기
export { colors, getThemeColors, getSystemTheme } from './colors';
export type { ThemeColors } from './colors';

// 공통 스타일
export { commonStyles } from './common';

// 개별 컴포넌트 스타일
export { getFloatingButtonStyles } from './floating-button';

// 스타일 조합 함수들
import { commonStyles } from './common';
import { getThemeColors } from './colors';
import { getPanelBaseStyles, getTabStyles } from './panel-base';
import { getLogStyles } from './log-styles';
import { getNetworkStyles } from './network-styles';
import { getAIStyles } from './ai-styles';
import { getModalStyles } from './modal-styles';
import { getResizeStyles } from './resize-styles';
import { getDockStyles } from './dock-styles';

/**
 * 분석 패널 전체 스타일 (통합)
 */
export function getAnalysisPanelStyles(theme: 'light' | 'dark', zIndex: number): string {
  const themeColors = getThemeColors(theme);

  return `
    ${commonStyles}
    ${getPanelBaseStyles(themeColors, zIndex)}
    ${getTabStyles(themeColors)}
    ${getLogStyles(themeColors, theme)}
    ${getNetworkStyles(themeColors)}
    ${getAIStyles(themeColors, theme)}
    ${getModalStyles(themeColors, theme, zIndex)}
    ${getResizeStyles(themeColors)}
    ${getDockStyles(themeColors)}
  `;
}
