import type { FilterQuery } from "mongoose";
import bcrypt from "bcryptjs";
import { BaseRepository } from "@/infrastructure/repositories/BaseRepository";
import { ApiError } from "@/shared/api";
import { parseQueryOptions } from "@/shared/utils/pagination";
import { z } from "zod";
import { isResourceName, resources, type ResourceName, withSlug } from "./resourceConfig";

export class CmsService {
  resource(name: string) {
    if (!isResourceName(name)) {
      throw new ApiError(404, `Unknown resource: ${name}`);
    }

    return resources[name];
  }

  async list(resourceName: ResourceName, query: Record<string, unknown>, isPublic = false) {
    const resource = this.resource(resourceName);
    const options = parseQueryOptions(query);
    const filter: FilterQuery<unknown> = {};

    if (isPublic && ["articles", "pages"].includes(resourceName)) {
      filter.status = "published";
    }

    if (isPublic && resourceName === "videos") {
      filter.isHidden = false;
    }

    if (resourceName === "articles") {
      if (query.categorySlug) {
        filter.categorySlug = String(query.categorySlug);
      } else {
        filter.categorySlug = { $ne: "bieu-mau" };
      }
    } else {
      if (query.categorySlug) {
        filter.categorySlug = String(query.categorySlug);
      }
    }

    if (query.date) {
      const dateStr = String(query.date);
      const start = new Date(`${dateStr}T00:00:00.000Z`);
      const end = new Date(`${dateStr}T23:59:59.999Z`);
      const dateField = resourceName === "articles" ? "publishedAt" : "createdAt";
      filter[dateField] = { $gte: start, $lte: end };
    }

    if (query.featured !== undefined) {
      filter.featured = String(query.featured) === "true";
    }

    if (query.isPublic !== undefined) {
      filter.isPublic = String(query.isPublic) === "true";
    }

    if (options.search) {
      filter.$or = resource.searchable.map((field) => ({
        [field]: { $regex: options.search, $options: "i" }
      }));
    }

    const repository = new BaseRepository(resource.model);
    const projection = isPublic && ["articles", "pages"].includes(resourceName) ? { content: 0 } : undefined;
    return repository.list(filter, options, projection);
  }

  async find(resourceName: ResourceName, idOrSlug: string, isPublic = false) {
    const resource = this.resource(resourceName);
    const repository = new BaseRepository(resource.model);
    const filter: FilterQuery<unknown> = idOrSlug.match(/^[0-9a-fA-F]{24}$/)
      ? { $or: [{ _id: idOrSlug }, { slug: idOrSlug }] }
      : { slug: idOrSlug };

    if (isPublic && ["articles", "pages"].includes(resourceName)) {
      filter.status = "published";
    }

    const document = await repository.findOne(filter);
    if (!document) {
      throw new ApiError(404, "Resource not found");
    }
    return document;
  }

  async create(resourceName: ResourceName, body: unknown) {
    const resource = this.resource(resourceName);
    const parsed = resource.schema.parse(body);
    const payload = withSlug(parsed);

    if (resourceName === "users") {
      throw new ApiError(405, "Create users through /api/admin/users/invite or seed script");
    }

    if (resourceName === "videos") {
      await resource.model.updateMany({}, { $inc: { order: 1 } });
      (payload as any).order = 1;
    }

    return new BaseRepository(resource.model).create(payload);
  }

  async update(resourceName: ResourceName, id: string, body: unknown) {
    const resource = this.resource(resourceName);
    const parsed = resource.schema.partial().parse(body);
    const payload = withSlug(parsed);
    const updated = await new BaseRepository(resource.model).update(id, payload);
    if (!updated) throw new ApiError(404, "Resource not found");
    return updated;
  }

  async delete(resourceName: ResourceName, id: string) {
    const deleted = await new BaseRepository(this.resource(resourceName).model).delete(id);
    if (!deleted) throw new ApiError(404, "Resource not found");
    return deleted;
  }

  async inviteUser(body: unknown) {
    const schema = resources.users.schema.extend({ password: z.string().min(8) });
    const parsed = schema.parse(body);
    const passwordHash = await bcrypt.hash(parsed.password, 12);
    const { password, ...userPayload } = parsed;
    return resources.users.model.create({ ...userPayload, passwordHash });
  }
}
