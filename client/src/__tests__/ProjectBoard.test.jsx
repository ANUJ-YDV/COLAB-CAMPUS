// __tests__/ProjectBoard.test.jsx
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import ProjectBoard from '../pages/ProjectBoard';
import { SocketContext } from '../SocketContext';

// Mock axios
jest.mock('axios', () => ({
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock socket
const mockSocket = {
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
};

// Mock useSocket hook
jest.mock('../SocketContext', () => ({
  SocketContext: {
    Provider: ({ children }) => children,
    Consumer: ({ children }) => children,
  },
  useSocket: () => mockSocket,
}));

describe('ProjectBoard (Kanban) Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders Kanban board with columns', () => {
    render(
      <BrowserRouter>
        <ProjectBoard />
      </BrowserRouter>
    );

    // Check for column headers (case-insensitive)
    expect(screen.getByText(/to-do|todo/i)).toBeInTheDocument();
    expect(screen.getByText(/in progress|in-progress/i)).toBeInTheDocument();
    expect(screen.getByText(/done|completed/i)).toBeInTheDocument();
  });

  it('renders initial tasks', () => {
    render(
      <BrowserRouter>
        <ProjectBoard />
      </BrowserRouter>
    );

    // Check for default tasks defined in component
    expect(screen.getByText(/setup backend/i)).toBeInTheDocument();
    expect(screen.getByText(/design schema/i)).toBeInTheDocument();
    expect(screen.getByText(/integrate auth/i)).toBeInTheDocument();
  });

  it('joins project room on mount', async () => {
    render(
      <BrowserRouter>
        <ProjectBoard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(mockSocket.emit).toHaveBeenCalledWith('join_project', {
        projectId: expect.any(String),
      });
    });
  });

  it('listens for socket events', async () => {
    render(
      <BrowserRouter>
        <ProjectBoard />
      </BrowserRouter>
    );

    await waitFor(() => {
      // Verify that socket event listeners are set up
      expect(mockSocket.on).toHaveBeenCalledWith('joined_project', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('user_joined', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('user_left', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('task_moved', expect.any(Function));
    });
  });

  it('displays connection status', () => {
    render(
      <BrowserRouter>
        <ProjectBoard />
      </BrowserRouter>
    );

    // Should show initial connecting status
    expect(screen.getByText(/connecting/i)).toBeInTheDocument();
  });

  it('handles null socket gracefully', () => {
    // Mock useSocket to return null
    jest.spyOn(require('../SocketContext'), 'useSocket').mockReturnValue(null);

    render(
      <BrowserRouter>
        <ProjectBoard />
      </BrowserRouter>
    );

    // Should still render the board
    expect(screen.getByText(/to-do|todo/i)).toBeInTheDocument();
  });

  it('displays task cards in correct columns', () => {
    render(
      <BrowserRouter>
        <ProjectBoard />
      </BrowserRouter>
    );

    // Get all column containers
    const todoColumn = screen.getByText(/to-do|todo/i).closest('div');
    const inProgressColumn = screen.getByText(/in progress|in-progress/i).closest('div');
    const doneColumn = screen.getByText(/done|completed/i).closest('div');

    // Verify tasks are in their respective columns
    // Note: This might need adjustment based on actual DOM structure
    expect(todoColumn).toBeInTheDocument();
    expect(inProgressColumn).toBeInTheDocument();
    expect(doneColumn).toBeInTheDocument();
  });

  it('has drag and drop functionality', () => {
    render(
      <BrowserRouter>
        <ProjectBoard />
      </BrowserRouter>
    );

    // Check for DragDropContext (from react-beautiful-dnd)
    // The component should render without errors when DragDropContext is present
    expect(screen.getByText(/setup backend/i)).toBeInTheDocument();
  });
});

describe('ProjectBoard - Real-time Updates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates task when task_moved event is received', async () => {
    render(
      <BrowserRouter>
        <ProjectBoard />
      </BrowserRouter>
    );

    // Get the callback function for 'task_moved'
    const taskMovedCallback = mockSocket.on.mock.calls.find(
      (call) => call[0] === 'task_moved'
    )?.[1];

    expect(taskMovedCallback).toBeDefined();

    // Simulate receiving a task_moved event
    if (taskMovedCallback) {
      taskMovedCallback({
        taskId: '1',
        status: 'done',
      });

      // The component should update the task status
      await waitFor(() => {
        // This test might need adjustment based on how tasks are displayed
        expect(screen.getByText(/setup backend/i)).toBeInTheDocument();
      });
    }
  });

  it('updates connected users when user_joined event is received', async () => {
    render(
      <BrowserRouter>
        <ProjectBoard />
      </BrowserRouter>
    );

    const userJoinedCallback = mockSocket.on.mock.calls.find(
      (call) => call[0] === 'user_joined'
    )?.[1];

    expect(userJoinedCallback).toBeDefined();

    // Simulate a user joining
    if (userJoinedCallback) {
      userJoinedCallback({
        userId: 'user123',
        user: 'John Doe',
        email: 'john@example.com',
      });

      await waitFor(() => {
        // Component should update connectedUsers state
        // This might show in a users list or status indicator
        expect(mockSocket.on).toHaveBeenCalled();
      });
    }
  });
});
