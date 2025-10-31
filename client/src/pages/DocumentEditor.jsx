/**
 * DocumentEditor Page
 * Wrapper page for collaborative document editing
 */
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
// import RichCollaborativeEditor from '../components/RichCollaborativeEditor'; // Advanced version
// import CollaborativeEditor from '../components/CollaborativeEditor'; // Feature-rich version
import SimpleCollaborativeEditor from '../components/SimpleCollaborativeEditor'; // Reference pattern

export default function DocumentEditor() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProject = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:5000/api/projects/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setProject(response.data);
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading project:', err);
        setIsLoading(false);
        // Redirect to dashboard if project not found
        navigate('/dashboard');
      }
    };

    if (projectId) {
      loadProject();
    }
  }, [projectId, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Project Not Found</h2>
          <p className="text-gray-600 mb-4">The project you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Back Button */}
      <button
        onClick={() => navigate(`/project/${projectId}`)}
        className="absolute top-4 left-4 z-50 px-4 py-2 bg-white border border-gray-300 rounded shadow hover:bg-gray-50 transition flex items-center space-x-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
        <span>Back to Project</span>
      </button>

      {/* Collaborative Editor - Using Simple Reference Pattern */}
      <SimpleCollaborativeEditor projectId={projectId} projectName={project.name} />

      {/* Other versions available: */}
      {/* <RichCollaborativeEditor projectId={projectId} projectName={project.name} /> */}
      {/* <CollaborativeEditor projectId={projectId} projectName={project.name} /> */}
    </div>
  );
}
