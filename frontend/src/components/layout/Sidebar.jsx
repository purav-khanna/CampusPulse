import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, Users, MessageCircle, Bell, User, Settings,
  Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useChat } from '../../context/ChatContext';
import './Sidebar.css';

const studentLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/events', icon: Calendar, label: 'Events' },
  { to: '/clubs', icon: Users, label: 'Clubs' },
  { to: '/chat', icon: MessageCircle, label: 'Chat' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
];

const professorLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/events', icon: Calendar, label: 'Events' },
  { to: '/clubs', icon: Users, label: 'Clubs' },
  { to: '/clubs/manage', icon: Users, label: 'Club Management' },
  { to: '/chat', icon: MessageCircle, label: 'Messages' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
];

const clubLeaderLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/events', icon: Calendar, label: 'Events' },
  { to: '/clubs', icon: Users, label: 'Clubs' },
  { to: '/chat', icon: MessageCircle, label: 'Chat' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
];

const adminLinks = [
  { to: '/admin', icon: Shield, label: 'Admin Panel' },
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/events', icon: Calendar, label: 'Events' },
  { to: '/clubs', icon: Users, label: 'Clubs' },
  { to: '/chat', icon: MessageCircle, label: 'Chat' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
];

const secondaryLinks = [
  { to: '/profile', icon: User, label: 'Profile' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const { totalUnreadCount } = useChat();

  const getLinks = () => {
    if (user?.role === 'admin') return adminLinks;
    if (user?.role === 'professor') return professorLinks;
    if (user?.role === 'clubLeader' || user?.role === 'club_leader') return clubLeaderLinks;
    return studentLinks;
  };

  const mainLinks = getLinks();

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'visible' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <img src="/logo.png" alt="CampusPulse Logo" className="sidebar-logo-img" />
          <span className="sidebar-brand-text">Campus<span>Pulse</span></span>
        </div>
        <nav className="sidebar-nav">
          <div className="sidebar-section">
            <div className="sidebar-section-title">Main</div>
            {mainLinks.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={onClose}
                end={link.to === '/dashboard' || link.to === '/admin'}
              >
                <link.icon className="sidebar-link-icon" />
                {link.label}
                {link.label === 'Notifications' && unreadCount > 0 && (
                  <span className="sidebar-link-badge">{unreadCount}</span>
                )}
                {(link.label === 'Chat' || link.label === 'Messages') && totalUnreadCount > 0 && (
                  <span className="sidebar-link-badge">
                    {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
                  </span>
                )}
              </NavLink>
            ))}
          </div>

          <div className="sidebar-section account-section">
            <div className="sidebar-section-title">Account</div>
            {secondaryLinks.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <link.icon className="sidebar-link-icon" />
                {link.label}
              </NavLink>
            ))}
          </div>
        </nav>
      </aside>
    </>
  );
}
