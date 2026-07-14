import type { NextApiResponse } from "next";
import { ZodError } from "zod";

export type ApiResult<T> = {
  data: T;
  meta?: Record<string, unknown>;
};

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
  }
}

export function ok<T>(res: NextApiResponse, payload: ApiResult<T> | T, statusCode = 200) {
  return res.status(statusCode).json("data" in (payload as object) ? payload : { data: payload });
}

export function fail(res: NextApiResponse, error: unknown) {
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({ error: error.message, details: error.details });
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    typeof (error as { statusCode?: unknown }).statusCode === "number"
  ) {
    const typedError = error as { statusCode: number; message?: string; details?: unknown };
    return res.status(typedError.statusCode).json({
      error: typedError.message ?? "Request failed",
      details: typedError.details
    });
  }

  if (error instanceof ZodError) {
    return res.status(422).json({ error: "Validation failed", details: error.flatten() });
  }

  const message = error instanceof Error ? error.message : "Internal server error";
  return res.status(500).json({ error: message });
}
