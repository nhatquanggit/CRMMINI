// ================================================================
// PIPELINE: Nhan tin nhan => Phan tich => Tra loi
// ================================================================

const normalizeText = (text = '') =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const hasAny = (text, words) => words.some((w) => text.includes(w));

// ================================================================
// KIEN THUC VE CAC TRANG CRM
// ================================================================

const PAGES = {
  dashboard: {
    label: 'Dashboard',
    keywords: ['dashboard', 'bang dieu khien', 'tong quan', 'kpi'],
    what: 'Trang Dashboard hiển thị KPI tổng quan: doanh thu, số deal mới, tỷ lệ chuyển đổi và hoạt động gần đây theo thời gian thực.',
    how: 'Cách dùng: chọn khoảng thời gian cần xem → đọc thẻ KPI → tìm chỉ số giảm mạnh nhất → tạo hành động xử lý trong ngày.',
    suggest: 'Gợi ý: xác định chỉ số giảm mạnh nhất rồi gắn hành động xử lý ngay trong ngày hôm nay.',
    summary: 'Dashboard: theo dõi KPI tổng quan. Ưu tiên chỉ số giảm mạnh nhất và tạo kế hoạch trong ngày.',
  },
  customers: {
    label: 'Customers',
    keywords: ['customers', 'customer', 'khach hang', 'lich su tuong tac'],
    what: 'Trang Customers quản lý toàn bộ hồ sơ khách hàng: thông tin liên hệ, lịch sử tương tác và mức độ ưu tiên chăm sóc.',
    how: 'Cách dùng: vào Customers → lọc theo trạng thái hoặc nguồn lead → mở hồ sơ → thêm ghi chú hoặc lên lịch follow-up.',
    suggest: 'Gợi ý: lọc nhóm khách hàng giá trị cao để follow-up trước, tăng tỷ lệ chốt đơn.',
    summary: 'Customers: quản lý hồ sơ và lịch sử tương tác. Lọc nhóm giá trị cao để ưu tiên chăm sóc.',
  },
  deals: {
    label: 'Deals',
    keywords: ['deals', 'deal', 'pipeline', 'co hoi', 'stage', 'won', 'lost'],
    what: 'Trang Deals quản lý pipeline bán hàng theo từng stage: từ liên hệ ban đầu đến chốt đơn (WON) hoặc thua (LOST).',
    how: 'Cách dùng: mở Deals → kéo deal sang stage phù hợp → gắn next action có deadline → theo dõi deal sắp hết hạn.',
    suggest: 'Gợi ý: ưu tiên deal đứng lâu chưa có activity — gắn deadline cụ thể để tránh lost.',
    summary: 'Deals: quản lý pipeline theo stage. Deal đứng lâu không có activity là rủi ro LOST cao nhất.',
  },
  quotes: {
    label: 'Quotes',
    keywords: ['quotes', 'quote', 'bao gia'],
    what: 'Trang Quotes tạo và quản lý báo giá gắn với từng khách hàng hoặc deal, theo dõi trạng thái duyệt.',
    how: 'Cách dùng: tạo báo giá từ deal → chọn sản phẩm → gửi duyệt → theo dõi trạng thái (draft/sent/approved).',
    suggest: 'Gợi ý: chuẩn hóa mẫu báo giá để giảm thời gian soạn và rút ngắn chu kỳ chốt đơn.',
    summary: 'Quotes: tạo và theo dõi báo giá theo deal. Chuẩn hóa mẫu để giảm thời gian chốt.',
  },
  products: {
    label: 'Products',
    keywords: ['products', 'product', 'san pham', 'danh muc'],
    what: 'Trang Products quản lý danh mục sản phẩm: tên, giá, mô tả và trạng thái. Dùng làm nguồn dữ liệu cho Quotes và Invoices.',
    how: 'Cách dùng: vào Products → thêm/sửa sản phẩm → cập nhật giá → sản phẩm tự động xuất hiện khi tạo báo giá.',
    suggest: 'Gợi ý: giữ dữ liệu sản phẩm luôn chuẩn để báo giá và hóa đơn đồng bộ chính xác.',
    summary: 'Products: danh mục sản phẩm cho Quotes và Invoices. Cần giữ giá và mô tả luôn cập nhật.',
  },
  invoices: {
    label: 'Invoices',
    keywords: ['invoices', 'invoice', 'hoa don', 'cong no', 'thanh toan'],
    what: 'Trang Invoices theo dõi hóa đơn, trạng thái thanh toán (paid/unpaid/overdue) và công nợ theo từng khách hàng.',
    how: 'Cách dùng: tạo hóa đơn từ deal/quote → gửi khách → cập nhật trạng thái thanh toán → theo dõi công nợ quá hạn.',
    suggest: 'Gợi ý: ưu tiên xử lý hóa đơn quá hạn (overdue) để giảm rủi ro dòng tiền.',
    summary: 'Invoices: quản lý hóa đơn và công nợ. Hóa đơn overdue cần xử lý trước để bảo vệ dòng tiền.',
  },
  leadSources: {
    label: 'Lead Sources',
    keywords: ['lead source', 'lead sources', 'nguon lead', 'nguon khach'],
    what: 'Trang Lead Sources quản lý các kênh nguồn khách hàng tiềm năng và đo lường hiệu quả chuyển đổi theo từng kênh.',
    how: 'Cách dùng: thêm nguồn lead → gắn vào khách hàng khi tạo mới → xem báo cáo tỷ lệ chuyển đổi theo kênh.',
    suggest: 'Gợi ý: tập trung ngân sách vào nguồn có tỷ lệ chuyển đổi cao nhất, cắt giảm nguồn kém hiệu quả.',
    summary: 'Lead Sources: đo hiệu quả từng kênh marketing. Đầu tư vào kênh tỷ lệ chuyển đổi cao nhất.',
  },
  reports: {
    label: 'Reports',
    keywords: ['reports', 'report', 'bao cao', 'hieu suat', 'thong ke', 'xu huong'],
    what: 'Trang Reports hiển thị xu hướng KPI theo kỳ: doanh thu, tỷ lệ chuyển đổi, số deal mới/chốt và hiệu suất theo từng owner.',
    how: 'Cách dùng: chọn kỳ so sánh → đọc biểu đồ xu hướng → tìm KPI giảm mạnh nhất → chốt 2–3 hành động xử lý trong 48 giờ.',
    suggest: 'Gợi ý: review báo cáo mỗi tuần, tập trung vào 1 KPI yếu nhất và đặt deadline hành động ngay.',
    summary: 'Reports: xu hướng KPI theo kỳ. Tìm chỉ số giảm mạnh nhất → chốt hành động trong 48 giờ.',
  },
  segments: {
    label: 'Segments',
    keywords: ['segments', 'segment', 'phan khuc', 'phan nhom', 'nhom khach'],
    what: 'Trang Segments tạo nhóm khách hàng theo điều kiện lọc (nguồn lead, trạng thái, giá trị deal) để nhắm mục tiêu chính xác hơn.',
    how: 'Cách dùng: tạo segment → đặt điều kiện lọc → lưu → dùng segment để gửi chiến dịch hoặc follow-up hàng loạt.',
    suggest: 'Gợi ý: tạo segment "khách hàng chưa mua trong 30 ngày" để tái kích hoạt nhanh.',
    summary: 'Segments: phân nhóm khách hàng theo điều kiện. Dùng để chạy chiến dịch chính xác hơn.',
  },
  support: {
    label: 'Support Tickets',
    keywords: ['support tickets', 'support', 'ticket', 'ho tro', 'sla', 'backlog', 'urgent'],
    what: 'Trang Support Tickets quản lý yêu cầu hỗ trợ từ khách hàng theo mức ưu tiên (URGENT/HIGH/MEDIUM/LOW) và SLA.',
    how: 'Cách dùng: xem danh sách ticket → lọc theo priority → gắn assignee → xử lý và đổi trạng thái → theo dõi SLA.',
    suggest: 'Gợi ý: xử lý URGENT và HIGH trước, sau đó gộp nhóm ticket lặp lại để giảm backlog dài hạn.',
    summary: 'Support Tickets: quản lý yêu cầu hỗ trợ theo SLA. Ưu tiên URGENT/HIGH, dọn ticket lặp.',
  },
  forecasts: {
    label: 'Forecasts',
    keywords: ['forecasts', 'forecast', 'du bao', 'chi tieu', 'target', 'muc tieu', 'doanh so', 'weighted', 'tien do'],
    what: 'Trang Forecasts so sánh target doanh thu với doanh thu đã chốt và weighted forecast (xác suất × giá trị deal).',
    how: 'Cách dùng: đặt target theo tháng/quý → theo dõi actual revenue → xem weighted forecast → điều chỉnh pipeline để đạt target.',
    suggest: 'Gợi ý: nếu thiếu target, tập trung vào deal xác suất WON trên 70% trong 7–14 ngày tới.',
    summary: 'Forecasts: so sánh target vs actual vs weighted forecast. Ưu tiên deal xác suất cao trong 7–14 ngày tới.',
  },
  calendar: {
    label: 'Calendar',
    keywords: ['calendar', 'lich', 'lich hen', 'cuoc hen', 'nhac viec', 'event'],
    what: 'Trang Calendar hiển thị lịch hẹn, nhắc việc và tất cả hoạt động CRM theo ngày/tuần/tháng.',
    how: 'Cách dùng: tạo event/lịch hẹn → gắn với deal hoặc khách hàng → đặt nhắc nhở → xem lịch tuần để ưu tiên.',
    suggest: 'Gợi ý: chốt lịch ưu tiên theo deadline và mức độ ảnh hưởng doanh thu, không chỉ theo thứ tự thời gian.',
    summary: 'Calendar: quản lý lịch hẹn và nhắc việc. Ưu tiên lịch ảnh hưởng doanh thu cao nhất.',
  },
  chatUi: {
    label: 'Chat UI',
    keywords: ['chat ui', 'khung chat', 'chatbox', 'chat box', 'tro ly', 'ai'],
    what: 'Trang Chat UI là khu vực hỏi đáp với trợ lý AI — hỗ trợ hướng dẫn thao tác, giải thích chức năng CRM và gợi ý hành động.',
    how: 'Cách dùng: gõ câu hỏi về bất kỳ trang CRM nào → trợ lý sẽ giải thích chức năng và gợi ý cách dùng.',
    suggest: 'Gợi ý: đặt câu hỏi cụ thể về trang bạn đang dùng để nhận hướng dẫn chính xác hơn.',
    summary: 'Chat UI: hỏi đáp với trợ lý AI về cách dùng CRM. Đặt câu hỏi cụ thể để nhận gợi ý đúng trọng tâm.',
  },
  importExport: {
    label: 'Import / Export',
    keywords: ['import', 'export', 'nhap du lieu', 'xuat du lieu', 'excel', 'csv', 'file'],
    what: 'Trang Import/Export cho phép nhập dữ liệu hàng loạt vào CRM hoặc xuất dữ liệu ra file Excel/CSV.',
    how: 'Cách dùng (import): tải template CSV → điền dữ liệu theo đúng cột → upload → kiểm tra lỗi mapping → xác nhận import.',
    suggest: 'Gợi ý: chuẩn hóa cột dữ liệu trước khi import để tránh lỗi mapping và phải làm lại từ đầu.',
    summary: 'Import/Export: nhập/xuất dữ liệu CRM hàng loạt. Chuẩn hóa cột trước khi import để tránh lỗi.',
  },
  users: {
    label: 'User Management',
    keywords: ['user management', 'users', 'nguoi dung', 'phan quyen', 'role', 'tai khoan', 'admin'],
    what: 'Trang User Management quản lý tài khoản người dùng, phân quyền (role) và quyền truy cập theo từng module CRM.',
    how: 'Cách dùng: vào Users → tạo tài khoản mới → gắn role (admin/member) → cấu hình quyền truy cập theo module.',
    suggest: 'Gợi ý: rà soát role định kỳ, gỡ quyền những tài khoản không còn hoạt động để bảo mật hệ thống.',
    summary: 'User Management: quản lý tài khoản và phân quyền. Rà soát role định kỳ để bảo mật.',
  },
  settings: {
    label: 'Settings',
    keywords: ['settings', 'setting', 'cai dat', 'ho so', 'avatar', 'profile', 'thong tin ca nhan'],
    what: 'Trang Settings cho phép cập nhật hồ sơ cá nhân, đổi avatar, thông tin tài khoản và cấu hình hệ thống.',
    how: 'Cách dùng: vào Settings → chỉnh thông tin cá nhân → upload avatar → lưu thay đổi.',
    suggest: 'Gợi ý: nếu thiếu chức năng, kiểm tra lại role/quyền truy cập của tài khoản bạn.',
    summary: 'Settings: cấu hình hồ sơ và tài khoản. Kiểm tra role nếu không truy cập được chức năng nào.',
  },
};

// ================================================================
// BUOC 1: PHAN TICH TIN NHAN
// ================================================================

const formatNumber = (value) => {
  if (!Number.isFinite(value)) return '0';
  if (Number.isInteger(value)) return String(value);
  return Number(value.toFixed(6)).toString();
};

const tryMath = (raw = '') => {
  const compact = raw
    .replace(/[xX\u00d7]/g, '*')
    .replace(/[\u00f7:]/g, '/')
    .replace(/,/g, '.')
    .trim();
  const directPattern = /^[\d\s()+\-*/%.]+$/;
  const phraseMatch = compact.match(/(?:tinh|calculate|bang bao nhieu|ket qua)\s*([\d\s()+\-*/%.]+)/i);
  const expression = directPattern.test(compact) ? compact : phraseMatch?.[1]?.trim();
  if (!expression || !/^[\d\s()+\-*/%.]+$/.test(expression)) return null;
  try {
    const result = Function('"use strict"; return (' + expression + ');')();
    if (!Number.isFinite(result)) return null;
    return formatNumber(result);
  } catch {
    return null;
  }
};

// Xac dinh trang tu noi dung cau hoi (uu tien cao nhat)
const detectPageFromQuestion = (normalized) => {
  for (const [key, page] of Object.entries(PAGES)) {
    if (hasAny(normalized, page.keywords)) return key;
  }
  return null;
};

// Xac dinh trang nguoi dung dang dung (tu payload)
const detectCurrentPage = (payload = {}) => {
  const page = normalizeText(payload.page || '');
  const path = normalizeText(payload.path || '');
  const combined = page + ' ' + path;

  for (const [key, info] of Object.entries(PAGES)) {
    if (hasAny(combined, info.keywords)) return key;
  }

  const pathMap = {
    dashboard: '/app/dashboard',
    customers: '/app/customers',
    deals: '/app/deals',
    quotes: '/app/quotes',
    products: '/app/products',
    invoices: '/app/invoices',
    leadSources: '/app/lead-sources',
    reports: '/app/reports',
    segments: '/app/segments',
    support: '/app/support-tickets',
    forecasts: '/app/forecasts',
    calendar: '/app/calendar',
    chatUi: '/app/chat',
    importExport: '/app/import',
    users: '/app/users',
    settings: '/app/settings',
  };

  for (const [key, pathPrefix] of Object.entries(pathMap)) {
    if (path.includes(pathPrefix)) return key;
  }

  return null;
};

// Phan loai loai cau hoi
const detectQuestionType = (normalized) => {
  // Chao hoi thuan tuy (khong chua tu khoa noi dung)
  if (
    hasAny(normalized, ['xin chao', 'hello', 'hi ', 'hey ', 'chao ban']) &&
    !hasAny(normalized, [
      '?', 'la gi', 'lam gi', 'the nao', 'nhu the nao',
      'huong dan', 'cach', 'muon biet', 'giai thich',
      'du bao', 'bao cao', 'tom tat', 'goi y',
    ])
  ) {
    if (normalized.split(/\s+/).filter(Boolean).length <= 5) return 'greeting';
  }

  // Cam on / ket thuc
  if (
    hasAny(normalized, ['cam on', 'cmon', 'thanks', 'thank you', 'ok roi', 'duoc roi', 'hieu roi']) &&
    normalized.split(/\s+/).length <= 5
  ) {
    return 'thanks';
  }

  // Tro ly la ai
  if (hasAny(normalized, ['ban la ai', 'may la ai', 'tro ly la ai', 'who are you', 'introduce'])) {
    return 'identity';
  }

  // Tom tat / tong hop
  if (hasAny(normalized, ['tom tat', 'tong hop', 'tong ket', 'tom luoc', 'ngan gon', 'overview'])) {
    return 'summary';
  }

  // Huong dan / cach dung
  if (hasAny(normalized, [
    'huong dan', 'cach dung', 'lam the nao', 'nhu the nao', 'the nao',
    'cach nao', 'cac buoc', 'step', 'cach su dung', 'su dung nhu the nao',
  ])) {
    return 'howto';
  }

  // Giai thich chuc nang
  if (hasAny(normalized, [
    'la gi', 'dung de lam gi', 'dung de', 'de lam gi',
    'chuc nang', 'giai thich', 'mo ta', 'muon biet',
    'biet them', 'them ve', 'biet ve', 'gioi thieu',
  ])) {
    return 'explain';
  }

  // Goi y hanh dong
  if (hasAny(normalized, [
    'nen lam gi', 'uu tien', 'goi y', 'de xuat',
    'hanh dong', 'bat dau tu dau', 'tiep theo', 'can lam gi',
  ])) {
    return 'suggest';
  }

  // Phan tich / bao cao / chi so
  if (hasAny(normalized, [
    'phan tich', 'bao cao', 'report', 'chi so', 'kpi',
    'hieu suat', 'tang', 'giam', 'so sanh', 'xu huong',
    'doanh thu', 'won', 'lost',
  ])) {
    return 'report';
  }

  return 'general';
};

// Phan tich tong hop dau vao
const analyzeMessage = (raw, payload) => {
  const normalized = normalizeText(raw);
  const mathResult = tryMath(normalized);
  // Trang tu cau hoi uu tien hon trang dang dung
  const questionPageKey = detectPageFromQuestion(normalized);
  const currentPageKey = detectCurrentPage(payload);
  const targetPageKey = questionPageKey || currentPageKey;
  const questionType = detectQuestionType(normalized);
  return { normalized, mathResult, questionPageKey, currentPageKey, targetPageKey, questionType };
};

// ================================================================
// BUOC 2: XAY DUNG CAU TRA LOI
// ================================================================

const buildDetailedReportReply = (normalized, page) => {
  if (hasAny(normalized, ['tom tat', 'tong quan', 'tuan nay', 'hom nay', 'thang nay'])) {
    return page.summary;
  }
  if (hasAny(normalized, ['nen lam gi', 'hanh dong', 'goi y', 'uu tien'])) {
    return page.suggest;
  }
  if (hasAny(normalized, ['tang', 'giam', 'so sanh', 'xu huong', 'chi so'])) {
    return (
      'Phân tích xu hướng ' + page.label +
      ': chỉ số tăng → giữ quy trình hiệu quả và nhân rộng; ' +
      'chỉ số giảm → khoanh vùng điểm nghẽn mạnh nhất, gắn owner chịu trách nhiệm và deadline 48 giờ.\n\n' +
      page.suggest
    );
  }
  return page.summary + '\n\n' + page.suggest;
};

const buildGeneralFallback = (normalized, questionType) => {
  if (hasAny(normalized, ['dang nhap', 'login', 'mat khau', 'password', 'token', 'phien'])) {
    return (
      'Để đăng nhập: dùng tài khoản được cấp, nhập đúng email + mật khẩu. ' +
      'Nếu bị văng phiên, đăng nhập lại để làm mới token. ' +
      'Quên mật khẩu → dùng chức năng "Quên mật khẩu" trên trang Login hoặc nhờ admin cấp lại.'
    );
  }

  const pageList = Object.values(PAGES).map((p) => p.label).join(', ');

  if (questionType === 'howto' || questionType === 'explain') {
    return (
      'Bạn muốn tìm hiểu trang nào trong CRM? Mình có thể hướng dẫn về: ' +
      pageList +
      '. Hãy hỏi cụ thể hơn, ví dụ: "Forecasts dùng để làm gì?" hoặc "Cách dùng Deals?".'
    );
  }

  return (
    'Mình có thể hỗ trợ bạn về các tính năng CRM: ' +
    pageList +
    '. Hãy đặt câu hỏi cụ thể về trang bạn muốn tìm hiểu!'
  );
};

const buildReply = (analysis, userRole = 'member') => {
  const { normalized, mathResult, targetPageKey, questionType } = analysis;
  const page = targetPageKey ? PAGES[targetPageKey] : null;

  // Toan hoc
  if (mathResult !== null) {
    return { intent: 'math', reply: 'Kết quả: ' + mathResult };
  }

  // Chao hoi
  if (questionType === 'greeting') {
    return {
      intent: 'greeting',
      reply:
        'Xin chào! Tôi là trợ lý AI CRM. ' +
        'Tôi có thể giúp bạn tìm hiểu bất kỳ trang nào trong hệ thống — ' +
        'hỏi về Dashboard, Deals, Reports, Forecasts hay bất kỳ tính năng nào bạn muốn!',
    };
  }

  // Cam on
  if (questionType === 'thanks') {
    return {
      intent: 'thanks',
      reply: 'Rất vui được hỗ trợ bạn! Nếu còn câu hỏi nào, cứ hỏi mình nhé.',
    };
  }

  // Tro ly la ai
  if (questionType === 'identity') {
    return {
      intent: 'identity',
      reply:
        'Tôi là trợ lý AI tích hợp trong hệ thống CRM — giúp bạn hiểu chức năng từng trang, ' +
        'hướng dẫn thao tác và gợi ý hành động hiệu quả. Hỏi tôi bất cứ điều gì về CRM!',
    };
  }

  // Kiem tra quyen truy cap admin
  const isAdminPage = targetPageKey === 'users';
  if (isAdminPage && userRole !== 'admin') {
    return {
      intent: 'restricted',
      reply: 'Phần quản lý người dùng chỉ dành cho Admin. Nếu bạn cần hỗ trợ, vui lòng liên hệ quản trị viên của hệ thống.',
    };
  }

  // Co trang cu the → tra loi theo loai cau hoi
  if (page) {
    switch (questionType) {
      case 'summary': return { intent: 'page_summary', reply: page.summary };
      case 'howto':   return { intent: 'page_howto',   reply: page.how };
      case 'suggest': return { intent: 'page_suggest', reply: page.suggest };
      case 'report':  return { intent: 'page_report',  reply: buildDetailedReportReply(normalized, page) };
      case 'explain':
      case 'general':
      default:
        return { intent: 'page_explain', reply: page.what + '\n\n' + page.how };
    }
  }

  // Khong xac dinh duoc trang → fallback chung
  return {
    intent: 'general',
    reply: buildGeneralFallback(normalized, questionType),
  };
};

// ================================================================
// BUOC 3: ENTRY POINT
// ================================================================

export const askChatAssistant = async (payload) => {
  const raw = String(payload?.message || '').trim();
  const userRole = payload?.userRole || 'member';

  if (!raw) {
    return {
      intent: 'general',
      reply: 'Bạn hãy gửi câu hỏi cụ thể, mình sẽ trả lời ngay!',
    };
  }

  // Buoc 1: Phan tich tin nhan
  const analysis = analyzeMessage(raw, payload);

  // Buoc 2: Xay dung cau tra loi
  return buildReply(analysis, userRole);
};