import { GoogleGenerativeAI } from '@google/generative-ai';
import env from '../config/env.js';

// ================================================================
// SYSTEM PROMPT - Giới hạn phạm vi + cho phép câu hỏi cơ bản
// ================================================================
const SYSTEM_PROMPT = `Bạn là trợ lý AI tích hợp trong hệ thống CRM Mini — một ứng dụng quản lý quan hệ khách hàng.

NHIỆM VỤ CHÍNH:
- Hỗ trợ người dùng hiểu và sử dụng các tính năng của CRM Mini
- Trả lời câu hỏi về nghiệp vụ bán hàng, quản lý khách hàng, pipeline deals
- Hướng dẫn thao tác trên từng trang của hệ thống

CÁC TRANG TRONG HỆ THỐNG CRM MINI:
1. Dashboard - Tổng quan KPI: doanh thu, số deal, tỷ lệ chuyển đổi, hoạt động gần đây
2. Khách hàng - Quản lý hồ sơ khách hàng, lịch sử tương tác, trạng thái chăm sóc
3. Deals - Pipeline bán hàng theo stage: LEAD → CONTACTED → NEGOTIATION → WON/LOST (Kanban board kéo thả)
4. Báo giá - Tạo và quản lý báo giá gắn với deal/khách hàng
5. Sản phẩm - Danh mục sản phẩm, giá, mô tả (dùng cho báo giá và hóa đơn)
6. Hóa đơn - Quản lý hóa đơn, trạng thái thanh toán, công nợ
7. Nguồn lead - Theo dõi hiệu quả các kênh marketing (Website, Facebook, Zalo, Referral...)
8. Phân khúc - Phân nhóm khách hàng theo điều kiện để chạy chiến dịch
9. Hỗ trợ - Quản lý ticket hỗ trợ khách hàng theo mức ưu tiên và SLA
10. Dự báo - So sánh target doanh thu với actual và weighted forecast
11. Lịch - Lịch hẹn, nhắc việc, sự kiện gắn với deal/khách hàng
12. Báo cáo - Xu hướng KPI theo kỳ, hiệu suất theo owner
13. Import/Export - Nhập/xuất dữ liệu hàng loạt qua Excel/CSV
14. Người dùng - Quản lý tài khoản và phân quyền (chỉ Admin)
15. Cài đặt - Hồ sơ cá nhân, đổi mật khẩu, avatar

QUY TẮC TRẢ LỜI:
- Ưu tiên trả lời về CRM Mini và nghiệp vụ bán hàng/quản lý khách hàng
- Với câu hỏi toán học cơ bản (1+1, tính phần trăm...) → trả lời bình thường
- Với câu hỏi kiến thức phổ thông đơn giản → trả lời ngắn gọn
- Với câu hỏi hoàn toàn ngoài phạm vi (chính trị, y tế chuyên sâu, pháp lý...) → lịch sự từ chối và hướng về CRM
- Trả lời bằng tiếng Việt, ngắn gọn, thực tế
- Không bịa đặt số liệu cụ thể của người dùng
- Nếu không chắc → thừa nhận và gợi ý hỏi thêm`;

// ================================================================
// FALLBACK khi không có API key (dùng rule-based cũ)
// ================================================================
const normalizeText = (text = '') =>
  text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

const tryMath = (raw = '') => {
  const compact = raw.replace(/[xX×]/g, '*').replace(/[÷:]/g, '/').replace(/,/g, '.').trim();
  const directPattern = /^[\d\s()+\-*/%.]+$/;
  const phraseMatch = compact.match(/(?:tinh|bang bao nhieu|ket qua)\s*([\d\s()+\-*/%.]+)/i);
  const expression = directPattern.test(compact) ? compact : phraseMatch?.[1]?.trim();
  if (!expression || !/^[\d\s()+\-*/%.]+$/.test(expression)) return null;
  try {
    const result = Function('"use strict"; return (' + expression + ');')();
    if (!Number.isFinite(result)) return null;
    return Number.isInteger(result) ? String(result) : Number(result.toFixed(6)).toString();
  } catch { return null; }
};

const fallbackReply = (message) => {
  const n = normalizeText(message);
  const math = tryMath(n);
  if (math) return 'Kết quả: ' + math;
  if (n.includes('xin chao') || n.includes('hello') || n.includes('hi ')) {
    return 'Xin chào! Tôi là trợ lý AI CRM Mini. Tôi có thể giúp bạn tìm hiểu các tính năng của hệ thống. Hỏi tôi bất cứ điều gì!';
  }
  return 'Xin lỗi, hệ thống AI đang bận. Bạn có thể hỏi về: Dashboard, Khách hàng, Deals, Báo giá, Hóa đơn, Dự báo, Báo cáo và các tính năng khác của CRM Mini.';
};

// ================================================================
// GEMINI AI
// ================================================================
let genAI = null;
let model = null;

const getModel = () => {
  const apiKey = env.geminiApiKey;
  if (!apiKey) return null;
  if (!genAI) {
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-lite',
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: {
        maxOutputTokens: 512,
        temperature: 0.7,
      }
    });
  }
  return model;
};

// ================================================================
// ENTRY POINT
// ================================================================
export const askChatAssistant = async (payload) => {
  const raw = String(payload?.message || '').trim();
  if (!raw) return { intent: 'general', reply: 'Bạn hãy gửi câu hỏi cụ thể, mình sẽ trả lời ngay!' };

  const aiModel = getModel();

  // Nếu không có API key → dùng fallback
  if (!aiModel) {
    return { intent: 'fallback', reply: fallbackReply(raw) };
  }

  try {
    // Thêm context trang hiện tại vào message nếu có
    const pageContext = payload?.path ? `\n[Người dùng đang ở trang: ${payload.path}]` : '';
    const fullMessage = raw + pageContext;

    const result = await aiModel.generateContent(fullMessage);
    const reply = result.response.text()?.trim();

    if (!reply) throw new Error('Empty response');

    return { intent: 'ai', reply };
  } catch (err) {
    console.error('Gemini error:', err?.message);
    // Fallback về rule-based nếu Gemini lỗi
    return { intent: 'fallback', reply: fallbackReply(raw) };
  }
};
