/**
 * 테마 색상 정의
 */
export const colors = {
  light: {
    background: '#ffffff',
    backgroundSecondary: '#f5f5f5',
    backgroundHover: '#e8e8e8',
    text: '#1a1a1a',
    textSecondary: '#666666',
    border: '#e0e0e0',
    error: '#e53935',
    errorBg: '#ffebee',
    warning: '#fb8c00',
    warningBg: '#fff3e0',
    info: '#1e88e5',
    infoBg: '#e3f2fd',
    success: '#43a047',
    successBg: '#e8f5e9',
    accent: '#6366f1',
    accentHover: '#4f46e5',
  },
  dark: {
    background: '#1e1e1e',
    backgroundSecondary: '#2d2d2d',
    backgroundHover: '#3d3d3d',
    text: '#f5f5f5',
    textSecondary: '#a0a0a0',
    border: '#404040',
    error: '#ef5350',
    errorBg: '#2d1f1f',
    warning: '#ffa726',
    warningBg: '#2d2518',
    info: '#42a5f5',
    infoBg: '#1f262d',
    success: '#66bb6a',
    successBg: '#1f2d1f',
    accent: '#818cf8',
    accentHover: '#6366f1',
  },
};

export type ThemeColors = typeof colors.light;

/**
 * 테마별 색상 가져오기
 */
export function getThemeColors(theme: 'light' | 'dark'): ThemeColors {
  return colors[theme];
}

/**
 * 시스템 다크모드 감지
 */
export function getSystemTheme(): 'light' | 'dark' {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}
