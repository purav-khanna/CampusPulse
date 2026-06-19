import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, UserCheck, UserMinus, ArrowLeft, Building, 
  Check, X, Clock, Shield, AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/api';
import './MembersManagement.css';

export default function MembersManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [clubs, setClubs] = useState([]);
  const [selectedClubId, setSelectedClubId] = useState(null);
  const [members, setMembers] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  
  const [loadingClubs, setLoadingClubs] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Load all managed clubs on mount
  useEffect(() => {
    const fetchClubs = async () => {
      if (!user) return;
      try {
        setLoadingClubs(true);
        // Using dashboard API to fetch all managed clubs
        const data = await apiService.getClubLeaderDashboard(user.clubId || 0, user.id);
        if (data && data.clubs) {
          setClubs(data.clubs);
          // Auto select primary club or first managed club
          if (data.clubs.length > 0) {
            const primaryId = user.clubId && data.clubs.some(c => c.id === user.clubId)
              ? user.clubId
              : data.clubs[0].id;
            setSelectedClubId(primaryId);
          }
        }
      } catch (err) {
        console.error('Failed to load managed clubs:', err);
        setError('Failed to retrieve your managed clubs.');
      } finally {
        setLoadingClubs(false);
      }
    };
    fetchClubs();
  }, [user]);

  // Load members and join requests whenever selectedClubId changes
  const loadClubDetails = async () => {
    if (!selectedClubId) return;
    try {
      setLoadingDetails(true);
      const [membersData, requestsData] = await Promise.all([
        apiService.getClubMembers(selectedClubId),
        apiService.getJoinRequests(selectedClubId)
      ]);
      setMembers(membersData);
      setJoinRequests(requestsData);
      setError(null);
    } catch (err) {
      console.error('Error fetching club details:', err);
      setError('Could not retrieve member list or requests. Please try again.');
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    loadClubDetails();
  }, [selectedClubId]);

  // Approve or Reject Join Request
  const handleJoinRequest = async (requestId, action) => {
    if (!selectedClubId || actionLoading) return;
    try {
      setActionLoading(true);
      await apiService.handleJoinRequest(selectedClubId, requestId, action);
      showToast(`Join request successfully ${action === 'approve' ? 'approved' : 'rejected'}!`, 'success');
      
      // Dispatch refresh events so dashboard registers the change
      window.dispatchEvent(new Event('notification_updated'));
      window.dispatchEvent(new Event('club_joined'));

      await loadClubDetails();
    } catch (err) {
      console.error(`Failed to ${action} request:`, err);
      showToast(`Failed to ${action} request: ${err.message || 'Error'}`, 'danger');
    } finally {
      setActionLoading(false);
    }
  };

  // Remove member from club
  const handleRemoveMember = async (memberId, memberName) => {
    if (!selectedClubId || actionLoading) return;
    const confirmKick = window.confirm(`Are you sure you want to remove ${memberName} from the club?`);
    if (!confirmKick) return;

    try {
      setActionLoading(true);
      await apiService.updateMemberRole(selectedClubId, memberId, 'remove');
      showToast('Member removed successfully.', 'success');

      // Dispatch refresh events
      window.dispatchEvent(new Event('notification_updated'));
      window.dispatchEvent(new Event('club_left'));

      await loadClubDetails();
    } catch (err) {
      console.error('Failed to remove member:', err);
      showToast(`Failed to remove member: ${err.message || 'Error'}`, 'danger');
    } finally {
      setActionLoading(false);
    }
  };

  // Promote / Demote member
  const handleToggleRole = async (memberId, currentRole, memberName) => {
    if (!selectedClubId || actionLoading) return;
    const newRole = currentRole === 'moderator' ? 'student' : 'moderator';
    try {
      setActionLoading(true);
      await apiService.updateMemberRole(selectedClubId, memberId, newRole);
      showToast(`${memberName} successfully updated to ${newRole === 'moderator' ? 'Moderator' : 'Student'}!`, 'success');
      await loadClubDetails();
    } catch (err) {
      console.error('Failed to update member role:', err);
      showToast(`Failed to update role: ${err.message || 'Error'}`, 'danger');
    } finally {
      setActionLoading(false);
    }
  };

  if (loadingClubs) {
    return (
      <div className="members-management-loading">
        <div className="spinner"></div>
        <p>Loading clubs and members console...</p>
      </div>
    );
  }

  const activeClub = clubs.find(c => c.id === selectedClubId);

  return (
    <div className="members-management-container animate-fade-in">
      {/* Toast Notification */}
      {toast && (
        <div className={`toast-notification ${toast.type}`}>
          {toast.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header section */}
      <div className="members-management-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="btn-back" onClick={() => navigate('/dashboard')} title="Go back to Dashboard">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1>👥 Club Members Management</h1>
            <p>Approve join requests, promote members, or remove active members from your clubs.</p>
          </div>
        </div>

        {/* Club selection dropdown */}
        {clubs.length > 1 && (
          <div className="club-selector-wrapper">
            <label htmlFor="club-select">Active Club:</label>
            <div className="select-container">
              <Building size={16} className="select-icon" />
              <select 
                id="club-select"
                value={selectedClubId || ''} 
                onChange={(e) => setSelectedClubId(parseInt(e.target.value))}
              >
                {clubs.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="error-banner">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button className="btn btn-sm btn-outline" onClick={loadClubDetails} style={{ marginLeft: 'auto' }}>Retry</button>
        </div>
      )}

      {selectedClubId ? (
        <div className="members-management-grid">
          
          {/* LEFT: Pending join requests */}
          <div className="members-management-card">
            <div className="card-header">
              <div className="title-wrapper">
                <div className="header-icon-badge requests-badge">
                  <UserCheck size={20} />
                </div>
                <h3>Pending Join Requests</h3>
              </div>
              <span className="count-badge">{joinRequests.length}</span>
            </div>

            {loadingDetails ? (
              <div className="card-shimmer">
                <div className="shimmer-row"></div>
                <div className="shimmer-row"></div>
              </div>
            ) : joinRequests.length === 0 ? (
              <div className="empty-state">
                <Check size={36} className="empty-icon-success" />
                <h4>All Caught Up!</h4>
                <p>There are no pending join requests for {activeClub?.name || 'this club'}.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="members-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Department</th>
                      <th>Request Date</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {joinRequests.map(req => (
                      <tr key={req.id}>
                        <td>
                          <div className="student-profile-cell">
                            <div className="avatar-mini" style={{ background: 'var(--accent-500)' }}>
                              {req.avatar || (req.name ? req.name.slice(0, 2).toUpperCase() : '??')}
                            </div>
                            <div>
                              <span className="student-name">{req.name}</span>
                              <span className="student-email">{req.email || 'No email'}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="student-dept">{req.department}</span>
                          <span className="student-year">{req.year}</span>
                        </td>
                        <td>
                          <div className="date-cell">
                            <Clock size={12} />
                            <span>{req.requestedAt ? new Date(req.requestedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'N/A'}</span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="actions-cell">
                            <button 
                              className="btn btn-xs btn-success" 
                              onClick={() => handleJoinRequest(req.id, 'approve')}
                              disabled={actionLoading}
                            >
                              Approve
                            </button>
                            <button 
                              className="btn btn-xs btn-danger btn-ghost" 
                              onClick={() => handleJoinRequest(req.id, 'reject')}
                              disabled={actionLoading}
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* RIGHT: Active club members */}
          <div className="members-management-card">
            <div className="card-header">
              <div className="title-wrapper">
                <div className="header-icon-badge members-badge">
                  <Users size={20} />
                </div>
                <h3>Active Club Members</h3>
              </div>
              <span className="count-badge">{members.length}</span>
            </div>

            {loadingDetails ? (
              <div className="card-shimmer">
                <div className="shimmer-row"></div>
                <div className="shimmer-row"></div>
                <div className="shimmer-row"></div>
              </div>
            ) : members.length === 0 ? (
              <div className="empty-state">
                <Users size={36} className="empty-icon-neutral" />
                <h4>No Members Yet</h4>
                <p>This club does not have any members registered yet.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="members-table">
                  <thead>
                    <tr>
                      <th>Member</th>
                      <th>Department</th>
                      <th>Role</th>
                      <th>Join Date</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map(member => {
                      const isPresident = member.role === 'clubLeader' || member.role === 'club_leader' || member.memberRole === 'President';
                      const isModerator = member.role === 'moderator';
                      
                      return (
                        <tr key={member.id}>
                          <td>
                            <div className="student-profile-cell">
                              <div className={`avatar-mini ${isPresident ? 'president' : ''}`} style={{ background: isPresident ? 'var(--warning-500)' : 'var(--text-tertiary)' }}>
                                {member.avatar || (member.name ? member.name.slice(0, 2).toUpperCase() : '??')}
                              </div>
                              <div>
                                <span className="student-name">{member.name}</span>
                                <span className="student-email">{member.email || 'No email'}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="student-dept">{member.department}</span>
                            <span className="student-year">{member.year || 'N/A'}</span>
                          </td>
                          <td>
                            {isPresident ? (
                              <span className="role-pill president">President</span>
                            ) : isModerator ? (
                              <span className="role-pill moderator">Moderator</span>
                            ) : (
                              <span className="role-pill student">Member</span>
                            )}
                          </td>
                          <td>
                            <div className="date-cell">
                              <Clock size={12} />
                              <span>{member.joinedDate ? new Date(member.joinedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</span>
                            </div>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div className="actions-cell">
                              {!isPresident && (
                                <>
                                  <button 
                                    className={`btn btn-xs btn-ghost ${isModerator ? 'btn-secondary' : 'btn-primary'}`} 
                                    onClick={() => handleToggleRole(member.id, member.role, member.name)}
                                    title={isModerator ? 'Demote to regular Student' : 'Promote to Moderator'}
                                    disabled={actionLoading}
                                  >
                                    <Shield size={12} style={{ marginRight: '4px' }} />
                                    {isModerator ? 'Demote' : 'Promote'}
                                  </button>
                                  <button 
                                    className="btn btn-xs btn-danger btn-ghost" 
                                    onClick={() => handleRemoveMember(member.id, member.name)}
                                    disabled={actionLoading}
                                    title="Remove from Club"
                                  >
                                    <UserMinus size={12} style={{ marginRight: '4px' }} />
                                    Remove
                                  </button>
                                </>
                              )}
                            </div>
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
      ) : (
        <div className="empty-state">
          <Building size={48} className="empty-icon-neutral" />
          <h4>No Active Club Selected</h4>
          <p>Please select a club to start managing its members and requests.</p>
        </div>
      )}
    </div>
  );
}
