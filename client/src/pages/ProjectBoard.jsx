import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import axios from 'axios';
import { useSocket } from '../SocketContext';
import TaskCard from '../components/TaskCard';
import ProjectChat from '../components/ProjectChat';
import FileUpload from '../components/FileUpload';
import FileList from '../components/FileList';

export default function ProjectBoard() {
  // Get socket from context (returns {socket, onlineUsers, typingUsers})
  const { socket } = useSocket();
  
  // Get projectId from URL params
  const { id: projectId } = useParams();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  const [connectedUsers, setConnectedUsers] = useState([]);
  const [roomStatus, setRoomStatus] = useState('Connecting...');
  const [showFilesModal, setShowFilesModal] = useState(false);
  const [refreshFiles, setRefreshFiles] = useState(0);
  const [exportingProject, setExportingProject] = useState(false);

  const columns = ['todo', 'in-progress', 'done'];

  // Load project and tasks from API
  useEffect(() => {
    const loadProjectData = async () => {
      if (!projectId) {
        navigate('/dashboard');
        return;
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        // Load project details
        const projectResponse = await axios.get(
          `http://localhost:5000/api/projects/${projectId}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        setProject(projectResponse.data);

        // Load project tasks
        const tasksResponse = await axios.get(
          `http://localhost:5000/api/tasks/project/${projectId}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        setTasks(tasksResponse.data.tasks || []);
        setLoading(false);
      } catch (error) {
        console.error('Error loading project:', error);
        if (error.response?.status === 401) {
          navigate('/login');
        } else if (error.response?.status === 403 || error.response?.status === 404) {
          alert('Project not found or access denied');
          navigate('/dashboard');
        }
        setLoading(false);
      }
    };

    loadProjectData();
  }, [projectId, navigate]);

  // Join project room on mount
  useEffect(() => {
    if (!socket) {
      console.log('⏳ Waiting for socket connection...');
      return;
    }

    console.log('🔌 Socket connected, joining project room:', projectId);

    // Join the project room
    socket.emit('join_project', { projectId });

    // Listen for room events
    socket.on('joined_project', (data) => {
      console.log('✅ Joined project room:', data.projectName || data.projectId);
      setRoomStatus(`Connected to ${data.projectName || 'project'}`);
    });

    socket.on('user_joined', (data) => {
      console.log(`👤 ${data.user} (${data.email}) joined this project`);
      setConnectedUsers((prev) => [
        ...prev,
        { userId: data.userId, name: data.user, email: data.email },
      ]);

      // Optional: Show a toast notification
      // toast.success(`${data.user} joined the project`);
    });

    socket.on('user_left', (data) => {
      console.log(`🚪 ${data.user} left this project`);
      setConnectedUsers((prev) => prev.filter((u) => u.userId !== data.userId));

      // Optional: Show a toast notification
      // toast.info(`${data.user} left the project`);
    });

    socket.on('error_message', (err) => {
      console.error('❌ Project room error:', err.message);
      setRoomStatus(`Error: ${err.message}`);
    });

    // Listen for real-time task updates from other users
    socket.on('task_moved', (data) => {
      console.log(`📥 Task moved by another user:`, data);

      // Update local state with the new task status
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task._id === data.taskId ? { ...task, status: data.status } : task
        )
      );
    });

    // Cleanup: Leave room on unmount
    return () => {
      console.log('🚪 Leaving project room:', projectId);
      socket.emit('leave_project', { projectId });

      // Clean up listeners
      socket.off('joined_project');
      socket.off('user_joined');
      socket.off('user_left');
      socket.off('error_message');
      socket.off('task_moved');
    };
  }, [socket, projectId]);

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    
    // Validate drag result
    if (!destination) {
      console.log('❌ Drag cancelled - no destination');
      return;
    }
    
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      console.log('❌ Drag cancelled - same position');
      return;
    }

    console.log('✅ Task dragged:', { draggableId, from: source.droppableId, to: destination.droppableId });

    // Optimistic UI update
    const updatedTasks = tasks.map((task) =>
      String(task._id) === String(draggableId) ? { ...task, status: destination.droppableId } : task
    );

    setTasks(updatedTasks);

    // Sync with backend and broadcast to other users
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/tasks/${draggableId}`,
        {
          status: destination.droppableId,
          projectId: projectId, // Include projectId for Socket.io broadcasting
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log('✅ Task status updated and broadcasted to room');
    } catch (err) {
      console.error('Failed to update task', err);

      // Revert optimistic update on error
      setTasks(tasks);
    }
  };

  const handleCreateTask = async () => {
    const title = prompt('Enter task title:');
    if (!title) return;

    const description = prompt('Enter task description (optional):');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/tasks/create',
        {
          title,
          description: description || '',
          projectId,
          status: 'todo'
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setTasks([...tasks, response.data.task]);
      alert('Task created successfully!');
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task');
    }
  };

  const handleExportProject = async () => {
    try {
      setExportingProject(true);
      const token = localStorage.getItem('token');
      if (!token) {
        alert('You must be logged in to export the project.');
        setExportingProject(false);
        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/upload/export/project/${projectId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        let message = 'Failed to export project';
        try {
          const parsed = JSON.parse(errorText);
          message = parsed.error || parsed.message || message;
        } catch (parseErr) {
          if (errorText) {
            message = errorText;
          }
        }
        throw new Error(message);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const safeName = (project?.name || 'project').replace(/[^a-zA-Z0-9._-]/g, '_');
      link.href = url;
      link.download = `${safeName}-export.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      alert('✅ Project archive downloaded successfully!');
    } catch (error) {
      console.error('Project export error:', error);
      alert(error.message || 'Failed to export project. Please try again.');
    } finally {
      setExportingProject(false);
    }
  };

  const handleDeleteProject = async () => {
    const confirmDelete = window.confirm(
      `⚠️ Are you sure you want to delete "${project.name}"?\n\nThis will permanently delete:\n- The project\n- All tasks (${tasks.length})\n- All messages\n- All documents\n\nThis action cannot be undone!`
    );

    if (!confirmDelete) return;

    // Double confirmation for safety
    const confirmAgain = window.confirm(
      `🚨 FINAL CONFIRMATION\n\nType "DELETE" in the next prompt to confirm deletion of "${project.name}"`
    );

    if (!confirmAgain) return;

    const userInput = prompt('Type "DELETE" to confirm:');
    if (userInput !== 'DELETE') {
      alert('Project deletion cancelled. You must type "DELETE" exactly.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `http://localhost:5000/api/projects/${projectId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      alert(`Project "${project.name}" has been deleted successfully.`);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error deleting project:', error);
      if (error.response?.status === 403) {
        alert('Access denied. Only the project owner can delete this project.');
      } else {
        alert('Failed to delete project. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Project Not Found</h2>
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
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-blue-600 hover:underline mb-2 flex items-center gap-2"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            {project.description && (
              <p className="text-gray-600 mt-1">{project.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreateTask}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              + New Task
            </button>
            <button
              onClick={() => setShowFilesModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              📁 Files
            </button>
            <button
              onClick={handleExportProject}
              disabled={exportingProject}
              className="bg-amber-500 text-white px-4 py-2 rounded hover:bg-amber-600 disabled:bg-amber-200 disabled:cursor-not-allowed"
            >
              {exportingProject ? '⏳ Exporting...' : '📦 Share Project'}
            </button>
            <button
              onClick={() => navigate(`/project/${projectId}/document`)}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              📝 Documents
            </button>
            <button
              onClick={handleDeleteProject}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 flex items-center gap-2"
              title="Delete this project permanently"
            >
              🗑️ Delete Project
            </button>
          </div>
        </div>

        {/* Room Status Indicator */}
        <div className="mt-2 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${socket ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}
            ></div>
            <span className="text-sm text-gray-600">{roomStatus}</span>
          </div>

          {/* Connected Users Indicator */}
          {connectedUsers.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                👥 {connectedUsers.length} other user{connectedUsers.length !== 1 ? 's' : ''} online
              </span>
            </div>
          )}
        </div>
        
        {tasks.length === 0 && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-4">
            No tasks yet. Click "+ New Task" to create your first task.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Kanban Board - Takes 3 columns */}
        <div className="lg:col-span-3">
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {columns.map((col) => (
                <Droppable droppableId={col} key={col}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`bg-white rounded-xl shadow p-4 min-h-[60vh] transition-colors ${
                        snapshot.isDraggingOver ? 'bg-blue-50' : ''
                      }`}
                    >
                      <h2 className="font-semibold text-lg mb-4 capitalize">
                        {col.replace('-', ' ')}
                        {' '}
                        <span className="text-sm text-gray-500">
                          ({tasks.filter((task) => task.status === col).length})
                        </span>
                      </h2>
                      {tasks
                        .filter((task) => task.status === col)
                        .map((task, index) => (
                          <Draggable 
                            key={task._id} 
                            draggableId={String(task._id)} 
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={snapshot.isDragging ? 'opacity-50' : ''}
                              >
                                <TaskCard task={task} />
                              </div>
                            )}
                          </Draggable>
                        ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              ))}
            </div>
          </DragDropContext>
        </div>

        {/* Chat Panel - Takes 1 column */}
        <div className="lg:col-span-1">
          <div className="sticky top-8">
            <ProjectChat socket={socket} projectId={projectId} />
          </div>
        </div>
      </div>

      {/* Files Modal */}
      {showFilesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                📁 Project Files
              </h2>
              <button
                onClick={() => setShowFilesModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upload Section */}
                <div>
                  <FileUpload
                    projectId={projectId}
                    onUploadComplete={() => setRefreshFiles(prev => prev + 1)}
                  />
                </div>

                {/* Files List Section */}
                <div>
                  <FileList key={refreshFiles} projectId={projectId} />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end p-6 border-t border-gray-200">
              <button
                onClick={() => setShowFilesModal(false)}
                className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
