const DEFAULT_JSON_REQUEST_BYTES = 1024 * 1024;
export const MAX_TRACK_PACK_BYTES = 2 * 1024 * 1024;

export type JsonRequestReadResult =
  | Readonly<{ ok: true; body: unknown; byteLength: number }>
  | Readonly<{
      ok: false;
      code: "payload_too_large" | "invalid_json";
      message: string;
      maxBytes?: number;
      byteLength?: number;
    }>;

export async function readJsonRequestWithLimit(
  request: Request,
  maxBytes = DEFAULT_JSON_REQUEST_BYTES
): Promise<JsonRequestReadResult> {
  const contentLength = request.headers.get("content-length");

  if (contentLength) {
    const declaredLength = Number(contentLength);

    if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
      return {
        ok: false,
        code: "payload_too_large",
        message: "O arquivo excede o limite permitido antes da leitura completa.",
        maxBytes,
        byteLength: declaredLength
      };
    }
  }

  const rawBody = await request.text();
  const byteLength = new TextEncoder().encode(rawBody).byteLength;

  if (byteLength > maxBytes) {
    return {
      ok: false,
      code: "payload_too_large",
      message: "O arquivo excede o limite permitido.",
      maxBytes,
      byteLength
    };
  }

  try {
    return {
      ok: true,
      body: JSON.parse(rawBody),
      byteLength
    };
  } catch {
    return {
      ok: false,
      code: "invalid_json",
      message: "O arquivo enviado não é um JSON válido.",
      byteLength
    };
  }
}
