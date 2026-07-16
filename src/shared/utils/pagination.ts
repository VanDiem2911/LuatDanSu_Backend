export type QueryOptions = {
  page: number;
  limit: number;
  search?: string;
  sort: string;
  order: "asc" | "desc";
};

export function parseQueryOptions(query: Record<string, unknown>): QueryOptions {
  const page = Math.max(Number(query.page ?? 1), 1);
  const limit = Math.min(Math.max(Number(query.limit ?? 12), 1), 10000);
  const sort = String(query.sort ?? "createdAt");
  const order = String(query.order ?? "desc") === "asc" ? "asc" : "desc";
  const searchVal = query.search || query.q;
  const search = searchVal ? String(searchVal).trim() : undefined;

  return { page, limit, sort, order, search };
}
