import React, { useState } from 'react';
import useTaskStore from '../store/taskStore';
import './TaskCard.css';

const priorityIcons = {
  LOW: '▼',
  MEDIUM: '●',
  HIGH: '▲',
  URGENT: '▲▲'
};

const priorityColors = {
  LOW: '#3B82F6',
  MEDIUM: '#F59E0B',
  HIGH: '#EF4444',
  URGENT: '#8B5CF6'
};

const TaskCard = ({ task, onTaskChange }) => {
  const { updateTaskStatus, removeTask } = useTaskStore();
  const [showMenu, setShowMenu] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const dueDate = new Date(task.dueDate);
  const today = new Date();
  const isOverdue = dueDate < today && task.status !== 'DONE' && task.status !== 'CANCELLED';
  const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

  const handleStatusChange = async (newStatus) => {
    setIsProcessing(true);
    try {
      await updateTaskStatus(task.id, newStatus);
      onTaskChange();
    } finally {
      setIsProcessing(false);
      setShowMenu(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Bạn có chắc muốn xóa task này?')) {
      try {
        await removeTask(task.id);
        onTaskChange();
      } catch (error) {
        console.error('Delete failed:', error);
      }
    }
  };

  return (
    <div
      className={`task-card ${isOverdue ? 'overdue' : ''}`}
      style={{ borderLeftColor: priorityColors[task.priority] }}
    >
      <div className="card-header">
        <h5 className="card-title">{task.title}</h5>
        <div className="card-priority">
          <span
            className="priority-badge"
            style={{ backgroundColor: priorityColors[task.priority] }}
            title={task.priority}
          >
            {priorityIcons[task.priority]}
          </span>
        </div>
      </div>

      {task.description && (
        <p className="card-description">{task.description.substring(0, 80)}...</p>
      )}

      <div className="card-footer">
        <div className="due-date">
          {isOverdue && <span className="overdue-badge">Quá hạn</span>}
          <span className={isOverdue ? 'date red' : daysUntilDue <= 3 ? 'date orange' : 'date'}>
            {dueDate.toLocaleDateString('vi-VN')}
          </span>
        </div>

        <div className="card-actions">
          <div className="action-menu">
            <button
              className="menu-btn"
              onClick={() => setShowMenu(!showMenu)}
              disabled={isProcessing}
            >
              ⋮
            </button>
            {showMenu && (
              <div className="menu-dropdown">
                {task.status !== 'DONE' && (
                  <button onClick={() => handleStatusChange('DONE')}>
                    ✓ Hoàn thành
                  </button>
                )}
                {task.status !== 'IN_PROGRESS' && task.status !== 'DONE' && (
                  <button onClick={() => handleStatusChange('IN_PROGRESS')}>
                    ► Đang làm
                  </button>
                )}
                {task.status !== 'TODO' && (
                  <button onClick={() => handleStatusChange('TODO')}>
                    ↻ Chưa làm
                  </button>
                )}
                <button onClick={() => handleStatusChange('CANCELLED')}>
                  ✕ Hủy
                </button>
                <hr />
                <button onClick={handleDelete} className="delete">
                  🗑️ Xóa
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {task.assignee && (
        <div className="card-assignee">
          <small>👤 {task.assignee.name}</small>
        </div>
      )}
    </div>
  );
};

export default TaskCard;
