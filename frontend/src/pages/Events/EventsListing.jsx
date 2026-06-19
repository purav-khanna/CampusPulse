import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Clock, MapPin, Users, Filter, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/api';
import '../../components/ui/Components.css';
import './Events.css';

export const eventCategories = [
  "All",
  "Technical",
  "Cultural",
  "Sports",
  "Workshop",
  "Seminar",
  "Hackathon"
];

export default function EventsListing() {
  const { user } = useAuth();
  const [eventsList, setEventsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('date');

  useEffect(() => {
    async function fetchEvents() {
      try {
        const data = await apiService.getEvents();
        setEventsList(data);
      } catch (err) {
        console.error('Failed to load events:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  const filtered = eventsList
    .filter(e => category === 'All' || e.category === category)
    .filter(e => e.title.toLowerCase().includes(search.toLowerCase()) || e.description.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sort === 'date' ? new Date(a.date) - new Date(b.date) : b.registeredSeats - a.registeredSeats);

  return (
    <div className="events-page">
      <div className="page-header">
        <h1>🎉 Events</h1>
        <p>Discover and register for campus events</p>
      </div>

      <div className="events-toolbar">
        <div className="search-wrap">
          <Search size={18} />
          <input type="text" className="form-input" placeholder="Search events..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="form-input form-select" style={{ width: 'auto', minWidth: '160px' }} value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="date">Sort by Date</option>
          <option value="popular">Sort by Popularity</option>
        </select>
      </div>

      <div className="filter-chips" style={{ marginBottom: 'var(--space-6)' }}>
        {eventCategories.map(cat => (
          <button key={cat} className={`filter-chip ${category === cat ? 'active' : ''}`} onClick={() => setCategory(cat)}>
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="events-grid">
          {[1, 2, 3, 4].map(n => (
            <div className="event-card loading-shimmer" key={n} style={{ height: '380px', display: 'flex', flexDirection: 'column' }}>
              <div className="shimmer-bone" style={{ height: '200px', width: '100%', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0' }} />
              <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', flex: 1 }}>
                <div className="shimmer-bone" style={{ height: '16px', width: '30%' }} />
                <div className="shimmer-bone" style={{ height: '24px', width: '80%' }} />
                <div className="shimmer-bone" style={{ height: '14px', width: '90%' }} />
                <div className="shimmer-bone" style={{ height: '14px', width: '60%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="events-grid">
          {filtered.map(event => {
            const pct = Math.min(100, Math.round((event.registeredSeats / event.totalSeats) * 100));
            const getProgressBarColor = (p) => {
              if (p < 50) return '#3b82f6';
              if (p < 80) return '#8b5cf6';
              if (p < 95) return '#f97316';
              return '#ef4444';
            };
            const remaining = event.totalSeats - event.registeredSeats;
            const tooltipText = `${event.registeredSeats} registered\n${remaining} seats remaining`;

            return (
              <Link to={`/events/${event.id}`} className="event-card" key={event.id}>
                <img src={event.banner} alt={event.title} className="event-card-banner" loading="lazy" />
                <div className="event-card-body">
                  <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                    <span className={`badge ${
                      event.category === 'Hackathon' ? 'badge-danger' :
                      event.category === 'Workshop' ? 'badge-warning' :
                      event.category === 'Cultural' ? 'badge-accent' :
                      event.category === 'Sports' ? 'badge-success' : 'badge-primary'
                    }`}>{event.category}</span>
                    {user?.registeredEvents?.includes(event.id) && (
                      <span className="badge badge-success">Registered</span>
                    )}
                  </div>
                  <h3>{event.title}</h3>
                  <p className="event-card-desc line-clamp-2">{event.description}</p>
                  <div className="event-card-meta">
                    <span><Clock size={14} /> {event.date} · {event.time}</span>
                    <span><MapPin size={14} /> {event.venue.split(',')[0]}</span>
                  </div>
                  <div className="event-card-footer">
                    <div className="event-card-seats-bar" title={tooltipText}>
                      <div className="event-card-seats-text">{event.registeredSeats}/{event.totalSeats} seats filled</div>
                      <div className="progress-bar">
                        <div 
                          className="progress-bar-fill" 
                          style={{ 
                            width: `${pct}%`,
                            backgroundColor: getProgressBarColor(pct),
                            transition: 'width 0.5s ease, background-color 0.5s ease'
                          }} 
                        />
                      </div>
                    </div>
                    <div className="event-card-organizer">
                      <div className="avatar avatar-sm" style={{ background: 'var(--primary-500)' }}>{event.organizerAvatar}</div>
                      {event.organizer}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="empty-state">
          <Calendar size={64} className="empty-state-icon" />
          <h3>No events found</h3>
          <p>Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}
