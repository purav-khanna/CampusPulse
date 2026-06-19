import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Users, Calendar, Plus, X, ShieldAlert } from 'lucide-react';
import { apiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import '../../components/ui/Components.css';
import './Clubs.css';

export const clubCategories = [
  "All",
  "Technical",
  "Cultural",
  "Sports",
  "Literature",
  "Entrepreneurship",
  "Social Service"
];

export const renderLogo = (logo, name) => {
  const isUrl = logo && (logo.startsWith('http') || logo.startsWith('/') || logo.includes('.'));
  if (isUrl) {
    return <img src={logo} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />;
  }
  return logo || name.slice(0, 2).toUpperCase();
};

export default function ClubsListing() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [clubsList, setClubsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showClubModal, setShowClubModal] = useState(false);
  const [clubForm, setClubForm] = useState({
    name: '',
    description: '',
    category: 'Technical',
    department: '',
    logo: '',
    banner: ''
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [dragOverLogo, setDragOverLogo] = useState(false);
  const [dragOverBanner, setDragOverBanner] = useState(false);

  const fetchClubs = async () => {
    try {
      const data = await apiService.getClubs();
      setClubsList(data);
    } catch (err) {
      console.error('Failed to load clubs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClubs();
  }, []);

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
      if (target === 'logo') setUploadingLogo(true);
      if (target === 'banner') setUploadingBanner(true);

      const formData = new FormData();
      formData.append('file', file);
      const res = await apiService.uploadChatFile(formData);

      if (target === 'logo') setClubForm(prev => ({ ...prev, logo: res.fileUrl }));
      if (target === 'banner') setClubForm(prev => ({ ...prev, banner: res.fileUrl }));
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Image upload failed. Please try again.');
    } finally {
      if (target === 'logo') setUploadingLogo(false);
      if (target === 'banner') setUploadingBanner(false);
    }
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
      
      await apiService.createClub(dataToSubmit);

      // Re-fetch clubs listing dynamically
      await fetchClubs();

      setShowClubModal(false);
      alert('🏛️ Club Created Successfully!');
      
      // Reset form
      setClubForm({
        name: '',
        description: '',
        category: 'Technical',
        department: '',
        logo: '',
        banner: ''
      });
    } catch (err) {
      console.error('Submit club error:', err);
      setFormError(err.message || 'Error creating club.');
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = clubsList
    .filter(c => category === 'All' || c.category === category)
    .filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase()));

  const showCreateButton = user && (user.role === 'professor' || user.role === 'clubLeader' || user.role === 'club_leader');

  return (
    <div className="clubs-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>🏛️ Clubs</h1>
          <p>Discover and join campus communities</p>
        </div>
        {showCreateButton && (
          <button className="btn btn-primary" onClick={() => setShowClubModal(true)}>
            <Plus size={16} style={{ marginRight: '6px' }} /> Create Club
          </button>
        )}
      </div>

      <div className="clubs-toolbar">
        <div className="search-wrap">
          <Search size={18} />
          <input type="text" className="form-input" placeholder="Search clubs..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="filter-chips" style={{ marginBottom: 'var(--space-6)' }}>
        {clubCategories.map(cat => (
          <button key={cat} className={`filter-chip ${category === cat ? 'active' : ''}`} onClick={() => setCategory(cat)}>{cat}</button>
        ))}
      </div>

      {loading ? (
        <div className="clubs-grid">
          {[1, 2, 3, 4].map(n => (
            <div className="club-card loading-shimmer" key={n} style={{ height: '200px', display: 'flex', flexDirection: 'column', padding: 'var(--space-4)' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                <div className="shimmer-bone" style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div className="shimmer-bone" style={{ width: '60%', height: '18px' }} />
                  <div className="shimmer-bone" style={{ width: '30%', height: '12px' }} />
                </div>
              </div>
              <div className="shimmer-bone" style={{ width: '90%', height: '14px', marginBottom: '8px' }} />
              <div className="shimmer-bone" style={{ width: '70%', height: '14px' }} />
            </div>
          ))}
        </div>
      ) : (
        <div className="clubs-grid">
          {filtered.map(club => (
            <Link to={`/clubs/${club.id}`} className="club-card" key={club.id}>
              <div className="club-card-banner">
                {club.banner ? (
                  <img src={club.banner} alt={club.name} />
                ) : (
                  <div className="club-banner-placeholder" />
                )}
              </div>
              <div className="club-card-body">
                <div className="club-card-header">
                  <div className="club-card-logo" style={{ background: club.color || 'var(--gradient-primary)' }}>
                    {renderLogo(club.logo, club.name)}
                  </div>
                  <div className="club-card-title-group">
                    <h3>{club.name}</h3>
                    <span className="badge-category">{club.category} Club</span>
                  </div>
                </div>
                <p className="club-card-desc">{club.description}</p>
                <div className="club-card-footer">
                  <div className="club-card-stats">
                    <span><Users size={14} /> {club.memberCount || 0} members</span>
                    <span><Calendar size={14} /> {club.events?.length || 0} events</span>
                  </div>
                  {club.recentActivity && (
                    <div className="club-card-activity">📌 {club.recentActivity}</div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="empty-state"><Users size={64} className="empty-state-icon" /><h3>No clubs found</h3><p>Try adjusting your search or filters</p></div>
      )}

      {/* CREATE CLUB MODAL */}
      {showClubModal && (
        <div className="cl-modal-backdrop" onClick={() => setShowClubModal(false)}>
          <div className="cl-modal-container" onClick={(e) => e.stopPropagation()}>
            
            <div className="cl-modal-header">
              <h3>Create New Club</h3>
              <button className="cl-modal-close" onClick={() => setShowClubModal(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleClubSubmit}>
              <div className="cl-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {formError && (
                  <div style={{ background: 'var(--danger-50)', color: 'var(--danger-700)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)' }}>{formError}</div>
                )}

                <div className="cl-form-group">
                  <label>Club Name *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Robotics Innovation Hub" 
                    className="cl-form-input"
                    value={clubForm.name}
                    onChange={(e) => setClubForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div className="cl-form-group">
                  <label>Description</label>
                  <textarea 
                    placeholder="Describe the club's activities and community vision..." 
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
                  >
                    {uploadingLogo ? (
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--cl-text-muted)' }}>Uploading Logo...</span>
                    ) : clubForm.logo ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <img src={clubForm.logo} alt="Club Logo Preview" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                        <button type="button" className="btn btn-ghost btn-xs btn-danger" onClick={() => setClubForm(prev => ({ ...prev, logo: '' }))}>Remove Logo</button>
                      </div>
                    ) : (
                      <div onClick={() => document.getElementById('clubs-logo-file-input').click()}>
                        <Plus size={16} style={{ margin: '0 auto', color: 'var(--cl-text-muted)' }} />
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--cl-text-secondary)' }}>Click or Drag Logo (Square ratio)</span>
                        <input id="clubs-logo-file-input" type="file" style={{ display: 'none' }} accept=".jpg,.jpeg,.png,.webp" onChange={(e) => {
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
                  >
                    {uploadingBanner ? (
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--cl-text-muted)' }}>Uploading Banner...</span>
                    ) : clubForm.banner ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <img src={clubForm.banner} alt="Club Banner Preview" style={{ width: '80px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                        <button type="button" className="btn btn-ghost btn-xs btn-danger" onClick={() => setClubForm(prev => ({ ...prev, banner: '' }))}>Remove Banner</button>
                      </div>
                    ) : (
                      <div onClick={() => document.getElementById('clubs-banner-file-input').click()}>
                        <Plus size={16} style={{ margin: '0 auto', color: 'var(--cl-text-muted)' }} />
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--cl-text-secondary)' }}>Click or Drag Banner (Wide ratio)</span>
                        <input id="clubs-banner-file-input" type="file" style={{ display: 'none' }} accept=".jpg,.jpeg,.png,.webp" onChange={(e) => {
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
                  {actionLoading ? 'Creating...' : 'Create Club'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}
