import React, { useState, useEffect } from 'react';
import useActivityStore from '../store/activityStore';
import ActivityForm from './ActivityForm';
import './ActivityTimeline.css';

const ACTIVITY_TYPES = {
  NOTE: { icon: '📝', label: 'Ghi chú', color: '#3B82F6' },
  CALL: { icon: '☎️', label: 'Cuộc gọi', color: '#10B981' },
  EMAIL: { icon: '📧', label: 'Email', color: '#F59E0B' },
  MEETING: { icon: '👥', label: 'Gặp mặt', color: '#8B5CF6' },
  OTHER: { icon: '📌', label: 'Khác', color: '#6B7280' }
};

const ActivityTimeline = ({ customerId, dealId, onClose }) => {
  const { activities, fetchActivities, removeActivity } = useActivityStore();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadActivities();
  }, [customerId, dealId]);

  const loadActivities = async () => {
    setLoading(true);
    try {
      await fetchActivities({ customerId, dealId });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteActivity = async (activityId) => {
    if (window.confirm('Bạn có chắc muốn xóa hoạt động này?')) {
      try {
        await removeActivity(activityId);
      } catch (error) {
        console.error('Delete failed:', error);
      }
    }
  };

  const filteredActivities = activities.filter(
    (a) => (!customerId || a.customerId === customerId) && 
            (!dealId || a.dealId === dealId)
  );

  return (
    <div className="activity-timeline">
      <div className="activity-header">
        <h3>Dòng thời gian hoạt động</h3>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '✕ Đóng' : '+ Thêm hoạt động'}
        </button>
      </div>

      {showForm && (
        <div className="activity-form-wrapper">
          <ActivityForm
            customerId={customerId}
            dealId={dealId}
            onSuccess={() => {
              setShowForm(false);
              loadActivities();
            }}
          />
        </div>
      )}

      {loading ? (
        <div className="activity-loading">Đang tải...</div>
      ) : filteredActivities.length === 0 ? (
        <div className="activity-empty">
          <p>Chưa có hoạt động nào</p>
          <button
            className="btn btn-outline-primary"
            onClick={() => setShowForm(true)}
          >
            Tạo hoạt động đầu tiên
          </button>
        </div>
      ) : (
        <div className="timeline">
          {filteredActivities.map((activity) => {
            const type = ACTIVITY_TYPES[activity.type] || ACTIVITY_TYPES.OTHER;
            const createdDate = new Date(activity.createdAt);

            return (
              <div
                key={activity.id}
                className="timeline-item"
                style={{ borderLeftColor: type.color }}
              >
                <div className="timeline-marker" style={{ backgroundColor: type.color }}>
                  {type.icon}
                </div>
                <div className="timeline-content">
                  <div className="timeline-header">
                    <h5>
                      {type.label}
                      {activity.creator && (
                        <span className="creator-info">
                          {' '}bởi {activity.creator.name}
                        </span>
                      )}
                    </h5>
                    <span className="timeline-time">
                      {createdDate.toLocaleDateString('vi-VN')}
                      {' '}
                      {createdDate.toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <p className="timeline-text">{activity.content}</p>
                  <div className="timeline-actions">
                    <button
                      className="btn-text btn-sm"
                      onClick={() => handleDeleteActivity(activity.id)}
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActivityTimeline;
