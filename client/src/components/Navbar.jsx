import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FileText, Search, LogOut } from 'lucide-react';

const Navbar = ({ onSearch }) => {
  const { user, logout } = useAuth();
  
  const initials = user?.name ? user.name.charAt(0).toUpperCase() : '?';

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom sticky-top shadow-sm px-3">
      <div className="container-fluid">
        <Link to="/dashboard" className="navbar-brand d-flex align-items-center gap-2 fw-bold text-dark">
          <div className="bg-primary text-white rounded p-1 d-flex align-items-center justify-content-center">
            <FileText size={20} />
          </div>
          CollabDocs
        </Link>
        
        {onSearch && (
          <div className="mx-auto d-none d-md-flex" style={{ flex: '0 1 500px' }}>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <Search size={16} />
              </span>
              <input
                type="text"
                className="form-control bg-light border-start-0 shadow-none"
                placeholder="Search documents..."
                onChange={(e) => onSearch(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="ms-auto d-flex flex-row align-items-center">
          <div className="dropdown">
            <button 
              className="btn btn-light d-flex align-items-center gap-2 border"
              type="button" 
              id="userDropdownMenu" 
              data-bs-toggle="dropdown" 
              aria-expanded="false"
            >
              <div 
                className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold"
                style={{ width: '24px', height: '24px', fontSize: '12px' }}
              >
                {initials}
              </div>
              <span className="d-none d-sm-inline small fw-medium">{user?.name}</span>
            </button>
            <ul className="dropdown-menu dropdown-menu-end shadow-sm" aria-labelledby="userDropdownMenu">
              <li className="px-3 py-2 border-bottom">
                <div className="fw-bold small">{user?.name}</div>
                <div className="text-muted small text-truncate" style={{maxWidth: '200px'}}>{user?.email}</div>
              </li>
              <li>
                <button className="dropdown-item text-danger small mt-1 d-flex align-items-center gap-2" onClick={logout}>
                  <LogOut size={16} /> Sign out
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
