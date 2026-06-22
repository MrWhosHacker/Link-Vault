const PREFIX = 'lv_dismiss:';

export function isDismissed(key: string): boolean {
  try {
    return sessionStorage.getItem(`${PREFIX}${key}`) === '1';
  } catch {
    return false;
  }
}

export function dismissOverlay(key: string): void {
  try {
    sessionStorage.setItem(`${PREFIX}${key}`, '1');
  } catch {
    /* ignore */
  }
}
