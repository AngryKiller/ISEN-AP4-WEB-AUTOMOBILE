/**
 * toast.ts — Floating UI notification system.
 */

export type ToastType = 'info' | 'success' | 'danger';

/** Displays a temporary floating notification on the screen */
export function showToast(message: string, type: ToastType = 'info'): void {
  const container = document.getElementById('toasts');
  if (!container) return;

  const toastElement = document.createElement('div');
  toastElement.className = `toast toast--${type}`;
  toastElement.textContent = message;
  container.append(toastElement);

  setTimeout(() => {
    toastElement.classList.add('toast--exit');
    toastElement.addEventListener('animationend', () => toastElement.remove(), { once: true });
  }, 2600);
}
