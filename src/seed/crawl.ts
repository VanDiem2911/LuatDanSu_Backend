import { connectDatabase } from "../infrastructure/database/connection";
import { ArticleModel } from "../domain/models";
import * as cheerio from "cheerio";
import mongoose from "mongoose";

// Helper to make relative URLs absolute
function resolveUrl(url: string, baseUrl: string = "https://www.luatdansu.net"): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("//")) return "https:" + url;
  if (url.startsWith("/")) return baseUrl + url;
  return baseUrl + "/" + url;
}

// Predefined tags and their keywords to auto-tag scraped articles
const tagKeywords = [
  { name: "Dân sự", slug: "dan-su", keywords: ["dân sự", "pháp luật dân sự", "bộ luật dân sự"] },
  { name: "Ly hôn", slug: "ly-hon", keywords: ["ly hôn", "đơn phương ly hôn", "thuận tình ly hôn", "quyền nuôi con", "tòa án"] },
  { name: "Đất đai", slug: "dat-dai", keywords: ["đất đai", "sổ đỏ", "tranh chấp đất", "thu hồi đất", "bồi thường"] },
  { name: "Thừa kế", slug: "thua-ke", keywords: ["thừa kế", "di chúc", "di sản", "hàng thừa kế", "khai nhận thừa kế"] },
  { name: "Biểu mẫu", slug: "bieu-mau", keywords: ["biểu mẫu", "đơn khởi kiện", "mẫu đơn", "tờ khai"] },
  { name: "Hỏi đáp", slug: "hoi-dap", keywords: ["hỏi đáp", "tư vấn", "thắc mắc", "câu hỏi", "giải đáp"] }
];

async function main() {
  console.log("=== BẮT ĐẦU CÀO DỮ LIỆU LUATDANSU.NET (ĐỒNG BỘ URL & ID) ===");

  // Parse limit from command line arguments (e.g. npm run crawl -- --limit=2)
  const limitIndex = process.argv.indexOf("--limit");
  let limit = -1;
  if (limitIndex !== -1 && limitIndex + 1 < process.argv.length) {
    limit = parseInt(process.argv[limitIndex + 1], 10);
  }
  if (limit > 0) {
    console.log(`Giới hạn cào: tối đa ${limit} bài viết mỗi chuyên mục (để test)`);
  }

  // 1. Connect to MongoDB
  await connectDatabase();
  console.log("Đã kết nối MongoDB.");

  // 2. Clear previously crawled articles to avoid duplicates and fix IDs/Slugs
  console.log("Đang xóa các bài viết đã cào cũ để đồng bộ lại theo ID gốc...");
  const deleteResult = await ArticleModel.deleteMany({ "seo.canonicalUrl": { $exists: true } });
  console.log(`Đã xóa ${deleteResult.deletedCount} bài viết cũ.`);

  // 3. Fetch sitemap
  const sitemapUrl = "https://www.luatdansu.net/sitemap.xml";
  console.log(`Đang tải sitemap từ: ${sitemapUrl}...`);
  const sitemapRes = await fetch(sitemapUrl);
  if (!sitemapRes.ok) {
    console.error("Không thể tải sitemap.xml!");
    process.exit(1);
  }
  const sitemapXml = await sitemapRes.text();

  // Extract all <loc> URLs
  const urls: string[] = [];
  const locRegex = /<loc>(https?:\/\/[^<]+)<\/loc>/g;
  let match;
  while ((match = locRegex.exec(sitemapXml)) !== null) {
    urls.push(match[1]);
  }
  console.log(`Tìm thấy tổng cộng ${urls.length} URLs trong sitemap.`);

  // Target categories to scrape
  const targetCategories = ["tin-tuc", "bieu-mau", "hoi-dap", "ly-hon", "dat-dai", "thua-ke"];
  const categorizedUrls: Record<string, string[]> = {};
  for (const cat of targetCategories) {
    categorizedUrls[cat] = [];
  }

  // Categorize URLs based on path pattern (e.g. domain/tin-tuc/<id>)
  for (const url of urls) {
    try {
      const parsed = new URL(url);
      const pathParts = parsed.pathname.split("/").filter(Boolean);
      if (pathParts.length === 2) {
        const [cat, idOrSlug] = pathParts;
        if (targetCategories.includes(cat)) {
          // Normalize URL to www.luatdansu.net
          const normalizedUrl = `https://www.luatdansu.net/${cat}/${idOrSlug}`;
          categorizedUrls[cat].push(normalizedUrl);
        }
      }
    } catch (e) {
      // Ignore invalid URLs
    }
  }

  // Print summary of URLs found
  for (const cat of targetCategories) {
    console.log(`Chuyên mục [${cat}]: tìm thấy ${categorizedUrls[cat].length} bài viết.`);
  }

  // 4. Process each category and scrape details
  let totalSaved = 0;
  let totalSkipped = 0;

  for (const cat of targetCategories) {
    let urlsToScrape = categorizedUrls[cat];
    if (limit > 0) {
      urlsToScrape = urlsToScrape.slice(0, limit);
    }

    console.log(`\n--- Đang xử lý chuyên mục [${cat}] (${urlsToScrape.length} bài viết) ---`);

    for (let i = 0; i < urlsToScrape.length; i++) {
      const url = urlsToScrape[i];
      const parts = url.split("/");
      const originalId = parts[parts.length - 1];

      // Validate that originalId is a valid 24-character hexadecimal MongoDB ObjectId
      if (!originalId.match(/^[0-9a-fA-F]{24}$/)) {
        console.error(`[${i + 1}/${urlsToScrape.length}] Bỏ qua URL không chứa ID hợp lệ: ${url}`);
        continue;
      }

      const objectId = new mongoose.Types.ObjectId(originalId);
      console.log(`[${i + 1}/${urlsToScrape.length}] Đang tải: ${url}`);

      // Check if already crawled in this run by checking _id
      const existingArticle = await ArticleModel.findById(objectId);
      if (existingArticle) {
        console.log(`-> Bỏ qua (Đã tồn tại trong DB, ID: ${existingArticle._id})`);
        totalSkipped++;
        continue;
      }

      try {
        const pageRes = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          }
        });

        if (!pageRes.ok) {
          console.error(`-> Lỗi tải trang! Status: ${pageRes.status}`);
          continue;
        }

        const html = await pageRes.text();
        const $ = cheerio.load(html);

        // Extract metadata and fields
        const title = $("h1").first().text().trim() || $("title").text().split("|")[0].trim();
        if (!title) {
          console.error("-> Lỗi: Không tìm thấy tiêu đề bài viết!");
          continue;
        }

        // Excerpt
        let excerpt = $('meta[name="description"]').attr("content") || 
                      $('meta[property="og:description"]').attr("content") || "";
        excerpt = excerpt.trim();

        // Image
        let image = $('meta[property="og:image"]').attr("content") || "";
        image = resolveUrl(image);

        // Published date
        let publishedAtStr = $('meta[property="article:published_time"]').attr("content") || "";
        if (!publishedAtStr) {
          // Look inside schema markup
          const schemaText = $('script[type="application/ld+json"]').html();
          if (schemaText) {
            try {
              const schema = JSON.parse(schemaText);
              publishedAtStr = schema.datePublished || schema.dateCreated || "";
            } catch (e) {}
          }
        }
        const publishedAt = publishedAtStr ? new Date(publishedAtStr) : new Date();

        // Article body HTML content
        const proseDiv = $(".prose");
        if (proseDiv.length === 0) {
          console.error("-> Lỗi: Không tìm thấy nội dung bài viết (.prose)!");
          continue;
        }

        // Clean up unnecessary classes/tags inside body
        proseDiv.find("script, style, iframe").remove();

        // Rewrite relative image paths to absolute inside the body
        proseDiv.find("img").each((_, img) => {
          const src = $(img).attr("src");
          if (src) {
            $(img).attr("src", resolveUrl(src));
          }
        });

        const contentHtml = proseDiv.html() || "";
        if (!contentHtml.trim()) {
          console.error("-> Lỗi: Nội dung bài viết rỗng!");
          continue;
        }

        // If excerpt is still empty, grab first 200 chars of text from content
        if (!excerpt) {
          const plainText = proseDiv.text().replace(/\s+/g, " ").trim();
          excerpt = plainText.slice(0, 197) + "...";
        }

        // Author Name
        const authorName = $("span.font-semibold.text-slate-700").text().trim() || "Ban Biên Tập";

        // Slug is set to the original ObjectID to preserve original URL paths
        const slug = originalId;

        // Auto-tagging
        const contentTextLower = (title + " " + proseDiv.text()).toLowerCase();
        const tagSlugs: string[] = [];
        for (const tag of tagKeywords) {
          if (tag.keywords.some(keyword => contentTextLower.includes(keyword))) {
            tagSlugs.push(tag.slug);
          }
        }
        if (tagSlugs.length === 0) {
          // Default tag based on category
          tagSlugs.push(cat);
        }

        // Views count (randomized to make the site look populated)
        const views = Math.floor(Math.random() * 450) + 50;

        // Construct Article Data
        const articleData = {
          _id: objectId,
          title,
          slug,
          excerpt,
          content: contentHtml,
          categorySlug: cat,
          tagSlugs,
          image,
          authorName,
          status: "published",
          featured: false,
          views,
          publishedAt,
          seo: {
            metaTitle: `${title} | Luật Dân Sự`,
            metaDescription: excerpt.slice(0, 160),
            canonicalUrl: url,
            ogImage: image,
            robots: "index, follow"
          }
        };

        // Save/Upsert using original ID
        await ArticleModel.updateOne(
          { _id: objectId },
          { $set: articleData },
          { upsert: true }
        );

        console.log(`-> Thành công: [Slug/ID: ${slug}] [Tiêu đề: ${title.slice(0, 40)}...]`);
        totalSaved++;
      } catch (err) {
        console.error(`-> Lỗi xảy ra khi cào bài viết ${url}:`, err);
      }

      // Add a tiny delay between requests to avoid blocking
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  console.log(`\n=== ĐỒNG BỘ HOÀN TẤT ===`);
  console.log(`Thành công: ${totalSaved} bài viết`);
  console.log(`Bỏ qua: ${totalSkipped} bài viết (đã tồn tại)`);

  process.exit(0);
}

main().catch((error) => {
  console.error("Lỗi chạy crawler chính:", error);
  process.exit(1);
});
