import nodemailer from "nodemailer";
import { SettingModel } from "../../domain/models/ContentModels";
import { logger } from "../../shared/logger";

export interface SmtpConfig {
  notificationEmail?: string;
  notifyOnComment?: boolean;
  notifyOnLead?: boolean;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPass?: string;
  fromName?: string;
}

export class EmailService {
  private static async getConfig(): Promise<SmtpConfig> {
    try {
      const doc = await SettingModel.findOne({ key: "smtp" }).lean<{ value?: SmtpConfig }>();
      const siteDoc = await SettingModel.findOne({ key: "site" }).lean<{ value?: { email?: string } }>();
      const smtp = doc?.value || {};
      return {
        notificationEmail: smtp.notificationEmail || siteDoc?.value?.email || process.env.NOTIFICATION_EMAIL || "",
        notifyOnComment: smtp.notifyOnComment ?? true,
        notifyOnLead: smtp.notifyOnLead ?? true,
        smtpHost: smtp.smtpHost || process.env.SMTP_HOST || "smtp.gmail.com",
        smtpPort: Number(smtp.smtpPort || process.env.SMTP_PORT || 465),
        smtpSecure: smtp.smtpSecure !== undefined ? Boolean(smtp.smtpSecure) : true,
        smtpUser: smtp.smtpUser || process.env.SMTP_USER || "",
        smtpPass: smtp.smtpPass || process.env.SMTP_PASS || "",
        fromName: smtp.fromName || "Hệ Thống Luật Dân Sự"
      };
    } catch (err) {
      logger.error({ err }, "Failed to load SMTP settings from DB");
      return {};
    }
  }

  private static createTransporter(config: SmtpConfig) {
    if (!config.smtpUser || !config.smtpPass) {
      return null;
    }

    return nodemailer.createTransport({
      host: config.smtpHost || "smtp.gmail.com",
      port: config.smtpPort || 465,
      secure: config.smtpPort === 465 || config.smtpSecure,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  static async sendTestEmail(targetEmail?: string) {
    const config = await this.getConfig();
    const recipient = targetEmail || config.notificationEmail;

    if (!recipient) {
      throw new Error("Chưa cài đặt email nhận thông báo!");
    }
    if (!config.smtpUser || !config.smtpPass) {
      throw new Error("Chưa điền thông tin tài khoản SMTP gửi mail (Email người gửi hoặc Mật khẩu ứng dụng)!");
    }

    const transporter = this.createTransporter(config);
    if (!transporter) {
      throw new Error("Không thể khởi tạo kết nối SMTP");
    }

    const info = await transporter.sendMail({
      from: `"${config.fromName}" <${config.smtpUser}>`,
      to: recipient,
      subject: `[Luật Dân Sự] Thử nghiệm cấu hình email thông báo thành công`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #2563eb; color: #ffffff; padding: 20px; text-align: center;">
            <h2 style="margin: 0;">Kiểm tra kết nối Email thành công!</h2>
          </div>
          <div style="padding: 24px; color: #334155; line-height: 1.6;">
            <p>Xin chào Quản trị viên,</p>
            <p>Hệ thống đã kết nối thành công với máy chủ gửi thư. Đây là email thử nghiệm để xác nhận rằng cấu hình của bạn đã hoạt động chính xác.</p>
            <div style="background-color: #f8fafc; padding: 16px; border-radius: 6px; margin: 16px 0; border-left: 4px solid #2563eb;">
              <p style="margin: 4px 0;"><strong>Email nhận thông báo:</strong> ${recipient}</p>
              <p style="margin: 4px 0;"><strong>Máy chủ SMTP:</strong> ${config.smtpHost}:${config.smtpPort}</p>
              <p style="margin: 4px 0;"><strong>Thời gian:</strong> ${new Date().toLocaleString("vi-VN")}</p>
            </div>
            <p>Từ giờ, mỗi khi có khách hàng để lại câu hỏi tư vấn hoặc số điện thoại trên website, bạn sẽ nhận được thông báo ngay lập tức.</p>
          </div>
          <div style="background-color: #f1f5f9; padding: 12px; text-align: center; font-size: 12px; color: #64748b;">
            © 2026 Luật Dân Sự - Thông báo tự động
          </div>
        </div>
      `
    });

    return { success: true, messageId: info.messageId, recipient };
  }

  static async sendNewQuestionNotification(comment: {
    name?: string;
    email?: string;
    content: string;
    phone?: string;
  }) {
    try {
      const config = await this.getConfig();
      if (!config.notifyOnComment || !config.notificationEmail) {
        return;
      }

      const transporter = this.createTransporter(config);
      if (!transporter) {
        logger.warn("SMTP credentials not configured, skipping question notification email");
        return;
      }

      await transporter.sendMail({
        from: `"${config.fromName}" <${config.smtpUser}>`,
        to: config.notificationEmail,
        subject: `[Luật Dân Sự] Có câu hỏi tư vấn mới từ ${comment.name || "Khách hàng"}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #2563eb; color: #ffffff; padding: 18px 24px;">
              <h2 style="margin: 0; font-size: 18px;">Khách hàng vừa để lại câu hỏi mới!</h2>
            </div>
            <div style="padding: 24px; color: #334155; line-height: 1.6;">
              <p>Hệ thống vừa ghi nhận một yêu cầu tư vấn mới từ website:</p>
              <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                <tr>
                  <td style="padding: 8px 12px; background: #f8fafc; font-weight: bold; width: 140px;">Họ tên:</td>
                  <td style="padding: 8px 12px; background: #f8fafc;">${comment.name || "Khách truy cập"}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; font-weight: bold;">Email:</td>
                  <td style="padding: 8px 12px;"><a href="mailto:${comment.email}">${comment.email || "Không có"}</a></td>
                </tr>
                ${comment.phone ? `
                <tr>
                  <td style="padding: 8px 12px; background: #f8fafc; font-weight: bold;">Số điện thoại:</td>
                  <td style="padding: 8px 12px; background: #f8fafc;"><a href="tel:${comment.phone}">${comment.phone}</a></td>
                </tr>
                ` : ""}
                <tr>
                  <td style="padding: 8px 12px; font-weight: bold;">Thời gian gửi:</td>
                  <td style="padding: 8px 12px;">${new Date().toLocaleString("vi-VN")}</td>
                </tr>
              </table>
              <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 14px 18px; margin: 16px 0; border-radius: 4px;">
                <p style="margin: 0 0 6px 0; font-weight: bold; color: #1e40af;">Nội dung câu hỏi:</p>
                <p style="margin: 0; white-space: pre-wrap; color: #1e293b;">${comment.content}</p>
              </div>
              <p style="margin-top: 20px;">Vui lòng đăng nhập vào trang quản trị để xem và trả lời câu hỏi này.</p>
            </div>
            <div style="background-color: #f1f5f9; padding: 12px; text-align: center; font-size: 12px; color: #64748b;">
              Email thông báo tự động từ Hệ thống Luật Dân Sự
            </div>
          </div>
        `
      });

      logger.info({ recipient: config.notificationEmail }, "Sent new question notification email successfully");
    } catch (err) {
      logger.error({ err }, "Failed to send new question notification email");
    }
  }

  static async sendNewLeadNotification(lead: { phone: string; source?: string }) {
    try {
      const config = await this.getConfig();
      if (!config.notifyOnLead || !config.notificationEmail) {
        return;
      }

      const transporter = this.createTransporter(config);
      if (!transporter) {
        logger.warn("SMTP credentials not configured, skipping lead notification email");
        return;
      }

      await transporter.sendMail({
        from: `"${config.fromName}" <${config.smtpUser}>`,
        to: config.notificationEmail,
        subject: `[Luật Dân Sự] Khách hàng yêu cầu gọi lại: ${lead.phone}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #059669; color: #ffffff; padding: 18px 24px;">
              <h2 style="margin: 0; font-size: 18px;">Khách hàng yêu cầu tư vấn qua điện thoại!</h2>
            </div>
            <div style="padding: 24px; color: #334155; line-height: 1.6;">
              <p>Một khách hàng vừa để lại số điện thoại yêu cầu gọi lại tư vấn:</p>
              <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 16px 0; text-align: center;">
                <p style="margin: 0; font-size: 14px; color: #166534;">Số điện thoại khách hàng:</p>
                <a href="tel:${lead.phone}" style="display: inline-block; margin-top: 8px; font-size: 26px; font-weight: bold; color: #15803d; text-decoration: none;">
                  ${lead.phone}
                </a>
              </div>
              <p style="margin: 4px 0;"><strong>Nguồn gửi:</strong> ${lead.source || "Website"}</p>
              <p style="margin: 4px 0;"><strong>Thời gian:</strong> ${new Date().toLocaleString("vi-VN")}</p>
            </div>
            <div style="background-color: #f1f5f9; padding: 12px; text-align: center; font-size: 12px; color: #64748b;">
              Email thông báo tự động từ Hệ thống Luật Dân Sự
            </div>
          </div>
        `
      });

      logger.info({ recipient: config.notificationEmail, phone: lead.phone }, "Sent new lead notification email successfully");
    } catch (err) {
      logger.error({ err }, "Failed to send new lead notification email");
    }
  }
}
