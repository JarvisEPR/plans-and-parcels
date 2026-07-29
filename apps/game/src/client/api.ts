function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function readApiObject(response: Response): Promise<Record<string, unknown>> {
  const value: unknown = await response.json();
  return isRecord(value) ? value : {};
}

export function apiString(data: Record<string, unknown>, key: string): string | null {
  const value = data[key];
  return typeof value === "string" ? value : null;
}
