import type { NextApiRequest, NextApiResponse } from "next";
import { apiRouter } from "@/interfaces/api/routes/router";
import { applyCors } from "@/shared/cors";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  applyCors(req, res, "GET,POST,PUT,DELETE,OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  return apiRouter(req, res);
}
