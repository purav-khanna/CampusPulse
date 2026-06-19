import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Bell, Menu, User, Settings, LogOut, Sparkles, Send, X, Loader2, Copy, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { getAvatarInitials, getAvatarGradient } from '../../utils/gemini';
import { apiService } from '../../services/api';
import './Navbar.css';

// Markdown parser helper for dynamic internal routing
const parseMarkdown = (text, navigate, onClose) => {
  if (!text) return null;
  
  const lines = text.split('\n');
  return lines.map((line, lIdx) => {
    const elements = [];
    let lastIdx = 0;
    
    // Regular expression for bold **text** and markdown links [text](url)
    const regex = /(\*\*.*?\*\*|\[.*?\]\(.*?\))/g;
    let match;
    let key = 0;
    
    while ((match = regex.exec(line)) !== null) {
      const matchText = match[0];
      const matchIdx = match.index;
      
      // Add plain text before match
      if (matchIdx > lastIdx) {
        elements.push(line.substring(lastIdx, matchIdx));
      }
      
      if (matchText.startsWith('**') && matchText.endsWith('**')) {
        const content = matchText.slice(2, -2);
        elements.push(<strong key={key++}>{content}</strong>);
      } else if (matchText.startsWith('[') && matchText.includes('](')) {
        const closeBracketIdx = matchText.indexOf(']');
        const linkText = matchText.slice(1, closeBracketIdx);
        const url = matchText.slice(closeBracketIdx + 2, -1);
        
        if (url.startsWith('/')) {
          elements.push(
            <Link 
              key={key++} 
              to={url} 
              onClick={onClose}
              className="ai-response-link"
            >
              {linkText}
            </Link>
          );
        } else {
          elements.push(
            <a 
              key={key++} 
              href={url} 
              target="_blank" 
              rel="noreferrer" 
              className="ai-response-link"
            >
              {linkText}
            </a>
          );
        }
      }
      
      lastIdx = regex.lastIndex;
    }
    
    if (lastIdx < line.length) {
      elements.push(line.substring(lastIdx));
    }
    
    return (
      <div key={lIdx} style={{ minHeight: '1.2em', margin: '4px 0' }}>
        {elements.length > 0 ? elements : line}
      </div>
    );
  });
};

export default function Navbar({ onMenuToggle }) {
  const { user, isAuthenticated, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [showProfile, setShowProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  
  const profileRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const isLandingPage = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfile(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // No AI overlay effects needed

  const handleLogout = () => {
    logout();
    navigate('/');
    setShowProfile(false);
  };

  // AI Handlers removed, unified AI chat handles requests directly

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <nav className={`navbar ${isLandingPage ? 'navbar-landing' : ''} ${isScrolled ? 'navbar-scrolled' : ''}`}>
        <div className="navbar-inner">
          <Link to={isAuthenticated ? '/dashboard' : '/'} className="navbar-brand">
            <img src="/logo.png" alt="CampusPulse" className="navbar-logo-img" />
            <span className="navbar-brand-text">Campus<span>Pulse</span></span>
          </Link>

          {isLandingPage ? (
            <div className="navbar-center-links">
              <Link to={isAuthenticated ? '/dashboard' : '/login'} className="navbar-link">Dashboard</Link>
              <Link to={isAuthenticated ? '/events' : '/login'} className="navbar-link">Events</Link>
              <Link to={isAuthenticated ? '/clubs' : '/login'} className="navbar-link">Communities</Link>
              <Link to={isAuthenticated ? '/clubs' : '/login'} className="navbar-link">Clubs</Link>
              <Link to={isAuthenticated ? '/dashboard' : '/login'} className="navbar-link">Resources</Link>
            </div>
          ) : (
            isAuthenticated && (
              <div className="navbar-search">
                <Search className="navbar-search-icon" />
                <input
                  type="text"
                  className="navbar-search-input"
                  placeholder="Search events, clubs, people..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            )
          )}

          <div className="navbar-actions">
            {/* AI Assistant button with glowing effect */}
            <button className="btn-ai-glow" onClick={() => navigate(user ? `/chat/ai-${user.id}` : '/login')}>
              <Sparkles size={14} className="sparkle-icon" />
              <span>AI Assistant</span>
            </button>

            {isAuthenticated ? (
              <>
                <button className="navbar-action-btn notif-bell" onClick={() => navigate('/notifications')} title="Notifications">
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="navbar-notification-count">{unreadCount}</span>
                  )}
                </button>

                <button className="navbar-mobile-toggle" onClick={onMenuToggle}>
                  <Menu size={20} />
                </button>

                <div ref={profileRef} style={{ position: 'relative' }}>
                  <div 
                    className={`navbar-avatar ${user?.role === 'clubLeader' || user?.role === 'club_leader' ? 'navbar-avatar-leader' : ''}`} 
                    onClick={() => setShowProfile(!showProfile)}
                    style={
                      user?.role === 'clubLeader' || user?.role === 'club_leader'
                        ? {}
                        : { background: getAvatarGradient(user?.name) }
                    }
                  >
                    {getAvatarInitials(user?.name)}
                  </div>

                  {showProfile && (
                    <div className="navbar-profile-menu">
                      <div className="navbar-profile-header">
                        <h4>{user?.name}</h4>
                        <p>{user?.role} · {user?.department}</p>
                      </div>
                      <button className="navbar-profile-menu-item" onClick={() => { navigate('/profile'); setShowProfile(false); }}>
                        <User size={16} /> Profile
                      </button>
                      <button className="navbar-profile-menu-item" onClick={() => { navigate('/settings'); setShowProfile(false); }}>
                        <Settings size={16} /> Settings
                      </button>
                      <button className="navbar-profile-menu-item danger" onClick={handleLogout}>
                        <LogOut size={16} /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link to="/login" style={{ marginLeft: 'var(--space-2)' }}>
                <button className="btn btn-primary btn-sm">Sign In</button>
              </Link>
            )}
          </div>
        </div>
      </nav>


    </>
  );
}
