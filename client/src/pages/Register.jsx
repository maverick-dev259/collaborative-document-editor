import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FileText } from 'lucide-react';

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      return setError('Passwords do not match');
    }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.confirmPassword);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container min-vh-100 d-flex flex-column justify-content-center align-items-center">
      <div className="card shadow-sm border-0" style={{ maxWidth: '400px', width: '100%' }}>
        <div className="card-body p-5">
          <div className="text-center mb-4">
            <div className="bg-primary text-white d-inline-flex align-items-center justify-content-center rounded p-2 mb-3">
              <FileText size={24} />
            </div>
            <h3 className="card-title fw-bold">Create account</h3>
            <p className="text-muted">Start collaborating today</p>
          </div>

          {error && <div className="alert alert-danger py-2">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Full Name</label>
              <input type="text" className="form-control" value={form.name} onChange={set('name')} required />
            </div>
            <div className="mb-3">
              <label className="form-label">Email address</label>
              <input type="email" className="form-control" value={form.email} onChange={set('email')} required />
            </div>
            <div className="mb-3">
              <label className="form-label">Password</label>
              <input type="password" className="form-control" value={form.password} onChange={set('password')} required minLength={6} />
            </div>
            <div className="mb-4">
              <label className="form-label">Confirm Password</label>
              <input type="password" className="form-control" value={form.confirmPassword} onChange={set('confirmPassword')} required minLength={6} />
            </div>

            <button type="submit" className="btn btn-primary w-100 mb-3" disabled={loading}>
              {loading ? <span className="spinner-border spinner-border-sm" /> : 'Register'}
            </button>

            <div className="text-center">
              <span className="text-muted">Already have an account? </span>
              <Link to="/login" className="text-decoration-none">Sign in</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
