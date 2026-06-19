import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, Users, Share2, Bookmark, BookmarkCheck, ArrowLeft, Tag, User, Send, MessageCircle, Sparkles, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/api';
import { geminiService } from '../../services/geminiService';
import '../../components/ui/Components.css';
import '../Events/Events.css';

export default function EventDetail() {
  const { id } = useParams();
  const { user, registerForEvent, toggleSaveEvent } = useAuth();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [relatedEvents, setRelatedEvents] = useState([]);
  
  // AI Insights State
  const [insight, setInsight] = useState('');
  const [insightLoading, setInsightLoading] = useState(true);

  const isRegistered = user?.registeredEvents?.includes(parseInt(id));
  const isSaved = user?.savedEvents?.includes(parseInt(id));

  useEffect(() => {
    async function loadEventData() {
      try {
        setLoading(true);
        const data = await apiService.getEvent(id);
        setEvent(data);
        
        // Load comments
        const commentsData = await apiService.getComments(id);
        setComments(commentsData);
        
        // Load related events
        const allEvents = await apiService.getEvents();
        const related = allEvents.filter(e => e.category === data.category && e.id !== data.id).slice(0, 3);
        setRelatedEvents(related);
      } catch (err) {
        console.error('Failed to load event details:', err);
      } finally {
        setLoading(false);
      }
    }
    
    loadEventData();
  }, [id]);

  useEffect(() => {
    async function loadInsight() {
      if (!user || !event) return;
      try {
        setInsightLoading(true);
        const response = await geminiService.getEventInsight(event.id, user);
        setInsight(response.insight);
      } catch (err) {
        console.error('Failed to load event insight:', err);
      } finally {
        setInsightLoading(false);
      }
    }
    loadInsight();
  }, [user, event?.id]);

  if (loading) {
    return (
      <div style={{ padding: 'var(--space-12)' }} className="animate-fade-in">
        <Link to="/events" className="btn btn-ghost btn-sm" style={{ marginBottom: 'var(--space-4)' }}>
          <ArrowLeft size={16} /> Back to Events
        </Link>
        <div className="event-detail-banner loading-shimmer" style={{ height: '300px', borderRadius: 'var(--radius-xl)' }} />
        <div className="event-detail-grid" style={{ marginTop: 'var(--space-6)' }}>
          <div>
            <div className="shimmer-bone" style={{ width: '40%', height: '32px', marginBottom: '16px' }} />
            <div className="shimmer-bone" style={{ width: '100%', height: '100px', marginBottom: '16px' }} />
          </div>
          <div className="shimmer-bone" style={{ width: '100%', height: '240px' }} />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="empty-state animate-fade-in">
        <h3>Event not found</h3>
        <Link to="/events" className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }}>
          Back to Events
        </Link>
      </div>
    );
  }

  const pct = Math.min(100, Math.round((event.registeredSeats / event.totalSeats) * 100));
  const getProgressBarColor = (p) => {
    if (p < 50) return '#3b82f6';
    if (p < 80) return '#8b5cf6';
    if (p < 95) return '#f97316';
    return '#ef4444';
  };
  const remaining = event.totalSeats - event.registeredSeats;
  const tooltipText = `${event.registeredSeats} registered\n${remaining} seats remaining`;

  const handleRegister = async () => {
    if (!user) return;
    const action = isRegistered ? 'unregistered' : 'registered';
    
    // Optimistic UI seat count adjustment
    setEvent(prev => {
      if (!prev) return null;
      const adjustment = action === 'registered' ? 1 : -1;
      return {
        ...prev,
        registeredSeats: Math.max(0, prev.registeredSeats + adjustment)
      };
    });
    
    try {
      await registerForEvent(event.id, action);
      const updatedEvent = await apiService.getEvent(event.id);
      setEvent(updatedEvent);
    } catch (err) {
      console.error(err);
      // Revert if API failed
      const revertedEvent = await apiService.getEvent(event.id);
      setEvent(revertedEvent);
    }
  };

  const handleSaveToggle = async () => {
    if (!user) return;
    try {
      await toggleSaveEvent(event.id, !isSaved);
    } catch (err) {
      console.error('Failed to toggle save event status:', err);
    }
  };

  const handlePostComment = async () => {
    if (!commentText.trim() || !user) return;
    const msg = commentText;
    setCommentText('');
    
    const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';
    
    // Optimistic Comment update
    const optComment = {
      id: Date.now(),
      commentId: Date.now(),
      userId: user.id,
      eventId: event.id,
      user: user.name,
      avatar: initials,
      text: msg,
      time: 'Just now'
    };
    setComments(prev => [...prev, optComment]);
    
    try {
      const updatedComments = await apiService.postComment(event.id, user.id, msg, user.name, initials);
      setComments(updatedComments);
    } catch (err) {
      console.error('Failed to submit comment:', err);
      alert('Failed to post comment');
      // Revert comments
      const commentsData = await apiService.getComments(event.id);
      setComments(commentsData);
    }
  };

  return (
    <div className="event-detail animate-fade-in">
      <Link to="/events" className="btn btn-ghost btn-sm" style={{ marginBottom: 'var(--space-4)' }}>
        <ArrowLeft size={16} /> Back to Events
      </Link>

      <img src={event.banner} alt={event.title} className="event-detail-banner" />

      <div className="event-detail-grid">
        <div className="event-detail-content">
          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
            <span className={`badge ${event.category === 'Hackathon' ? 'badge-danger' : event.category === 'Workshop' ? 'badge-warning' : 'badge-primary'}`}>{event.category}</span>
            {isRegistered && (
              <span className="badge badge-success">Registered</span>
            )}
            {event.tags?.map(tag => <span key={tag} className="badge badge-gray">#{tag}</span>)}
          </div>

          <h1>{event.title}</h1>
          <p className="event-detail-desc">{event.description}</p>

          {/* AI Event Insights */}
          <div className="event-insights-card" style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(139, 92, 246, 0.05))',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-4)',
            marginBottom: 'var(--space-6)',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.05)'
          }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-600)', fontWeight: 700, marginBottom: '8px', fontSize: 'var(--text-sm)' }}>
              <Sparkles size={16} /> AI Event Insights
            </h4>
            {insightLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="shimmer-bone" style={{ width: '80%', height: '12px', borderRadius: '4px' }} />
              </div>
            ) : (
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                {insight}
              </p>
            )}
          </div>

          {/* Comments */}
          <div className="comments-section">
            <h3><MessageCircle size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />Discussion ({comments.length})</h3>
            <div className="comment-list">
              {comments.map(c => (
                <div className="comment-item" key={c.id}>
                  <div className="avatar avatar-md" style={{ background: 'linear-gradient(135deg, var(--primary-400), var(--accent-400))' }}>{c.avatar}</div>
                  <div className="comment-body">
                    <h4>{c.user}</h4>
                    <p>{c.text}</p>
                    <span className="comment-time">{c.time}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="comment-input-wrap">
              <input 
                type="text" 
                className="form-input" 
                placeholder="Add a comment..." 
                value={commentText} 
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handlePostComment(); }}
              />
              <button className="btn btn-primary" onClick={handlePostComment}><Send size={16} /></button>
            </div>
          </div>
        </div>

        <div>
          {/* Event Info Card */}
          <div className="event-sidebar-card">
            <h3>Event Details</h3>
            <div className="event-info-row"><Calendar size={16} /><div><div className="event-info-label">Date</div><div className="event-info-value">{event.date}</div></div></div>
            <div className="event-info-row"><Clock size={16} /><div><div className="event-info-label">Time</div><div className="event-info-value">{event.time} - {event.endTime}</div></div></div>
            <div className="event-info-row"><MapPin size={16} /><div><div className="event-info-label">Venue</div><div className="event-info-value">{event.venue}</div></div></div>
            <div className="event-info-row"><User size={16} /><div><div className="event-info-label">Organizer</div><div className="event-info-value">{event.organizer}</div></div></div>
            <div className="event-info-row" title={tooltipText}><Users size={16} /><div><div className="event-info-label">Seats</div><div className="event-info-value">{event.registeredSeats}/{event.totalSeats} seats filled</div><div className="progress-bar" style={{ marginTop: '6px', width: '100%' }}><div className="progress-bar-fill" style={{ width: `${pct}%`, backgroundColor: getProgressBarColor(pct), transition: 'width 0.5s ease, background-color 0.5s ease' }} /></div></div></div>

            <div className="event-actions">
              <button 
                className={`btn ${isRegistered ? 'btn-success' : 'btn-primary'} btn-lg`} 
                onClick={handleRegister} 
                style={{ 
                  width: '100%', 
                  backgroundColor: isRegistered ? 'var(--success-500)' : undefined, 
                  borderColor: isRegistered ? 'var(--success-500)' : undefined,
                  color: isRegistered ? 'white' : undefined,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                {isRegistered ? <><Check size={18} /> Registered</> : 'Register Now'}
              </button>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <button className={`btn ${isSaved ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1 }} onClick={handleSaveToggle}>
                  {isSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />} {isSaved ? 'Saved' : 'Save'}
                </button>
                <button className="btn btn-secondary" style={{ flex: 1 }}><Share2 size={16} /> Share</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Events */}
      {relatedEvents.length > 0 && (
        <div className="related-events">
          <h3>Related Events</h3>
          <div className="related-grid">
            {relatedEvents.map(e => (
              <Link to={`/events/${e.id}`} className="event-card" key={e.id}>
                <img src={e.banner} alt={e.title} className="event-card-banner" loading="lazy" />
                <div className="event-card-body">
                  <span className="badge badge-primary">{e.category}</span>
                  <h3>{e.title}</h3>
                  <div className="event-card-meta"><span><Clock size={14} /> {e.date}</span></div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
