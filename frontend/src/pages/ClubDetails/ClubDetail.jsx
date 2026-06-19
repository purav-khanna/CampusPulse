import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Users, Calendar, Clock, Heart, UserPlus, UserCheck, Tag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/api';
import '../../components/ui/Components.css';
import '../Clubs/Clubs.css';

const renderLogo = (logo, name) => {
  const isUrl = logo && (logo.startsWith('http') || logo.startsWith('/') || logo.includes('.'));
  if (isUrl) {
    return <img src={logo} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />;
  }
  return logo || name.slice(0, 2).toUpperCase();
};

export default function ClubDetail() {
  const { id } = useParams();
  const { user, toggleJoinClub } = useAuth();
  
  const [club, setClub] = useState(null);
  const [clubEvents, setClubEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const joined = user?.joinedClubs?.includes(parseInt(id));

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    async function loadClubData() {
      try {
        setLoading(true);
        const data = await apiService.getClub(id);
        setClub(data);
        
        const allEvents = await apiService.getEvents();
        const relevantEvents = allEvents.filter(e => data.events?.includes(e.id));
        setClubEvents(relevantEvents);
      } catch (err) {
        console.error('Failed to load club details:', err);
      } finally {
        setLoading(false);
      }
    }
    loadClubData();
  }, [id]);

  const handleJoinToggle = async () => {
    if (!user || !club) return;
    const isLeaving = joined;
    const action = isLeaving ? 'leave' : 'join';
    
    // Cache current state in case we need to roll back
    const prevClub = { ...club };
    const countAdjustment = isLeaving ? -1 : 1;
    const newCount = Math.max(0, club.memberCount + countAdjustment);
    
    const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'U';
    const memberObj = {
      userId: user.id,
      name: user.name,
      role: user.role === 'clubLeader' ? 'President' : user.role === 'professor' ? 'Faculty Advisor' : 'Member',
      avatar: initials,
      joinedAt: 'Today'
    };
    
    const newMembers = isLeaving
      ? (club.members || []).filter(m => m.userId !== user.id)
      : [...(club.members || []), memberObj];
      
    // Update locally optimistically
    setClub(prev => ({
      ...prev,
      memberCount: newCount,
      members: newMembers
    }));
    
    showToast(isLeaving ? `Left ${club.name}` : `✅ Joined ${club.name}`);
    
    try {
      await toggleJoinClub(club.id);
      const freshClub = await apiService.getClub(club.id);
      setClub(freshClub);
    } catch (err) {
      console.error('Failed to join/leave club:', err);
      setClub(prevClub);
      showToast(`❌ Error: Could not join/leave club`);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 'var(--space-12)' }} className="animate-fade-in">
        <Link to="/clubs" className="btn btn-ghost btn-sm" style={{ marginBottom: 'var(--space-4)' }}><ArrowLeft size={16} /> Back to Clubs</Link>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
          <div className="shimmer-bone" style={{ width: '100px', height: '100px', borderRadius: 'var(--radius-xl)' }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="shimmer-bone" style={{ width: '40%', height: '32px' }} />
            <div className="shimmer-bone" style={{ width: '80%', height: '16px' }} />
          </div>
        </div>
      </div>
    );
  }

  if (!club) return <div className="empty-state"><h3>Club not found</h3><Link to="/clubs" className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }}>Back to Clubs</Link></div>;

  return (
    <div className="club-detail animate-fade-in">
      <Link to="/clubs" className="btn btn-ghost btn-sm" style={{ marginBottom: 'var(--space-4)' }}><ArrowLeft size={16} style={{ marginRight: '6px' }} /> Back to Clubs</Link>

      <div className="club-detail-header-card animate-fade-in">
        <div className="club-detail-banner">
          {club.banner ? (
            <img src={club.banner} alt={club.name} />
          ) : (
            <div className="club-banner-placeholder" />
          )}
        </div>
        <div className="club-detail-header-info-bar">
          <div className="club-detail-logo" style={{ background: club.color || 'var(--gradient-primary)' }}>
            {renderLogo(club.logo, club.name)}
          </div>
          <div className="club-detail-info">
            <h1>{club.name}</h1>
            <p>{club.description}</p>
            <div className="club-detail-stats">
              <span><Users size={14} /> <span key={club.memberCount} className="member-count-animate">{club.memberCount || 0}</span> members</span>
              <span><Calendar size={14} /> Founded {club.founded || 'June 2026'}</span>
              <span className="badge-category">{club.category} Club</span>
            </div>
            <div className="club-detail-actions" style={{ marginTop: '16px' }}>
              <button className={`btn ${joined ? 'btn-success' : 'btn-primary'}`} onClick={handleJoinToggle}>
                {joined ? <><UserCheck size={16} style={{ marginRight: '6px' }} /> Joined</> : <><UserPlus size={16} style={{ marginRight: '6px' }} /> Join Club</>}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="club-detail-grid">
        <div>
          {/* About */}
          <div className="club-about">
            <h3>About Club</h3>
            <p>{club.longDescription}</p>
            <div className="club-tags">
              {club.tags?.map(tag => <span key={tag} className="badge badge-gray">#{tag}</span>)}
            </div>
          </div>

          {/* Posts */}
          <div className="club-posts">
            <h3>Posts & Updates</h3>
            {club.posts && club.posts.length > 0 ? club.posts.map(post => (
              <div className="club-post-item" key={post.id}>
                <div className="club-post-header">
                  <div className="avatar avatar-sm" style={{ background: `linear-gradient(135deg, var(--primary-400), var(--accent-400))` }}>{post.avatar}</div>
                  <h4>{post.author}</h4>
                  <span>· {post.time}</span>
                </div>
                <p className="club-post-content">{post.content}</p>
                <span className="club-post-likes"><Heart size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> {post.likes} likes</span>
              </div>
            )) : <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>No posts yet</p>}
          </div>
        </div>

        <div>
          {/* Members */}
          <div className="club-members-card">
            <h3>Club Members ({club.members?.length || 0})</h3>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {club.members?.map((m, i) => (
                <div className="club-member-item animate-fade-in" key={m.userId || i}>
                  <div className="avatar avatar-md" style={{ background: `linear-gradient(135deg, var(--primary-400), var(--accent-400))` }}>{m.avatar}</div>
                  <div className="member-name">{m.name}</div>
                  <div className="member-role">{m.role}</div>
                  <div className="member-date">{m.joinedAt ? `Joined ${m.joinedAt}` : ''}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Club Events */}
          <div className="club-members-card">
            <h3>Events ({clubEvents.length})</h3>
            {clubEvents.length > 0 ? clubEvents.map(e => (
              <Link to={`/events/${e.id}`} className="upcoming-item" key={e.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="upcoming-date">
                  <span className="day">{new Date(e.date).getDate()}</span>
                  <span className="month">{new Date(e.date).toLocaleString('en', { month: 'short' })}</span>
                </div>
                <div className="upcoming-info"><h4>{e.title}</h4><p><Clock size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> {e.time}</p></div>
              </Link>
            )) : <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>No events yet</p>}
          </div>
        </div>
      </div>

      {toast && (
        <div className="toast-notification">
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
