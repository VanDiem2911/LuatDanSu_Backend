export const env = {
  mongodbUri: process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/luatdansu",
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret-change-in-production",
  adminEmail: process.env.ADMIN_EMAIL ?? "admin@luatdansu.net",
  adminPassword: process.env.ADMIN_PASSWORD ?? "ChangeMe123!",
  siteUrl: process.env.SITE_URL ?? "http://localhost:5173",
  uploadDir: process.env.UPLOAD_DIR ?? "uploads"
};
