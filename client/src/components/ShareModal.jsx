import { Users, X, Link as LinkIcon, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import API from '../services/api';

const ShareModal = ({ documentId, isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState('read');
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  useEffect(() => {
    if (isOpen) loadCollaborators();
  }, [isOpen, documentId]);

  const loadCollaborators = async () => {
    try {
      const { data } = await API.get(`/documents/${documentId}`);
      setCollaborators(data.collaborators || []);
    } catch (err) {}
  };

  const handleShare = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const { data } = await API.post(`/documents/${documentId}/share`, { email, role: permission });
      setCollaborators(data.collaborators);
      setEmail('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to share document');
    } finally {
      setLoading(false);
    }
  };

  const removeUser = async (userId) => {
    try {
      const { data } = await API.delete(`/documents/${documentId}/share/${userId}`);
      setCollaborators(data.collaborators);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove user');
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
        <div className="modal-content shadow">
          <div className="modal-header border-bottom-0 pb-0">
            <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
              <Users size={20} className="text-secondary" /> Share Document
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          
          <div className="modal-body">
            <form onSubmit={handleShare} className="d-flex gap-2 mb-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Add people by email..."
                className="form-control"
                required
              />
              <select 
                value={permission} 
                onChange={(e) => setPermission(e.target.value)}
                className="form-select"
                style={{ width: '120px' }}
              >
                <option value="read">Viewer</option>
                <option value="edit">Editor</option>
              </select>
              <button type="submit" disabled={loading} className="btn btn-primary px-4 fw-medium">
                {loading ? <span className="spinner-border spinner-border-sm" /> : 'Invite'}
              </button>
            </form>

            <h6 className="text-muted small fw-bold text-uppercase mb-3">People with access</h6>
            
            <div className="list-group list-group-flush border rounded-3 overflow-hidden shadow-sm" style={{ maxHeight: '250px', overflowY: 'auto' }}>
              {collaborators.length === 0 ? (
                <div className="list-group-item text-muted fst-italic py-3">
                  This document hasn't been shared with anyone yet.
                </div>
              ) : (
                collaborators.map(({ user, role }) => (
                  <div key={user._id} className="list-group-item d-flex justify-content-between align-items-center py-2">
                    <div className="d-flex align-items-center gap-3">
                      <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '32px', height: '32px', fontSize: '14px' }}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="fw-bold small mb-0 lh-1">{user.name}</div>
                        <div className="text-muted small" style={{ fontSize: '12px' }}>{user.email}</div>
                      </div>
                    </div>
                    
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge bg-light text-secondary border">{role === 'edit' ? 'Editor' : 'Viewer'}</span>
                      <button 
                        onClick={() => removeUser(user._id)}
                        className="btn btn-sm btn-light text-danger rounded-circle p-1"
                        title="Remove Access"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="modal-footer justify-content-between border-top-0 pt-0">
            <button onClick={copyLink} className="btn btn-light d-flex align-items-center gap-2 border">
              {copied ? <Check size={16} className="text-success" /> : <LinkIcon size={16} />} 
              {copied ? 'Link Copied!' : 'Copy Link'}
            </button>
            <button onClick={onClose} className="btn btn-primary px-4 fw-medium">Done</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
