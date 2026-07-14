import type { NextApiRequest, NextApiResponse } from "next";

function configuredOrigins() {
  return [process.env.CORS_ORIGIN, process.env.CORS_ALLOWED_ORIGINS]
    .filter(Boolean)
    .flatMap((value) => String(value).split(","))
    .map((value) => value.trim())
    .filter(Boolean);
}

export function applyCors(req: NextApiRequest, res: NextApiResponse, methods: string) {
  const origins = configuredOrigins();
  const requestOrigin = req.headers.origin;
  const allowOrigin =
    origins.length === 0 || origins.includes("*")
      ? "*"
      : requestOrigin && origins.includes(requestOrigin)
        ? requestOrigin
        : origins[0];

  res.setHeader("Access-Control-Allow-Origin", allowOrigin);
  res.setHeader("Access-Control-Allow-Methods", methods);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Vary", "Origin");
}
