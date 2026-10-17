export interface SafeFetchResult<T> {
  ok: boolean;
  status: number;
  data: T;
  error?: string;
}

export async function safeFetchJson<T>(
  input: RequestInfo | URL,
  init: RequestInit,
  fallback: T,
): Promise<SafeFetchResult<T>> {
  try {
    const response = await fetch(input, { credentials: "same-origin", ...init });

    const text = await response.text();
    let payload: unknown;
    try {
      payload = text.trim() ? JSON.parse(text) as T : undefined;
    } catch {
      return {
        ok: false,
        status: response.status,
        data: fallback,
        error: response.ok ? "El servidor devolvió una respuesta no válida." : `La solicitud falló (${response.status}).`,
      };
    }

    if (!response.ok) {
      const payloadError = typeof payload === "object" && payload !== null && "error" in payload
        ? (payload as { error?: unknown }).error
        : undefined;
      return {
        ok: false,
        status: response.status,
        data: fallback,
        error: typeof payloadError === "string" ? payloadError : `La solicitud falló (${response.status}).`,
      };
    }

    if (payload === undefined) {
      return { ok: false, status: response.status, data: fallback, error: "El servidor devolvió una respuesta vacía." };
    }

    return { ok: true, status: response.status, data: payload as T };
  } catch {
    return { ok: false, status: 0, data: fallback, error: "No se pudo conectar con el servidor." };
  }
}