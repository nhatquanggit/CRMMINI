import { createRequire } from 'module';
import { getCustomersForExport, getDealsForExport, bulkInsertCustomers } from '../models/import-export.model.js';
import ApiError from '../utils/apiError.js';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

const VALID_STATUSES  = new Set(['NEW', 'CONTACTED', 'CONVERTED']);
const MAX_IMPORT_ROWS = 1000;

// ─── Export ──────────────────────────────────────────────────────────────────

export const exportCustomers = async (user) => {
  const isAdmin = user.role === 'ADMIN' || user.role === 'MANAGER';
  const rows = await getCustomersForExport(user.id, isAdmin);

  const sheetData = [
    ['ID', 'Tên khách hàng', 'Email', 'Điện thoại', 'Công ty', 'Trạng thái', 'Nhân viên phụ trách', 'Ngày tạo'],
    ...rows.map((r) => [
      r.id,
      r.name,
      r.email,
      r.phone,
      r.company,
      r.status,
      r.assigneeName || '',
      r.createdAt ? new Date(r.createdAt).toLocaleDateString('vi-VN') : ''
    ])
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Column widths
  ws['!cols'] = [
    { wch: 6 }, { wch: 25 }, { wch: 30 }, { wch: 15 },
    { wch: 25 }, { wch: 12 }, { wch: 20 }, { wch: 14 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Khách hàng');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
};

export const exportDeals = async (user) => {
  const isAdmin = user.role === 'ADMIN' || user.role === 'MANAGER';
  const rows = await getDealsForExport(user.id, isAdmin);

  const sheetData = [
    ['ID', 'Tiêu đề', 'Giá trị (VNĐ)', 'Giai đoạn', 'Khách hàng', 'Nhân viên phụ trách', 'Ngày tạo'],
    ...rows.map((r) => [
      r.id,
      r.title,
      Number(r.value),
      r.stage,
      r.customerName || '',
      r.ownerName || '',
      r.createdAt ? new Date(r.createdAt).toLocaleDateString('vi-VN') : ''
    ])
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  ws['!cols'] = [
    { wch: 6 }, { wch: 30 }, { wch: 16 }, { wch: 14 },
    { wch: 25 }, { wch: 20 }, { wch: 14 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Deals');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
};

// ─── Import ──────────────────────────────────────────────────────────────────

/**
 * Parse an uploaded .xlsx/.csv buffer and return validated row objects.
 * Expected columns (case-insensitive): name, email, phone, company, status
 */
const parseImportBuffer = (buffer, mimetype) => {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) throw new ApiError(400, 'File không có sheet nào');

  const ws = wb.Sheets[sheetName];
  // header:1 returns an array of arrays; header row first
  const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  if (raw.length < 2) throw new ApiError(400, 'File không có dữ liệu (cần ít nhất 1 dòng tiêu đề + 1 dòng data)');

  // Normalize header row
  const headers = raw[0].map((h) => String(h).trim().toLowerCase());

  const col = (name) => {
    const idx = headers.indexOf(name);
    return idx === -1 ? null : idx;
  };

  const nameIdx    = col('name') ?? col('tên') ?? col('ten') ?? col('họ tên') ?? col('ho ten');
  const emailIdx   = col('email');
  const phoneIdx   = col('phone') ?? col('điện thoại') ?? col('dien thoai') ?? col('sdt');
  const companyIdx = col('company') ?? col('công ty') ?? col('cong ty');
  const statusIdx  = col('status') ?? col('trạng thái') ?? col('trang thai');

  if (nameIdx === null) throw new ApiError(400, 'File thiếu cột "name" (tên khách hàng)');
  if (emailIdx === null) throw new ApiError(400, 'File thiếu cột "email"');

  const dataRows = raw.slice(1).filter((r) => r.some((c) => String(c).trim()));

  if (dataRows.length > MAX_IMPORT_ROWS) {
    throw new ApiError(400, `Tối đa ${MAX_IMPORT_ROWS} dòng mỗi lần import`);
  }

  const parsed = [];
  const parseErrors = [];

  dataRows.forEach((row, i) => {
    const name  = String(row[nameIdx]  || '').trim();
    const email = String(row[emailIdx] || '').trim().toLowerCase();
    const phone = phoneIdx !== null ? String(row[phoneIdx] || '').trim() : '';
    const company = companyIdx !== null ? String(row[companyIdx] || '').trim() : '';
    let status = statusIdx !== null ? String(row[statusIdx] || '').trim().toUpperCase() : 'NEW';

    if (!name) { parseErrors.push(`Dòng ${i + 2}: Thiếu tên`); return; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      parseErrors.push(`Dòng ${i + 2}: Email không hợp lệ (${email})`);
      return;
    }
    if (!VALID_STATUSES.has(status)) status = 'NEW';

    parsed.push({ name, email, phone, company, status });
  });

  return { rows: parsed, parseErrors };
};

export const importCustomers = async (buffer, mimetype, user) => {
  if (!buffer || buffer.length === 0) throw new ApiError(400, 'File rỗng');

  const { rows, parseErrors } = parseImportBuffer(buffer, mimetype);

  if (rows.length === 0) {
    throw new ApiError(400, 'Không có dòng hợp lệ để import' + (parseErrors.length ? ': ' + parseErrors[0] : ''));
  }

  const result = await bulkInsertCustomers(rows, user.id);

  return {
    total:    rows.length + parseErrors.length,
    valid:    rows.length,
    inserted: result.inserted.length,
    skipped:  result.skipped.length,
    errors:   [...parseErrors, ...result.errors.map((e) => `${e.row}: ${e.reason}`)],
    skippedList: result.skipped
  };
};
