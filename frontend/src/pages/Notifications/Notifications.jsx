import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Calendar, Users, MessageCircle, CheckCircle, Megaphone, UserPlus, X } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import '../../components/ui/Components.css';
import './Notifications.css';

const iconMap = { calendar: Calendar, users: Users, 'message-circle': MessageCircle, 'check-circle': CheckCircle, megaphone: Megaphone, 'user-plus': UserPlus, bell: Bell };
const colorMap = { event: 'var(--primary-500)', club: 'var(--accent-500)', message: 'var(--success-500)', announcement: 'var(--warning-500)', registration: 'var(--success-500)', approval: 'var(--success-500)', reminder: 'var(--primary-400)' };
const bgMap = { event: 'var(--primary-50)', club: 'var(--accent-50)', message: 'var(--success-50)', announcement: 'var(--warning-50)', registration: 'var(--success-50)', approval: 'var(--success-50)', reminder: 'var(--primary-50)' };

export default function Notifications() {
  const { notifications, markAsRead, markAllAsRead, dismissNotification, unreadCount } = useNotifications();
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? notifications : filter === 'unread' ? notifications.filter(n => !n.isRead) : notifications.filter(n => n.type === filter);
  const filters = ['all', 'unread', 'event', 'club', 'message', 'announcement'];

  return (
    <div className="notif-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>🔔 Notifications</h1>
          <p>{unreadCount} unread notifications</p>
        </div>
        <div className="notif-header-actions">
          <button className="btn btn-secondary btn-sm" onClick={markAllAsRead}>Mark all read</button>
        </div>
      </div>

      <div className="notif-filters">
        {filters.map(f => (
          <button key={f} className={`filter-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="notif-list">
        {filtered.map(n => {
          const Icon = iconMap[n.icon] || Bell;
          return (
            <Link to={n.link} className={`notif-item ${!n.isRead ? 'unread' : ''}`} key={n.id} onClick={() => markAsRead(n.id)}>
              <div className="notif-icon" style={{ background: bgMap[n.type], color: colorMap[n.type] }}><Icon size={18} /></div>
              <div className="notif-content"><h4>{n.title}</h4><p>{n.message}</p></div>
              <span className="notif-time">{n.time}</span>
              <button className="notif-dismiss" onClick={(e) => { e.preventDefault(); e.stopPropagation(); dismissNotification(n.id); }}><X size={16} /></button>
            </Link>
          );
        })}
        {filtered.length === 0 && <div className="empty-state"><Bell size={48} className="empty-state-icon" /><h3>All caught up!</h3><p>No notifications to show</p></div>}
      </div>
    </div>
  );
}
