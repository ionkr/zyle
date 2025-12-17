/**
 * Web Crypto API를 사용한 암호화 유틸리티
 * API 키 등 민감 정보의 안전한 저장을 위해 사용
 */

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;

/**
 * 브라우저 핑거프린트 기반 암호화 키 생성
 * 완벽한 보안은 아니지만 평문 저장보다 훨씬 안전
 */
async function deriveKey(): Promise<CryptoKey> {
  // 브라우저 고유 정보를 조합하여 키 시드 생성
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width.toString(),
    screen.height.toString(),
    new Date().getTimezoneOffset().toString(),
    // origin을 포함하여 다른 도메인에서 복호화 불가능하게 함
    window.location.origin,
  ].join('|');

  const encoder = new TextEncoder();
  const data = encoder.encode(fingerprint);

  // SHA-256 해시 생성
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);

  // 해시를 AES 키로 변환
  return crypto.subtle.importKey('raw', hashBuffer, { name: ALGORITHM, length: KEY_LENGTH }, false, [
    'encrypt',
    'decrypt',
  ]);
}

/**
 * 문자열 암호화
 * @param plaintext 암호화할 평문
 * @returns Base64 인코딩된 암호문과 IV
 */
export async function encrypt(plaintext: string): Promise<{ ciphertext: string; iv: string }> {
  try {
    const key = await deriveKey();
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);

    // 랜덤 IV 생성 (AES-GCM은 12바이트 IV 권장)
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encryptedBuffer = await crypto.subtle.encrypt({ name: ALGORITHM, iv }, key, data);

    // Base64 인코딩
    const ciphertext = btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));
    const ivString = btoa(String.fromCharCode(...iv));

    return { ciphertext, iv: ivString };
  } catch (error) {
    console.warn('[Zyle] Encryption failed, falling back to obfuscation:', error);
    // 폴백: 단순 난독화 (Web Crypto API 미지원 환경)
    return {
      ciphertext: btoa(plaintext),
      iv: 'fallback',
    };
  }
}

/**
 * 문자열 복호화
 * @param ciphertext Base64 인코딩된 암호문
 * @param ivString Base64 인코딩된 IV
 * @returns 복호화된 평문
 */
export async function decrypt(ciphertext: string, ivString: string): Promise<string> {
  try {
    // 폴백 케이스 처리
    if (ivString === 'fallback') {
      return atob(ciphertext);
    }

    const key = await deriveKey();

    // Base64 디코딩
    const encryptedData = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(ivString), (c) => c.charCodeAt(0));

    const decryptedBuffer = await crypto.subtle.decrypt({ name: ALGORITHM, iv }, key, encryptedData);

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.warn('[Zyle] Decryption failed:', error);
    // 복호화 실패 시 빈 문자열 반환 (키가 손상되었거나 다른 환경)
    return '';
  }
}

/**
 * Web Crypto API 지원 여부 확인
 */
export function isCryptoSupported(): boolean {
  return (
    typeof crypto !== 'undefined' &&
    typeof crypto.subtle !== 'undefined' &&
    typeof crypto.subtle.encrypt === 'function'
  );
}
