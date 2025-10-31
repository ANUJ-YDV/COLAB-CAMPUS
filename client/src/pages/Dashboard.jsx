import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../SocketContext';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const navigate = useNavigate();
  const { socket, onlineUsers } = useSocket();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      navigate('/login');
      return;
    }

    setUser(JSON.parse(userData));
    loadProjects();
  }, [navigate]);

  const loadProjects = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:5000/api/projects', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // API returns projects array directly, not wrapped in {projects: [...]}
        setProjects(Array.isArray(data) ? data : []);
        console.log('✅ Loaded projects:', data);
      } else {
        console.error('Failed to load projects:', response.status);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
    window.location.reload();
  };

  const handleCreateProject = async () => {
    const projectName = prompt('Enter project name:');
    if (!projectName || !projectName.trim()) return;

    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:5000/api/projects', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: projectName.trim(), description: 'New project' })
      });

      if (response.ok) {
        const newProject = await response.json();
        console.log('✅ Project created:', newProject);
        alert(`Project "${newProject.name}" created successfully!`);
        // Reload projects to show the new one
        await loadProjects();
      } else {
        const error = await response.json();
        alert(`Failed to create project: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project. Check console for details.');
    }
  };

  if (!user) {
    return <div className="text-center p-4">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-600 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">COLAB CAMPUS</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/messages')}
              className="bg-purple-500 px-4 py-2 rounded hover:bg-purple-600 flex items-center gap-2"
            >
              💬 Messages
            </button>
            <span className="text-sm">Welcome, {user.name}!</span>
            {socket && (
              <span className="text-xs bg-green-500 px-2 py-1 rounded">
                🟢 Online ({onlineUsers.length})
              </span>
            )}
            <button
              onClick={handleLogout}
              className="bg-red-500 px-4 py-2 rounded hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto p-6">
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Your Projects</h2>
            <button
              onClick={handleCreateProject}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              + New Project
            </button>
          </div>

          {projects.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-4">No projects yet. Create your first project!</p>
              <button
                onClick={handleCreateProject}
                className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700"
              >
                Create First Project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <div
                  key={project._id}
                  className="border rounded-lg p-4 hover:shadow-lg cursor-pointer transition"
                  onClick={() => navigate(`/project/${project._id}`)}
                >
                  <h3 className="font-bold text-lg mb-2">{project.name}</h3>
                  <p className="text-gray-600 text-sm">{project.description}</p>
                  <div className="mt-4 text-xs text-gray-500">
                    Created: {new Date(project.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold mb-4">User Information</h3>
          <div className="space-y-2">
            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>User ID:</strong> {user.id}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
