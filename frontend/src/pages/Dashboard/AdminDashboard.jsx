import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Shield, Users, Calendar, TrendingUp, CheckCircle, XCircle, AlertTriangle, BarChart3 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { events } from '../../data/events';
import { clubs } from '../../data/clubs';
import { allUsers } from '../../data/users';
import { stats } from '../../data/announcements';
import '../../components/ui/Components.css';
import './Dashboard.css';

const COLORS = ['#6366f1', '#ec4899', '#22c55e', '#f59e0b', '#06b6d4', '#ef4444'];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const miniStats = [
    { num: stats.activeUsers.toLocaleString(), label: 'Total Users', color: 'var(--primary-500)', icon: Users },
    { num: stats.totalEvents.toString(), label: 'Total Events', color: 'var(--accent-500)', icon: Calendar },
    { num: stats.activeClubs.toString(), label: 'Active Clubs', color: 'var(--success-500)', icon: Shield },
    { num: stats.totalRegistrations.toLocaleString(), label: 'Registrations', color: 'var(--warning-500)', icon: TrendingUp }
  ];

  const pendingApprovals = [
    { id: 1, title: 'Blockchain Workshop', by: 'CyberSec Club', type: 'Event' },
    { id: 2, title: 'Poetry Slam Night', by: 'Literary Club', type: 'Event' },
    { id: 3, title: 'Robotics Club', by: 'Dev Patel', type: 'Club' }
  ];

  return (
    <div className="dashboard-page animate-fade-in">
      <div className="dashboard-welcome">
        <h1><Shield size={28} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px', color: 'var(--primary-500)' }} /> Admin Dashboard</h1>
        <p>Manage your campus platform</p>
      </div>

      <div className="stats-row">
        {miniStats.map((s, i) => (
          <div className="mini-stat" key={i}>
            <s.icon size={20} style={{ color: s.color, marginBottom: '4px' }} />
            <div className="mini-stat-num" style={{ color: s.color }}>{s.num}</div>
            <div className="mini-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 'var(--space-6)' }}>
        {['overview', 'users', 'approvals'].map(tab => (
          <button key={tab} className={`tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="dashboard-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <div className="dash-card">
              <div className="dash-card-header"><h3><BarChart3 size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />Monthly Registrations</h3></div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.monthlyRegistrations}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="month" tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }} />
                    <YAxis tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }} />
                    <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                    <Line type="monotone" dataKey="count" stroke="var(--primary-500)" strokeWidth={2} dot={{ r: 4, fill: 'var(--primary-500)' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="dash-card">
              <div className="dash-card-header"><h3>🏆 Top Clubs</h3></div>
              <div className="upcoming-list">
                {stats.topClubs.map((club, i) => (
                  <div className="upcoming-item" key={i}>
                    <div className="avatar avatar-md" style={{ background: COLORS[i % COLORS.length] }}>{i + 1}</div>
                    <div className="upcoming-info"><h4>{club.name}</h4><p>{club.members} members · {club.events} events</p></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <div className="dash-card">
              <div className="dash-card-header"><h3>📊 Category Distribution</h3></div>
              <div className="chart-container" style={{ height: '240px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stats.categoryDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {stats.categoryDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="dash-card">
              <div className="dash-card-header"><h3>⏳ Pending Approvals</h3></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {pendingApprovals.map(a => (
                  <div className="approval-item" key={a.id}>
                    <div>
                      <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{a.title}</h4>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>by {a.by} · {a.type}</p>
                    </div>
                    <div className="approval-actions">
                      <button className="btn btn-sm btn-success"><CheckCircle size={14} /></button>
                      <button className="btn btn-sm btn-danger"><XCircle size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="dash-card">
          <div className="dash-card-header"><h3>All Users</h3></div>
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr><th>User</th><th>Role</th><th>Department</th><th>Status</th></tr>
              </thead>
              <tbody>
                {allUsers.map(u => (
                  <tr key={u.id}>
                    <td><div className="user-cell"><div className="avatar avatar-sm" style={{ background: 'linear-gradient(135deg, var(--primary-400), var(--accent-400))' }}>{u.avatar}</div>{u.name}</div></td>
                    <td><span className="badge badge-primary" style={{ textTransform: 'capitalize' }}>{u.role}</span></td>
                    <td>{u.department}</td>
                    <td><span className="badge badge-success">Active</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'approvals' && (
        <div className="dash-card">
          <div className="dash-card-header"><h3>Approval Queue</h3></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {pendingApprovals.map(a => (
              <div className="approval-item" key={a.id}>
                <div>
                  <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{a.title}</h4>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Submitted by {a.by} · Type: {a.type}</p>
                </div>
                <div className="approval-actions">
                  <button className="btn btn-sm btn-success"><CheckCircle size={14} /> Approve</button>
                  <button className="btn btn-sm btn-danger"><XCircle size={14} /> Reject</button>
                </div>
              </div>
            ))}
            <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', padding: 'var(--space-4)' }}>3 items pending review</p>
          </div>
        </div>
      )}
    </div>
  );
}
