/**
 * 공통 스타일 (리셋, 스크롤바 등)
 */
export const commonStyles = `
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  :host {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    font-size: 14px;
    line-height: 1.5;
  }

  button {
    cursor: pointer;
    border: none;
    background: none;
    font-family: inherit;
    font-size: inherit;
  }

  .scrollbar-thin::-webkit-scrollbar {
    width: 6px;
  }

  .scrollbar-thin::-webkit-scrollbar-track {
    background: transparent;
  }

  .scrollbar-thin::-webkit-scrollbar-thumb {
    background-color: rgba(128, 128, 128, 0.4);
    border-radius: 3px;
  }
`;
