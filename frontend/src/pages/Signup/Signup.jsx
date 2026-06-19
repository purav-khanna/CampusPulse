import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, BookOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import '../../components/ui/Components.css';
import './Auth.css';

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student', department: '' });
  const [showPassword, setShowPassword] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    signup(form);
    navigate('/dashboard');
  };

  const roles = [
    { key: 'student', label: 'Student', desc: 'Browse & join' },
    { key: 'professor', label: 'Professor', desc: 'Manage & announce' },
    { key: 'clubLeader', label: 'Club Leader', desc: 'Lead & organize' }
  ];

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo-container">
            <img src="/logo.png" alt="CampusPulse Logo" className="auth-logo-img" />
            <h2 className="auth-logo-title">Campus<span>Pulse</span></h2>
            <p className="auth-logo-subtitle">"The Pulse of Campus Life"</p>
          </div>
          <h3 className="auth-action-title">Create Account</h3>
          <p className="auth-action-subtitle">Join CampusPulse and connect with your campus</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div>
            <label className="form-label" style={{ marginBottom: 'var(--space-2)', display: 'block' }}>I am a</label>
            <div className="auth-role-selector">
              {roles.map(r => (
                <button
                  type="button"
                  key={r.key}
                  className={`auth-role-btn ${form.role === r.key ? 'selected' : ''}`}
                  onClick={() => handleChange('role', r.key)}
                >
                  <h4>{r.label}</h4>
                  <p>{r.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input type="text" className="form-input" placeholder="Your full name" value={form.name} onChange={(e) => handleChange('name', e.target.value)} style={{ paddingLeft: '40px' }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input type="email" className="form-input" placeholder="you@campus.edu" value={form.email} onChange={(e) => handleChange('email', e.target.value)} style={{ paddingLeft: '40px' }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Department</label>
            <div style={{ position: 'relative' }}>
              <BookOpen size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input type="text" className="form-input" placeholder="e.g. Computer Science" value={form.department} onChange={(e) => handleChange('department', e.target.value)} style={{ paddingLeft: '40px' }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input type={showPassword ? 'text' : 'password'} className="form-input" placeholder="Create a password" value={form.password} onChange={(e) => handleChange('password', e.target.value)} style={{ paddingLeft: '40px', paddingRight: '40px' }} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
            Create Account
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
