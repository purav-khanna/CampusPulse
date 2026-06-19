import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Calendar, TrendingUp, MessageCircle, Megaphone, 
  Clock, MapPin, Sparkles, Plus, Search, Trash2, Edit3, 
  UserCheck, UserMinus, ArrowUpRight, BarChart3, X, AlertCircle, Check, ShieldAlert,
  MoreVertical, Copy, PlusCircle, UserPlus, Building, Layers,
  Eye, Heart, MessageSquare
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { apiService } from '../../services/api';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './ClubLeaderDashboard.css';
import '../../components/ui/Components.css';
import './Dashboard.css';

const CATEGORIES = ['Workshop', 'Hackathon', 'Cultural', 'Sports', 'Seminar', 'Meeting'];

const renderLogo = (logo, name) => {
  const isUrl = logo && (logo.startsWith('http') || logo.startsWith('/') || logo.includes('.'));
  if (isUrl) {
    return <img src={logo} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />;
  }
  return logo || name.slice(0, 2).toUpperCase();
};

export default function ClubLeaderDashboard() {
  const { user, updateUserLocalState } = useAuth();
  const { totalUnreadCount } = useChat();
  const navigate = useNavigate();

  const membersSectionRef = useRef(null);
  const handleScrollToMembers = () => {
    if (membersSectionRef.current) {
      membersSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const [showRegistrationsModal, setShowRegistrationsModal] = useState(false);
  const [registrationsEvent, setRegistrationsEvent] = useState(null);
  const [registrationsList, setRegistrationsList] = useState([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  const [viewMode, setViewMode] = useState('dashboard');
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState('growth');

  const openViewRegistrationsModal = async (event) => {
    setRegistrationsEvent(event);
    setShowRegistrationsModal(true);
    setLoadingRegistrations(true);
    try {
      const attendees = await apiService.getEventRegistrations(event.id);
      setRegistrationsList(attendees);
    } catch (err) {
      console.error('Failed to load registrations:', err);
      alert('Error fetching registrations.');
    } finally {
      setLoadingRegistrations(false);
    }
  };

  // Dashboard Data
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Focus club filter
  const [focusedClubId, setFocusedClubId] = useState(null);

  // Search filter for members
  const [memberSearch, setMemberSearch] = useState('');

  // Modals Visibility & State
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
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

  const [showAnnounceModal, setShowAnnounceModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [announceForm, setAnnounceForm] = useState({
    title: '',
    content: '',
    clubId: ''
  });

  const [showClubModal, setShowClubModal] = useState(false);
  const [editingClub, setEditingClub] = useState(null);
  const [clubForm, setClubForm] = useState({
    name: '',
    description: '',
    category: 'Technical',
    department: '',
    logo: '',
    banner: ''
  });

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    clubId: ''
  });

  const [actionLoading, setActionLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Uploading flags
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [dragOverLogo, setDragOverLogo] = useState(false);
  const [dragOverBanner, setDragOverBanner] = useState(false);

  // Deletion Confirmations
  const [deleteConfirmEvent, setDeleteConfirmEvent] = useState(null);
  const [deleteConfirmAnnouncement, setDeleteConfirmAnnouncement] = useState(null);
  const [deleteConfirmClub, setDeleteConfirmClub] = useState(null);

  // Dropdown states
  const [activeEventMenuId, setActiveEventMenuId] = useState(null);
  const [activeClubMenuId, setActiveClubMenuId] = useState(null);

  // Fetch all dashboard data
  const loadDashboardData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await apiService.getClubLeaderDashboard(user.clubId || 0, user.id);
      setDashboardData(data);
      
      // Auto-focus first club if not set yet
      if (data && data.clubs && data.clubs.length > 0 && !focusedClubId) {
        setFocusedClubId(data.clubs[0].id);
      }
      setError(null);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Could not retrieve club leader statistics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  useEffect(() => {
    const handleRefresh = () => {
      loadDashboardData();
    };

    const handleDocumentClick = () => {
      setActiveEventMenuId(null);
      setActiveClubMenuId(null);
    };

    window.addEventListener('notification_updated', handleRefresh);
    window.addEventListener('event_registered', handleRefresh);
    window.addEventListener('event_deleted', handleRefresh);
    window.addEventListener('club_joined', handleRefresh);
    window.addEventListener('club_left', handleRefresh);
    window.addEventListener('club_created', handleRefresh);
    window.addEventListener('club_deleted', handleRefresh);
    window.addEventListener('announcement_created', handleRefresh);
    window.addEventListener('announcement_deleted', handleRefresh);
    document.addEventListener('click', handleDocumentClick);

    return () => {
      window.removeEventListener('notification_updated', handleRefresh);
      window.removeEventListener('event_registered', handleRefresh);
      window.removeEventListener('event_deleted', handleRefresh);
      window.removeEventListener('club_joined', handleRefresh);
      window.removeEventListener('club_left', handleRefresh);
      window.removeEventListener('club_created', handleRefresh);
      window.removeEventListener('club_deleted', handleRefresh);
      window.removeEventListener('announcement_created', handleRefresh);
      window.removeEventListener('announcement_deleted', handleRefresh);
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [user, focusedClubId]);

  // Image Upload helper
  const handleImageUpload = async (file, target = 'event') => {
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
      console.error('Failed to upload image:', err);
      alert('Error uploading image. Please try again.');
    } finally {
      if (target === 'event') setUploadingImage(false);
      if (target === 'logo') setUploadingLogo(false);
      if (target === 'banner') setUploadingBanner(false);
    }
  };

  // Club Create/Update Submission
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
        clubName: clubForm.name,
        name: clubForm.name,
        description: clubForm.description,
        category: clubForm.category,
        department: clubForm.department,
        logo: clubForm.logo,
        banner: clubForm.banner,
        createdBy: user.id,
        userId: user.id,
        createdAt: new Date().toISOString()
      };

      let result;
      if (editingClub) {
        result = await apiService.updateClub(editingClub.id, dataToSubmit);
        alert('Club updated successfully!');
      } else {
        result = await apiService.createClub(dataToSubmit);
        alert('Club created successfully!');
        if (result && result.user) {
          updateUserLocalState(result.user);
        }
      }

      setShowClubModal(false);
      setEditingClub(null);
      await loadDashboardData();
    } catch (err) {
      console.error('Submit club error:', err);
      setFormError(err.message || 'Error processing club request.');
    } finally {
      setActionLoading(false);
    }
  };

  const openCreateClubModal = () => {
    setEditingClub(null);
    setClubForm({
      name: '',
      description: '',
      category: 'Technical',
      department: user.department || '',
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

  // Event Create/Update Submission
  const handleEventSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!eventForm.title.trim() || !eventForm.date) {
      setFormError('Event Title and Date are required.');
      return;
    }

    const clubId = focusedClubId || (dashboardData?.clubs && dashboardData.clubs[0]?.id) || user.clubId;
    if (!clubId) {
      setFormError('You must manage or create a club first before scheduling events.');
      return;
    }

    try {
      setActionLoading(true);
      const dataToSubmit = {
        title: eventForm.title,
        description: eventForm.description,
        date: eventForm.date,
        time: eventForm.time,
        location: eventForm.venue,
        venue: eventForm.venue,
        banner: eventForm.imageUrl || eventForm.banner || 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&h=400&fit=crop',
        imageUrl: eventForm.imageUrl || eventForm.banner || 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&h=400&fit=crop',
        maxSeats: parseInt(eventForm.totalSeats) || 50,
        totalSeats: parseInt(eventForm.totalSeats) || 50,
        createdBy: user.id,
        userId: user.id,
        category: eventForm.category,
        registrationDeadline: eventForm.registrationDeadline,
        tags: eventForm.tags
      };

      if (editingEvent) {
        await apiService.updateEvent(editingEvent.id, dataToSubmit);
        alert('Event updated successfully!');
      } else {
        await apiService.createEvent(dataToSubmit);
        alert('Event Created Successfully');
      }

      setShowEventModal(false);
      setEditingEvent(null);
      await loadDashboardData();
    } catch (err) {
      console.error('Event submit error:', err);
      alert('Failed to Create Event');
      setFormError(err.message || 'Error processing event request.');
    } finally {
      setActionLoading(false);
    }
  };

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

  // Announcement Create/Update Submission
  const handleAnnouncementSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!announceForm.title.trim() || !announceForm.content.trim()) {
      setFormError('Announcement title and message are required.');
      return;
    }

    const clubId = announceForm.clubId || focusedClubId || (dashboardData?.clubs && dashboardData.clubs[0]?.id) || user.clubId;
    if (!clubId) {
      setFormError('You must select or manage a club to post announcements.');
      return;
    }

    try {
      setActionLoading(true);
      if (editingAnnouncement) {
        await apiService.updateAnnouncement(editingAnnouncement.id, {
          userId: user.id,
          title: announceForm.title,
          content: announceForm.content
        });
        alert('Announcement updated successfully!');
      } else {
        await apiService.postAnnouncement({
          title: announceForm.title,
          message: announceForm.content,
          authorId: user.id,
          authorRole: user.role,
          createdAt: new Date().toISOString()
        });
        alert('Announcement Published');
      }

      setAnnounceForm({ title: '', content: '', clubId: '' });
      setShowAnnounceModal(false);
      setEditingAnnouncement(null);
      await loadDashboardData();
    } catch (err) {
      console.error('Announcement submit error:', err);
      alert('Failed to Publish Announcement');
      setFormError(err.message || 'Error processing announcement request.');
    } finally {
      setActionLoading(false);
    }
  };

  const openCreateAnnounceModal = () => {
    setEditingAnnouncement(null);
    setAnnounceForm({
      title: '',
      content: '',
      clubId: focusedClubId || (dashboardData?.clubs && dashboardData.clubs[0]?.id) || ''
    });
    setFormError('');
    setShowAnnounceModal(true);
  };

  const openEditAnnounceModal = (ann) => {
    setEditingAnnouncement(ann);
    setAnnounceForm({
      title: ann.title || '',
      content: ann.content || '',
      clubId: ann.clubId || focusedClubId || ''
    });
    setFormError('');
    setShowAnnounceModal(true);
  };

  // Invite Member Submission
  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!inviteForm.email.trim()) {
      setFormError('Student email address is required.');
      return;
    }

    const clubId = inviteForm.clubId || focusedClubId || (dashboardData?.clubs && dashboardData.clubs[0]?.id) || user.clubId;
    if (!clubId) {
      setFormError('You must manage a club to send invites.');
      return;
    }

    try {
      setActionLoading(true);
      await apiService.inviteMember(clubId, { email: inviteForm.email });
      alert(`Invitation sent to ${inviteForm.email}!`);
      setShowInviteModal(false);
      setInviteForm({ email: '', clubId: '' });
    } catch (err) {
      console.error('Invite member error:', err);
      setFormError(err.message || 'Error sending invitation. Please check the email.');
    } finally {
      setActionLoading(false);
    }
  };

  // Create Group Chat action
  const handleCreateGroupChat = async (clubId) => {
    const cid = clubId || focusedClubId || (dashboardData?.clubs && dashboardData.clubs[0]?.id);
    if (!cid) {
      alert('Create or select a club first.');
      return;
    }
    try {
      setActionLoading(true);
      const res = await apiService.createGroupChat(cid);
      alert('Club Group Chat initialized!');
      navigate(`/chat/club-${cid}`);
    } catch (err) {
      console.error('Group chat creation failed:', err);
      alert('Error initializing group chat.');
    } finally {
      setActionLoading(false);
    }
  };

  // Approve / Reject Join Request
  const handleRequest = async (requestId, action, clubId) => {
    try {
      setActionLoading(true);
      await apiService.handleJoinRequest(clubId, requestId, action);
      alert(`Join request successfully ${action}d!`);
      await loadDashboardData();
    } catch (err) {
      console.error(`Failed to ${action} join request:`, err);
      alert(`Error trying to ${action} request.`);
    } finally {
      setActionLoading(false);
    }
  };

  // Remove member from club
  const handleRemoveMember = async (memberId, clubId) => {
    const confirmKick = window.confirm("Are you sure you want to remove this member from the club?");
    if (!confirmKick) return;

    try {
      setActionLoading(true);
      await apiService.updateMemberRole(clubId, memberId, 'remove');
      alert('Member removed successfully.');
      await loadDashboardData();
    } catch (err) {
      console.error('Failed to remove member:', err);
      alert('Error trying to remove member.');
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle moderator status
  const handleToggleModerator = async (memberId, currentRole, clubId) => {
    const newRole = currentRole === 'moderator' ? 'student' : 'moderator';
    try {
      setActionLoading(true);
      await apiService.updateMemberRole(clubId, memberId, newRole);
      alert(`User role updated to ${newRole === 'moderator' ? 'Moderator' : 'Student'}!`);
      await loadDashboardData();
    } catch (err) {
      console.error('Failed to update member role:', err);
      alert('Error updating role.');
    } finally {
      setActionLoading(false);
    }
  };

  const getMonthDay = (dateStr) => {
    if (!dateStr) return { day: '??', month: '??' };
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { day: '??', month: '??' };
    return { day: d.getDate(), month: d.toLocaleString('en', { month: 'short' }) };
  };

  if (loading && !dashboardData) {
    return (
      <div className="loading-spinner-container" style={{ display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="shimmer-bone" style={{ width: '64px', height: '64px', borderRadius: '50%' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>Aggregating leader data workspace...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dash-card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--space-8)', textAlign: 'center', gap: 'var(--space-4)', margin: '40px auto', maxWidth: '600px' }}>
        <AlertCircle size={48} style={{ color: 'var(--danger-500)' }} />
        <h3>Dashboard Error</h3>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '400px' }}>{error}</p>
        <button className="btn btn-primary" onClick={loadDashboardData}>Retry Load</button>
      </div>
    );
  }

  const {
    clubs = [],
    members = [],
    events = [],
    announcements = [],
    joinRequests = [],
    clubsCount = 0,
    eventsCreated = 0,
    activeMembers = 0,
    announcementsPosted = 0,
    pendingRequestsCount = 0,
    analytics = { totalMembers: 0, newMembersThisWeek: 0, eventRegistrations: 0, mostActiveClub: 'N/A', engagementRate: 0, memberGrowth: [], eventParticipation: [] }
  } = dashboardData || {};

  // Filter lists based on focusedClubId if set
  const displayClubs = focusedClubId ? clubs.filter(c => c.id === focusedClubId) : clubs;
  const displayEvents = focusedClubId ? events.filter(e => {
    const club = clubs.find(c => c.id === focusedClubId);
    return e.organizer === club?.name;
  }) : events;
  const displayMembers = focusedClubId ? members.filter(m => {
    const userDb = dashboardData.members.find(x => x.id === m.id);
    return userDb && displayClubs.some(c => c.name === userDb.clubName || userDb.clubName.includes(c.name));
  }) : members;
  const displayJoinRequests = focusedClubId ? joinRequests.filter(jr => jr.clubId === focusedClubId) : joinRequests;
  const displayAnnouncements = focusedClubId ? announcements.filter(a => a.clubId === focusedClubId) : announcements;

  // Filter members by search input
  const filteredMembers = displayMembers.filter(m => 
    (m.name || '').toLowerCase().includes(memberSearch.toLowerCase()) ||
    (m.department || '').toLowerCase().includes(memberSearch.toLowerCase())
  );

  // Deterministic metrics generator for announcements
  const getAnnMetrics = (ann) => {
    const seed = typeof ann.id === 'string' 
      ? ann.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) 
      : (ann.id || 0);
    const views = (seed % 150) + 42;
    const likes = Math.round(views * (0.15 + (seed % 10) / 100));
    const comments = Math.round(likes * (0.1 + (seed % 5) / 50));
    return { views, likes, comments };
  };

  const statsList = [
    { key: 'clubs', num: clubsCount, label: 'Clubs Managed', icon: Building, needsAction: false },
    { key: 'events', num: eventsCreated, label: 'Events Created', icon: Calendar, needsAction: false },
    { key: 'members', num: activeMembers, label: 'Members', icon: Users, needsAction: false, onClick: () => navigate('/members-management') },
    { key: 'announcements', num: announcementsPosted, label: 'Announcements', icon: Megaphone, needsAction: false },
    { key: 'requests', num: pendingRequestsCount, label: 'Pending Requests', icon: UserCheck, needsAction: pendingRequestsCount > 0, trend: pendingRequestsCount > 0 ? 'Requires action' : 'All caught up', onClick: () => navigate('/members-management') },
    { key: 'messages', num: totalUnreadCount, label: 'Unread Messages', icon: MessageCircle, needsAction: totalUnreadCount > 0, trend: totalUnreadCount > 0 ? `${totalUnreadCount} unread` : 'No unread', path: '/chat' }
  ];

  if (viewMode === 'members') {
    return (
      <div className="cl-dashboard-container animate-fade-in">
        {/* Header with Back button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <button className="btn btn-secondary btn-sm" onClick={() => setViewMode('dashboard')} style={{ marginBottom: '12px' }}>
              ← Back to Dashboard
            </button>
            <h1>👥 Members & Requests Management</h1>
            <p>Approve pending requests, review student details, or remove members from your managed clubs.</p>
          </div>
        </div>

        {/* Pending Requests Section */}
        <div className="dash-card">
          <h3>📥 Pending Join Requests ({joinRequests.length})</h3>
          {joinRequests.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--space-6)', color: 'var(--text-tertiary)', textAlign: 'center' }}>
              <Check size={28} style={{ color: 'var(--success-500)', marginBottom: '8px' }} />
              <p style={{ fontSize: 'var(--text-sm)' }}>No pending requests.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', marginTop: 'var(--space-4)' }}>
              <table className="cl-members-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>
                    <th style={{ padding: '12px 8px' }}>Member Name</th>
                    <th style={{ padding: '12px 8px' }}>Department</th>
                    <th style={{ padding: '12px 8px' }}>Request Date</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {joinRequests.map(req => {
                    const reqClub = clubs.find(c => c.id === req.clubId);
                    return (
                      <tr key={req.id} style={{ borderBottom: '1px solid var(--border-light)', fontSize: 'var(--text-sm)' }}>
                        <td style={{ padding: '12px 8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div className="avatar avatar-sm" style={{ background: 'var(--accent-500)', color: 'white', fontWeight: 'bold' }}>
                            {req.avatar || (req.name ? req.name.slice(0, 2).toUpperCase() : '??')}
                          </div>
                          <div>
                            <span style={{ fontWeight: 600 }}>{req.name}</span>
                            <span style={{ display: 'block', fontSize: '9px', color: 'var(--primary-500)' }}>Club: {reqClub?.name || 'Club'}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 8px' }}>{req.department} · {req.year}</td>
                        <td style={{ padding: '12px 8px' }}>{req.requestedAt ? new Date(req.requestedAt).toLocaleDateString() : 'N/A'}</td>
                        <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                          <button className="btn btn-sm btn-success" onClick={() => handleRequest(req.id, 'approve', req.clubId)} style={{ marginRight: '6px', padding: '4px 10px', fontSize: 'var(--text-xs)' }}>
                            Approve
                          </button>
                          <button className="btn btn-sm btn-danger btn-ghost" onClick={() => handleRequest(req.id, 'reject', req.clubId)} style={{ padding: '4px 10px', fontSize: 'var(--text-xs)' }}>
                            Reject
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Active Members Section */}
        <div className="dash-card">
          <h3>👥 Active Members ({members.length})</h3>
          {members.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-tertiary)' }}>
              <Users size={32} style={{ marginBottom: '8px' }} />
              <p style={{ fontSize: 'var(--text-sm)' }}>No active members.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', marginTop: 'var(--space-4)' }}>
              <table className="cl-members-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>
                    <th style={{ padding: '12px 8px' }}>Member Name</th>
                    <th style={{ padding: '12px 8px' }}>Department</th>
                    <th style={{ padding: '12px 8px' }}>Join Date</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map(member => {
                    const isPresident = member.id === user.id || member.role === 'clubLeader' || member.role === 'club_leader';
                    const memberClub = clubs.find(c => c.name === member.clubName || member.clubName.includes(c.name));
                    const clubId = memberClub?.id || user.clubId;
                    return (
                      <tr key={member.id} style={{ borderBottom: '1px solid var(--border-light)', fontSize: 'var(--text-sm)' }}>
                        <td style={{ padding: '12px 8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div className="avatar avatar-sm" style={{ background: isPresident ? 'var(--warning-500)' : 'var(--text-tertiary)', color: 'white', fontWeight: 'bold' }}>
                            {member.avatar || member.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span style={{ fontWeight: 600 }}>{member.name}</span>
                            {isPresident && <span className="badge badge-warning" style={{ fontSize: '7px', padding: '0 3px', marginLeft: '6px' }}>President</span>}
                            <span style={{ display: 'block', fontSize: '9px', color: 'var(--primary-500)' }}>Club: {member.clubName}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 8px' }}>{member.department} · {member.year}</td>
                        <td style={{ padding: '12px 8px' }}>{member.joinedDate ? new Date(member.joinedDate).toLocaleDateString() : 'N/A'}</td>
                        <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                          {!isPresident && (
                            <button className="btn btn-sm btn-danger btn-ghost" onClick={() => handleRemoveMember(member.id, clubId)} style={{ padding: '4px 10px', fontSize: 'var(--text-xs)' }}>
                              Remove
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  const hasGrowthData = analytics.memberGrowth && analytics.memberGrowth.length >= 3 && activeMembers >= 3;
  const hasAttendanceData = analytics.eventParticipation && analytics.eventParticipation.length >= 3;
  const hasReachData = displayAnnouncements.length >= 3;
  const hasTrendsData = displayEvents.length >= 3;
  const hasAnalyticsData = hasGrowthData || hasAttendanceData || hasReachData || hasTrendsData;

  const announcementReachData = displayAnnouncements.slice(0, 5).map(ann => {
    const m = getAnnMetrics(ann);
    return {
      title: ann.title.length > 12 ? ann.title.slice(0, 12) + '…' : ann.title,
      Views: m.views,
      Likes: m.likes
    };
  });

  const registrationTrendData = displayEvents.slice().reverse().map(e => ({
    name: e.title.length > 12 ? e.title.slice(0, 12) + '…' : e.title,
    Registrations: e.registeredSeats || e.registrations || 0
  }));

  return (
    <div className="cl-dashboard-container animate-fade-in">
      
      {/* Welcome Header */}
      <div className="dashboard-welcome">
        <h1>
          <span className="wave">👋</span> Welcome back, Club Leader!
          {focusedClubId && (
            <span className="cl-badge-filter">
              Filter Active: <strong>{clubs.find(c => c.id === focusedClubId)?.name || 'Focus Club'}</strong>
              <button 
                onClick={() => setFocusedClubId(null)}
                className="cl-badge-filter-close"
                title="Clear Filter"
              >
                <X size={12} />
              </button>
            </span>
          )}
        </h1>
        <p>Manage clubs, events, announcements, and members.</p>
      </div>

      {/* Top Statistics Grid */}
      <div className="cl-stats-grid">
        {statsList.map((s, i) => (
          <div 
            className={`cl-stat-card stat-${s.key} ${s.needsAction ? 'needs-action' : ''}`} 
            key={i} 
            onClick={() => {
              if (s.onClick) s.onClick();
              else if (s.path) navigate(s.path);
            }}
            style={{ cursor: (s.path || s.onClick) ? 'pointer' : 'default' }}
          >
            <div className="cl-stat-icon-wrapper">
              <s.icon size={20} />
            </div>
            <div className="cl-stat-info">
              <div className="cl-stat-num">{s.num}</div>
              <div className="cl-stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions Panel */}
      <div className="dash-card">
        <h3 className="cl-section-title">Quick Actions Panel</h3>
        <div className="cl-quick-actions-row">
          
          <button className="cl-btn-secondary" onClick={openCreateClubModal}>
            <Plus size={16} /> Create Club
          </button>
 
          <button className="cl-btn-primary" onClick={() => openCreateEventModal()} disabled={clubsCount === 0}>
            <Calendar size={16} /> Create Event
          </button>
 
          <button className="cl-btn-secondary" onClick={openCreateAnnounceModal} disabled={clubsCount === 0}>
            <Megaphone size={16} /> Post Announcement
          </button>
 
          <button className="cl-btn-secondary" onClick={() => navigate('/members-management')} disabled={clubsCount === 0}>
            <Users size={16} /> Manage Members
          </button>
        </div>
      </div>

      {/* Dashboard Core Columns Layout */}
      <div className="cl-dashboard-workspace-grid">
        
        {/* LEFT COLUMN: Clubs, Events */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* MY CLUBS SECTION */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h3>🏛️ My Clubs ({clubs.length})</h3>
              <button className="cl-btn-secondary" onClick={openCreateClubModal} style={{ height: '32px', padding: '0 12px', fontSize: '12px' }}>
                <Plus size={14} /> Add Club
              </button>
            </div>
            
            {clubs.length === 0 ? (
              <div className="cl-empty-state">
                <Building size={48} style={{ color: 'var(--text-tertiary)' }} />
                <p>You don't manage any clubs yet.</p>
                <button className="cl-btn-primary" onClick={openCreateClubModal}>Initialize first club</button>
              </div>
            ) : (
              <div className="cl-clubs-list-grid">
                {clubs.map(club => {
                  const isFocused = focusedClubId === club.id;
                  const formattedDate = club.createdAt ? new Date(club.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'June 2026';
                  return (
                    <div 
                      key={club.id} 
                      className={`cl-club-card-compact ${isFocused ? 'focused' : ''}`}
                    >
                      <div className="cl-club-card-header">
                        <div className="cl-club-card-logo" style={{ background: club.color || 'var(--gradient-primary)' }}>
                          {renderLogo(club.logo, club.name)}
                        </div>
                        <div className="cl-club-card-title-group">
                          <h4 className="cl-club-card-name" title={club.name}>{club.name}</h4>
                          <span className="cl-club-card-category">{club.category} Club</span>
                        </div>

                        {/* 3-dot dropdown menu trigger */}
                        <div className="cl-actions-dropdown-trigger">
                          <button 
                            type="button"
                            className="cl-actions-btn" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveClubMenuId(activeClubMenuId === club.id ? null : club.id);
                            }}
                          >
                            <MoreVertical size={16} />
                          </button>
                          
                          {activeClubMenuId === club.id && (
                            <div className="cl-actions-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                              <button 
                                type="button"
                                className="cl-dropdown-item" 
                                onClick={() => {
                                  setActiveClubMenuId(null);
                                  openEditClubModal(club);
                                }}
                              >
                                <Edit3 size={14} /> Edit Details
                              </button>
                              <button 
                                type="button"
                                className="cl-dropdown-item cl-dropdown-item-danger" 
                                onClick={() => {
                                  setActiveClubMenuId(null);
                                  setDeleteConfirmClub(club);
                                }}
                              >
                                <Trash2 size={14} /> Delete Club
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="cl-club-card-stats-row">
                        <span className="cl-badge">👥 {club.memberCount || 0} Members</span>
                        <span className="cl-badge">📅 Created {formattedDate}</span>
                      </div>

                      <div className="cl-club-card-actions">
                        <button 
                          type="button"
                          className="cl-club-action-btn" 
                          onClick={() => navigate(`/clubs/${club.id}`)}
                          title="Club Dashboard"
                        >
                          📊 Dashboard
                        </button>
                        <button 
                          type="button"
                          className="cl-club-action-btn" 
                          onClick={() => {
                            setFocusedClubId(club.id);
                            navigate('/members-management');
                          }}
                          title="Members"
                        >
                          👥 Members
                        </button>
                        <button 
                          type="button"
                          className="cl-club-action-btn" 
                          onClick={() => {
                            setFocusedClubId(club.id);
                            openCreateEventModal();
                          }}
                          title="Events"
                        >
                          📅 Events
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* MY EVENTS SECTION */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h3>📅 My Events ({displayEvents.length})</h3>
              <button 
                className="cl-btn-secondary"
                onClick={() => openCreateEventModal()}
                disabled={clubsCount === 0}
                style={{ height: '32px', padding: '0 12px', fontSize: '12px' }}
              >
                <Plus size={14} /> Schedule Event
              </button>
            </div>
            
            <div className="cl-events-grid">
              {displayEvents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-tertiary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <Calendar size={48} style={{ color: 'var(--text-tertiary)' }} />
                  <p style={{ fontSize: '14px', margin: 0 }}>No events scheduled.</p>
                </div>
              ) : (
                displayEvents.map(event => {
                  const { day, month } = getMonthDay(event.date);
                  const isPast = new Date(event.date) < new Date();
                  const registered = event.registeredSeats || event.registrations || 0;
                  const capacity = event.totalSeats || 50;
                  const pct = Math.min(100, Math.round((registered / capacity) * 100));
                  const isFull = registered >= capacity;
                  const status = isPast ? 'Past' : (isFull ? 'Full' : 'Active');

                  const formattedEventDate = event.date ? new Date(event.date).toLocaleDateString('en-US', {
                    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                  }) : 'TBD';

                  return (
                    <div className={`cl-linkedin-event-card ${isPast ? 'past' : ''}`} key={event.id}>
                      <div className="cl-event-thumbnail-wrapper">
                        {event.imageUrl || event.banner ? (
                          <img src={event.imageUrl || event.banner} alt={event.title} className="cl-event-thumbnail" />
                        ) : (
                          <div className="cl-event-thumbnail-placeholder" style={{ background: `linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1))` }} />
                        )}
                        <div className="cl-event-thumbnail-date">
                          <span className="day">{day}</span>
                          <span className="month">{month}</span>
                        </div>
                      </div>

                      <div className="cl-event-content-area">
                        <div className="cl-event-header-row">
                          <h4 className="cl-event-title" title={event.title}>{event.title}</h4>
                          <span className={`badge ${status === 'Active' ? 'badge-success' : (status === 'Full' ? 'badge-warning' : 'badge-gray')}`}>
                            {status}
                          </span>
                        </div>

                        <p className="cl-event-organizer-line">
                          Organized by <strong className="cl-event-org-name">{event.organizer}</strong>
                        </p>

                        <div className="cl-event-details-grid">
                          <span className="cl-event-detail-item"><Clock size={12} /> {formattedEventDate} · {event.time}</span>
                          <span className="cl-event-detail-item"><MapPin size={12} /> {event.venue || event.location || 'Campus'}</span>
                        </div>

                        <div className="cl-event-capacity-section">
                          <div className="cl-event-capacity-info">
                            <span className="cl-event-cap-lbl">Registrations</span>
                            <span className="cl-event-cap-val">{registered} / {capacity} ({pct}%)</span>
                          </div>
                          <div className="cl-event-progress-track">
                            <div className="cl-event-progress-bar" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </div>

                      <div className="cl-event-action-buttons">
                        <button 
                          className="btn-event-action view" 
                          title="View Registrations"
                          onClick={() => openViewRegistrationsModal(event)}
                        >
                          👥 View
                        </button>
                        {(event.creatorId === user.id || event.createdBy === user.id) && (
                          <>
                            <button 
                              className="btn-event-action edit" 
                              title="Edit Event"
                              onClick={() => openEditEventModal(event)}
                            >
                              ✏️ Edit
                            </button>
                            <button 
                              className="btn-event-action delete" 
                              title="Delete Event"
                              onClick={() => setDeleteConfirmEvent(event)}
                            >
                              🗑️ Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          
        </div>

        {/* RIGHT COLUMN: Member Requests, Announcements, Analytics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* MEMBER REQUESTS SECTION */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h3>📥 Pending Join Requests ({displayJoinRequests.length})</h3>
            </div>
            
            {displayJoinRequests.length === 0 ? (
              <div className="cl-empty-compact-card">
                <Check size={16} style={{ color: '#10B981', flexShrink: 0 }} />
                <span>No pending requests.</span>
              </div>
            ) : (
              <div className="cl-requests-list">
                {displayJoinRequests.map((req) => {
                  const reqClub = clubs.find(c => c.id === req.clubId);
                  return (
                    <div className="cl-join-request" key={req.id}>
                      <div className="cl-request-user">
                        <div className="avatar avatar-md" style={{ background: 'linear-gradient(135deg, var(--primary-400), var(--accent-400))', color: 'white', fontWeight: 'bold' }}>
                          {req.avatar || (req.name ? req.name.slice(0, 2).toUpperCase() : '??')}
                        </div>
                        <div className="cl-request-details">
                          <h4>{req.name}</h4>
                          <p>{req.department} · {req.year}</p>
                          <p style={{ fontSize: '10px', color: 'var(--primary-600)', fontWeight: 650, margin: 0 }}>Applied: {reqClub?.name || 'Club'}</p>
                        </div>
                      </div>
                      <div className="cl-request-actions">
                        <button 
                          className="btn btn-sm btn-success" 
                          disabled={actionLoading}
                          onClick={() => handleRequest(req.id, 'approve', req.clubId)}
                          style={{ padding: '4px 10px', fontSize: 'var(--text-xs)' }}
                        >
                          Approve
                        </button>
                        <button 
                          className="btn btn-sm btn-danger btn-ghost" 
                          disabled={actionLoading}
                          onClick={() => handleRequest(req.id, 'reject', req.clubId)}
                          style={{ padding: '4px 10px', fontSize: 'var(--text-xs)' }}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ANNOUNCEMENTS SECTION */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h3>📢 Club Announcements ({displayAnnouncements.length})</h3>
              <button 
                className="cl-btn-secondary"
                onClick={openCreateAnnounceModal}
                disabled={clubsCount === 0}
                style={{ height: '32px', padding: '0 12px', fontSize: '12px' }}
              >
                <Plus size={14} /> Post
              </button>
            </div>

            <div className="cl-announcements-list-panel">
              {displayAnnouncements.length === 0 ? (
                <p style={{ fontStyle: 'italic', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textAlign: 'center', padding: '12px', margin: 0 }}>
                  No announcements posted for these clubs.
                </p>
              ) : (
                displayAnnouncements.map((ann) => {
                  const annClub = clubs.find(c => c.id === ann.clubId);
                  const clubName = annClub ? annClub.name : (ann.clubName || 'General');
                  const metrics = getAnnMetrics(ann);

                  return (
                    <div key={ann.id} className="cl-feed-announcement-card">
                      <div className="cl-ann-header">
                        <div className="cl-ann-avatar-wrapper">
                          <div className="cl-ann-avatar" style={{ background: annClub?.color || 'var(--gradient-primary)' }}>
                            {ann.author ? ann.author.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : 'CL'}
                          </div>
                        </div>
                        <div className="cl-ann-meta">
                          <div className="cl-ann-author-info">
                            <span className="cl-ann-author">{ann.author}</span>
                            <span className="cl-ann-club">{clubName}</span>
                          </div>
                          <span className="cl-ann-date">{ann.date || 'Today'}</span>
                        </div>
                        
                        {ann.authorId === user.id && (
                          <div className="cl-ann-actions">
                            <button 
                              className="cl-ann-action-btn edit"
                              title="Edit Announcement"
                              onClick={() => openEditAnnounceModal(ann)}
                            >
                              <Edit3 size={14} />
                            </button>
                            <button 
                              className="cl-ann-action-btn delete"
                              title="Delete Announcement"
                              onClick={() => setDeleteConfirmAnnouncement(ann)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="cl-ann-body">
                        <h4 className="cl-ann-title">{ann.title}</h4>
                        <p className="cl-ann-content">{ann.content}</p>
                        
                        {ann.aiSummary && ann.content && ann.content.split(/\s+/).length > 25 && (
                          <div className="cl-ann-ai-summary">
                            <Sparkles size={12} className="ai-icon" />
                            <span><strong>AI Summary:</strong> {ann.aiSummary}</span>
                          </div>
                        )}
                      </div>

                      <div className="cl-ann-footer">
                        <div className="cl-ann-metrics">
                          <span className="cl-metric-item" title="Views"><Eye size={12} /> {metrics.views}</span>
                          <span className="cl-metric-item" title="Likes"><Heart size={12} /> {metrics.likes}</span>
                          <span className="cl-metric-item" title="Comments"><MessageSquare size={12} /> {metrics.comments}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* CLUB ANALYTICS */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h3>📈 Performance Analytics</h3>
            </div>

            {hasAnalyticsData ? (
              <>
                <div className="cl-analytics-tabs">
                  <button 
                    className={`cl-analytics-tab-btn ${activeAnalyticsTab === 'growth' ? 'active' : ''}`}
                    onClick={() => setActiveAnalyticsTab('growth')}
                  >
                    📈 Growth
                  </button>
                  <button 
                    className={`cl-analytics-tab-btn ${activeAnalyticsTab === 'attendance' ? 'active' : ''}`}
                    onClick={() => setActiveAnalyticsTab('attendance')}
                  >
                    🎫 Attendance
                  </button>
                  <button 
                    className={`cl-analytics-tab-btn ${activeAnalyticsTab === 'reach' ? 'active' : ''}`}
                    onClick={() => setActiveAnalyticsTab('reach')}
                  >
                    📣 Reach
                  </button>
                  <button 
                    className={`cl-analytics-tab-btn ${activeAnalyticsTab === 'trends' ? 'active' : ''}`}
                    onClick={() => setActiveAnalyticsTab('trends')}
                  >
                    📊 Trends
                  </button>
                </div>

                <div className="cl-chart-container">
                  {activeAnalyticsTab === 'growth' && (
                    <>
                      <span className="cl-chart-header">Member Growth Timeline</span>
                      {hasGrowthData ? (
                        <ResponsiveContainer width="100%" height="90%">
                          <AreaChart data={analytics.memberGrowth} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                            <defs>
                              <linearGradient id="areaGrowth" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.15}/>
                                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 10 }} stroke="#cbd5e1" />
                            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} stroke="#cbd5e1" />
                            <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: 11, color: '#0f172a', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }} labelStyle={{ color: '#64748b' }} itemStyle={{ color: '#0f172a' }} />
                            <Area type="monotone" dataKey="members" name="Members" stroke="#8B5CF6" strokeWidth={2} fillOpacity={1} fill="url(#areaGrowth)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="cl-chart-empty">Not enough analytics data yet</div>
                      )}
                    </>
                  )}

                  {activeAnalyticsTab === 'attendance' && (
                    <>
                      <span className="cl-chart-header">Event Participation vs Capacity</span>
                      {hasAttendanceData ? (
                        <ResponsiveContainer width="100%" height="90%">
                          <BarChart data={analytics.eventParticipation} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 8 }} stroke="#cbd5e1" />
                            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} stroke="#cbd5e1" />
                            <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: 11, color: '#0f172a', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }} labelStyle={{ color: '#64748b' }} itemStyle={{ color: '#0f172a' }} />
                            <Bar dataKey="registered" name="Registrations" fill="#8B5CF6" radius={[4, 4, 0, 0]} barSize={20} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="cl-chart-empty">Not enough analytics data yet</div>
                      )}
                    </>
                  )}

                  {activeAnalyticsTab === 'reach' && (
                    <>
                      <span className="cl-chart-header">Announcement Reach</span>
                      {hasReachData ? (
                        <ResponsiveContainer width="100%" height="90%">
                          <BarChart 
                            data={announcementReachData} 
                            margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="title" tick={{ fill: '#64748b', fontSize: 8 }} stroke="#cbd5e1" />
                            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} stroke="#cbd5e1" />
                            <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: 11, color: '#0f172a', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }} labelStyle={{ color: '#64748b' }} itemStyle={{ color: '#0f172a' }} />
                            <Bar dataKey="Views" fill="#6366F1" radius={[4, 4, 0, 0]} barSize={14} />
                            <Bar dataKey="Likes" fill="#EC4899" radius={[4, 4, 0, 0]} barSize={14} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="cl-chart-empty">Not enough analytics data yet</div>
                      )}
                    </>
                  )}

                  {activeAnalyticsTab === 'trends' && (
                    <>
                      <span className="cl-chart-header">Registration Trend</span>
                      {hasTrendsData ? (
                        <ResponsiveContainer width="100%" height="90%">
                          <AreaChart 
                            data={registrationTrendData} 
                            margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                          >
                            <defs>
                              <linearGradient id="areaTrends" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.15}/>
                                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 8 }} stroke="#cbd5e1" />
                            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} stroke="#cbd5e1" />
                            <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: 11, color: '#0f172a', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }} labelStyle={{ color: '#64748b' }} itemStyle={{ color: '#0f172a' }} />
                            <Area type="monotone" dataKey="Registrations" name="Registrations" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#areaTrends)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="cl-chart-empty">Not enough analytics data yet</div>
                      )}
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="cl-chart-empty">
                Not enough analytics data yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CREATE / EDIT CLUB MODAL */}
      {showClubModal && (
        <div className="cl-modal-backdrop" onClick={() => setShowClubModal(false)}>
          <div className="cl-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="cl-modal-header">
              <h3>{editingClub ? 'Edit Club Details' : 'Create New Club'}</h3>
              <button className="cl-modal-close" onClick={() => setShowClubModal(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleClubSubmit}>
              <div className="cl-modal-body">
                {formError && (
                  <div style={{ background: 'var(--danger-50)', color: 'var(--danger-700)', padding: '10px', borderRadius: '6px', fontSize: 'var(--text-xs)', marginBottom: '12px' }}>
                    {formError}
                  </div>
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
                      placeholder="e.g. Computer Science" 
                      className="cl-form-input"
                      value={clubForm.department}
                      onChange={(e) => setClubForm(prev => ({ ...prev, department: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Logo Image Upload */}
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
                    style={{ border: '2px dashed rgba(0,0,0,0.1)', borderRadius: 'var(--radius-lg)', padding: '12px', textAlign: 'center', cursor: 'pointer', background: 'rgba(0,0,0,0.01)' }}
                  >
                    {uploadingLogo ? (
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Uploading Logo...</span>
                    ) : clubForm.logo ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <img src={clubForm.logo} alt="Club Logo Preview" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                        <button type="button" className="btn btn-ghost btn-xs btn-danger" onClick={() => setClubForm(prev => ({ ...prev, logo: '' }))}>Remove</button>
                      </div>
                    ) : (
                      <div onClick={() => document.getElementById('logo-file-input').click()}>
                        <Plus size={16} style={{ margin: '0 auto', color: 'var(--text-tertiary)' }} />
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Click or Drag Logo File</span>
                        <input id="logo-file-input" type="file" style={{ display: 'none' }} accept=".jpg,.jpeg,.png,.webp" onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleImageUpload(e.target.files[0], 'logo');
                          }
                        }} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Banner Image Upload */}
                <div className="cl-form-group">
                  <label>Club Banner</label>
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
                    style={{ border: '2px dashed rgba(0,0,0,0.1)', borderRadius: 'var(--radius-lg)', padding: '12px', textAlign: 'center', cursor: 'pointer', background: 'rgba(0,0,0,0.01)' }}
                  >
                    {uploadingBanner ? (
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Uploading Banner...</span>
                    ) : clubForm.banner ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <img src={clubForm.banner} alt="Club Banner Preview" style={{ width: '80px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                        <button type="button" className="btn btn-ghost btn-xs btn-danger" onClick={() => setClubForm(prev => ({ ...prev, banner: '' }))}>Remove</button>
                      </div>
                    ) : (
                      <div onClick={() => document.getElementById('banner-file-input').click()}>
                        <Plus size={16} style={{ margin: '0 auto', color: 'var(--text-tertiary)' }} />
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Click or Drag Banner File</span>
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

      {/* CREATE / EDIT EVENT MODAL */}
      {showEventModal && (
        <div className="cl-modal-backdrop" onClick={() => setShowEventModal(false)}>
          <div className="cl-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="cl-modal-header">
              <h3>{editingEvent ? 'Edit Club Event Details' : 'Schedule New Club Event'}</h3>
              <button className="cl-modal-close" onClick={() => setShowEventModal(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleEventSubmit}>
              <div className="cl-modal-body">
                {formError && (
                  <div style={{ background: 'var(--danger-50)', color: 'var(--danger-700)', padding: '10px', borderRadius: '6px', fontSize: 'var(--text-xs)', marginBottom: '12px' }}>
                    {formError}
                  </div>
                )}

                <div className="cl-form-group">
                  <label>Event Title *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Intro to Modern React" 
                    className="cl-form-input"
                    value={eventForm.title}
                    onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                    required
                  />
                </div>

                <div className="cl-form-group">
                  <label>Description</label>
                  <textarea 
                    placeholder="Provide details about what attendees will learn, prerequisites..." 
                    className="cl-form-textarea"
                    value={eventForm.description}
                    onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  />
                </div>

                {/* Event Banner Image Upload */}
                <div className="cl-form-group">
                  <label>Event Banner Image</label>
                  <div 
                    className={`image-upload-zone ${dragOver ? 'dragover' : ''}`}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleImageUpload(e.dataTransfer.files[0], 'event');
                      }
                    }}
                    style={{ border: '2px dashed rgba(0,0,0,0.1)', borderRadius: 'var(--radius-lg)', padding: '16px', textAlign: 'center', cursor: 'pointer', background: 'rgba(0,0,0,0.01)' }}
                  >
                    {uploadingImage ? (
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Uploading image...</span>
                    ) : eventForm.imageUrl ? (
                      <div style={{ position: 'relative' }}>
                        <img src={eventForm.imageUrl} alt="Event Preview" style={{ width: '100%', maxHeight: '140px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
                        <button type="button" onClick={() => setEventForm(prev => ({ ...prev, imageUrl: '' }))} style={{ position: 'absolute', top: '8px', right: '8px', background: 'var(--danger-500)', color: 'white', border: 'none', borderRadius: '50%', cursor: 'pointer', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <div onClick={() => document.getElementById('ev-file-input').click()}>
                        <Plus size={20} style={{ margin: '0 auto', color: 'var(--text-tertiary)' }} />
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Click or Drag Banner File</span>
                        <input id="ev-file-input" type="file" style={{ display: 'none' }} accept=".jpg,.jpeg,.png,.webp" onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleImageUpload(e.target.files[0], 'event');
                          }
                        }} />
                      </div>
                    )}
                  </div>
                </div>

                <div className="cl-form-row">
                  <div className="cl-form-group">
                    <label>Category</label>
                    <select 
                      className="cl-form-select"
                      value={eventForm.category}
                      onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
                    >
                      {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>

                  <div className="cl-form-group">
                    <label>Seats Available</label>
                    <input 
                      type="number" 
                      className="cl-form-input"
                      value={eventForm.totalSeats}
                      onChange={(e) => setEventForm({ ...eventForm, totalSeats: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="cl-form-row">
                  <div className="cl-form-group">
                    <label>Date *</label>
                    <input 
                      type="date" 
                      className="cl-form-input"
                      value={eventForm.date}
                      onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                      required
                    />
                  </div>

                  <div className="cl-form-group">
                    <label>Registration Deadline</label>
                    <input 
                      type="date" 
                      className="cl-form-input"
                      value={eventForm.registrationDeadline}
                      onChange={(e) => setEventForm({ ...eventForm, registrationDeadline: e.target.value })}
                    />
                  </div>
                </div>

                <div className="cl-form-row">
                  <div className="cl-form-group">
                    <label>Start Time</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 10:00 AM" 
                      className="cl-form-input"
                      value={eventForm.time}
                      onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })}
                    />
                  </div>

                  <div className="cl-form-group">
                    <label>End Time</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 1:00 PM" 
                      className="cl-form-input"
                      value={eventForm.endTime}
                      onChange={(e) => setEventForm({ ...eventForm, endTime: e.target.value })}
                    />
                  </div>
                </div>

                <div className="cl-form-group">
                  <label>Venue / Location</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Seminar Hall, Block C or Online Zoom" 
                    className="cl-form-input"
                    value={eventForm.venue}
                    onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
                  />
                </div>

                <div className="cl-form-group">
                  <label>Tags (Comma-separated)</label>
                  <input 
                    type="text" 
                    placeholder="coding, react, design" 
                    className="cl-form-input"
                    value={eventForm.tags}
                    onChange={(e) => setEventForm({ ...eventForm, tags: e.target.value })}
                  />
                </div>
              </div>

              <div className="cl-modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEventModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Saving...' : editingEvent ? 'Save Changes' : 'Schedule Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POST / EDIT ANNOUNCEMENT MODAL */}
      {showAnnounceModal && (
        <div className="cl-modal-backdrop" onClick={() => setShowAnnounceModal(false)}>
          <div className="cl-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="cl-modal-header">
              <h3>{editingAnnouncement ? 'Edit Announcement' : 'Post Club Announcement'}</h3>
              <button className="cl-modal-close" onClick={() => setShowAnnounceModal(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleAnnouncementSubmit}>
              <div className="cl-modal-body">
                {formError && (
                  <div style={{ background: 'var(--danger-50)', color: 'var(--danger-700)', padding: '10px', borderRadius: '6px', fontSize: 'var(--text-xs)', marginBottom: '12px' }}>
                    {formError}
                  </div>
                )}

                <div className="cl-form-group">
                  <label>Select Club *</label>
                  <select 
                    className="cl-form-select"
                    value={announceForm.clubId}
                    onChange={(e) => setAnnounceForm({ ...announceForm, clubId: e.target.value })}
                    required
                  >
                    <option value="">-- Choose Club --</option>
                    {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="cl-form-group">
                  <label>Title *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Schedule Change for Hackathon" 
                    className="cl-form-input"
                    value={announceForm.title}
                    onChange={(e) => setAnnounceForm({ ...announceForm, title: e.target.value })}
                    required
                  />
                </div>

                <div className="cl-form-group">
                  <label>Message *</label>
                  <textarea 
                    placeholder="Type your announcement body..." 
                    className="cl-form-textarea"
                    style={{ minHeight: '120px' }}
                    value={announceForm.content}
                    onChange={(e) => setAnnounceForm({ ...announceForm, content: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="cl-modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAnnounceModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Posting...' : editingAnnouncement ? 'Save Changes' : 'Broadcast Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INVITE MEMBER MODAL */}
      {showInviteModal && (
        <div className="cl-modal-backdrop" onClick={() => setShowInviteModal(false)}>
          <div className="cl-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="cl-modal-header">
              <h3>Invite Member to Club</h3>
              <button className="cl-modal-close" onClick={() => setShowInviteModal(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleInviteSubmit}>
              <div className="cl-modal-body">
                {formError && (
                  <div style={{ background: 'var(--danger-50)', color: 'var(--danger-700)', padding: '10px', borderRadius: '6px', fontSize: 'var(--text-xs)', marginBottom: '12px' }}>
                    {formError}
                  </div>
                )}

                <div className="cl-form-group">
                  <label>Select Club *</label>
                  <select 
                    className="cl-form-select"
                    value={inviteForm.clubId}
                    onChange={(e) => setInviteForm({ ...inviteForm, clubId: e.target.value })}
                    required
                  >
                    <option value="">-- Choose Club --</option>
                    {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="cl-form-group">
                  <label>Student Email Address *</label>
                  <input 
                    type="email" 
                    placeholder="e.g. student@campus.edu" 
                    className="cl-form-input"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="cl-modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowInviteModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE EVENT MODAL */}
      {deleteConfirmEvent && (
        <div className="cl-modal-backdrop" onClick={() => setDeleteConfirmEvent(null)}>
          <div className="cl-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px', padding: 'var(--space-5)' }}>
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)' }}>
              <AlertCircle size={32} style={{ color: 'var(--danger-500)' }} />
              <h3 style={{ margin: 0 }}>Delete Event?</h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Are you sure you want to delete <strong>"{deleteConfirmEvent.title}"</strong>? This will remove all registration seat logs permanently.
              </p>
              <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '12px' }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setDeleteConfirmEvent(null)}>Cancel</button>
                <button 
                  className="btn btn-danger" 
                  style={{ flex: 1 }} 
                  disabled={actionLoading}
                  onClick={async () => {
                    try {
                      setActionLoading(true);
                      await apiService.deleteEvent(deleteConfirmEvent.id, user.id);
                      setDeleteConfirmEvent(null);
                      await loadDashboardData();
                    } catch (err) {
                      alert(err.message || 'Failed to delete event.');
                    } finally {
                      setActionLoading(false);
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CLUB MODAL */}
      {deleteConfirmClub && (
        <div className="cl-modal-backdrop" onClick={() => setDeleteConfirmClub(null)}>
          <div className="cl-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px', padding: 'var(--space-5)' }}>
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)' }}>
              <AlertCircle size={32} style={{ color: 'var(--danger-500)' }} />
              <h3 style={{ margin: 0 }}>Delete Club?</h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Are you sure you want to delete <strong>"{deleteConfirmClub.name}"</strong>? All associated events, announcements and memberships will be deleted permanently.
              </p>
              <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '12px' }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setDeleteConfirmClub(null)}>Cancel</button>
                <button 
                  className="btn btn-danger" 
                  style={{ flex: 1 }} 
                  disabled={actionLoading}
                  onClick={async () => {
                    try {
                      setActionLoading(true);
                      await apiService.deleteClub(deleteConfirmClub.id, user.id);
                      setDeleteConfirmClub(null);
                      if (focusedClubId === deleteConfirmClub.id) {
                        setFocusedClubId(null);
                      }
                      await loadDashboardData();
                    } catch (err) {
                      alert(err.message || 'Failed to delete club.');
                    } finally {
                      setActionLoading(false);
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE ANNOUNCEMENT MODAL */}
      {deleteConfirmAnnouncement && (
        <div className="cl-modal-backdrop" onClick={() => setDeleteConfirmAnnouncement(null)}>
          <div className="cl-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px', padding: 'var(--space-5)' }}>
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)' }}>
              <AlertCircle size={32} style={{ color: 'var(--danger-500)' }} />
              <h3 style={{ margin: 0 }}>Delete Announcement?</h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Are you sure you want to delete this announcement? It will be removed from all student dashboard feeds immediately.
              </p>
              <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '12px' }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setDeleteConfirmAnnouncement(null)}>Cancel</button>
                <button 
                  className="btn btn-danger" 
                  style={{ flex: 1 }} 
                  disabled={actionLoading}
                  onClick={async () => {
                    try {
                      setActionLoading(true);
                      await apiService.deleteAnnouncement(deleteConfirmAnnouncement.id, user.id);
                      setDeleteConfirmAnnouncement(null);
                      await loadDashboardData();
                    } catch (err) {
                      alert(err.message || 'Failed to delete announcement.');
                    } finally {
                      setActionLoading(false);
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW REGISTRATIONS MODAL */}
      {showRegistrationsModal && registrationsEvent && (
        <div className="cl-modal-backdrop" onClick={() => setShowRegistrationsModal(false)}>
          <div className="cl-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="cl-modal-header">
              <h3>Registrations: {registrationsEvent.title}</h3>
              <button className="cl-modal-close" onClick={() => setShowRegistrationsModal(false)}><X size={18} /></button>
            </div>
            <div className="cl-modal-body" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {loadingRegistrations ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
                  <div className="shimmer-bone" style={{ width: '40px', height: '40px', borderRadius: '50%', margin: '0 auto' }} />
                  <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', marginTop: '8px' }}>Loading registrations...</p>
                </div>
              ) : registrationsList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-tertiary)' }}>
                  <Users size={32} style={{ marginBottom: '8px', color: 'var(--text-tertiary)' }} />
                  <p style={{ fontSize: 'var(--text-sm)' }}>No registrations for this event yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {registrationsList.map(attendee => (
                    <div key={attendee.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
                      <div className="avatar avatar-sm" style={{ background: 'var(--primary-500)', color: 'white', fontWeight: 'bold' }}>
                        {attendee.avatar}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, margin: 0 }}>{attendee.name}</h4>
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: 0 }}>{attendee.email}</p>
                        <p style={{ fontSize: '10px', color: 'var(--text-tertiary)', margin: 0 }}>{attendee.department} · {attendee.year}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="cl-modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowRegistrationsModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
