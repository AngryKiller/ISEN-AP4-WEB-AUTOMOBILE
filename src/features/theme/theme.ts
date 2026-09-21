/**
 * theme.ts — Dark / Light / Auto theme management.
 */

import type { ThemeChoice } from '../../models';
import { AVAILABLE_THEMES } from '../../models';
import { loadTheme, saveTheme } from '../../core/storage';

const rootElement = document.documentElement;

export function applyTheme(theme: ThemeChoice): void {
  if (theme === 'auto') {
    rootElement.removeAttribute('data-theme');
  } else {
    rootElement.dataset.theme = theme === 'light' ? 'clair' : 'sombre';
  }
  saveTheme(theme);

  // Update active state in theme buttons
  document.querySelectorAll<HTMLButtonElement>('[data-theme-choix]').forEach((button) => {
    const choice = button.dataset.themeChoix;
    const isSelected =
      choice === theme ||
      (choice === 'clair' && theme === 'light') ||
      (choice === 'sombre' && theme === 'dark');
    button.classList.toggle('theme__btn--active', isSelected);
    button.setAttribute('aria-pressed', String(isSelected));
  });
}

export function initTheme(): void {
  applyTheme(loadTheme());

  const themeContainer = document.querySelector('.theme');
  if (!themeContainer) return;

  themeContainer.addEventListener('click', (event: Event) => {
    const target = event.target as HTMLElement | null;
    const button = target?.closest<HTMLButtonElement>('[data-theme-choix]');
    if (!button?.dataset.themeChoix) return;

    let rawChoice = button.dataset.themeChoix;
    if (rawChoice === 'clair') rawChoice = 'light';
    if (rawChoice === 'sombre') rawChoice = 'dark';

    if ((AVAILABLE_THEMES as readonly string[]).includes(rawChoice)) {
      applyTheme(rawChoice as ThemeChoice);
    }
  });
}
