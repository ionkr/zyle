import type { ThemeColors } from './colors';

/**
 * 공통 애니메이션 키프레임
 */
export function getAnimationStyles(themeColors: ThemeColors): string {
  return `
    @keyframes badge-pop {
      0% { transform: scale(0); }
      50% { transform: scale(1.2); }
      100% { transform: scale(1); }
    }

    @keyframes sparkle-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }

    @keyframes sparkle-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    @keyframes dissolve-in {
      0% {
        opacity: 0;
        transform: translateY(10px);
        filter: blur(4px);
      }
      100% {
        opacity: 1;
        transform: translateY(0);
        filter: blur(0);
      }
    }

    @keyframes dissolve-out {
      0% {
        opacity: 1;
        transform: translateY(0);
        filter: blur(0);
      }
      100% {
        opacity: 0;
        transform: translateY(-10px);
        filter: blur(4px);
      }
    }

    @keyframes sparkle-float {
      0%, 100% {
        transform: translateY(0) scale(1);
        filter: drop-shadow(0 0 12px ${themeColors.accent});
      }
      50% {
        transform: translateY(-8px) scale(1.05);
        filter: drop-shadow(0 0 20px ${themeColors.accent});
      }
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }

    @keyframes spinner-rotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    @keyframes fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes modal-slide-in {
      from {
        opacity: 0;
        transform: translateY(-20px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    @keyframes dock-slide-in {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }
  `;
}
