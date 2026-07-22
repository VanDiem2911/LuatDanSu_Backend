import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { CmsService } from "@/application/services/CmsService";
import { AuthService } from "@/application/services/AuthService";
import { isResourceName, type ResourceName, resources as resourceConfigs } from "@/application/services/resourceConfig";
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
    const path = getPath(req);
    const [scope, resource, id, action] = path;

    if (scope === "health") {
      return ok(res, { status: "ok", timestamp: new Date().toISOString() });
    }

    await connectDatabase();

    if (scope === "auth" && resource === "login" && req.method === "POST") {
      return ok(res, await auth.login(req.body));
    }

    if (scope === "public") {
      return handlePublic(req, res, resource, id);
    }

    if (scope === "admin") {
      requireAdmin(req);
      if (resource === "backup" && req.method === "GET") {
        await handleBackup(req, res);
        return;
      }
      return handleAdmin(req, res, resource, id, action);
    }

    throw new ApiError(404, "Route not found");
  } catch (error) {
    return fail(res, error);
  }
}

async function handlePublic(req: NextApiRequest, res: NextApiResponse, resource?: string, id?: string) {
  if (resource === "sitemap" || resource === "sitemap.xml") {
    const baseUrl = process.env.SITE_URL || "https://luatdansu.vercel.app";
    const [categories, articles, pages] = await Promise.all([
      cms.list("categories", { limit: 100 }, true),
      cms.list("articles", { limit: 5000, sort: "updatedAt", order: "desc" }, true),
      cms.list("pages", { limit: 100 }, true)
    ]);

    type SitemapItem = {
      loc: string;
      lastmod?: string;
      changefreq: string;
      priority: string;
    };

    const staticUrls: SitemapItem[] = [
      { loc: `${baseUrl}/`, priority: "1.0", changefreq: "daily" },
      { loc: `${baseUrl}/gioi-thieu`, priority: "0.5", changefreq: "monthly" },
      { loc: `${baseUrl}/lien-he`, priority: "0.5", changefreq: "monthly" },
      { loc: `${baseUrl}/dang-ky-tu-van`, priority: "0.5", changefreq: "monthly" }
    ];

    const categoryUrls: SitemapItem[] = categories.items.map((cat: Record<string, unknown>) => ({
      loc: `${baseUrl}/${cat.slug}`,
      priority: "0.8",
      changefreq: "daily"
    }));

    const articleUrls: SitemapItem[] = articles.items.map((art: Record<string, unknown>) => ({
      loc: `${baseUrl}/${art.categorySlug}/${art.slug || art._id}`,
      lastmod: art.updatedAt ? new Date(String(art.updatedAt)).toISOString().split("T")[0] : undefined,
      priority: "0.9",
      changefreq: "weekly"
    }));

    const pageUrls: SitemapItem[] = pages.items.map((p: Record<string, unknown>) => ({
      loc: `${baseUrl}/${p.slug}`,
      priority: "0.6",
      changefreq: "monthly"
    }));

    const allUrls: SitemapItem[] = [...staticUrls, ...categoryUrls, ...articleUrls, ...pageUrls];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    (item) =>
      `  <url>\n    <loc>${item.loc}</loc>${item.lastmod ? `\n    <lastmod>${item.lastmod}</lastmod>` : ""}\n    <changefreq>${item.changefreq}</changefreq>\n    <priority>${item.priority}</priority>\n  </url>`
  )
  .join("\n")}
</urlset>`;

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.status(200).send(xml);
    return;
  }

  if (req.method === "GET") {
    const cacheTime = resource === "navigation" ? 60 : 3;
    res.setHeader("Cache-Control", `public, max-age=${cacheTime}, stale-while-revalidate=${cacheTime * 2}`);
  }

  if (resource === "download" && req.method === "GET") {
    const url = String(req.query.url ?? "");
    const filename = String(req.query.filename ?? "document");

    if (!url) {
      throw new ApiError(400, "URL is required");
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new ApiError(500, "Failed to fetch file from remote source");
    }

    const contentType = response.headers.get("content-type") || "application/octet-stream";

    res.setHeader("Content-Type", contentType);
    const safeFilename = encodeURIComponent(filename).replace(/['()]/g, escape).replace(/\*/g, '%2A');
    res.setHeader("Content-Disposition", `attachment; filename="document.docx"; filename*=UTF-8''${safeFilename}`);

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.send(buffer);
    return;
  }

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
  if (id) return ok(res, await cms.find(resourceName, id, true, req.query.categorySlug as string));

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
  if (resource === "dashboard" && req.method === "GET") {
    const [articles, leads, comments, videos] = await Promise.all([
      cms.list("articles", { limit: 1 }),
      cms.list("leads", { limit: 5, sort: "createdAt", order: "desc" }),
      cms.list("comments", { limit: 1 }),
      cms.list("videos", { limit: 1 })
    ]);

    return ok(res, {
      counts: {
        articles: articles.total,
        leads: leads.total,
        comments: comments.total,
        videos: videos.total
      },
      recentLeads: leads.items
    });
  }

  if (!resource || !isResourceName(resource)) throw new ApiError(404, "Admin resource not found");
  const resourceName = resource as ResourceName;

  if (resourceName === "users" && id === "invite" && req.method === "POST") {
    return ok(res, await cms.inviteUser(req.body), 201);
  }

  if (action) throw new ApiError(404, "Action not found");

  if (req.method === "GET") {
    if (id) return ok(res, await cms.find(resourceName, id, false, req.query.categorySlug as string));
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

async function handleBackup(req: NextApiRequest, res: NextApiResponse) {
  const backupData: Record<string, unknown[]> = {};
  
  for (const [name, config] of Object.entries(resourceConfigs)) {
    // Lấy tất cả tài liệu từ mỗi collection
    const docs = await config.model.find({}).lean();
    backupData[name] = docs as unknown[];
  }
  
  const dateStr = new Date().toISOString().split("T")[0];
  res.setHeader("Content-Disposition", `attachment; filename=luatdansu_backup_${dateStr}.json`);
  res.setHeader("Content-Type", "application/json");
  res.status(200).json(backupData);
}

