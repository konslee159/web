import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export async function parseJsonSafe(response) {
  const contentType = response.headers.get('content-type') || '';
  // Read body as text first to avoid stream lock in case of non-JSON
  const bodyText = await response.text().catch(() => '');
  if (!bodyText) return null;
  if (!contentType.toLowerCase().includes('application/json')) {
    throw new Error(bodyText.slice(0, 200));
  }
  try {
    return JSON.parse(bodyText);
  } catch (e) {
    throw new Error(`Invalid JSON: ${e.message}`);
  }
}