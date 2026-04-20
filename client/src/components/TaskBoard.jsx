import React, { useState, useEffect } from 'react';
import useTaskStore from '../store/taskStore';
import TaskCard from './TaskCard';
import TaskForm from './TaskForm';
import './TaskBoard.css';

const STATUSES = [
  { value: 'TODO', label: 'Cần làm', color: '#EF4444' },
  { value: 'IN_PROGRESS', label: 'Đang làm', color: '#F59E0B' },
  { value: 'DONE', label: 'Hoàn thành', color: '#10B981' },
  { value: 'CANCELLED', label: 'Hủy', color: '#9CA3AF' }
];

const TaskBoard = ({ customerId, dealId, viewMode = 'board' }) => {
  const { tasks, fetchTasks, stats, fetchStats } = useTaskStore();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filterPriority, setFilterPriority] = useState(null);

  useEffect(() => {
    loadTasks();
  }, [customerId, dealId]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const filters = {};
      if (customerId) filters.customerId = customerId;
      if (dealId) filters.dealId = dealId;
      await fetchTasks(filters);
      await fetchStats();
    } finally {
      setLoading(false);
    }
  };

  const getTasksByStatus = (status) => {
    return tasks.filter((t) => {
      if (t.status !== status) return false;
      if (filterPriority && t.priority !== filterPriority) return false;
      return true;
    });
  };

  if (viewMode === 'list') {
    return (
      <TaskList
        tasks={tasks}
        loading={loading}
        onLoadTasks={loadTasks}
        customerId={customerId}
        dealId={dealId}
      />
    );
  }

  return (
    <div className="task-board">
      <div className="board-header">
        <h3>Bảng quản lý nhiệm vụ</h3>
        <div className="board-controls">
          {filterPriority && (
            <span className="filter-badge">
              {filterPriority}
              <button className="btn-close" onClick={() => setFilterPriority(null)}>×</button>
            </span>
          )}
          <select
            className="filter-select"
            value={filterPriority || ''}
            onChange={(e) => setFilterPriority(e.target.value || null)}
          >
            <option value="">Tất cả mức độ</option>
            <option value="LOW">Thấp</option>
            <option value="MEDIUM">Trung bình</option>
            <option value="HIGH">Cao</option>
            <option value="URGENT">Khẩn cấp</option>
          </select>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? '✕' : '+ Tạo task'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="board-form">
          <TaskForm
            customerId={customerId}
            dealId={dealId}
            onSuccess={() => {
              setShowForm(false);
              loadTasks();
            }}
          />
        </div>
      )}

      <div className="board-container">
        {STATUSES.map((status) => {
          const statusTasks = getTasksByStatus(status.value);
          return (
            <div key={status.value} className="board-column">
              <div className="column-header" style={{ borderTopColor: status.color }}>
                <h4>{status.label}</h4>
                <span className="task-count">{statusTasks.length}</span>
              </div>
              <div className="column-content">
                {statusTasks.length === 0 ? (
                  <div className="empty-state">Không có task</div>
                ) : (
                  statusTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onTaskChange={loadTasks}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Stats Row */}
      <div className="board-stats">
        <div className="stat-item">
          <span className="stat-label">Tổng cộng</span>
          <span className="stat-value">{stats.total}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Quá hạn</span>
          <span className="stat-value" style={{ color: '#EF4444' }}>{stats.overdue}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Đang làm</span>
          <span className="stat-value" style={{ color: '#F59E0B' }}>{stats.inProgress}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Hoàn thành</span>
          <span className="stat-value" style={{ color: '#10B981' }}>{stats.done}</span>
        </div>
      </div>
    </div>
  );
};

const TaskList = ({ tasks, loading, onLoadTasks, customerId, dealId }) => {
  const [sortBy, setSortBy] = useState('dueDate');

  const sortedTasks = [...tasks].sort((a, b) => {
    switch (sortBy) {
      case 'dueDate':
        return new Date(a.dueDate) - new Date(b.dueDate);
      case 'priority':
        const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      case 'status':
        return a.status.localeCompare(b.status);
      default:
        return 0;
    }
  });

  const statusColors = {
    TODO: '#EF4444',
    IN_PROGRESS: '#F59E0B',
    DONE: '#10B981',
    CANCELLED: '#9CA3AF'
  };

  const priorityColors = {
    LOW: '#3B82F6',
    MEDIUM: '#F59E0B',
    HIGH: '#EF4444',
    URGENT: '#8B5CF6'
  };

  return (
    <div className="task-list">
      <div className="list-header">
        <h3>Danh sách nhiệm vụ</h3>
        <select
          className="sort-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="dueDate">Sắp xếp: Đến hạn</option>
          <option value="priority">Sắp xếp: Mức độ</option>
          <option value="status">Sắp xếp: Trạng thái</option>
        </select>
      </div>

      {loading ? (
        <div className="loading">Đang tải...</div>
      ) : tasks.length === 0 ? (
        <div className="empty">Không có task nào</div>
      ) : (
        <table className="task-table">
          <thead>
            <tr>
              <th>Tiêu đề</th>
              <th>Trạng thái</th>
              <th>Mức độ</th>
              <th>Đến hạn</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {sortedTasks.map((task) => (
              <tr key={task.id}>
                <td className="task-title">{task.title}</td>
                <td>
                  <span
                    className="badge"
                    style={{ backgroundColor: statusColors[task.status] }}
                  >
                    {task.status}
                  </span>
                </td>
                <td>
                  <span
                    className="badge"
                    style={{ backgroundColor: priorityColors[task.priority] }}
                  >
                    {task.priority}
                  </span>
                </td>
                <td>{new Date(task.dueDate).toLocaleDateString('vi-VN')}</td>
                <td>
                  <button className="btn-action">✓</button>
                  <button className="btn-action">✎</button>
                  <button className="btn-action">✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default TaskBoard;
