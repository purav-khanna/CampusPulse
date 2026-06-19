import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Calendar, Users, TrendingUp, Megaphone, Plus, Search, Trash2, Edit3, 
  UserCheck, UserMinus, ArrowUpRight, BarChart3, X, AlertCircle, Check, 
  ShieldAlert, Sparkles, Clock, MapPin, Bookmark, Brain, Send, Copy, UploadCloud, Link as LinkIcon,
  MoreVertical
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import '../../components/ui/Components.css';
import './Dashboard.css';

const CATEGORIES = ['Workshop', 'Hackathon', 'Cultural', 'Sports', 'Seminar', 'Meeting'];

export default function ProfessorDashboard({ initialTab }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Tab State
  const [activeTab, setActiveTab] = useState(
    initialTab || (window.location.pathname === '/clubs/manage' ? 'clubs' : 'overview')
  );
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  // Dynamic Data
  const [professorStats, setProfessorStats] = useState({
    eventsCreated: 0,
    eventsJoined: 0,
    clubsCreated: 0,
    clubsJoined: 0,
    announcementsCount: 0,
    studentsReached: 0,
    recentRegistrations: [],
    recentActivities: []
  });

  const [announcementList, setAnnouncementList] = useState([]);
  const [eventsList, setEventsList] = useState([]);
  const [clubsList, setClubsList] = useState([]);
  
  // Managing clubs
  const [selectedClubId, setSelectedClubId] = useState(null);
  const [clubMembers, setClubMembers] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  
  // Modal visibility
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [deleteConfirmEvent, setDeleteConfirmEvent] = useState(null);
  
  const [showClubModal, setShowClubModal] = useState(false);
  const [editingClub, setEditingClub] = useState(null);
  const [deleteConfirmClub, setDeleteConfirmClub] = useState(null);

  // Dropdown states
  const [activeEventMenuId, setActiveEventMenuId] = useState(null);
  const [activeClubMenuId, setActiveClubMenuId] = useState(null);

  // Announcement management states
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [deleteConfirmAnnouncement, setDeleteConfirmAnnouncement] = useState(null);

  // Forms
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    category: 'Workshop',
    date: '',
    time: '10:00 AM',
    endTime: '',
    venue: '',
    totalSeats: 50,
    tags: '',
    imageUrl: '',
    registrationDeadline: ''
  });

  const [clubForm, setClubForm] = useState({
    name: '',
    description: '',
    category: 'Technical',
    department: '',
    logo: '',
    banner: ''
  });

  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    department: ''
  });

  // Upload indicators
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [dragOverLogo, setDragOverLogo] = useState(false);
  const [dragOverBanner, setDragOverBanner] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Fetch Dashboard Stats and Data
  const fetchStats = async () => {
    if (!user) return;
    setStatsLoading(true);
    setStatsError(false);
    try {
      const data = await apiService.getProfessorDashboardStats(user.id);
      setProfessorStats(data);
    } catch (err) {
      console.error('Failed to fetch professor stats:', err);
      setStatsError(true);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadGeneralData = async () => {
    try {
      const [evs, cls, anns] = await Promise.all([
        apiService.getEvents(),
        apiService.getClubs(),
        apiService.getAnnouncements()
      ]);
      setEventsList(evs);
      setClubsList(cls);
      setAnnouncementList(anns);

      // Auto select first owned club if available
      const owned = cls.filter(c => c.leaderId === user.id || c.ownerId === user.id);
      if (owned.length > 0 && !selectedClubId) {
        setSelectedClubId(owned[0].id);
      }
    } catch (err) {
      console.error('Failed to load campus directory:', err);
    } finally {
      setDataLoading(false);
    }
  };

  const loadClubManagementData = async (clubId) => {
    if (!clubId) return;
    try {
      const [members, requests] = await Promise.all([
        apiService.getClubMembers(clubId),
        apiService.getJoinRequests(clubId)
      ]);
      setClubMembers(members);
      setJoinRequests(requests);
    } catch (err) {
      console.error('Failed to load club management details:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchStats();
      loadGeneralData();
    }
  }, [user]);

  useEffect(() => {
    if (selectedClubId) {
      loadClubManagementData(selectedClubId);
    }
  }, [selectedClubId]);

  useEffect(() => {
    const handleRefresh = () => {
      fetchStats();
      loadGeneralData();
      if (selectedClubId) {
        loadClubManagementData(selectedClubId);
      }
    };

    const handleDocumentClick = () => {
      setActiveEventMenuId(null);
      setActiveClubMenuId(null);
    };

    window.addEventListener('notification_updated', handleRefresh);
    window.addEventListener('event_registered', handleRefresh);
    window.addEventListener('event_deleted', handleRefresh);
    window.addEventListener('club_joined', handleRefresh);
    window.addEventListener('announcement_created', handleRefresh);
    window.addEventListener('announcement_deleted', handleRefresh);
    document.addEventListener('click', handleDocumentClick);

    return () => {
      window.removeEventListener('notification_updated', handleRefresh);
      window.removeEventListener('event_registered', handleRefresh);
      window.removeEventListener('event_deleted', handleRefresh);
      window.removeEventListener('club_joined', handleRefresh);
      window.removeEventListener('announcement_created', handleRefresh);
      window.removeEventListener('announcement_deleted', handleRefresh);
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [user, selectedClubId]);

  // Image Upload Handlers
  const handleImageUpload = async (file, target) => {
    if (!file) return;
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      alert('Unsupported format. Please upload JPG, JPEG, PNG, or WEBP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit.');
      return;
    }
    
    try {
      if (target === 'event') setUploadingImage(true);
      if (target === 'logo') setUploadingLogo(true);
      if (target === 'banner') setUploadingBanner(true);

      const formData = new FormData();
      formData.append('file', file);
      const res = await apiService.uploadChatFile(formData);

      if (target === 'event') setEventForm(prev => ({ ...prev, imageUrl: res.fileUrl }));
      if (target === 'logo') setClubForm(prev => ({ ...prev, logo: res.fileUrl }));
      if (target === 'banner') setClubForm(prev => ({ ...prev, banner: res.fileUrl }));
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Image upload failed. Please try again.');
    } finally {
      if (target === 'event') setUploadingImage(false);
      if (target === 'logo') setUploadingLogo(false);
      if (target === 'banner') setUploadingBanner(false);
    }
  };

  // Event Action Handlers
  const openCreateEventModal = (prefills = {}) => {
    setEditingEvent(null);
    setEventForm({
      title: prefills.title || '',
      description: prefills.description || '',
      category: prefills.category || 'Workshop',
      date: prefills.date || '',
      time: prefills.time || '10:00 AM',
      endTime: prefills.endTime || '',
      venue: prefills.venue || '',
      totalSeats: prefills.totalSeats || 50,
      tags: prefills.tags || '',
      imageUrl: prefills.imageUrl || '',
      registrationDeadline: prefills.registrationDeadline || ''
    });
    setFormError('');
    setShowEventModal(true);
  };

  const openEditEventModal = (event) => {
    setEditingEvent(event);
    setEventForm({
      title: event.title || '',
      description: event.description || '',
      category: event.category || 'Workshop',
      date: event.date || '',
      time: event.time || '10:00 AM',
      endTime: event.endTime || '',
      venue: event.venue || '',
      totalSeats: event.totalSeats || 50,
      tags: Array.isArray(event.tags) ? event.tags.join(', ') : (event.tags || ''),
      imageUrl: event.imageUrl || event.banner || '',
      registrationDeadline: event.registrationDeadline || ''
    });
    setFormError('');
    setShowEventModal(true);
  };

  const handleDuplicateEvent = (event) => {
    openCreateEventModal({
      title: `Copy of ${event.title}`,
      description: event.description,
      category: event.category,
      date: event.date,
      time: event.time,
      endTime: event.endTime,
      venue: event.venue,
      totalSeats: event.totalSeats,
      tags: Array.isArray(event.tags) ? event.tags.join(', ') : event.tags,
      imageUrl: event.imageUrl || event.banner,
      registrationDeadline: event.registrationDeadline
    });
  };

  const handleEventSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!eventForm.title.trim() || !eventForm.date) {
      setFormError('Event Title and Date are required.');
      return;
    }

    try {
      setActionLoading(true);
      const dataToSubmit = {
        ...eventForm,
        totalSeats: parseInt(eventForm.totalSeats) || 50,
        userId: user.id
      };

      if (editingEvent) {
        await apiService.updateEvent(editingEvent.id, dataToSubmit);
      } else {
        await apiService.createEvent(dataToSubmit);
      }

      setShowEventModal(false);
      await loadGeneralData();
      await fetchStats();
    } catch (err) {
      console.error('Submit event error:', err);
      setFormError(err.message || 'Error processing request.');
    } finally {
      setActionLoading(false);
    }
  };

  // Club Action Handlers
  const openCreateClubModal = () => {
    setEditingClub(null);
    setClubForm({
      name: '',
      description: '',
      category: 'Technical',
      department: user.department || 'Computer Science',
      logo: '',
      banner: ''
    });
    setFormError('');
    setShowClubModal(true);
  };

  const openEditClubModal = (club) => {
    setEditingClub(club);
    setClubForm({
      name: club.name || '',
      description: club.description || '',
      category: club.category || 'Technical',
      department: club.department || '',
      logo: club.logo || '',
      banner: club.banner || ''
    });
    setFormError('');
    setShowClubModal(true);
  };

  const handleClubSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!clubForm.name.trim()) {
      setFormError('Club Name is required.');
      return;
    }

    try {
      setActionLoading(true);
      const dataToSubmit = {
        ...clubForm,
        userId: user.id
      };

      if (editingClub) {
        const res = await apiService.updateClub(editingClub.id, dataToSubmit);
        // Refresh local view
        setSelectedClubId(res.club.id);
      } else {
        const res = await apiService.createClub(dataToSubmit);
        setSelectedClubId(res.club.id);
      }

      setShowClubModal(false);
      await loadGeneralData();
      await fetchStats();
    } catch (err) {
      console.error('Submit club error:', err);
      setFormError(err.message || 'Error processing request.');
    } finally {
      setActionLoading(false);
    }
  };

  // Club Members roster and join requests
  const handleRequest = async (requestId, action) => {
    if (!selectedClubId) return;
    try {
      setActionLoading(true);
      await apiService.handleJoinRequest(selectedClubId, requestId, action);
      await loadClubManagementData(selectedClubId);
    } catch (err) {
      console.error(`Failed to ${action} request:`, err);
      alert(`Error trying to ${action} request.`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!selectedClubId) return;
    const confirmKick = window.confirm("Are you sure you want to remove this member?");
    if (!confirmKick) return;

    try {
      setActionLoading(true);
      await apiService.updateMemberRole(selectedClubId, memberId, 'remove');
      await loadClubManagementData(selectedClubId);
    } catch (err) {
      console.error('Failed to remove member:', err);
      alert('Error trying to remove member.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleModerator = async (memberId, currentRole) => {
    if (!selectedClubId) return;
    const newRole = currentRole === 'moderator' ? 'student' : 'moderator';
    try {
      setActionLoading(true);
      await apiService.updateMemberRole(selectedClubId, memberId, newRole);
      await loadClubManagementData(selectedClubId);
    } catch (err) {
      console.error('Failed to update member role:', err);
      alert('Error updating role.');
    } finally {
      setActionLoading(false);
    }
  };

  // Announcement Handlers
  const handleAnnouncementSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!announcementForm.title.trim() || !announcementForm.content.trim()) {
      setFormError('Announcement title and content are required.');
      return;
    }

    try {
      setActionLoading(true);
      if (editingAnnouncement) {
        await apiService.updateAnnouncement(editingAnnouncement.id, {
          userId: user.id,
          title: announcementForm.title,
          content: announcementForm.content,
          department: announcementForm.department || user.department || 'Computer Science'
        });
        setEditingAnnouncement(null);
        alert('Announcement updated successfully!');
      } else {
        const initials = user.name ? user.name.split(' ').map(n=>n[0]).join('').toUpperCase() : 'P';
        await apiService.postAnnouncement({
          title: announcementForm.title,
          content: announcementForm.content,
          author: user.name,
          authorAvatar: initials,
          authorId: user.id,
          department: announcementForm.department || user.department || 'Computer Science'
        });
        alert('Announcement posted successfully!');
      }

      setAnnouncementForm({ title: '', content: '', department: '' });
      await loadGeneralData();
      await fetchStats();
    } catch (err) {
      console.error('Announcement submit error:', err);
      setFormError(err.message || 'Error processing announcement.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditAnnouncement = (ann) => {
    setEditingAnnouncement(ann);
    setAnnouncementForm({
      title: ann.title || '',
      content: ann.content || '',
      department: ann.department || ''
    });
    const titleInput = document.getElementById('announcement-title');
    if (titleInput) titleInput.focus();
  };

  const handleDeleteAnnouncement = async () => {
    if (!deleteConfirmAnnouncement) return;
    try {
      setActionLoading(true);
      await apiService.deleteAnnouncement(deleteConfirmAnnouncement.id, user.id);
      setDeleteConfirmAnnouncement(null);
      await loadGeneralData();
      await fetchStats();
    } catch (err) {
      console.error('Failed to delete announcement:', err);
      alert('Error trying to delete announcement.');
    } finally {
      setActionLoading(false);
    }
  };

  // UI Helpers
  const getMonthDay = (dateStr) => {
    if (!dateStr) return { day: '??', month: '??' };
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { day: '??', month: '??' };
    return { day: d.getDate(), month: d.toLocaleString('en', { month: 'short' }) };
  };

  // Filter lists
  const professorEvents = eventsList.filter(e => e.creatorId === user.id || e.createdBy === user.id);
  const professorClubs = clubsList.filter(c => c.leaderId === user.id || c.ownerId === user.id);
  const joinedClubs = clubsList.filter(c => user.joinedClubs?.includes(c.id));
  const registeredEvents = eventsList.filter(e => user.registeredEvents?.includes(e.id));

  const miniStats = [
    { num: professorStats.eventsCreated, label: 'Events Created', color: '#6366f1', icon: Calendar, tab: 'events' },
    { num: professorStats.eventsJoined, label: 'Events Registered', color: '#ec4899', icon: Bookmark, tab: 'overview' },
    { num: professorStats.clubsCreated, label: 'Clubs Founded', color: '#f59e0b', icon: Users, tab: 'clubs' },
    { num: professorStats.clubsJoined, label: 'Clubs Joined', color: '#06b6d4', icon: Users, tab: 'overview' },
    { num: professorStats.announcementsCount, label: 'Announcements', color: '#22c55e', icon: Megaphone, tab: 'announcements' },
    { num: professorStats.studentsReached, label: 'Students Reached', color: '#a855f7', icon: TrendingUp, tab: 'overview' }
  ];

  return (
    <div className="cl-dashboard-container animate-fade-in">
      
      {/* Welcome Header */}
      <div className="dashboard-welcome">
        <h1><span className="wave">👨‍🏫</span> Welcome back, {user?.name}!</h1>
        <p>Campus Management Console. Oversee your clubs, publish announcements, schedule events and analyze participation.</p>
      </div>

      {/* Quick Actions Card Section */}
      <div className="quick-actions-section" style={{ marginBottom: 'var(--space-6)' }}>
        <h3 style={{ fontSize: 'var(--text-base)', fontWeight: '700', marginBottom: 'var(--space-3)', color: 'var(--text-primary)' }}>Quick Actions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
          
          <div 
            className="action-card card-hover" 
            onClick={openCreateClubModal}
            style={{ 
              cursor: 'pointer', 
              padding: 'var(--space-4) var(--space-5)', 
              borderRadius: 'var(--radius-xl)', 
              background: 'var(--bg-elevated)', 
              border: '1px solid var(--border-color)', 
              display: 'flex', 
              alignItems: 'center', 
              gap: 'var(--space-4)', 
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: 'var(--radius-lg)', 
              background: 'rgba(245, 158, 11, 0.1)', 
              color: '#f59e0b', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Users size={18} />
            </div>
            <div>
              <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: '700', margin: 0 }}>Create Club</h4>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>Establish a new campus group</p>
            </div>
          </div>

          <div 
            className="action-card card-hover" 
            onClick={() => openCreateEventModal()}
            style={{ 
              cursor: 'pointer', 
              padding: 'var(--space-4) var(--space-5)', 
              borderRadius: 'var(--radius-xl)', 
              background: 'var(--bg-elevated)', 
              border: '1px solid var(--border-color)', 
              display: 'flex', 
              alignItems: 'center', 
              gap: 'var(--space-4)', 
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: 'var(--radius-lg)', 
              background: 'rgba(99, 102, 241, 0.1)', 
              color: '#6366f1', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Calendar size={18} />
            </div>
            <div>
              <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: '700', margin: 0 }}>Create Event</h4>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>Schedule workshops or activities</p>
            </div>
          </div>

          <div 
            className="action-card card-hover" 
            onClick={() => {
              setActiveTab('announcements');
              setTimeout(() => {
                const titleInput = document.getElementById('announcement-title');
                if (titleInput) titleInput.focus();
              }, 100);
            }}
            style={{ 
              cursor: 'pointer', 
              padding: 'var(--space-4) var(--space-5)', 
              borderRadius: 'var(--radius-xl)', 
              background: 'var(--bg-elevated)', 
              border: '1px solid var(--border-color)', 
              display: 'flex', 
              alignItems: 'center', 
              gap: 'var(--space-4)', 
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: 'var(--radius-lg)', 
              background: 'rgba(34, 197, 94, 0.1)', 
              color: '#22c55e', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Megaphone size={18} />
            </div>
            <div>
              <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: '700', margin: 0 }}>Post Announcement</h4>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>Broadcast news to all students</p>
            </div>
          </div>

        </div>
      </div>

      {/* Mini Stats Grid */}
      <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        {miniStats.map((s, i) => (
          <div 
            className="mini-stat" 
            key={i} 
            style={{ cursor: 'pointer', transition: 'all 0.2s', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            onClick={() => setActiveTab(s.tab)}
          >
            <s.icon size={18} style={{ color: s.color, marginBottom: '6px' }} />
            {statsLoading ? (
              <div className="skeleton" style={{ width: '40px', height: '22px', margin: '4px 0', borderRadius: '4px' }}></div>
            ) : statsError ? (
              <span style={{ color: 'var(--danger-500)', fontSize: '10px', fontWeight: '500', textAlign: 'center', margin: '4px 0' }}>Unable to load statistics</span>
            ) : (
              <div className="mini-stat-num" style={{ color: s.color, fontSize: 'var(--text-lg)', fontWeight: 'bold' }}>{s.num}</div>
            )}
            <div className="mini-stat-label" style={{ fontSize: '11px', color: 'var(--text-tertiary)', textAlign: 'center' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Navigation tabs */}
      <div className="cl-tabs" style={{ marginBottom: 'var(--space-6)' }}>
        <button className={`cl-tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
        <button className={`cl-tab-btn ${activeTab === 'events' ? 'active' : ''}`} onClick={() => setActiveTab('events')}>Manage Events</button>
        <button className={`cl-tab-btn ${activeTab === 'clubs' ? 'active' : ''}`} onClick={() => setActiveTab('clubs')}>Manage Clubs</button>
        <button className={`cl-tab-btn ${activeTab === 'announcements' ? 'active' : ''}`} onClick={() => setActiveTab('announcements')}>Announcements</button>
      </div>

      {/* OVERVIEW PANEL */}
      {activeTab === 'overview' && (
        <div className="cl-overview-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            
            {/* Dynamic Activity Stream */}
            <div className="dash-card">
              <div className="dash-card-header">
                <h3>⚡ Recent Campus Actions</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', padding: 'var(--space-2)' }}>
                {professorStats.recentActivities && professorStats.recentActivities.length > 0 ? (
                  professorStats.recentActivities.map((act) => (
                    <div 
                      key={act.id} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 'var(--space-4)', 
                        padding: 'var(--space-3)', 
                        borderRadius: 'var(--radius-lg)', 
                        background: 'rgba(0,0,0,0.01)', 
                        border: '1px solid rgba(0,0,0,0.03)',
                        cursor: 'pointer'
                      }}
                      onClick={() => navigate(act.link)}
                    >
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: act.type.startsWith('event') ? 'rgba(99, 102, 241, 0.1)' : act.type.startsWith('club') ? 'rgba(245, 158, 11, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                        color: act.type.startsWith('event') ? '#6366f1' : act.type.startsWith('club') ? '#f59e0b' : '#22c55e',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px'
                      }}>
                        {act.type.startsWith('event') ? '📅' : act.type.startsWith('club') ? '🏛️' : '📢'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: '600', margin: 0 }}>{act.title}</h4>
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>{act.description}</p>
                      </div>
                      <div style={{ textAlign: 'right', fontSize: '10px', color: 'var(--text-tertiary)' }}>
                        <div>{act.date}</div>
                        <div>{act.time}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ fontStyle: 'italic', color: 'var(--text-tertiary)', textAlign: 'center', padding: 'var(--space-6)' }}>No activities logged yet.</p>
                )}
              </div>
            </div>

            {/* Registered Events */}
            <div className="dash-card">
              <div className="dash-card-header">
                <h3>📅 Registered & Booked Events ({registeredEvents.length})</h3>
                <Link to="/events" className="btn btn-ghost btn-sm">Browse All</Link>
              </div>
              <div className="upcoming-list">
                {registeredEvents.length > 0 ? (
                  registeredEvents.map(event => {
                    const { day, month } = getMonthDay(event.date);
                    return (
                      <Link to={`/events/${event.id}`} className="upcoming-item" key={event.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div className="upcoming-date"><span className="day">{day}</span><span className="month">{month}</span></div>
                        <div className="upcoming-info">
                          <h4>{event.title}</h4>
                          <p>{event.category} · Hosted by {event.organizer}</p>
                        </div>
                        <ArrowUpRight size={16} style={{ marginLeft: 'auto', color: 'var(--text-tertiary)' }} />
                      </Link>
                    );
                  })
                ) : (
                  <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', textAlign: 'center', padding: 'var(--space-4)' }}>No events registered yet.</p>
                )}
              </div>
            </div>

          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            
            {/* Joined Clubs */}
            <div className="dash-card">
              <div className="dash-card-header">
                <h3>🏛 Joined Communities ({joinedClubs.length})</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {joinedClubs.length > 0 ? (
                  joinedClubs.map(club => (
                    <Link 
                      to={`/clubs/${club.id}`} 
                      key={club.id} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px', 
                        padding: '10px', 
                        borderRadius: 'var(--radius-md)', 
                        background: 'rgba(0,0,0,0.01)', 
                        border: '1px solid rgba(0,0,0,0.03)',
                        textDecoration: 'none',
                        color: 'inherit'
                      }}
                    >
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        background: club.color || 'var(--primary-500)',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '11px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {club.logo || club.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: '13px', fontWeight: '600', margin: 0 }}>{club.name}</h4>
                        <p style={{ fontSize: '10px', color: 'var(--text-tertiary)', margin: '2px 0 0 0' }}>{club.memberCount || 1} members</p>
                      </div>
                      <ArrowUpRight size={14} style={{ color: 'var(--text-tertiary)' }} />
                    </Link>
                  ))
                ) : (
                  <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', textAlign: 'center', padding: 'var(--space-4)' }}>Not joined any clubs.</p>
                )}
              </div>
            </div>

            {/* Student Registrations widget */}
            <div className="dash-card">
              <div className="dash-card-header">
                <h3>👥 Recent Student Registrations</h3>
              </div>
              <div className="upcoming-list">
                {professorStats.recentRegistrations && professorStats.recentRegistrations.length > 0 ? (
                  professorStats.recentRegistrations.map((r) => (
                    <div className="upcoming-item" key={r.id}>
                      <div className="avatar avatar-md" style={{ background: `linear-gradient(135deg, var(--primary-400), var(--accent-400))` }}>{r.avatar}</div>
                      <div className="upcoming-info">
                        <h4>{r.name}</h4>
                        <p>Booked seat for "{r.event}"</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ padding: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', textAlign: 'center' }}>
                    No students registered yet
                  </p>
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* MANAGE EVENTS PANEL */}
      {activeTab === 'events' && (
        <div className="dash-card animate-fade-in">
          <div className="dash-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Your Events Queue ({professorEvents.length})</h3>
            <button className="btn btn-primary" onClick={() => openCreateEventModal()}>
              <Plus size={16} style={{ marginRight: '6px' }} /> Create Event
            </button>
          </div>

          <div className="cl-events-grid" style={{ marginTop: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {professorEvents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-tertiary)' }}>
                <Calendar size={36} style={{ color: 'var(--text-tertiary)', marginBottom: '8px' }} />
                <p>You have not scheduled any events.</p>
                <button className="btn btn-sm btn-ghost" style={{ marginTop: '8px' }} onClick={() => openCreateEventModal()}>Schedule first event</button>
              </div>
            ) : (
              professorEvents.map((event) => {
                const { day, month } = getMonthDay(event.date);
                const isPast = new Date(event.date) < new Date();
                const registered = event.registeredSeats || event.registrations || 0;
                const total = event.totalSeats || 50;
                const pct = Math.round((registered / total) * 100);

                return (
                  <div className="cl-event-row" key={event.id} style={{ opacity: isPast ? 0.75 : 1 }}>
                    <div className="cl-event-info">
                      <div className="cl-event-date-badge">
                        <span className="day">{day}</span>
                        <span className="month">{month}</span>
                      </div>
                      <div className="cl-event-details">
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {event.title}
                          {isPast && <span className="badge" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)', fontSize: '8px' }}>Past</span>}
                        </h4>
                        <p style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span><Clock size={11} style={{ display: 'inline', marginRight: '4px' }} /> {event.time}</span>
                          <span><MapPin size={11} style={{ display: 'inline', marginRight: '4px' }} /> {event.venue}</span>
                        </p>
                      </div>
                    </div>

                    <div className="cl-event-stats">
                      <div className="cl-event-stat">
                        <span className="cl-event-stat-val">{registered} / {total}</span>
                        <span className="cl-event-stat-label">Registered</span>
                      </div>
                      <div className="cl-event-stat" style={{ width: '60px' }}>
                        <span className="cl-event-stat-val" style={{ color: pct > 80 ? 'var(--success-500)' : 'var(--text-secondary)' }}>{pct}%</span>
                        <span className="cl-event-stat-label">Filled</span>
                      </div>
                    </div>

                    <div className="cl-event-actions cl-actions-dropdown-trigger">
                      <button 
                        className="btn btn-icon btn-sm btn-secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveEventMenuId(prev => prev === event.id ? null : event.id);
                        }}
                        title="Actions"
                      >
                        <MoreVertical size={16} />
                      </button>
                      
                      {activeEventMenuId === event.id && (
                        <div className="cl-actions-dropdown-menu">
                          <button 
                            className="cl-dropdown-item"
                            onClick={() => {
                              setActiveEventMenuId(null);
                              navigate(`/events/${event.id}`);
                            }}
                          >
                            <ArrowUpRight size={14} /> View Event
                          </button>
                          <button 
                            className="cl-dropdown-item"
                            onClick={() => {
                              setActiveEventMenuId(null);
                              openEditEventModal(event);
                            }}
                          >
                            <Edit3 size={14} /> Edit Event
                          </button>
                          <button 
                            className="cl-dropdown-item"
                            onClick={() => {
                              setActiveEventMenuId(null);
                              handleDuplicateEvent(event);
                            }}
                          >
                            <Copy size={14} /> Duplicate Event
                          </button>
                          <button 
                            className="cl-dropdown-item cl-dropdown-item-danger"
                            onClick={() => {
                              setActiveEventMenuId(null);
                              setDeleteConfirmEvent(event);
                            }}
                          >
                            <Trash2 size={14} /> Delete Event
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* MANAGE CLUBS PANEL */}
      {activeTab === 'clubs' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {professorClubs.length > 0 ? (
            <div>
              {/* Selector and Club Header controls */}
              <div className="dash-card" style={{ marginBottom: 'var(--space-6)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Select Club:</span>
                    <select 
                      className="cl-form-select" 
                      style={{ width: '220px', height: '36px', padding: '0 8px' }}
                      value={selectedClubId || ''} 
                      onChange={(e) => setSelectedClubId(parseInt(e.target.value))}
                    >
                      {professorClubs.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button className="btn btn-primary btn-sm" onClick={openCreateClubModal}>
                      <Plus size={14} style={{ marginRight: '6px' }} /> Create Another Club
                    </button>
                    
                    <div className="cl-actions-dropdown-trigger">
                      <button 
                        className="btn btn-icon btn-sm btn-secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveClubMenuId(prev => prev === selectedClubId ? null : selectedClubId);
                        }}
                        title="Actions"
                      >
                        <MoreVertical size={16} />
                      </button>
                      
                      {activeClubMenuId === selectedClubId && (
                        <div className="cl-actions-dropdown-menu">
                          <button 
                            className="cl-dropdown-item"
                            onClick={() => {
                              setActiveClubMenuId(null);
                              navigate(`/clubs/${selectedClubId}`);
                            }}
                          >
                            <ArrowUpRight size={14} /> View Club
                          </button>
                          <button 
                            className="cl-dropdown-item"
                            onClick={() => {
                              setActiveClubMenuId(null);
                              openEditClubModal(professorClubs.find(c => c.id === selectedClubId));
                            }}
                          >
                            <Edit3 size={14} /> Edit Club
                          </button>
                          <button 
                            className="cl-dropdown-item"
                            onClick={() => {
                              setActiveClubMenuId(null);
                              const roster = document.querySelector('.cl-members-list');
                              if (roster) roster.scrollIntoView({ behavior: 'smooth' });
                            }}
                          >
                            <Users size={14} /> Manage Members
                          </button>
                          <button 
                            className="cl-dropdown-item cl-dropdown-item-danger"
                            onClick={() => {
                              setActiveClubMenuId(null);
                              setDeleteConfirmClub(professorClubs.find(c => c.id === selectedClubId));
                            }}
                          >
                            <Trash2 size={14} /> Delete Club
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Roster & Join Requests split */}
              <div className="cl-overview-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
                
                {/* Join Requests */}
                <div className="dash-card">
                  <div className="dash-card-header">
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <UserCheck size={18} style={{ color: 'var(--warning-500)' }} />
                      Join Requests ({joinRequests.length})
                    </h3>
                  </div>
                  
                  {joinRequests.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--space-6)', color: 'var(--text-tertiary)' }}>
                      <Check size={28} style={{ color: 'var(--success-500)', marginBottom: '8px' }} />
                      <p style={{ fontSize: 'var(--text-sm)' }}>No pending join requests.</p>
                    </div>
                  ) : (
                    <div className="cl-requests-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {joinRequests.map((req) => (
                        <div className="cl-join-request" key={req.id} style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
                          <div className="cl-request-user">
                            <div className="avatar avatar-md" style={{ background: 'var(--accent-500)', color: 'white' }}>{req.avatar || (req.name ? req.name.slice(0,2).toUpperCase() : '??')}</div>
                            <div className="cl-request-details">
                              <h4 style={{ margin: 0, fontSize: '13px' }}>{req.name}</h4>
                              <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--text-tertiary)' }}>{req.department} · {req.year}</p>
                            </div>
                          </div>
                          <div className="cl-request-actions" style={{ display: 'flex', gap: '6px', marginTop: '8px', justifyContent: 'flex-end' }}>
                            <button className="btn btn-xs btn-success" disabled={actionLoading} onClick={() => handleRequest(req.id, 'approve')}>Approve</button>
                            <button className="btn btn-xs btn-danger" disabled={actionLoading} onClick={() => handleRequest(req.id, 'reject')}>Reject</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Member Roster */}
                <div className="dash-card">
                  <div className="dash-card-header">
                    <h3>Active Club Roster ({clubMembers.length})</h3>
                  </div>
                  
                  {clubMembers.length === 0 ? (
                    <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: 'var(--space-4)' }}>No members found.</p>
                  ) : (
                    <div className="cl-members-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {clubMembers.map((member) => {
                        const isFaculty = member.userId === user.id || member.role === 'Faculty Advisor';
                        const isMod = member.role === 'moderator' || member.role === 'Moderator';
                        const isPresident = member.role === 'President' || member.role === 'clubLeader';
                        
                        return (
                          <div className="cl-member-card" key={member.userId} style={{ padding: '10px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
                            <div className="cl-member-avatar" style={{ background: isFaculty ? 'linear-gradient(135deg, var(--primary-400), var(--primary-600))' : isMod ? 'linear-gradient(135deg, var(--accent-400), var(--accent-600))' : 'var(--text-tertiary)' }}>
                              {member.avatar || member.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="cl-member-info">
                              <h4 style={{ margin: 0, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {member.name}
                                {isFaculty && <span className="badge badge-primary" style={{ fontSize: '8px', padding: '1px 4px' }}>Advisor</span>}
                                {isPresident && <span className="badge badge-warning" style={{ fontSize: '8px', padding: '1px 4px' }}>President</span>}
                                {isMod && <span className="badge badge-success" style={{ fontSize: '8px', padding: '1px 4px' }}>Mod</span>}
                              </h4>
                              <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: 'var(--text-tertiary)' }}>{member.department || 'N/A'}</p>
                            </div>
                            
                            {!isFaculty && !isPresident && (
                              <div className="cl-member-actions">
                                <button 
                                  className={`btn btn-icon btn-sm ${isMod ? 'btn-secondary' : 'btn-ghost'}`} 
                                  title={isMod ? "Demote to Member" : "Promote to Moderator"}
                                  onClick={() => handleToggleModerator(member.userId, member.role)}
                                  disabled={actionLoading}
                                >
                                  {isMod ? <UserMinus size={12} /> : <UserCheck size={12} />}
                                </button>
                                <button 
                                  className="btn btn-icon btn-sm btn-danger btn-ghost" 
                                  title="Remove Member"
                                  onClick={() => handleRemoveMember(member.userId)}
                                  disabled={actionLoading}
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
              <div className="dash-card" style={{ maxWidth: '500px', width: '100%', textAlign: 'center', padding: 'var(--space-6)' }}>
                <span style={{ fontSize: '48px', display: 'block', marginBottom: '8px' }}>🏛</span>
                <h3>Create Your First Club</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-6)' }}>
                  You don't own any clubs yet. Build and manage a new club space, select members, schedule activities, and coordinate updates easily.
                </p>
                <button className="btn btn-primary" onClick={openCreateClubModal}>Create Club Workspace</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ANNOUNCEMENTS PANEL */}
      {activeTab === 'announcements' && (
        <div className="cl-overview-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: 'var(--space-6)' }}>
          
          {/* Post announcement */}
          <div className="dash-card" style={{ height: 'fit-content' }}>
            <div className="dash-card-header">
              <h3>📣 {editingAnnouncement ? 'Edit Campus Announcement' : 'Post Campus Announcement'}</h3>
            </div>
            
            <form onSubmit={handleAnnouncementSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
              {formError && (
                <div style={{ background: 'var(--danger-50)', color: 'var(--danger-700)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)' }}>{formError}</div>
              )}
              
              <div className="cl-form-group">
                <label htmlFor="announcement-title">Announcement Title *</label>
                <input 
                  id="announcement-title"
                  type="text" 
                  placeholder="e.g. Project submissions date extended" 
                  className="cl-form-input"
                  value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div className="cl-form-group">
                <label>Department Target</label>
                <input 
                  type="text" 
                  placeholder={`e.g. ${user.department || 'Computer Science'}`} 
                  className="cl-form-input"
                  value={announcementForm.department}
                  onChange={(e) => setAnnouncementForm(prev => ({ ...prev, department: e.target.value }))}
                />
              </div>

              <div className="cl-form-group">
                <label>Announcement Content *</label>
                <textarea 
                  placeholder="Draft details of the announcement here..." 
                  className="cl-form-textarea"
                  style={{ minHeight: '120px' }}
                  value={announcementForm.content}
                  onChange={(e) => setAnnouncementForm(prev => ({ ...prev, content: e.target.value }))}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" className="btn btn-primary" disabled={actionLoading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flex: 1 }}>
                  <Send size={16} /> {actionLoading ? 'Saving...' : editingAnnouncement ? 'Save Changes' : 'Publish Announcement'}
                </button>
                {editingAnnouncement && (
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => {
                      setEditingAnnouncement(null);
                      setAnnouncementForm({ title: '', content: '', department: '' });
                    }}
                    style={{ height: '44px' }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Campus Feed */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h3>📢 Latest Campus Announcements Feed</h3>
            </div>
            
            <div className="announcement-list" style={{ marginTop: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {announcementList.length === 0 ? (
                <p style={{ fontStyle: 'italic', color: 'var(--text-tertiary)', textAlign: 'center', padding: 'var(--space-6)' }}>No announcements found.</p>
              ) : (
                announcementList.map(ann => {
                  const canManage = user && (user.role === 'professor' || user.role === 'admin' || ann.authorId === user.id || ann.createdBy === user.id);
                  return (
                    <div className="announcement-item" key={ann.id} style={{ borderLeft: '4px solid var(--primary-500)', padding: '12px', background: 'rgba(0,0,0,0.01)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h4 style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', margin: 0 }}>{ann.title}</h4>
                        <span className="badge" style={{ background: 'var(--bg-tertiary)', fontSize: '10px' }}>{ann.date}</span>
                      </div>
                      <p style={{ color: 'var(--text-tertiary)', fontSize: '10px', margin: '2px 0' }}>Posted by {ann.author} · {ann.department}</p>
                      <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 1.4, margin: '8px 0 0 0', whiteSpace: 'pre-line' }}>{ann.content}</p>
                      
                      {ann.aiSummary && (
                        <div className="ai-summary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', background: 'var(--primary-50)', borderRadius: 'var(--radius-md)', color: 'var(--primary-700)', marginTop: '8px' }}>
                          <Sparkles size={12} style={{ color: 'var(--primary-500)' }} />
                          <span style={{ fontSize: 'var(--text-xs)', fontStyle: 'italic' }}><strong>AI Summary:</strong> {ann.aiSummary}</span>
                        </div>
                      )}

                      {canManage && (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', justifyContent: 'flex-end', borderTop: '1px solid rgba(0,0,0,0.03)', paddingTop: '8px' }}>
                          <button 
                            className="btn btn-secondary btn-sm" 
                            style={{ padding: '2px 8px', fontSize: '11px', height: '24px' }}
                            onClick={() => handleEditAnnouncement(ann)}
                          >
                            <Edit3 size={11} /> Edit
                          </button>
                          <button 
                            className="btn btn-danger btn-sm" 
                            style={{ padding: '2px 8px', fontSize: '11px', height: '24px' }}
                            onClick={() => setDeleteConfirmAnnouncement(ann)}
                          >
                            <Trash2 size={11} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      )}

      {/* CREATE / EDIT EVENT MODAL */}
      {showEventModal && (
        <div className="cl-modal-backdrop" onClick={() => setShowEventModal(false)}>
          <div className="cl-modal-container" onClick={(e) => e.stopPropagation()}>
            
            <div className="cl-modal-header">
              <h3>{editingEvent ? 'Edit Event Details' : 'Schedule New Event'}</h3>
              <button className="cl-modal-close" onClick={() => setShowEventModal(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleEventSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
              <div className="cl-modal-body">
                
                {formError && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--danger-50)', border: '1px solid var(--danger-200)', color: 'var(--danger-700)', padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-xs)' }}>
                    <ShieldAlert size={16} style={{ color: 'var(--danger-500)', flexShrink: 0 }} />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="cl-form-group">
                  <label htmlFor="ev-title">Event Title *</label>
                  <input 
                    id="ev-title"
                    type="text" 
                    placeholder="e.g. Seminar on Quantum Computing" 
                    className="cl-form-input"
                    value={eventForm.title}
                    onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                    required
                  />
                </div>

                <div className="cl-form-group">
                  <label htmlFor="ev-desc">Description</label>
                  <textarea 
                    id="ev-desc"
                    placeholder="Provide details about the session..." 
                    className="cl-form-textarea"
                    value={eventForm.description}
                    onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  />
                </div>

                <div className="cl-form-group">
                  <label>Event Banner Image</label>
                  <div 
                    className={`image-upload-zone ${dragOver ? 'dragover' : ''} ${eventForm.imageUrl ? 'has-image' : ''}`}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleImageUpload(e.dataTransfer.files[0], 'event');
                      }
                    }}
                    style={{
                      border: '2px dashed rgba(0,0,0,0.1)',
                      borderRadius: 'var(--radius-lg)',
                      padding: 'var(--space-5)',
                      textAlign: 'center',
                      cursor: 'pointer',
                      position: 'relative',
                      minHeight: '120px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      background: 'rgba(0,0,0,0.01)',
                      transition: 'all 0.2s',
                      borderColor: dragOver ? 'var(--primary-500)' : 'rgba(0,0,0,0.1)'
                    }}
                  >
                    {uploadingImage ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                        <div className="loading-spinner-container">
                          <div className="shimmer-bone" style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                        </div>
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Uploading image...</p>
                      </div>
                    ) : eventForm.imageUrl ? (
                      <div style={{ position: 'relative', width: '100%' }}>
                        <img 
                          src={eventForm.imageUrl} 
                          alt="Event Banner Preview" 
                          style={{ width: '100%', maxHeight: '160px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} 
                        />
                        <button 
                          type="button" 
                          onClick={(e) => { e.stopPropagation(); setEventForm(prev => ({ ...prev, imageUrl: '' })); }} 
                          style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            background: 'var(--danger-500)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '28px',
                            height: '28px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: 'var(--shadow-md)'
                          }}
                          title="Remove Image"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div onClick={() => document.getElementById('ev-file-input').click()} style={{ width: '100%' }}>
                        <Plus size={24} style={{ color: 'var(--text-tertiary)', marginBottom: '8px', margin: '0 auto' }} />
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: '500' }}>
                          Drag and drop your banner here, or <span style={{ color: 'var(--primary-500)' }}>browse</span>
                        </p>
                        <p style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                          Supports JPG, JPEG, PNG, WEBP (Max 5MB)
                        </p>
                        <input 
                          id="ev-file-input"
                          type="file" 
                          accept=".jpg,.jpeg,.png,.webp"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleImageUpload(e.target.files[0], 'event');
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="cl-form-row">
                  <div className="cl-form-group">
                    <label htmlFor="ev-category">Category</label>
                    <select 
                      id="ev-category"
                      className="cl-form-select"
                      value={eventForm.category}
                      onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="cl-form-group">
                    <label htmlFor="ev-seats">Maximum Seats Available</label>
                    <input 
                      id="ev-seats"
                      type="number" 
                      min="5" 
                      max="1000"
                      className="cl-form-input"
                      value={eventForm.totalSeats}
                      onChange={(e) => setEventForm({ ...eventForm, totalSeats: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="cl-form-row">
                  <div className="cl-form-group">
                    <label htmlFor="ev-date">Date *</label>
                    <input 
                      id="ev-date"
                      type="date" 
                      className="cl-form-input"
                      value={eventForm.date}
                      onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                      required
                    />
                  </div>

                  <div className="cl-form-group">
                    <label htmlFor="ev-deadline">Registration Deadline</label>
                    <input 
                      id="ev-deadline"
                      type="date" 
                      className="cl-form-input"
                      value={eventForm.registrationDeadline}
                      onChange={(e) => setEventForm({ ...eventForm, registrationDeadline: e.target.value })}
                    />
                  </div>
                </div>

                <div className="cl-form-row">
                  <div className="cl-form-group">
                    <label htmlFor="ev-time">Start Time</label>
                    <input 
                      id="ev-time"
                      type="text" 
                      placeholder="e.g. 10:00 AM" 
                      className="cl-form-input"
                      value={eventForm.time}
                      onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })}
                    />
                  </div>

                  <div className="cl-form-group">
                    <label htmlFor="ev-endtime">End Time</label>
                    <input 
                      id="ev-endtime"
                      type="text" 
                      placeholder="e.g. 1:00 PM" 
                      className="cl-form-input"
                      value={eventForm.endTime}
                      onChange={(e) => setEventForm({ ...eventForm, endTime: e.target.value })}
                    />
                  </div>
                </div>

                <div className="cl-form-group">
                  <label htmlFor="ev-venue">Venue / Location</label>
                  <input 
                    id="ev-venue"
                    type="text" 
                    placeholder="e.g. Seminar Hall, Block C or Online Zoom Link" 
                    className="cl-form-input"
                    value={eventForm.venue}
                    onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
                  />
                </div>

                <div className="cl-form-group">
                  <label htmlFor="ev-tags">Tags (Comma-separated)</label>
                  <input 
                    id="ev-tags"
                    type="text" 
                    placeholder="coding, react, javascript" 
                    className="cl-form-input"
                    value={eventForm.tags}
                    onChange={(e) => setEventForm({ ...eventForm, tags: e.target.value })}
                  />
                </div>

              </div>

              <div className="cl-modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEventModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Saving...' : editingEvent ? 'Save Changes' : 'Create Event'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* CREATE / EDIT CLUB MODAL */}
      {showClubModal && (
        <div className="cl-modal-backdrop" onClick={() => setShowClubModal(false)}>
          <div className="cl-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            
            <div className="cl-modal-header">
              <h3>{editingClub ? 'Edit Club Details' : 'Create New Club'}</h3>
              <button className="cl-modal-close" onClick={() => setShowClubModal(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleClubSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
              <div className="cl-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', overflowY: 'auto', overflowX: 'hidden' }}>
                {formError && (
                  <div style={{ background: 'var(--danger-50)', color: 'var(--danger-700)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)' }}>{formError}</div>
                )}

                <div className="cl-form-group">
                  <label>Club Name *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Quantum Computing Society" 
                    className="cl-form-input"
                    value={clubForm.name}
                    onChange={(e) => setClubForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div className="cl-form-group">
                  <label>Description</label>
                  <textarea 
                    placeholder="Explain the purpose and focus of this community..." 
                    className="cl-form-textarea"
                    style={{ minHeight: '80px' }}
                    value={clubForm.description}
                    onChange={(e) => setClubForm(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="cl-form-row">
                  <div className="cl-form-group">
                    <label>Category</label>
                    <select 
                      className="cl-form-select"
                      value={clubForm.category}
                      onChange={(e) => setClubForm(prev => ({ ...prev, category: e.target.value }))}
                    >
                      <option value="Technical">Technical</option>
                      <option value="Cultural">Cultural</option>
                      <option value="Sports">Sports</option>
                      <option value="Social Services">Social Services</option>
                    </select>
                  </div>

                  <div className="cl-form-group">
                    <label>Department Target</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Physics / Engineering" 
                      className="cl-form-input"
                      value={clubForm.department}
                      onChange={(e) => setClubForm(prev => ({ ...prev, department: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Logo Drag & Drop */}
                <div className="cl-form-group">
                  <label>Club Logo</label>
                  <div 
                    className={`image-upload-zone ${dragOverLogo ? 'dragover' : ''}`}
                    onDragOver={(e) => { e.preventDefault(); setDragOverLogo(true); }}
                    onDragLeave={() => setDragOverLogo(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOverLogo(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleImageUpload(e.dataTransfer.files[0], 'logo');
                      }
                    }}
                    style={{
                      border: '2px dashed rgba(0,0,0,0.1)',
                      borderRadius: 'var(--radius-lg)',
                      padding: 'var(--space-4)',
                      textAlign: 'center',
                      cursor: 'pointer',
                      background: 'rgba(0,0,0,0.01)',
                      borderColor: dragOverLogo ? 'var(--primary-500)' : 'rgba(0,0,0,0.1)'
                    }}
                  >
                    {uploadingLogo ? (
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Uploading Logo...</span>
                    ) : clubForm.logo ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <img src={clubForm.logo} alt="Club Logo Preview" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                        <button type="button" className="btn btn-ghost btn-xs btn-danger" onClick={() => setClubForm(prev => ({ ...prev, logo: '' }))}>Remove Logo</button>
                      </div>
                    ) : (
                      <div onClick={() => document.getElementById('logo-file-input').click()}>
                        <Plus size={16} style={{ margin: '0 auto', color: 'var(--text-tertiary)' }} />
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Click or Drag Logo (Square ratio)</span>
                        <input id="logo-file-input" type="file" style={{ display: 'none' }} accept=".jpg,.jpeg,.png,.webp" onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleImageUpload(e.target.files[0], 'logo');
                          }
                        }} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Banner Drag & Drop */}
                <div className="cl-form-group">
                  <label>Club Banner Image</label>
                  <div 
                    className={`image-upload-zone ${dragOverBanner ? 'dragover' : ''}`}
                    onDragOver={(e) => { e.preventDefault(); setDragOverBanner(true); }}
                    onDragLeave={() => setDragOverBanner(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOverBanner(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleImageUpload(e.dataTransfer.files[0], 'banner');
                      }
                    }}
                    style={{
                      border: '2px dashed rgba(0,0,0,0.1)',
                      borderRadius: 'var(--radius-lg)',
                      padding: 'var(--space-4)',
                      textAlign: 'center',
                      cursor: 'pointer',
                      background: 'rgba(0,0,0,0.01)',
                      borderColor: dragOverBanner ? 'var(--primary-500)' : 'rgba(0,0,0,0.1)'
                    }}
                  >
                    {uploadingBanner ? (
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Uploading Banner...</span>
                    ) : clubForm.banner ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <img src={clubForm.banner} alt="Club Banner Preview" style={{ width: '80px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                        <button type="button" className="btn btn-ghost btn-xs btn-danger" onClick={() => setClubForm(prev => ({ ...prev, banner: '' }))}>Remove Banner</button>
                      </div>
                    ) : (
                      <div onClick={() => document.getElementById('banner-file-input').click()}>
                        <Plus size={16} style={{ margin: '0 auto', color: 'var(--text-tertiary)' }} />
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Click or Drag Banner (Wide ratio)</span>
                        <input id="banner-file-input" type="file" style={{ display: 'none' }} accept=".jpg,.jpeg,.png,.webp" onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleImageUpload(e.target.files[0], 'banner');
                          }
                        }} />
                      </div>
                    )}
                  </div>
                </div>

              </div>

              <div className="cl-modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowClubModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Saving...' : editingClub ? 'Save Changes' : 'Create Club'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* EVENT DELETE CONFIRMATION MODAL */}
      {deleteConfirmEvent && (
        <div className="cl-modal-backdrop" onClick={() => setDeleteConfirmEvent(null)}>
          <div className="cl-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px', padding: 'var(--space-6)' }}>
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--danger-50)', color: 'var(--danger-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldAlert size={24} />
              </div>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 800, margin: 0 }}>Delete Event?</h3>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Are you sure you want to delete <strong>"{deleteConfirmEvent.title}"</strong>? All student registrations will be deleted, and they will receive cancellation notices instantly.
              </p>
              
              <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: 'var(--space-4)' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setDeleteConfirmEvent(null)}>Cancel</button>
                <button 
                  type="button" 
                  className="btn btn-danger" 
                  style={{ flex: 1 }} 
                  disabled={actionLoading}
                  onClick={async () => {
                    try {
                      setActionLoading(true);
                      await apiService.deleteEvent(deleteConfirmEvent.id, user.id);
                      setDeleteConfirmEvent(null);
                      await loadGeneralData();
                      await fetchStats();
                    } catch (err) {
                      console.error('Failed to delete event:', err);
                      alert(err.message || 'Failed to delete the event.');
                    } finally {
                      setActionLoading(false);
                    }
                  }}
                >
                  {actionLoading ? 'Deleting...' : 'Delete Event'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CLUB DELETE CONFIRMATION MODAL */}
      {deleteConfirmClub && (
        <div className="cl-modal-backdrop" onClick={() => setDeleteConfirmClub(null)}>
          <div className="cl-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px', padding: 'var(--space-6)' }}>
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--danger-50)', color: 'var(--danger-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldAlert size={24} />
              </div>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 800, margin: 0 }}>Delete Club?</h3>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.5, textAlign: 'left', width: '100%' }}>
                Deleting this club will:
              </p>
              <ul style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.6, textAlign: 'left', width: '100%', margin: '0 0 var(--space-2) var(--space-4)', padding: 0 }}>
                <li>Remove all memberships</li>
                <li>Remove club announcements</li>
                <li>Remove club chats</li>
                <li>Remove club events</li>
              </ul>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--danger-500)', fontWeight: '600', width: '100%', textAlign: 'left' }}>
                This action is absolute and cannot be undone.
              </p>
              
              <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: 'var(--space-4)' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setDeleteConfirmClub(null)}>Cancel</button>
                <button 
                  type="button" 
                  className="btn btn-danger" 
                  style={{ flex: 1 }} 
                  disabled={actionLoading}
                  onClick={async () => {
                    try {
                      setActionLoading(true);
                      await apiService.deleteClub(deleteConfirmClub.id, user.id);
                      setDeleteConfirmClub(null);
                      // Clear selected club selection
                      setSelectedClubId(null);
                      await loadGeneralData();
                      await fetchStats();
                    } catch (err) {
                      console.error('Failed to delete club:', err);
                      alert(err.message || 'Failed to delete the club.');
                    } finally {
                      setActionLoading(false);
                    }
                  }}
                >
                  {actionLoading ? 'Deleting...' : 'Delete Club'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ANNOUNCEMENT DELETE CONFIRMATION MODAL */}
      {deleteConfirmAnnouncement && (
        <div className="cl-modal-backdrop" onClick={() => setDeleteConfirmAnnouncement(null)}>
          <div className="cl-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px', padding: 'var(--space-6)' }}>
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--danger-50)', color: 'var(--danger-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldAlert size={24} />
              </div>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 800, margin: 0 }}>Delete Announcement?</h3>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Are you sure you want to delete <strong>"{deleteConfirmAnnouncement.title}"</strong>? This announcement will be removed from the feed for all students immediately.
              </p>
              
              <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: 'var(--space-4)' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setDeleteConfirmAnnouncement(null)}>Cancel</button>
                <button 
                  type="button" 
                  className="btn btn-danger" 
                  style={{ flex: 1 }} 
                  disabled={actionLoading}
                  onClick={handleDeleteAnnouncement}
                >
                  {actionLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
