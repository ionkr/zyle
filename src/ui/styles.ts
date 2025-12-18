/**
 * UI 스타일 정의 (하위 호환성 유지용 re-export)
 *
 * 이 파일은 기존 import 경로 호환성을 위해 유지됩니다.
 * 새로운 코드는 './styles/index.ts'에서 직접 import하는 것을 권장합니다.
 *
 * 리팩토링: 1,656줄 → 12개 모듈로 분리
 * @see ./styles/index.ts
 */

export {
  colors,
  getThemeColors,
  getSystemTheme,
  commonStyles,
  getFloatingButtonStyles,
  getAnalysisPanelStyles,
} from './styles/index';

export type { ThemeColors } from './styles/index';
