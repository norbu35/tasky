import type { Page } from '@playwright/test';

export async function loginThroughDevAuth(page: Page, buttonName: string): Promise<void> {
  await page.goto('/auth');
  await page.getByRole('button', { name: buttonName }).click();
}

export function nextLocalDateTimeInput(hoursAhead: number): string {
  const date = new Date(Date.now() + hoursAhead * 60 * 60 * 1000);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
