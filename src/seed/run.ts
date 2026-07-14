import bcrypt from "bcryptjs";
import { connectDatabase } from "@/infrastructure/database/connection";
import {
  ArticleModel,
  BannerModel,
  CategoryModel,
  MenuModel,
  PageModel,
  SettingModel,
  TagModel,
  UserModel,
  VideoModel
} from "@/domain/models";
import { env } from "@/shared/env";
import { articles, banners, categories, menu, pages, settings, tags, videos } from "./data";

async function upsertBySlug(model: typeof CategoryModel, records: Array<Record<string, unknown>>) {
  for (const record of records) {
    await model.updateOne({ slug: record.slug }, { $set: record }, { upsert: true });
  }
}

async function main() {
  await connectDatabase();

  await upsertBySlug(CategoryModel, categories);
  await upsertBySlug(TagModel, tags);
  await upsertBySlug(ArticleModel, articles);
  await upsertBySlug(PageModel, pages);

  await MenuModel.updateOne({ location: "header" }, { $set: menu }, { upsert: true });

  for (const setting of settings) {
    await SettingModel.updateOne({ key: setting.key }, { $set: setting }, { upsert: true });
  }

  for (const banner of banners) {
    await BannerModel.updateOne({ title: banner.title, placement: banner.placement }, { $set: banner }, { upsert: true });
  }

  for (const video of videos) {
    await VideoModel.updateOne({ youtubeId: video.youtubeId }, { $set: video }, { upsert: true });
  }

  const passwordHash = await bcrypt.hash(env.adminPassword, 12);
  await UserModel.updateOne(
    { email: env.adminEmail },
    {
      $set: {
        name: "Quản trị Luật Dân Sự",
        email: env.adminEmail,
        passwordHash,
        role: "super_admin",
        permissions: ["*"],
        isActive: true
      }
    },
    { upsert: true }
  );

  console.log("Seed completed");
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
