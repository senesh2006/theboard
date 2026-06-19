export async function readJsonResponse<T extends Record<string, unknown>>(
  res: Response,
): Promise<T> {
  const text = await res.text();
  if (!text) {
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return { error: text.slice(0, 200) || "Unexpected server response" } as unknown as T;
  }
}
