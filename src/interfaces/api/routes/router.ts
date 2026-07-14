import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { CmsService } from "@/application/services/CmsService";
import { AuthService } from "@/application/services/AuthService";
import { isResourceName, type ResourceName } from "@/application/services/resourceConfig";
import { connectDatabase } from "@/infrastructure/database/connection";
import { ApiError, fail, ok } from "@/shared/api";

const cms = new CmsService();
const auth = new AuthService();

function getPath(req: NextApiRequest) {
  const path = req.query.path;
  return Array.isArray(path) ? path : path ? [path] : [];
}

function requireAdmin(req: NextApiRequest) {
  return auth.verify(req.headers.authorization);
}

export async function apiRouter(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectDatabase();
    const path = getPath(req);
    const [scope, resource, id, action] = path;

    if (scope === "health") {
      return ok(res, { status: "ok", timestamp: new Date().toISOString() });
    }

    if (scope === "auth" && resource === "login" && req.method === "POST") {
      return ok(res, await auth.login(req.body));
    }

    if (scope === "public") {
      return handlePublic(req, res, resource, id);
    }

    if (scope === "admin") {
      requireAdmin(req);
      return handleAdmin(req, res, resource, id, action);
    }

    throw new ApiError(404, "Route not found");
  } catch (error) {
    return fail(res, error);
  }
}

async function handlePublic(req: NextApiRequest, res: NextApiResponse, resource?: string, id?: string) {
  if (resource === "leads" && req.method === "POST") {
    return ok(res, await cms.create("leads", req.body), 201);
  }

  if (resource === "comments" && req.method === "POST") {
    return ok(res, await cms.create("comments", req.body), 201);
  }

  if (resource === "search") {
    const q = z.string().optional().parse(req.query.q);
    const result = await cms.list("articles", { ...req.query, search: q, limit: req.query.limit ?? 10 }, true);
    return ok(res, { data: result.items, meta: publicMeta(result) });
  }

  if (resource === "navigation") {
    const [categories, settings] = await Promise.all([
      cms.list("categories", { limit: 50, sort: "order", order: "asc" }, true),
      cms.list("settings", { isPublic: true, limit: 100 }, true)
    ]);

    // Build header menu from categories, exclude special sections
    const EXCLUDED_FROM_NAV = ["bieu-mau", "hoi-dap"];
    const visibleCats = categories.items.filter(
      (c: Record<string, unknown>) => c.isVisible !== false && !EXCLUDED_FROM_NAV.includes(String(c.slug ?? ""))
    );
    const menuItems = visibleCats.map((cat: Record<string, unknown>, index: number) => ({
      label: cat.name,
      href: `/${cat.slug}`,
      order: typeof cat.order === "number" ? cat.order : index,
      isExternal: false
    }));

    return ok(res, {
      menus: [{ location: "header", items: menuItems }],
      categories: categories.items,
      settings: settings.items
    });
  }

  if (!resource || !isResourceName(resource)) throw new ApiError(404, "Public resource not found");
  const resourceName = resource as ResourceName;

  if (req.method !== "GET") throw new ApiError(405, "Method not allowed");
  if (id) return ok(res, await cms.find(resourceName, id, true));

  const result = await cms.list(resourceName, req.query, true);
  return ok(res, { data: result.items, meta: publicMeta(result) });
}

async function handleAdmin(
  req: NextApiRequest,
  res: NextApiResponse,
  resource?: string,
  id?: string,
  action?: string
) {
  if (!resource || !isResourceName(resource)) throw new ApiError(404, "Admin resource not found");
  const resourceName = resource as ResourceName;

  if (resourceName === "users" && id === "invite" && req.method === "POST") {
    return ok(res, await cms.inviteUser(req.body), 201);
  }

  if (action) throw new ApiError(404, "Action not found");

  if (req.method === "GET") {
    if (id) return ok(res, await cms.find(resourceName, id));
    const result = await cms.list(resourceName, req.query);
    return ok(res, { data: result.items, meta: publicMeta(result) });
  }

  if (req.method === "POST") return ok(res, await cms.create(resourceName, req.body), 201);
  if (req.method === "PUT" && id) return ok(res, await cms.update(resourceName, id, req.body));
  if (req.method === "DELETE" && id) return ok(res, await cms.delete(resourceName, id));

  throw new ApiError(405, "Method not allowed");
}

function publicMeta(result: { total: number; page: number; limit: number; totalPages: number }) {
  return {
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages
  };
}
