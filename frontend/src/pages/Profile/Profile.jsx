import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Mail, BookOpen, Calendar, Edit, X, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/api';
import { getAvatarInitials, getAvatarGradient } from '../../utils/gemini';
import '../../components/ui/Components.css';
import './Profile.css';

export default function Profile() {
  const { user, updateUserLocalState } = useAuth();
  const [clubsList, setClubsList] = useState([]);
  const [eventsList, setEventsList] = useState([]);
  const [announcementList, setAnnouncementList] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', bio: '', department: '', year: '1st Year' });
  const [interestTags, setInterestTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const tagInputRef = useRef(null);

  const loadProfileData = async () => {
    if (!user) return;
    try {
      const [profile, clubs, events, anns] = await Promise.all([
        apiService.getProfileMe(user.id),
        apiService.getClubs(),
        apiService.getEvents(),
        apiService.getAnnouncements()
      ]);
      
      updateUserLocalState(profile);
      setClubsList(clubs);
      setEventsList(events);
      setAnnouncementList(anns);
      
      setEditForm({
        name: profile.name || '',
        bio: profile.bio || '',
        department: profile.department || '',
        year: profile.year || '1st Year'
      });
      setInterestTags(Array.isArray(profile.interests) ? profile.interests : []);
    } catch (err) {
      console.error('Failed to fetch profile details:', err);
    }
  };

  useEffect(() => {
    loadProfileData();

    // Listen to real-time updates to refresh profile lists
    const handleRefresh = () => {
      loadProfileData();
    };

    window.addEventListener('event_registered', handleRefresh);
    window.addEventListener('event_deleted', handleRefresh);
    window.addEventListener('club_joined', handleRefresh);
    window.addEventListener('announcement_created', handleRefresh);

    return () => {
      window.removeEventListener('event_registered', handleRefresh);
      window.removeEventListener('event_deleted', handleRefresh);
      window.removeEventListener('club_joined', handleRefresh);
      window.removeEventListener('announcement_created', handleRefresh);
    };
  }, [user?.id]);

  const joinedClubs = clubsList.filter(c => user?.joinedClubs?.includes(c.id));
  const registeredEvents = eventsList.filter(e => user?.registeredEvents?.includes(e.id));
  const savedEvents = eventsList.filter(e => user?.savedEvents?.includes(e.id));
  const createdClubs = clubsList.filter(c => c.leaderId === user?.id || c.ownerId === user?.id);
  const createdEvents = eventsList.filter(e => e.creatorId === user?.id || e.createdBy === user?.id);
  const myAnnouncements = announcementList.filter(a => a.authorId === user?.id);

  // Open modal handler — populate form from current user state
  const openEditModal = () => {
    setEditForm({
      name: user?.name || '',
      bio: user?.bio || '',
      department: user?.department || '',
      year: user?.year || '1st Year'
    });
    setInterestTags(Array.isArray(user?.interests) ? [...user.interests] : []);
    setTagInput('');
    setShowEditModal(true);
  };

  // Tag management
  const addTag = (value) => {
    const tag = value.trim();
    if (tag && !interestTags.includes(tag)) {
      setInterestTags(prev => [...prev, tag]);
    }
    setTagInput('');
  };

  const removeTag = (tagToRemove) => {
    setInterestTags(prev => prev.filter(t => t !== tagToRemove));
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === 'Backspace' && !tagInput && interestTags.length > 0) {
      removeTag(interestTags[interestTags.length - 1]);
    }
  };

  // Edit profile submit handler
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = await apiService.updateProfile({
        userId: user.id,
        name: editForm.name,
        bio: editForm.bio,
        department: editForm.department,
        year: editForm.year,
        interests: interestTags.join(', ')
      });
      
      // Update global context session
      updateUserLocalState(data.user);
      setShowEditModal(false);
      alert('✅ Profile Updated Successfully');
    } catch (err) {
      console.error('Profile update failed:', err);
      alert('Profile update failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div><h1>👤 Profile</h1></div>
        <button 
          className="btn btn-secondary btn-sm"
          onClick={openEditModal}
        >
          <Edit size={14} /> Edit Profile
        </button>
      </div>

      <div className="profile-header">
        <div 
          className="profile-avatar"
          style={{ background: getAvatarGradient(user?.name) }}
        >
          {getAvatarInitials(user?.name)}
        </div>
        <div className="profile-info">
          <h1>{user?.name}</h1>
          <span className="badge badge-primary role-badge" style={{ textTransform: 'capitalize' }}>
            {user?.role === 'clubLeader' ? 'Club Leader' : user?.role || 'Student'}
          </span>
          <p>{user?.bio || 'No bio written yet. Click Edit Profile to add one!'}</p>
          <div className="profile-meta">
            <span><Mail size={14} /> {user?.email}</span>
            <span><BookOpen size={14} /> {user?.department}</span>
            {user?.year && <span><Calendar size={14} /> {user.year}</span>}
          </div>
        </div>
      </div>

      {user?.interests && user.interests.length > 0 && (
        <div className="profile-section">
          <h3>🎯 Interests</h3>
          <div className="profile-interests">
            {user.interests.map(i => <span key={i} className="badge badge-primary">{i}</span>)}
          </div>
        </div>
      )}

      {createdClubs.length > 0 && (
        <div className="profile-section">
          <h3>🏛️ Founded Clubs</h3>
          <div className="profile-clubs-list">
            {createdClubs.map(club => (
              <Link to={`/clubs/${club.id}`} className="profile-club-item" key={club.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="avatar avatar-md" style={{ background: club.color }}>{club.logo}</div>
                <div><h4>{club.name}</h4><p>{club.memberCount} members · {club.category} (Founder)</p></div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {createdEvents.length > 0 && (
        <div className="profile-section">
          <h3>📅 Created Events</h3>
          <div className="profile-events-list">
            {createdEvents.map(event => {
              const eventDate = new Date(event.date);
              const day = isNaN(eventDate.getDate()) ? '?' : eventDate.getDate();
              const month = isNaN(eventDate.getDate()) ? 'EVT' : eventDate.toLocaleString('en', { month: 'short' });
              return (
                <Link to={`/events/${event.id}`} className="profile-event-item" key={event.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="event-date-badge" style={{ background: 'var(--primary-100)', color: 'var(--primary-700)' }}>
                    <span className="event-day">{day}</span>
                    <span className="event-month">{month}</span>
                  </div>
                  <div>
                    <h4>{event.title}</h4>
                    <p>{event.time} · {event.venue}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {myAnnouncements.length > 0 && (
        <div className="profile-section">
          <h3>📢 My Announcements</h3>
          <div className="profile-events-list">
            {myAnnouncements.map(ann => {
              return (
                <div className="profile-event-item" key={ann.id} style={{ borderLeft: '3px solid var(--primary-500)', paddingLeft: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0 }}>{ann.title}</h4>
                    <p style={{ margin: '4px 0 0 0', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{ann.content.substring(0, 100)}...</p>
                    <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: 'var(--text-tertiary)' }}>{ann.date} · {ann.department}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {joinedClubs.length > 0 && (
        <div className="profile-section">
          <h3>🏛️ Clubs</h3>
          <div className="profile-clubs-list">
            {joinedClubs.map(club => (
              <Link to={`/clubs/${club.id}`} className="profile-club-item" key={club.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="avatar avatar-md" style={{ background: club.color }}>{club.logo}</div>
                <div><h4>{club.name}</h4><p>{club.memberCount} members · {club.category}</p></div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {registeredEvents.length > 0 && (
        <div className="profile-section">
          <h3>📅 Registered Events</h3>
          <div className="profile-events-list">
            {registeredEvents.map(event => {
              const eventDate = new Date(event.date);
              const day = isNaN(eventDate.getDate()) ? '?' : eventDate.getDate();
              const month = isNaN(eventDate.getDate()) ? 'EVT' : eventDate.toLocaleString('en', { month: 'short' });
              return (
                <Link to={`/events/${event.id}`} className="profile-event-item" key={event.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="event-date-badge">
                    <span className="event-day">{day}</span>
                    <span className="event-month">{month}</span>
                  </div>
                  <div>
                    <h4>{event.title}</h4>
                    <p>{event.time} · {event.venue}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {savedEvents.length > 0 && (
        <div className="profile-section">
          <h3>💾 Saved Events</h3>
          <div className="profile-events-list">
            {savedEvents.map(event => {
              const eventDate = new Date(event.date);
              const day = isNaN(eventDate.getDate()) ? '?' : eventDate.getDate();
              const month = isNaN(eventDate.getDate()) ? 'EVT' : eventDate.toLocaleString('en', { month: 'short' });
              return (
                <Link to={`/events/${event.id}`} className="profile-event-item" key={event.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="event-date-badge" style={{ background: 'var(--accent-100)', color: 'var(--accent-700)' }}>
                    <span className="event-day">{day}</span>
                    <span className="event-month">{month}</span>
                  </div>
                  <div>
                    <h4>{event.title}</h4>
                    <p>{event.category} · {event.organizer}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {user?.courses && user.courses.length > 0 && (
        <div className="profile-section">
          <h3>📚 Courses</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {user.courses.map(c => <div key={c} className="badge badge-gray" style={{ display: 'inline-block', margin: '0' }}>{c}</div>)}
          </div>
        </div>
      )}

      {/* ======== Edit Profile Modal — Rebuilt from Scratch ======== */}
      {showEditModal && (
        <div className="epm-overlay" onClick={() => setShowEditModal(false)}>
          <div className="epm-container" onClick={e => e.stopPropagation()}>
            
            {/* Header */}
            <div className="epm-header">
              <h3 className="epm-header-title">Edit Profile</h3>
              <button 
                className="epm-close-btn" 
                onClick={() => setShowEditModal(false)}
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveProfile} className="epm-form">
              <div className="epm-body">
                
                {/* Avatar Section */}
                <div className="epm-avatar-section">
                  <div 
                    className="epm-avatar"
                    style={{ background: getAvatarGradient(user?.name) }}
                  >
                    {getAvatarInitials(user?.name)}
                  </div>
                  <div className="epm-avatar-info">
                    <h4>{user?.name}</h4>
                    <p>{user?.email}</p>
                  </div>
                </div>

                {/* Full Name */}
                <div className="epm-field">
                  <label className="epm-label">Full Name</label>
                  <input 
                    type="text" 
                    className="epm-input" 
                    value={editForm.name} 
                    onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Your full name"
                    required 
                  />
                </div>

                {/* Bio */}
                <div className="epm-field">
                  <label className="epm-label">Bio</label>
                  <textarea 
                    className="epm-input" 
                    value={editForm.bio} 
                    onChange={e => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                    rows={3}
                    placeholder="Tell us about yourself..."
                  />
                </div>

                {/* Department & Year — Side by Side */}
                <div className="epm-row">
                  <div className="epm-field">
                    <label className="epm-label">Department</label>
                    <input 
                      type="text" 
                      className="epm-input" 
                      value={editForm.department} 
                      onChange={e => setEditForm(prev => ({ ...prev, department: e.target.value }))}
                      placeholder="e.g. Computer Science"
                      required
                    />
                  </div>
                  <div className="epm-field">
                    <label className="epm-label">Academic Year</label>
                    <select 
                      className="epm-input" 
                      value={editForm.year} 
                      onChange={e => setEditForm(prev => ({ ...prev, year: e.target.value }))}
                    >
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                      <option value="Professor">Professor</option>
                      <option value="Faculty Advisor">Faculty Advisor</option>
                      <option value="Alumni">Alumni</option>
                    </select>
                  </div>
                </div>

                {/* Interests — Tag System */}
                <div className="epm-field">
                  <label className="epm-label">Interests</label>
                  <div 
                    className="epm-tags-container"
                    onClick={() => tagInputRef.current?.focus()}
                  >
                    {interestTags.map(tag => (
                      <span key={tag} className="epm-tag">
                        {tag}
                        <button 
                          type="button" 
                          className="epm-tag-remove" 
                          onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
                          aria-label={`Remove ${tag}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <input
                      ref={tagInputRef}
                      type="text"
                      className="epm-tag-input"
                      value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      onBlur={() => { if (tagInput.trim()) addTag(tagInput); }}
                      placeholder={interestTags.length === 0 ? "Type and press Enter to add..." : "Add more..."}
                    />
                  </div>
                  <span className="epm-tag-hint">Press Enter or comma to add a tag. Backspace to remove.</span>
                </div>

              </div>

              {/* Footer */}
              <div className="epm-footer">
                <button 
                  type="button" 
                  className="epm-btn epm-btn-cancel" 
                  disabled={saving}
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="epm-btn epm-btn-save" 
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="epm-spinner" size={18} />
                      <span>Saving...</span>
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}

