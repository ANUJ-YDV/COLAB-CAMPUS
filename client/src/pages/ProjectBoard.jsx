import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import axios from "axios";
import { useSocket } from "../SocketContext";
import TaskCard from "../components/TaskCard";
import ProjectChat from "../components/ProjectChat";

export default function ProjectBoard() {
  // Get socket from context
  const socket = useSocket();
  
  // TODO: Get projectId from URL params (e.g., useParams from react-router)
  // For now, using a hardcoded project ID
  const projectId = "6900ebd4a6305efc84cffebc"; // Demo Project
  
  const [tasks, setTasks] = useState([
    { _id: "1", title: "Setup backend", status: "todo" },
    { _id: "2", title: "Design schema", status: "in-progress" },
    { _id: "3", title: "Integrate auth", status: "done" },
  ]);

  const [connectedUsers, setConnectedUsers] = useState([]);
  const [roomStatus, setRoomStatus] = useState("Connecting...");

  const columns = ["todo", "in-progress", "done"];

  // Join project room on mount
  useEffect(() => {
    if (!socket) {
      console.log("⏳ Waiting for socket connection...");
      return;
    }

    console.log("🔌 Socket connected, joining project room:", projectId);
    
    // Join the project room
    socket.emit("join_project", { projectId });

    // Listen for room events
    socket.on("joined_project", (data) => {
      console.log("✅ Joined project room:", data.projectName || data.projectId);
      setRoomStatus(`Connected to ${data.projectName || "project"}`);
    });

    socket.on("user_joined", (data) => {
      console.log(`👤 ${data.user} (${data.email}) joined this project`);
      setConnectedUsers((prev) => [...prev, { userId: data.userId, name: data.user, email: data.email }]);
      
      // Optional: Show a toast notification
      // toast.success(`${data.user} joined the project`);
    });

    socket.on("user_left", (data) => {
      console.log(`🚪 ${data.user} left this project`);
      setConnectedUsers((prev) => prev.filter((u) => u.userId !== data.userId));
      
      // Optional: Show a toast notification
      // toast.info(`${data.user} left the project`);
    });

    socket.on("error_message", (err) => {
      console.error("❌ Project room error:", err.message);
      setRoomStatus(`Error: ${err.message}`);
    });

    // Listen for real-time task updates from other users
    socket.on("task_moved", (data) => {
      console.log(`📥 Task moved by another user:`, data);
      
      // Update local state with the new task status
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task._id === data.taskId
            ? { ...task, status: data.status }
            : task
        )
      );
    });

    // Cleanup: Leave room on unmount
    return () => {
      console.log("🚪 Leaving project room:", projectId);
      socket.emit("leave_project", { projectId });
      
      // Clean up listeners
      socket.off("joined_project");
      socket.off("user_joined");
      socket.off("user_left");
      socket.off("error_message");
      socket.off("task_moved");
    };
  }, [socket, projectId]);

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    // Optimistic UI update
    const updatedTasks = tasks.map((task) =>
      task._id === draggableId ? { ...task, status: destination.droppableId } : task
    );

    setTasks(updatedTasks);

    // Sync with backend and broadcast to other users
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/tasks/${draggableId}`,
        { 
          status: destination.droppableId,
          projectId: projectId  // Include projectId for Socket.io broadcasting
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      console.log('✅ Task status updated and broadcasted to room');
    } catch (err) {
      console.error("Failed to update task", err);
      
      // Revert optimistic update on error
      setTasks(tasks);
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Project Kanban Board</h1>
        
        {/* Room Status Indicator */}
        <div className="mt-2 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${socket ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Kanban Board - Takes 3 columns */}
        <div className="lg:col-span-3">
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {columns.map((col) => (
                <Droppable droppableId={col} key={col}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="bg-white rounded-xl shadow p-4 min-h-[60vh]"
                    >
                      <h2 className="font-semibold text-lg mb-4 capitalize">{col.replace("-", " ")}</h2>
                      {tasks
                        .filter((task) => task.status === col)
                        .map((task, index) => (
                          <Draggable key={task._id} draggableId={task._id} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
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
    </div>
  );
}
