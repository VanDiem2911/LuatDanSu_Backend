import slugify from "slugify";
import { z } from "zod";
import {
  ArticleModel,
  BannerModel,
  CategoryModel,
  CommentModel,
  LeadModel,
  MediaModel,
  MenuModel,
  PageModel,
  SettingModel,
  TagModel,
  UserModel,
  VideoModel
} from "@/domain/models";

const phoneRegex = /^(\+84|84|0)([\s.-]?\d){8,10}$/;
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const youtubeIdRegex = /^[A-Za-z0-9_-]{6,20}$/;
const optionalUrl = z.string().optional();

const seoSchema = z
  .object({
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    canonicalUrl: z.string().url().optional(),
    ogImage: z.string().optional(),
    robots: z.string().optional()
  })
  .partial()
  .optional();

const articleSchema = z.object({
  title: z.string().min(3),
  slug: z.string().regex(slugRegex).optional(),
  excerpt: z.string().min(10),
  content: z.string().min(20),
  categorySlug: z.string().regex(slugRegex),
  tagSlugs: z.array(z.string().regex(slugRegex)).default([]),
  image: optionalUrl,
  authorName: z.string().default("Ban Biên Tập"),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  featured: z.boolean().default(false),
  views: z.number().optional(),
  publishedAt: z.coerce.date().optional(),
  seo: seoSchema
});

const categorySchema = z.object({
  name: z.string().min(2),
  slug: z.string().regex(slugRegex).optional(),
  description: z.string().optional(),
  type: z.enum(["category", "specialty"]).default("category"),
  parentSlug: z.string().regex(slugRegex).optional(),
  order: z.number().default(0),
  isVisible: z.boolean().default(true),
  seo: seoSchema
});

const tagSchema = z.object({
  name: z.string().min(2),
  slug: z.string().regex(slugRegex).optional(),
  description: z.string().optional()
});

const menuSchema = z.object({
  name: z.string().min(2),
  location: z.enum(["header", "footer", "mobile"]),
  items: z
    .array(
      z.object({
        label: z.string(),
        href: z.string(),
        order: z.number().default(0),
        isExternal: z.boolean().default(false)
      })
    )
    .default([]),
  isActive: z.boolean().default(true)
});

const pageSchema = z.object({
  title: z.string().min(3),
  slug: z.string().regex(slugRegex).optional(),
  excerpt: z.string().optional(),
  content: z.string().min(10),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  seo: seoSchema
});

const settingSchema = z.object({
  key: z.string().min(2),
  value: z.unknown(),
  group: z.string().default("general"),
  isPublic: z.boolean().default(false)
});

const mediaSchema = z.object({
  filename: z.string().min(1),
  url: z.string().url(),
  mimeType: z.string().optional(),
  size: z.number().optional(),
  alt: z.string().optional(),
  folder: z.string().default("library")
});

const bannerSchema = z.object({
  title: z.string().min(2),
  placement: z.enum(["home", "category", "article", "sidebar"]),
  image: z.string().url(),
  href: optionalUrl,
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional()
});

const commentSchema = z.object({
  articleId: z.string().optional(),
  name: z.string().min(2),
  email: z.string().email(),
  content: z.string().min(5),
  status: z.enum(["pending", "approved", "spam"]).default("pending")
});

const leadSchema = z.object({
  phone: z.string().regex(phoneRegex),
  source: z.string().default("website"),
  status: z.enum(["new", "contacted", "closed"]).default("new")
});

const videoSchema = z.object({
  title: z.string().min(2),
  youtubeId: z.string().regex(youtubeIdRegex),
  order: z.number().default(0),
  isHidden: z.boolean().default(false)
});

const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(["super_admin", "admin", "editor", "viewer"]).default("viewer"),
  permissions: z.array(z.string()).default([]),
  isActive: z.boolean().default(true)
});

export const resources = {
  articles: { model: ArticleModel, schema: articleSchema, searchable: ["title", "excerpt", "content"] },
  categories: { model: CategoryModel, schema: categorySchema, searchable: ["name", "description"] },
  tags: { model: TagModel, schema: tagSchema, searchable: ["name", "description"] },
  menus: { model: MenuModel, schema: menuSchema, searchable: ["name"] },
  pages: { model: PageModel, schema: pageSchema, searchable: ["title", "excerpt", "content"] },
  settings: { model: SettingModel, schema: settingSchema, searchable: ["key", "group"] },
  media: { model: MediaModel, schema: mediaSchema, searchable: ["filename", "alt"] },
  banners: { model: BannerModel, schema: bannerSchema, searchable: ["title", "description"] },
  comments: { model: CommentModel, schema: commentSchema, searchable: ["name", "email", "content"] },
  leads: { model: LeadModel, schema: leadSchema, searchable: ["phone"] },
  videos: { model: VideoModel, schema: videoSchema, searchable: ["title", "youtubeId"] },
  users: { model: UserModel, schema: userSchema, searchable: ["name", "email"] }
} as const;

export type ResourceName = keyof typeof resources;

export function isResourceName(value: string): value is ResourceName {
  return value in resources;
}

export function withSlug<T extends Record<string, unknown>>(payload: T): T {
  if (typeof payload.slug === "string" && payload.slug.length > 0) return payload;
  const source = typeof payload.title === "string" ? payload.title : typeof payload.name === "string" ? payload.name : undefined;
  if (!source) return payload;
  return {
    ...payload,
    slug: slugify(source, { lower: true, strict: true, locale: "vi" })
  };
}
