import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Download, ExternalLink, Star, Tag, Clock, Layers, Award } from 'lucide-react';
import { resources } from '../../data/resources';
import '../../components/ui/Components.css';
import './ResourceDetail.css';

export default function ResourceDetail() {
  const { id } = useParams();
  const resource = resources.find(r => r.id === parseInt(id));
  const [downloaded, setDownloaded] = useState(false);

  if (!resource) {
    return (
      <div className="empty-state">
        <h3>Resource not found</h3>
        <Link to="/dashboard" className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }}>
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const handleDownload = (name) => {
    setDownloaded(true);
    alert(`Downloading: ${name}`);
    setTimeout(() => setDownloaded(false), 2000);
  };

  return (
    <div className="resource-detail animate-fade-in">
      <Link to="/dashboard" className="btn btn-ghost btn-sm" style={{ marginBottom: 'var(--space-4)', display: 'inline-flex', gap: '8px' }}>
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>

      <div className="resource-detail-header-card">
        <div className="resource-detail-badge-row">
          <span className="badge badge-success">{resource.type}</span>
          <span className="badge badge-gray">{resource.difficulty}</span>
        </div>
        <h1>{resource.title}</h1>
        <p className="resource-subtitle">Provided by {resource.author}</p>
        <div className="resource-meta">
          <span><Star size={14} fill="var(--warning-400)" stroke="var(--warning-400)" /> {resource.rating} ({resource.reviews} reviews)</span>
          <span><Clock size={14} /> {resource.duration}</span>
        </div>
        <div className="resource-tags" style={{ marginTop: '12px' }}>
          {resource.tags.map(t => <span key={t} className="badge badge-gray">#{t}</span>)}
        </div>
      </div>

      <div className="resource-detail-grid">
        <div className="resource-main-content">
          <div className="resource-section-card">
            <h3><BookOpen size={20} className="icon-align" /> Description</h3>
            <p className="resource-desc-text">{resource.description}</p>
          </div>

          <div className="resource-section-card">
            <h3><Layers size={20} className="icon-align" /> Syllabus & Key Topics</h3>
            <div className="topics-list">
              {resource.topics.map((t, idx) => (
                <div className="topic-item" key={idx}>
                  <div className="topic-number">{idx + 1}</div>
                  <div className="topic-text">{t}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="resource-sidebar">
          <div className="resource-sidebar-card">
            <h3><Award size={20} className="icon-align" /> Learning Materials</h3>
            <p className="sidebar-hint">Access the files and video guides curated by the community.</p>
            <div className="materials-list">
              {resource.materials.map((m, idx) => (
                <div 
                  className="material-item" 
                  key={idx}
                  onClick={() => handleDownload(m.name)}
                >
                  <div className="material-icon-box">
                    {m.name.includes('Repo') ? <ExternalLink size={16} /> : <Download size={16} />}
                  </div>
                  <div className="material-info">
                    <h4>{m.name}</h4>
                    <p>{m.name.includes('PDF') ? 'Document File' : m.name.includes('Repo') ? 'Github Link' : 'External Link'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
