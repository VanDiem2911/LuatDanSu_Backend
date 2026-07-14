export const categories = [
  {
    name: "Tin tức pháp luật",
    slug: "tin-tuc",
    description: "Cập nhật thay đổi mới nhất về chính sách, nghị định và thông tin pháp lý dân sự.",
    order: 1,
    seo: {
      metaTitle: "Tin tức Pháp luật Dân sự | Cập nhật mới nhất 2026 | Luật Dân Sự",
      metaDescription: "Cập nhật các tin tức, thay đổi về bộ luật dân sự, các hoạt động pháp lý mới nhất tại Việt Nam."
    }
  },
  {
    name: "Biểu mẫu pháp luật",
    slug: "bieu-mau",
    description: "Tải và tham khảo các biểu mẫu pháp lý thông dụng trong dân sự, hôn nhân, đất đai.",
    order: 2
  },
  {
    name: "Hỏi đáp pháp luật",
    slug: "hoi-dap",
    description: "Giải đáp thắc mắc pháp lý dân sự bởi đội ngũ chuyên gia.",
    order: 3,
    seo: {
      metaTitle: "Hỏi đáp Pháp luật | Giải đáp thắc mắc dân sự | Luật Dân Sự",
      metaDescription: "Giải đáp các thắc mắc về luật dân sự, tư vấn pháp lý trực tuyến cùng các luật sư uy tín."
    }
  },
  {
    name: "Hôn nhân & Gia đình",
    slug: "ly-hon",
    description: "Tư vấn ly hôn, quyền nuôi con, tài sản chung và thủ tục hôn nhân gia đình.",
    type: "specialty",
    order: 4
  },
  {
    name: "Pháp luật Đất đai",
    slug: "dat-dai",
    description: "Giải thích quy định đất đai, sổ đỏ, tranh chấp đất và bồi thường.",
    type: "specialty",
    order: 5
  },
  {
    name: "Thừa kế & Di sản",
    slug: "thua-ke",
    description: "Tư vấn di chúc, hàng thừa kế, phân chia di sản và khai nhận thừa kế.",
    type: "specialty",
    order: 6
  }
];

export const tags = [
  { name: "Dân sự", slug: "dan-su" },
  { name: "Ly hôn", slug: "ly-hon" },
  { name: "Đất đai", slug: "dat-dai" },
  { name: "Thừa kế", slug: "thua-ke" },
  { name: "Biểu mẫu", slug: "bieu-mau" },
  { name: "Hỏi đáp", slug: "hoi-dap" }
];

export const menu = {
  name: "Header chính",
  location: "header",
  isActive: true,
  items: [
    { label: "Trang chủ", href: "/", order: 1, isExternal: false },
    { label: "Tin tức", href: "/tin-tuc", order: 2, isExternal: false },
    { label: "Biểu mẫu", href: "/bieu-mau", order: 3, isExternal: false },
    { label: "Hỏi đáp", href: "/hoi-dap", order: 4, isExternal: false },
    { label: "Ly hôn", href: "/ly-hon", order: 5, isExternal: false },
    { label: "Đất đai", href: "/dat-dai", order: 6, isExternal: false },
    { label: "Thừa kế", href: "/thua-ke", order: 7, isExternal: false }
  ]
};

const legalImage =
  "https://www.qeh.ox.ac.uk/sites/default/files/styles/paragraph_image/public/2025-08/law-blog_shutterstock_2115451628.jpg?itok=B-GlzEQu";

export const articles = [
  {
    title: "Ly hôn đơn phương có được quyền nuôi con",
    slug: "ly-hon-don-phuong-co-duoc-quyen-nuoi-con",
    excerpt:
      "Khi ly hôn đơn phương, quyền nuôi con được Tòa án xem xét dựa trên điều kiện chăm sóc, nuôi dưỡng và lợi ích tốt nhất của trẻ.",
    categorySlug: "tin-tuc",
    tagSlugs: ["ly-hon", "dan-su"],
    image: "https://congtyluatanp.com/public/uploads/e94e207ef865c71554e828ff22fb3d90/images/thutuclyhon(1).jpg",
    status: "published",
    featured: true,
    publishedAt: "2026-05-06T15:44:27.948Z",
    content: `
      <p>Khi một người thực hiện ly hôn đơn phương, một trong những vấn đề họ quan tâm là quyền nuôi con sau ly hôn thuộc về ai.</p>
      <h2>1. Điều kiện giành quyền nuôi con sau ly hôn</h2>
      <p>Tòa án giao quyền trực tiếp nuôi con cho bên đáp ứng đầy đủ điều kiện đảm bảo sự phát triển tốt nhất cho trẻ. Các điều kiện thường được xem xét gồm nơi ở ổn định, thu nhập, thời gian chăm sóc, môi trường sống và nhân thân của người nuôi dưỡng.</p>
      <p><strong>Con dưới 36 tháng tuổi</strong> thường được giao cho mẹ trực tiếp nuôi, trừ trường hợp có thỏa thuận khác phù hợp với lợi ích của con. <strong>Con từ đủ 7 tuổi trở lên</strong> được xem xét nguyện vọng.</p>
      <h2>2. Tư vấn quyền nuôi con</h2>
      <p>Người yêu cầu nuôi con cần chuẩn bị chứng cứ chứng minh khả năng kinh tế, tinh thần, thời gian chăm sóc và các yếu tố cho thấy việc giao con cho mình là phù hợp nhất.</p>
    `,
    seo: {
      metaTitle: "Ly hôn đơn phương có được quyền nuôi con | Luật Dân Sự",
      metaDescription:
        "Điều kiện giành quyền nuôi con khi ly hôn đơn phương và các chứng cứ cần chuẩn bị."
    }
  },
  {
    title: "Thủ tục sang tên sổ đỏ khi nhận thừa kế",
    slug: "thu-tuc-sang-ten-so-do-khi-nhan-thua-ke",
    excerpt: "Các bước khai nhận di sản, kê khai nghĩa vụ tài chính và đăng ký biến động khi nhận thừa kế quyền sử dụng đất.",
    categorySlug: "thua-ke",
    tagSlugs: ["thua-ke", "dat-dai"],
    image: legalImage,
    status: "published",
    featured: true,
    publishedAt: "2026-05-13T09:58:01.218Z",
    content:
      "<p>Người nhận thừa kế quyền sử dụng đất cần thực hiện thủ tục khai nhận hoặc phân chia di sản tại tổ chức công chứng, sau đó nộp hồ sơ đăng ký biến động tại cơ quan đăng ký đất đai.</p><h2>Hồ sơ cơ bản</h2><p>Hồ sơ gồm giấy chứng tử, giấy tờ chứng minh quan hệ thừa kế, giấy chứng nhận quyền sử dụng đất, văn bản khai nhận hoặc thỏa thuận phân chia di sản.</p>"
  },
  {
    title: "Mẫu đơn yêu cầu giải quyết tranh chấp đất đai",
    slug: "mau-don-yeu-cau-giai-quyet-tranh-chap-dat-dai",
    excerpt: "Biểu mẫu tham khảo để yêu cầu cơ quan có thẩm quyền giải quyết tranh chấp đất đai.",
    categorySlug: "bieu-mau",
    tagSlugs: ["bieu-mau", "dat-dai"],
    image: legalImage,
    status: "published",
    publishedAt: "2026-05-21T05:47:34.070Z",
    content:
      "<p>Mẫu đơn cần thể hiện thông tin người yêu cầu, nguồn gốc đất, quá trình sử dụng, nội dung tranh chấp và yêu cầu giải quyết cụ thể.</p><h2>Nội dung chính</h2><p>Người làm đơn nên kèm theo giấy tờ về quyền sử dụng đất, biên bản hòa giải, hình ảnh hiện trạng và tài liệu liên quan.</p>"
  },
  {
    title: "Có được bán đất khi đang tranh chấp không?",
    slug: "co-duoc-ban-dat-khi-dang-tranh-chap-khong",
    excerpt: "Quyền chuyển nhượng đất đang tranh chấp bị hạn chế và có thể không đủ điều kiện đăng ký sang tên.",
    categorySlug: "hoi-dap",
    tagSlugs: ["hoi-dap", "dat-dai"],
    image: legalImage,
    status: "published",
    publishedAt: "2026-05-21T05:25:32.838Z",
    content:
      "<p>Đất đang có tranh chấp thường không đáp ứng điều kiện chuyển nhượng. Người dân nên giải quyết xong tranh chấp hoặc có văn bản xác nhận tình trạng pháp lý rõ ràng trước khi giao dịch.</p>"
  },
  {
    title: "Chia tài sản chung vợ chồng khi ly hôn",
    slug: "chia-tai-san-chung-vo-chong-khi-ly-hon",
    excerpt: "Nguyên tắc chia tài sản chung, công sức đóng góp và bảo vệ quyền lợi chính đáng của mỗi bên.",
    categorySlug: "ly-hon",
    tagSlugs: ["ly-hon"],
    image: legalImage,
    status: "published",
    publishedAt: "2026-05-20T14:33:53.779Z",
    content:
      "<p>Tài sản chung của vợ chồng được chia theo thỏa thuận; nếu không thỏa thuận được, Tòa án xem xét hoàn cảnh gia đình, công sức đóng góp, lỗi của mỗi bên và bảo vệ lợi ích của con chưa thành niên.</p>"
  },
  {
    title: "Điều kiện cấp giấy chứng nhận quyền sử dụng đất lần đầu",
    slug: "dieu-kien-cap-giay-chung-nhan-quyen-su-dung-dat-lan-dau",
    excerpt: "Các điều kiện về sử dụng đất ổn định, giấy tờ nguồn gốc đất và nghĩa vụ tài chính khi xin cấp sổ đỏ lần đầu.",
    categorySlug: "dat-dai",
    tagSlugs: ["dat-dai"],
    image: legalImage,
    status: "published",
    publishedAt: "2026-05-21T04:32:57.375Z",
    content:
      "<p>Người sử dụng đất có thể được cấp giấy chứng nhận nếu có giấy tờ hợp lệ hoặc sử dụng ổn định, không tranh chấp, phù hợp quy hoạch và hoàn thành nghĩa vụ tài chính theo quy định.</p>"
  }
];

export const pages = [
  {
    title: "Giới thiệu",
    slug: "gioi-thieu",
    excerpt: "Thông tin về Cổng thông tin pháp lý Luật Dân Sự và Công ty Luật TNHH ANP.",
    status: "published",
    content:
      "<p>Luật Dân Sự là cổng thông tin pháp lý chuyên sâu về dân sự, đất đai, hôn nhân gia đình và thừa kế, được vận hành với định hướng hỗ trợ người dân tra cứu thông tin pháp luật dễ hiểu.</p>"
  },
  {
    title: "Liên hệ",
    slug: "lien-he",
    excerpt: "Liên hệ đội ngũ tư vấn pháp lý.",
    status: "published",
    content:
      "<p>Công ty Luật TNHH ANP. Hotline: 090 360 1234. Email: congtyluatanp.hcm@gmail.com.</p>"
  }
];

export const settings = [
  {
    key: "site",
    group: "general",
    isPublic: true,
    value: {
      name: "Luật Dân Sự",
      company: "CÔNG TY LUẬT TNHH ANP",
      description: "Cổng thông tin pháp lý chuyên sâu về luật dân sự, đất đai, hôn nhân gia đình, thừa kế.",
      hotline: "090 360 1234",
      zalo: "https://zalo.me/0903601234",
      facebook: "https://www.facebook.com/dudisoftware/",
      email: "congtyluatanp.hcm@gmail.com",
      logoText: "Luật Dân Sự"
    }
  },
  {
    key: "offices",
    group: "contact",
    isPublic: true,
    value: [
      { title: "Trụ sở chính", address: "Tổ dân phố Viên 3 - Phường Cổ Nhuế 2 - Quận Bắc Từ Liêm - Hà Nội" },
      { title: "Văn phòng Hà Nội", address: "Tầng 5 Tòa N07, Trần Đăng Ninh, P. Dịch Vọng, Q. Cầu Giấy, TP. Hà Nội" },
      { title: "Văn phòng TP. HCM", address: "Tầng 1, Số 232 Nguyễn Thị Minh Khai, Phường Xuân Hoà, TP. HCM" },
      { title: "Văn phòng Đồng Nai", address: "Số 9A Nguyễn Ái Quốc, Khu phố 6, Phường Trấn Biên, TP. Biên Hòa, Tỉnh Đồng Nai" }
    ]
  }
];

export const banners = [
  {
    title: "Kết nối Luật sư ngay để bảo vệ quyền lợi của bạn",
    placement: "category",
    image: legalImage,
    description: "Nhận tư vấn nhanh từ đội ngũ pháp lý.",
    isActive: true
  }
];

export const videos = [
  {
    title: "Tu van phap luat thua ke - Cong ty luat ANP",
    youtubeId: "KSpmA39TVUY",
    order: 1,
    isHidden: false
  },
  {
    title: "Phan to la gi? Quy dinh phap luat ve phan to",
    youtubeId: "fOY_AWKqXXQ",
    order: 2,
    isHidden: false
  },
  {
    title: "Dieu kien giai quyet vu an dan su theo thu tuc rut gon",
    youtubeId: "HuCNnJ7hDu0",
    order: 3,
    isHidden: false
  },
  {
    title: "Dam bao quyen bao chua cua nguoi bi buoc toi",
    youtubeId: "n-8nDx2IevE",
    order: 4,
    isHidden: false
  }
];
