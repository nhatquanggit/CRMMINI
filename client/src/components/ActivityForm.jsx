import React, { useState } from 'react';
import useActivityStore from '../store/activityStore';

const ACTIVITY_TYPES = [
  { value: 'NOTE', label: '📝 Ghi chú' },
  { value: 'CALL', label: '☎️ Cuộc gọi' },
  { value: 'EMAIL', label: '📧 Email' },
  { value: 'MEETING', label: '👥 Gặp mặt' },
  { value: 'OTHER', label: '📌 Khác' }
];

const ActivityForm = ({ customerId, dealId, onSuccess, editingActivity }) => {
  const { addActivity, editActivity } = useActivityStore();
  const [formData, setFormData] = useState({
    type: editingActivity?.type || 'NOTE',
    content: editingActivity?.content || '',
    customerId: customerId || null,
    dealId: dealId || null
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!formData.type) {
        throw new Error('Vui lòng chọn loại hoạt động');
      }
      if (!formData.content.trim()) {
        throw new Error('Vui lòng nhập nội dung hoạt động');
      }
      if (!formData.customerId && !formData.dealId) {
        throw new Error('Vui lòng chọn khách hàng hoặc deal');
      }

      const payload = {
        type: formData.type,
        content: formData.content.trim(),
        ...(formData.customerId && { customerId: formData.customerId }),
        ...(formData.dealId && { dealId: formData.dealId })
      };

      if (editingActivity) {
        await editActivity(editingActivity.id, payload);
      } else {
        await addActivity(payload);
      }

      setFormData({
        type: 'NOTE',
        content: '',
        customerId: customerId || null,
        dealId: dealId || null
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err.message || 'Lỗi khi lưu hoạt động');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="activity-form" onSubmit={handleSubmit}>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="form-group">
        <label htmlFor="type">Loại hoạt động</label>
        <select
          id="type"
          name="type"
          value={formData.type}
          onChange={handleChange}
          className="form-control"
        >
          {ACTIVITY_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="content">Nội dung</label>
        <textarea
          id="content"
          name="content"
          value={formData.content}
          onChange={handleChange}
          className="form-control"
          rows="4"
          placeholder="Nhập nội dung của hoạt động..."
        />
      </div>

      <div className="form-actions">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Đang lưu...' : (editingActivity ? 'Cập nhật hoạt động' : 'Thêm hoạt động')}
        </button>
      </div>
    </form>
  );
};

export default ActivityForm;
