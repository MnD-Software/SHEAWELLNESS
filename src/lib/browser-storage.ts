/** Stored browser data is optional; stale JSON or private mode must not break pages. */
export function readStoredArray(key: string): unknown[] {
  try {
    const value = JSON.parse(window.localStorage.getItem(key) ?? "[]");
    return Array.isArray(value) ? value : [];
  } catch { return []; }
}
