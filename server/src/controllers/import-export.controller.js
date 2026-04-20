import asyncHandler from '../utils/asyncHandler.js';
import {
  exportCustomers,
  exportDeals,
  importCustomers
} from '../services/import-export.service.js';

// ─── Export ───────────────────────────────────────────────────

export const exportCustomersHandler = asyncHandler(async (req, res) => {
  const buffer = await exportCustomers(req.user);
  const filename = `customers_${new Date().toISOString().slice(0, 10)}.xlsx`;
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buffer);
});

export const exportDealsHandler = asyncHandler(async (req, res) => {
  const buffer = await exportDeals(req.user);
  const filename = `deals_${new Date().toISOString().slice(0, 10)}.xlsx`;
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buffer);
});

// ─── Import ───────────────────────────────────────────────────

export const importCustomersHandler = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Không tìm thấy file upload' });
  }

  const result = await importCustomers(req.file.buffer, req.file.mimetype, req.user);

  res.status(200).json({
    success: true,
    message: `Import hoàn tất: ${result.inserted} thêm mới, ${result.skipped} bỏ qua`,
    data: result
  });
});
