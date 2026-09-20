import { Layers, Clock, Share2, Trash2, Github } from 'lucide-react';

const Sidebar = ({ filter, setFilter }) => {
  const filters = [
    { id: 'all', label: 'All documents', icon: <Layers size={18} /> },
    { id: 'my', label: 'My documents', icon: <Clock size={18} /> },
    { id: 'shared', label: 'Shared with me', icon: <Share2 size={18} /> },
    { id: 'trash', label: 'Trash', icon: <Trash2 size={18} /> },
  ];

  return (
    <aside className="d-none d-md-flex flex-column p-3 bg-light border-end" style={{ width: '260px' }}>
      <div className="text-muted small fw-bold text-uppercase mb-3 px-3">Browse</div>
      <div className="nav flex-column nav-pills gap-1">
        {filters.map((f) => (
          <button
            key={f.id}
            className={`nav-link text-start d-flex align-items-center gap-3 py-2 ${filter === f.id ? 'active' : 'text-dark hover-bg-light'}`}
            onClick={() => setFilter(f.id)}
            style={filter !== f.id ? { transition: 'background-color 0.2s', backgroundColor: 'transparent' } : {}}
          >
            {f.icon}
            <span className="fw-medium">{f.label}</span>
          </button>
        ))}
      </div>
      
      <div className="mt-auto pt-3 border-top">
        <a 
          href="https://github.com/maverickdev259/data-dev" 
          target="_blank" 
          rel="noopener noreferrer"
          className="nav-link text-muted d-flex align-items-center gap-3 py-2"
        >
          <Github size={18} />
          <span className="small">Source Code</span>
        </a>
      </div>
    </aside>
  );
};

export default Sidebar;
