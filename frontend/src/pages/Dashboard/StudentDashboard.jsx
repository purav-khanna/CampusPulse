import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, MessageCircle, Bell, Sparkles, Clock, MapPin, ArrowRight, Bookmark, Brain } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useChat } from '../../context/ChatContext';
import { apiService } from '../../services/api';
import { geminiService } from '../../services/geminiService';
import '../../components/ui/Components.css';
import './Dashboard.css';

export default function StudentDashboard() {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const { totalUnreadCount } = useChat();
  const [eventsList, setEventsList] = useState([]);
  const [clubsList, setClubsList] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [aiRecs, setAiRecs] = useState([]);
  const [recsLoading, setRecsLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      const [evs, cls, anns] = await Promise.all([
        apiService.getEvents(),
        apiService.getClubs(),
        apiService.getAnnouncements()
      ]);
      setEventsList(evs);
      setClubsList(cls);
      setAnnouncements(anns);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setDataLoading(false);
    }
  };

  const loadRecommendations = async () => {
    if (!user) return;
    try {
      setRecsLoading(true);
      const recs = await geminiService.getAIRecommendations(user);
      setAiRecs(recs);
    } catch (err) {
      console.error('Failed to load AI recommendations:', err);
    } finally {
      setRecsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    if (user) {
      loadRecommendations();
    }

    const handleRefresh = () => {
      loadDashboardData();
      loadRecommendations();
    };

    window.addEventListener('notification_updated', handleRefresh);
    window.addEventListener('message_received', handleRefresh);
    window.addEventListener('event_registered', handleRefresh);
    window.addEventListener('club_joined', handleRefresh);
    window.addEventListener('announcement_created', handleRefresh);

    return () => {
      window.removeEventListener('notification_updated', handleRefresh);
      window.removeEventListener('message_received', handleRefresh);
      window.removeEventListener('event_registered', handleRefresh);
      window.removeEventListener('club_joined', handleRefresh);
      window.removeEventListener('announcement_created', handleRefresh);
    };
  }, [user]);

  const joinedClubs = clubsList.filter(c => user?.joinedClubs?.includes(c.id));
  const upcomingEvents = eventsList.slice(0, 4);
  const savedEvents = eventsList.filter(e => user?.savedEvents?.includes(e.id));

  const quickLinks = [
    { to: '/events', icon: Calendar, label: 'Events', desc: 'Browse all', color: 'var(--primary-500)' },
    { to: '/clubs', icon: Users, label: 'Clubs', desc: 'Explore', color: 'var(--accent-500)' },
    { to: '/chat', icon: MessageCircle, label: 'Chat', desc: `${totalUnreadCount} unread`, color: 'var(--success-500)' },
    { to: '/notifications', icon: Bell, label: 'Notifications', desc: `${unreadCount} new`, color: 'var(--warning-500)' }
  ];

  const getMonthDay = (dateStr) => {
    const d = new Date(dateStr);
    return { day: d.getDate(), month: d.toLocaleString('en', { month: 'short' }) };
  };

  return (
    <div className="dashboard-page animate-fade-in">
      <div className="dashboard-welcome">
        <h1><span className="wave">👋</span> Welcome back, {user?.name?.split(' ')[0]}!</h1>
        <p>Here's what's happening on your campus today</p>
      </div>

      {/* Quick Access */}
      <div className="quick-access">
        {quickLinks.map(q => (
          <Link to={q.to} className="quick-card" key={q.to}>
            <div className="quick-card-icon" style={{ background: q.color }}><q.icon size={20} /></div>
            <div><h4>{q.label}</h4><p>{q.desc}</p></div>
          </Link>
        ))}
      </div>

      <div className="dashboard-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* AI Recommendations */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h3>
                <Sparkles size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px', color: 'var(--primary-500)' }} />
                AI Recommendations
              </h3>
              <span className="badge badge-primary"><Brain size={12} /> Smart</span>
            </div>
            <div className="ai-rec">
              {recsLoading ? (
                [1, 2, 3].map(n => (
                  <div className="ai-rec-item loading-shimmer" key={n} style={{ height: '62px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="shimmer-bone" style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', flexShrink: 0 }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div className="shimmer-bone" style={{ width: '60%', height: '14px', borderRadius: '4px' }} />
                      <div className="shimmer-bone" style={{ width: '40%', height: '10px', borderRadius: '4px' }} />
                    </div>
                  </div>
                ))
              ) : (
                aiRecs.map((r, i) => {
                  const linkPath = r.type === 'event' ? `/events/${r.id}` : r.type === 'club' ? `/clubs/${r.id}` : `/resources/${r.id}`;
                  return (
                    <Link to={linkPath} className="ai-rec-item" key={i} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <div className="ai-rec-icon" style={{ background: r.color }}>{r.icon}</div>
                      <div className="ai-rec-info">
                        <h4>{r.title}</h4>
                        <p>{r.reason}</p>
                      </div>
                      <ArrowRight size={16} style={{ marginLeft: 'auto', color: 'var(--text-tertiary)' }} />
                    </Link>
                  );
                })
              )}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h3>📅 Upcoming Events</h3>
              <Link to="/events" className="btn btn-ghost btn-sm">View All</Link>
            </div>
            <div className="upcoming-list">
              {upcomingEvents.map(event => {
                const { day, month } = getMonthDay(event.date);
                const isUserRegistered = user?.registeredEvents?.includes(event.id);
                return (
                  <Link to={`/events/${event.id}`} className="upcoming-item" key={event.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="upcoming-date"><span className="day">{day}</span><span className="month">{month}</span></div>
                    <div className="upcoming-info">
                      <h4>{event.title}</h4>
                      <p><Clock size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> {event.time} · <MapPin size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> {event.venue.split(',')[0]}</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', marginLeft: 'auto' }}>
                      {isUserRegistered && (
                        <span className="badge badge-success">Registered</span>
                      )}
                      <span className={`badge ${event.category === 'Hackathon' ? 'badge-danger' : event.category === 'Workshop' ? 'badge-warning' : 'badge-primary'}`}>{event.category}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Latest Campus Announcements */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h3>📢 Campus Announcements</h3>
            </div>
            <div className="announcements-mini-list" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', maxHeight: '350px', overflowY: 'auto', paddingRight: '4px' }}>
              {announcements.length > 0 ? (
                announcements.slice(0, 5).map(ann => (
                  <div key={ann.id} style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)', background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '600', fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{ann.title}</span>
                      <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{ann.date}</span>
                    </div>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                      {ann.aiSummary || (ann.content.length > 80 ? ann.content.substring(0, 80) + '...' : ann.content)}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                      <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'var(--primary-100)', color: 'var(--primary-700)', fontSize: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {ann.authorAvatar || (ann.author ? ann.author.charAt(0) : 'A')}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{ann.author} · <span style={{ fontStyle: 'italic' }}>{ann.department}</span></span>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', textAlign: 'center', padding: 'var(--space-4)' }}>No announcements yet</p>
              )}
            </div>
          </div>

          {/* Joined Clubs */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h3>🏛️ My Clubs</h3>
              <Link to="/clubs" className="btn btn-ghost btn-sm">All Clubs</Link>
            </div>
            <div className="club-chips">
              {joinedClubs.map(club => (
                <Link to={`/clubs/${club.id}`} className="club-chip" key={club.id}>
                  <span className="club-chip-dot" style={{ background: club.color }} />
                  {club.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Saved Events */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h3><Bookmark size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />Saved Events</h3>
            </div>
            <div className="upcoming-list">
              {savedEvents.length > 0 ? savedEvents.map(event => {
                const { day, month } = getMonthDay(event.date);
                const isUserRegistered = user?.registeredEvents?.includes(event.id);
                return (
                  <Link to={`/events/${event.id}`} className="upcoming-item" key={event.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="upcoming-date"><span className="day">{day}</span><span className="month">{month}</span></div>
                    <div className="upcoming-info">
                      <h4>{event.title}</h4>
                      <p>{event.category} · {event.organizer}</p>
                    </div>
                    {isUserRegistered && (
                      <span className="badge badge-success" style={{ marginLeft: 'auto' }}>Registered</span>
                    )}
                  </Link>
                );
              }) : <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', textAlign: 'center', padding: 'var(--space-4)' }}>No saved events yet</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

