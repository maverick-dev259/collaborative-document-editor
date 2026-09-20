import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, LayoutGrid, List as ListIcon, FileText } from 'lucide-react';
import API from '../services/api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import DocumentCard from '../components/DocumentCard';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    setLoading(true);
    const debounceTimeout = setTimeout(async () => {
      try {
        const { data } = await API.get('/documents', { params: { filter, search } });
        setDocuments(data);
      } catch (error) {
        console.error('Failed to fetch documents', error);
      } finally {
        setLoading(false);
      }
    }, search ? 300 : 0);
    return () => clearTimeout(debounceTimeout);
  }, [filter, search]);

  const handleCreateDocument = async () => {
    try {
      setCreating(true);
      const { data } = await API.post('/documents', { title: 'Untitled Document' });
      navigate(`/document/${data._id}`);
    } catch (error) {
      alert('Failed to create document');
      setCreating(false);
    }
  };

  const handleDeleteDocument = async (id) => {
    if (!window.confirm('Are you sure you want to move this document to trash?')) return;
    try {
      await API.delete(`/documents/${id}`);
      setDocuments(documents.filter(doc => doc._id !== id));
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete');
    }
  };

  const getPageTitle = () => {
    if (search) return `Search results for "${search}"`;
    switch (filter) {
      case 'my': return 'My Documents';
      case 'shared': return 'Shared with me';
      case 'trash': return 'Trash';
      default: return 'Recent Documents';
    }
  };

  return (
    <>
      <Navbar onSearch={setSearch} />
      
      <div className="dashboard-layout bg-white">
        <Sidebar filter={filter} setFilter={setFilter} />
        
        <main className="flex-grow-1 overflow-auto p-4 p-md-5">
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-4 gap-3">
            <div>
              {!search && (
                <h4 className="fw-bold text-dark mb-1">
                  Good morning, {user?.name?.split(' ')[0]} 👋
                </h4>
              )}
              <div className="text-secondary fw-medium">{getPageTitle()}</div>
            </div>
            
            <div className="d-flex align-items-center gap-3">
              <div className="btn-group border rounded bg-light p-1">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`btn btn-sm ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'btn-light border-0'}`}
                >
                  <LayoutGrid size={16} />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`btn btn-sm ${viewMode === 'list' ? 'bg-white shadow-sm' : 'btn-light border-0'}`}
                >
                  <ListIcon size={16} />
                </button>
              </div>
              
              <button
                onClick={handleCreateDocument}
                disabled={creating}
                className="btn btn-primary d-flex align-items-center gap-2 px-3 fw-medium"
              >
                {creating ? <span className="spinner-border spinner-border-sm" /> : <Plus size={18} />}
                <span className="d-none d-sm-inline">New Document</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : documents.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 row-cols-xl-4 g-4">
                {documents.map((doc) => (
                  <DocumentCard key={doc._id} document={doc} onDelete={handleDeleteDocument} viewMode="grid" />
                ))}
              </div>
            ) : (
              <div className="list-group list-group-flush border rounded shadow-sm">
                {documents.map((doc) => (
                  <DocumentCard key={doc._id} document={doc} onDelete={handleDeleteDocument} viewMode="list" />
                ))}
              </div>
            )
          ) : (
            <div className="text-center py-5 my-5">
              <FileText size={48} className="text-muted mb-3" />
              <h5 className="fw-bold">No documents found</h5>
              <p className="text-muted mb-4 max-w-md mx-auto">
                {search ? "We couldn't find anything matching your search." : "Your workspace is empty. Get started by creating your first document."}
              </p>
              {!search && (filter === 'all' || filter === 'my') && (
                <button onClick={handleCreateDocument} className="btn btn-primary px-4 fw-medium">
                  <Plus size={18} className="me-2"/> Create Document
                </button>
              )}
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default Dashboard;
