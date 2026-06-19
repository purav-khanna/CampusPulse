import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

export default function AccessDenied() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', textAlign: 'center', padding: '20px' }}>
      <ShieldAlert size={64} color="var(--danger-500)" style={{ marginBottom: '20px' }} />
      <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '10px' }}>Access Denied</h1>
      <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', marginBottom: '24px' }}>
        You do not have permission to access this page. Please contact the administrator if you believe this is an error.
      </p>
      <Link to="/dashboard" className="btn btn-primary">
        Back to Dashboard
      </Link>
    </div>
  );
}
