import { Link } from 'react-router-dom';
import { FileText, MoreVertical, Trash2, Clock, Users } from 'lucide-react';

const DocumentCard = ({ document, onDelete, viewMode = 'grid' }) => {
  const formatDate = (date) => {
    const d = new Date(date);
    const diff = new Date() - d;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleDelete = (e) => {
    e.preventDefault();
    onDelete(document._id);
  };

  if (viewMode === 'list') {
    return (
      <Link to={`/document/${document._id}`} className="list-group-item list-group-item-action d-flex align-items-center py-3 border-0 border-bottom">
        <div className="bg-primary bg-opacity-10 text-primary rounded p-2 me-3">
          <FileText size={20} />
        </div>
        <div className="flex-grow-1 min-w-0">
          <h6 className="mb-1 text-truncate text-dark fw-bold">{document.title || 'Untitled Document'}</h6>
          <div className="d-flex text-muted small gap-3">
            <span className="d-flex align-items-center gap-1"><Clock size={12}/> {formatDate(document.updatedAt)}</span>
            <span className="d-flex align-items-center gap-1"><Users size={12}/> {document.collaborators?.length || 0}</span>
          </div>
        </div>
        <div className="dropdown ms-3" onClick={e => e.preventDefault()}>
          <button className="btn btn-sm btn-light rounded-circle" data-bs-toggle="dropdown">
            <MoreVertical size={16} />
          </button>
          <ul className="dropdown-menu dropdown-menu-end shadow-sm">
            <li><button className="dropdown-item text-danger d-flex align-items-center gap-2" onClick={handleDelete}><Trash2 size={14}/> Move to trash</button></li>
          </ul>
        </div>
      </Link>
    );
  }

  // Grid View
  return (
    <div className="col">
      <Link to={`/document/${document._id}`} className="card h-100 text-decoration-none doc-card border border-gray-200">
        <div className="card-img-top bg-light border-bottom d-flex align-items-center justify-content-center" style={{ height: '140px' }}>
           <FileText size={48} className="text-secondary opacity-50" />
        </div>
        <div className="card-body d-flex flex-column">
          <h6 className="card-title text-dark fw-bold text-truncate mb-2" title={document.title}>
            {document.title || 'Untitled'}
          </h6>
          <div className="d-flex justify-content-between align-items-center mt-auto">
            <span className="small text-muted">{formatDate(document.updatedAt)}</span>
            
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-light text-secondary border d-flex align-items-center gap-1">
                <Users size={12} /> {document.collaborators?.length || 0}
              </span>
              <div className="dropdown" onClick={e => e.preventDefault()}>
                <button className="btn btn-sm btn-light rounded-circle p-1" data-bs-toggle="dropdown">
                  <MoreVertical size={14} />
                </button>
                <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 mt-1">
                  <li><button className="dropdown-item text-danger d-flex align-items-center gap-2 small" onClick={handleDelete}><Trash2 size={14}/> Trash</button></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default DocumentCard;
