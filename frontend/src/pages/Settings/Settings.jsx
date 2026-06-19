import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Lock, Eye, X, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/api';
import '../../components/ui/Components.css';
import '../Profile/Profile.css';

export default function Settings() {
  const { user, updateUserLocalState, logout } = useAuth();
  const navigate = useNavigate();

  // Settings State (loaded from database)
  const [notifSettings, setNotifSettings] = useState({ events: true, clubs: true, messages: true, announcements: true, reminders: true });
  const [profileVisibility, setProfileVisibility] = useState('Everyone');
  const [onlineStatus, setOnlineStatus] = useState(true);
  const [loadingSettings, setLoadingSettings] = useState(true);

  // Modals Visibility
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Forms inputs
  const [emailForm, setEmailForm] = useState({ currentEmail: '', newEmail: '', password: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState('');

  // Submit status states
  const [savingSettings, setSavingSettings] = useState(false);
  const [submittingModal, setSubmittingModal] = useState(false);

  // Fetch settings from database on mount
  useEffect(() => {
    if (!user) return;
    
    async function loadSettings() {
      try {
        setLoadingSettings(true);
        const data = await apiService.getUserSettings(user.id);
        setNotifSettings(data.notificationPreferences || { events: true, clubs: true, messages: true, announcements: true, reminders: true });
        setProfileVisibility(data.privacySettings?.profileVisibility || 'Everyone');
        setOnlineStatus(data.onlineStatus !== undefined ? data.onlineStatus : true);
      } catch (err) {
        console.error('Failed to load user settings:', err);
      } finally {
        setLoadingSettings(false);
      }
    }
    loadSettings();
  }, [user?.id]);

  // Synchronize changes to settings instantly
  const handleUpdateSetting = async (updatedFields) => {
    if (!user) return;
    setSavingSettings(true);
    
    const payload = {
      userId: user.id,
      notificationPreferences: updatedFields.notificationPreferences !== undefined ? updatedFields.notificationPreferences : notifSettings,
      privacySettings: updatedFields.privacySettings !== undefined ? updatedFields.privacySettings : { profileVisibility },
      onlineStatus: updatedFields.onlineStatus !== undefined ? updatedFields.onlineStatus : onlineStatus
    };

    try {
      const data = await apiService.updateUserSettings(payload);
      // Update local states
      setNotifSettings(data.notificationPreferences);
      setProfileVisibility(data.privacySettings?.profileVisibility || 'Everyone');
      setOnlineStatus(data.onlineStatus);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSavingSettings(false);
    }
  };

  const toggleNotif = (key) => {
    const updatedNotifs = { ...notifSettings, [key]: !notifSettings[key] };
    setNotifSettings(updatedNotifs);
    handleUpdateSetting({ notificationPreferences: updatedNotifs });
  };

  const handleOnlineToggle = () => {
    const nextStatus = !onlineStatus;
    setOnlineStatus(nextStatus);
    handleUpdateSetting({ onlineStatus: nextStatus });
  };

  const handleVisibilityChange = (e) => {
    const nextVal = e.target.value;
    setProfileVisibility(nextVal);
    handleUpdateSetting({ privacySettings: { profileVisibility: nextVal } });
  };

  // Change Email Action
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!emailForm.newEmail || !emailForm.password) {
      alert('Please fill out all fields');
      return;
    }
    
    setSubmittingModal(true);
    try {
      const data = await apiService.updateEmail({
        userId: user.id,
        currentEmail: user.email,
        newEmail: emailForm.newEmail,
        password: emailForm.password
      });

      updateUserLocalState(data.user);
      setShowEmailModal(false);
      setEmailForm({ currentEmail: '', newEmail: '', password: '' });
      alert('✅ Email Updated Successfully');
    } catch (err) {
      console.error('Failed to update email:', err);
      alert('Failed to update email: ' + err.message);
    } finally {
      setSubmittingModal(false);
    }
  };

  // Update Password Action
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    setSubmittingModal(true);
    try {
      await apiService.updatePassword({
        userId: user.id,
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      setShowPasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      alert('✅ Password Updated Successfully');
    } catch (err) {
      console.error('Failed to update password:', err);
      alert('Failed to update password: ' + err.message);
    } finally {
      setSubmittingModal(false);
    }
  };

  // Permanently Delete Account
  const handleDeleteAccountSubmit = async (e) => {
    e.preventDefault();
    if (!deleteConfirmPassword) {
      alert('Please enter your password to confirm account deletion');
      return;
    }

    if (!window.confirm('WARNING: Are you absolutely sure? This action is permanent and cannot be undone.')) {
      return;
    }

    setSubmittingModal(true);
    try {
      await apiService.deleteAccount(user.id, deleteConfirmPassword);
      setShowDeleteModal(false);
      alert('Account permanently deleted. Hope to see you again!');
      logout();
      navigate('/');
    } catch (err) {
      console.error('Account deletion failed:', err);
      alert('Deletion failed: ' + err.message);
    } finally {
      setSubmittingModal(false);
    }
  };

  return (
    <div className="settings-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>⚙️ Settings</h1>
          <p>Manage your account preferences</p>
        </div>
        {savingSettings && (
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Loader2 className="animate-spin" size={12} /> Saving changes...
          </span>
        )}
      </div>

      {loadingSettings ? (
        <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-tertiary)' }}>
          <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto var(--space-4)' }} />
          <p>Loading settings preferences...</p>
        </div>
      ) : (
        <>
          {/* Notifications */}
          <div className="settings-section">
            <h3><Bell size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />Notifications</h3>
            {Object.entries(notifSettings).map(([key, val]) => (
              <div className="settings-row" key={key}>
                <div className="settings-row-info">
                  <h4 style={{ textTransform: 'capitalize' }}>{key}</h4>
                  <p>Receive notifications for {key} activities</p>
                </div>
                <button 
                  className={`toggle-switch ${val ? 'on' : ''}`} 
                  onClick={() => toggleNotif(key)} 
                />
              </div>
            ))}
          </div>

          {/* Account */}
          <div className="settings-section">
            <h3><Lock size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />Account</h3>
            <div className="settings-row">
              <div className="settings-row-info">
                <h4>Email</h4>
                <p>{user?.email}</p>
              </div>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setEmailForm({ currentEmail: user?.email || '', newEmail: '', password: '' });
                  setShowEmailModal(true);
                }}
              >
                Change
              </button>
            </div>
            <div className="settings-row">
              <div className="settings-row-info">
                <h4>Password</h4>
                <p>Ensure security by updating passwords regularly</p>
              </div>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  setShowPasswordModal(true);
                }}
              >
                Update
              </button>
            </div>
            <div className="settings-row">
              <div className="settings-row-info">
                <h4>Delete Account</h4>
                <p>Permanently delete your profile and all associated data</p>
              </div>
              <button 
                className="btn btn-danger btn-sm"
                onClick={() => {
                  setDeleteConfirmPassword('');
                  setShowDeleteModal(true);
                }}
              >
                Delete
              </button>
            </div>
          </div>

          {/* Privacy */}
          <div className="settings-section">
            <h3><Eye size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />Privacy</h3>
            <div className="settings-row">
              <div className="settings-row-info">
                <h4>Profile Visibility</h4>
                <p>Control who can look up and view your profile</p>
              </div>
              <select 
                className="form-input form-select" 
                style={{ width: 'auto', height: '36px', fontSize: 'var(--text-sm)' }}
                value={profileVisibility}
                onChange={handleVisibilityChange}
              >
                <option value="Everyone">Everyone</option>
                <option value="Students Only">Students Only</option>
                <option value="Club Members Only">Club Members Only</option>
                <option value="Private">Private</option>
              </select>
            </div>
            <div className="settings-row">
              <div className="settings-row-info">
                <h4>Show Online Status</h4>
                <p>Allow other campus members to see when you are active</p>
              </div>
              <button 
                className={`toggle-switch ${onlineStatus ? 'on' : ''}`}
                onClick={handleOnlineToggle}
              />
            </div>
          </div>
        </>
      )}

      {/* Change Email Modal */}
      {showEmailModal && (
        <div className="profile-preview-backdrop" onClick={() => setShowEmailModal(false)}>
          <div className="chat-search-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px', width: '90%' }}>
            <div className="chat-search-modal-header">
              <h3>Change Email</h3>
              <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setShowEmailModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleEmailSubmit} style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label">Current Email</label>
                <input 
                  type="email" 
                  className="form-input" 
                  value={emailForm.currentEmail} 
                  disabled 
                />
              </div>
              <div className="form-group">
                <label className="form-label">New Email Address</label>
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="newemail@campus.edu"
                  value={emailForm.newEmail} 
                  onChange={e => setEmailForm(prev => ({ ...prev, newEmail: e.target.value }))}
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Verify Password</label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="••••••••"
                  value={emailForm.password} 
                  onChange={e => setEmailForm(prev => ({ ...prev, password: e.target.value }))}
                  required 
                />
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowEmailModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submittingModal}>
                  {submittingModal ? 'Submitting...' : 'Change Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Password Modal */}
      {showPasswordModal && (
        <div className="profile-preview-backdrop" onClick={() => setShowPasswordModal(false)}>
          <div className="chat-search-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px', width: '90%' }}>
            <div className="chat-search-modal-header">
              <h3>Update Password</h3>
              <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setShowPasswordModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handlePasswordSubmit} style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="Enter current password"
                  value={passwordForm.currentPassword} 
                  onChange={e => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="Enter new password"
                  value={passwordForm.newPassword} 
                  onChange={e => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="Confirm new password"
                  value={passwordForm.confirmPassword} 
                  onChange={e => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  required 
                />
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowPasswordModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submittingModal}>
                  {submittingModal ? 'Submitting...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="profile-preview-backdrop" onClick={() => setShowDeleteModal(false)}>
          <div className="chat-search-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px', width: '90%' }}>
            <div className="chat-search-modal-header" style={{ borderBottomColor: 'var(--danger-200)' }}>
              <h3 style={{ color: 'var(--danger-500)' }}>Delete Account</h3>
              <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setShowDeleteModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleDeleteAccountSubmit} style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="alert alert-danger" style={{ fontSize: 'var(--text-xs)', background: 'rgba(239, 68, 68, 0.05)', color: 'var(--danger-600)', border: '1px solid var(--danger-200)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-3)' }}>
                <strong>⚠️ Warning:</strong> This action is permanent and cannot be undone. All your messages, club memberships, event registrations, saved events, and profile data will be permanently wiped out.
              </div>
              
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="Enter your password to confirm deletion"
                  value={deleteConfirmPassword} 
                  onChange={e => setDeleteConfirmPassword(e.target.value)}
                  required 
                />
              </div>
              
              <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowDeleteModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-danger" style={{ flex: 1 }} disabled={submittingModal}>
                  {submittingModal ? 'Deleting...' : 'Delete Permanently'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
