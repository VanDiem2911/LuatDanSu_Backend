import type { FilterQuery, Model, UpdateQuery } from "mongoose";
import type { QueryOptions } from "@/shared/utils/pagination";

export class BaseRepository<T> {
  constructor(private model: Model<T>) {}

  async list(filter: FilterQuery<T>, options: QueryOptions, projection?: any) {
    const skip = (options.page - 1) * options.limit;
    const sortDirection = options.order === "asc" ? 1 : -1;
    const [items, total] = await Promise.all([
      this.model
        .find(filter, projection)
        .sort({ [options.sort]: sortDirection })
        .skip(skip)
        .limit(options.limit)
        .lean(),
      this.model.countDocuments(filter)
    ]);

    return {
      items,
      total,
      page: options.page,
      limit: options.limit,
      totalPages: Math.ceil(total / options.limit)
    };
  }

  async findById(id: string) {
    return this.model.findById(id).lean();
  }

  async findOne(filter: FilterQuery<T>) {
    return this.model.findOne(filter).lean();
  }

  async create(payload: Partial<T>) {
    return this.model.create(payload);
  }

  async update(id: string, payload: UpdateQuery<T>) {
    return this.model.findByIdAndUpdate(id, payload, { new: true, runValidators: true }).lean();
  }

  async delete(id: string) {
    return this.model.findByIdAndDelete(id).lean();
  }
}
