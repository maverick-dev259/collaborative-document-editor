import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Share2, Cloud, CloudOff, 
  CheckCircle2, Clock, History, FileText, X, UserX
} from 'lucide-react';
import API from '../services/api';
import socketService from '../services/socket';
import { useAuth } from '../context/AuthContext';
import EditorToolbar from '../components/EditorToolbar';
import Editor from '../components/Editor';
import UserPresence from '../components/UserPresence';
import ShareModal from '../components/ShareModal';

const DocumentEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  
  const [document, setDocument] = useState(null);
  const [title, setTitle] = useState('');
  const [editorInstance, setEditorInstance] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [socketStatus, setSocketStatus] = useState('connecting');
  const [saveStatus, setSaveStatus] = useState('saved');
  const [activeUsers, setActiveUsers] = useState([]);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [versions, setVersions] = useState([]);
  
  const saveTimeoutRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    const initDocument = async () => {
      try {
        setLoading(true);
        const { data } = await API.get(`/documents/${id}`);
        setDocument(data);
        setTitle(data.title);
        contentRef.current = data.content;
        
        const socket = socketService.connectSocket(token);
        socket.on('connect', () => setSocketStatus('connected'));
        socket.on('disconnect', () => setSocketStatus('disconnected'));
        socket.emit('join-document', { documentId: id });
        
        socket.on('active-users', (users) => setActiveUsers(users.filter(u => u._id !== user._id)));
        socket.on('user-joined', (newUser) => {
          if (newUser._id !== user._id) {
            setActiveUsers(prev => prev.find(u => u._id === newUser._id) ? prev : [...prev, newUser]);
          }
        });
        socket.on('user-left', (leftUser) => setActiveUsers(prev => prev.filter(u => u._id !== leftUser._id)));
        socket.on('document-saved', () => setSaveStatus('saved'));

        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to open document');
        setLoading(false);
      }
    };
    if (token) initDocument();
    return () => {
      const socket = socketService.getSocket();
      if (socket) {
        socket.emit('leave-document', { documentId: id });
        socket.off('connect').off('disconnect').off('active-users').off('user-joined').off('user-left').off('document-saved');
      }
    };
  }, [id, token, user._id]);

  useEffect(() => {
    if (showVersionHistory) fetchVersions();
  }, [showVersionHistory]);

  const fetchVersions = async () => {
    try {
      const { data } = await API.get(`/documents/${id}/versions`);
      setVersions(data);
    } catch (err) { console.error(err); }
  };

  const saveDocumentToServer = async (newTitle, newContent) => {
    setSaveStatus('saving');
    try {
      await API.put(`/documents/${id}`, { title: newTitle, content: newContent });
      setSaveStatus('saved');
      const socket = socketService.getSocket();
      if (socket) socket.emit('save-document', { documentId: id });
    } catch (err) { setSaveStatus('error'); }
  };

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    setSaveStatus('saving');
    saveTimeoutRef.current = setTimeout(() => saveDocumentToServer(newTitle, contentRef.current), 1500);
  };

  const handleContentChange = useCallback((newContent) => {
    contentRef.current = newContent;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    setSaveStatus('saving');
    saveTimeoutRef.current = setTimeout(() => saveDocumentToServer(title, newContent), 2000);
  }, [title]);

  const handleManualSave = async () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    await saveDocumentToServer(title, contentRef.current);
    try {
      await API.post(`/documents/${id}/versions`);
      if (showVersionHistory) fetchVersions();
    } catch(err) {} 
  };

  const restoreVersion = async (versionId) => {
    if (!window.confirm('Restore this version? The current state will be saved.')) return;
    try {
      const { data } = await API.post(`/documents/${id}/versions/${versionId}/restore`);
      setDocument(data);
      setTitle(data.title);
      contentRef.current = data.content;
      if (editorInstance) editorInstance.commands.setContent(data.content, false);
      fetchVersions();
    } catch (err) { alert('Failed to restore'); }
  };

  if (loading) return (
    <div className="vh-100 d-flex flex-column align-items-center justify-content-center bg-light">
      <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
        <span className="visually-hidden">Loading...</span>
      </div>
      <p className="text-secondary fw-semibold">Loading document...</p>
    </div>
  );

  if (error) return (
    <div className="vh-100 d-flex align-items-center justify-content-center bg-light p-4">
      <div className="card shadow-sm border-0 text-center" style={{ maxWidth: '400px', width: '100%' }}>
        <div className="card-body p-5">
          <div className="bg-danger bg-opacity-10 text-danger rounded-circle d-inline-flex p-3 mb-3">
            <UserX size={32} />
          </div>
          <h4 className="fw-bold mb-2">Access Denied</h4>
          <p className="text-muted mb-4">{error}</p>
          <Link to="/dashboard" className="btn btn-primary">Back to Dashboard</Link>
        </div>
      </div>
    </div>
  );

  const isOwner = document?.owner?._id === user._id;

  return (
    <div className="d-flex flex-column vh-100">
      {/* Navbar */}
      <div className="bg-white border-bottom px-3 py-2 d-flex align-items-center justify-content-between shrink-0 shadow-sm" style={{ zIndex: 10 }}>
        
        <div className="d-flex align-items-center gap-3">
          <Link to="/dashboard" className="btn btn-light rounded-circle p-2 d-flex align-items-center justify-content-center" title="Back to Dashboard">
            <ArrowLeft size={18} />
          </Link>
          <div className="d-flex flex-column">
            <div className="d-flex align-items-center gap-2">
              <input
                type="text"
                value={title}
                onChange={handleTitleChange}
                placeholder="Untitled Document"
                className="form-control form-control-sm border-0 shadow-none fw-bold fs-5 px-1 py-0 bg-transparent text-dark hover-bg-light"
                style={{ width: 'auto', minWidth: '150px' }}
              />
            </div>
            <div className="d-flex align-items-center mt-1 px-1" style={{ fontSize: '11px' }}>
              {saveStatus === 'saved' && <><CheckCircle2 size={12} className="text-success me-1" /> <span className="text-muted">Saved to Drive</span></>}
              {saveStatus === 'saving' && <><Clock size={12} className="text-secondary me-1" /> <span className="text-muted">Saving...</span></>}
              {saveStatus === 'error' && <><CloudOff size={12} className="text-danger me-1" /> <span className="text-danger">Save failed</span></>}
            </div>
          </div>
        </div>

        <div className="d-none d-md-flex align-items-center">
           <UserPresence activeUsers={activeUsers} />
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            onClick={() => setShowVersionHistory(!showVersionHistory)}
            title="Version history"
            className={`btn btn-sm d-flex align-items-center justify-content-center p-2 rounded-circle ${showVersionHistory ? 'btn-primary' : 'btn-light'}`}
          >
            <History size={18} />
          </button>

          {isOwner && (
            <button onClick={() => setIsShareModalOpen(true)} className="btn btn-primary btn-sm d-flex align-items-center gap-2 px-3 fw-medium ms-2 rounded-pill">
              <Share2 size={16} /> <span className="d-none d-sm-inline">Share</span>
            </button>
          )}
          
          <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold ms-3" style={{ width: '36px', height: '36px' }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-grow-1 position-relative editor-layout">
        
        {/* Editor Area */}
        <div className="editor-content-area transition-all" style={{ marginRight: showVersionHistory ? '320px' : '0' }}>
          <EditorToolbar editor={editorInstance} />
          <Editor 
            documentId={id} 
            initialContent={document.content}
            onContentChange={handleContentChange}
            onEditorReady={setEditorInstance}
          />
        </div>

        {/* Version History Sidebar */}
        <div 
          className="bg-white border-start position-absolute end-0 top-0 bottom-0 shadow-sm d-flex flex-column transition-transform"
          style={{ width: '320px', zIndex: 10, transform: showVersionHistory ? 'translateX(0)' : 'translateX(100%)' }}
        >
          <div className="p-3 border-bottom d-flex align-items-center justify-content-between bg-light">
            <h6 className="mb-0 fw-bold d-flex align-items-center gap-2"><History size={16} className="text-primary" /> Version History</h6>
            <button className="btn-close" onClick={() => setShowVersionHistory(false)}></button>
          </div>
          
          <div className="p-3 border-bottom">
            <button onClick={handleManualSave} className="btn btn-outline-primary btn-sm w-100 fw-medium">Save new version</button>
          </div>

          <div className="flex-grow-1 overflow-auto p-3">
            {versions.length === 0 ? (
              <div className="text-center text-muted small fst-italic mt-3">No saved versions yet.</div>
            ) : (
              versions.map((v) => (
                <div key={v._id} className="card shadow-sm mb-3 border-0 bg-light">
                  <div className="card-body p-3">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <span className="badge bg-primary bg-opacity-10 text-primary border border-primary-subtle">{new Date(v.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h6 className="card-title fw-bold small text-truncate mb-1">{v.title || 'Untitled'}</h6>
                    <p className="card-text text-muted small d-flex align-items-center gap-2 mb-3" style={{ fontSize: '12px' }}>
                      <span className="bg-secondary text-white rounded-circle d-inline-flex justify-content-center align-items-center" style={{ width: '16px', height: '16px', fontSize: '9px' }}>
                        {v.editedBy.name.charAt(0)}
                      </span>
                      {v.editedBy.name}
                    </p>
                    <button onClick={() => restoreVersion(v._id)} className="btn btn-sm btn-white border w-100" style={{ fontSize: '12px' }}>
                      Restore version
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      <ShareModal 
        documentId={id}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </div>
  );
};

export default DocumentEditor;
