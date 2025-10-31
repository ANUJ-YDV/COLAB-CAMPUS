// Example: How to use socket in ProjectBoard.jsx
// This demonstrates integrating socket events with the existing drag-and-drop functionality

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import axios from 'axios';
import { useSocket } from '../SocketContext';
import TaskCard from '../components/TaskCard';

export default function ProjectBoardWithSocket() {
  const [tasks, setTasks] = useState([]);
  const socket = useSocket(); // Get socket from context

  useEffect(() => {
    // Join the project room when component mounts
    if (socket) {
      const projectId = '1'; // Get from useParams() in real app

      console.log(`📡 Joining project room: ${projectId}`);
      socket.emit('join_project', { projectId });

      // Listen for task updates from other users
      socket.on('task_updated', (data) => {
        console.log('📩 Task updated by another user:', data);

        // Update local state with the change
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task._id === data.taskId ? { ...task, status: data.newStatus } : task
          )
        );
      });

      // Cleanup: leave room on unmount
      return () => {
        console.log(`🚪 Leaving project room: ${projectId}`);
        socket.emit('leave_project', { projectId });
        socket.off('task_updated');
      };
    }
  }, [socket]);

  // Load initial tasks
  useEffect(() => {
    const loadTasks = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/tasks/project/1', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTasks(response.data);
      } catch (err) {
        console.error('Error loading tasks:', err);
      }
    };
    loadTasks();
  }, []);

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const { draggableId, destination } = result;
    const newStatus = destination.droppableId;

    // Find the task
    const task = tasks.find((t) => t._id === draggableId);
    if (!task || task.status === newStatus) return;

    // Optimistic update
    setTasks((prevTasks) =>
      prevTasks.map((t) => (t._id === draggableId ? { ...t, status: newStatus } : t))
    );

    try {
      const token = localStorage.getItem('token');

      // Update via REST API
      await axios.put(
        `http://localhost:5000/api/tasks/${draggableId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Broadcast the change via socket to other users
      if (socket) {
        socket.emit('task_moved', {
          taskId: draggableId,
          oldStatus: task.status,
          newStatus: newStatus,
          projectId: '1', // Get from useParams()
        });
      }

      console.log('✅ Task updated successfully');
    } catch (err) {
      console.error('❌ Error updating task:', err);

      // Revert optimistic update on error
      setTasks((prevTasks) =>
        prevTasks.map((t) => (t._id === draggableId ? { ...t, status: task.status } : t))
      );
    }
  };

  const columns = {
    todo: tasks.filter((t) => t.status === 'todo'),
    'in-progress': tasks.filter((t) => t.status === 'in-progress'),
    done: tasks.filter((t) => t.status === 'done'),
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Project Board</h1>
        {socket && (
          <p className="text-sm text-green-600 mt-2">
            ✅ Real-time updates enabled (Socket ID: {socket.id})
          </p>
        )}
        {!socket && (
          <p className="text-sm text-orange-600 mt-2">
            ⚠️ Real-time updates disabled (not connected)
          </p>
        )}
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-3 gap-6">
          {['todo', 'in-progress', 'done'].map((columnId) => (
            <Droppable key={columnId} droppableId={columnId}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`bg-white p-4 rounded-lg shadow min-h-[500px] ${
                    snapshot.isDraggingOver ? 'bg-blue-50' : ''
                  }`}
                >
                  <h2 className="text-xl font-semibold mb-4 capitalize">
                    {columnId.replace('-', ' ')}
                    <span className="text-sm text-gray-500 ml-2">({columns[columnId].length})</span>
                  </h2>

                  {columns[columnId].map((task, index) => (
                    <Draggable key={task._id} draggableId={task._id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <TaskCard task={task} isDragging={snapshot.isDragging} />
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
  );
}
