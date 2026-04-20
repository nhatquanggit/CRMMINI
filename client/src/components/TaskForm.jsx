import React, { useState } from 'react';
import useTaskStore from '../store/taskStore';

const TaskForm = ({ customerId, dealId, onSuccess }) => {
  const { addTask } = useTaskStore();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    dueDate: '',
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
      if (!formData.title.trim()) {
        throw new Error('Vui lòng nhập tiêu đề task');
      }
      if (!formData.description.trim()) {
        throw new Error('Vui lòng nhập mô tả');
      }
      if (!formData.dueDate) {
        throw new Error('Vui lòng chọn ngày đến hạn');
      }

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
        dueDate: new Date(formData.dueDate).toISOString(),
        assignedTo: 1, // TODO: Get from current user context
        ...(formData.customerId && { customerId: formData.customerId }),
        ...(formData.dealId && { dealId: formData.dealId })
      };

      await addTask(payload);

      setFormData({
        title: '',
        description: '',
        priority: 'MEDIUM',
        dueDate: '',
        customerId: customerId || null,
        dealId: dealId || null
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err.message || 'Lỗi khi tạo task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="title">Tiêu đề</label>
          <input
            id="title"
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="form-control"
            placeholder="Nhập tiêu đề task..."
          />
        </div>
        <div className="form-group">
          <label htmlFor="priority">Mức độ</label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="form-control"
          >
            <option value="LOW">Thấp</option>
            <option value="MEDIUM">Trung bình</option>
            <option value="HIGH">Cao</option>
            <option value="URGENT">Khẩn cấp</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="description">Mô tả</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="form-control"
          rows="3"
          placeholder="Nhập mô tả chi tiết..."
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="dueDate">Đến hạn</label>
          <input
            id="dueDate"
            type="datetime-local"
            name="dueDate"
            value={formData.dueDate}
            onChange={handleChange}
            className="form-control"
          />
        </div>
      </div>

      <div className="form-actions">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Đang tạo...' : 'Tạo task'}
        </button>
      </div>
    </form>
  );
};

export default TaskForm;
