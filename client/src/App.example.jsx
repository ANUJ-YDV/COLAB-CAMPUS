// Example: How to integrate SocketProvider in your main App
// This shows how to wrap your app with the SocketProvider for global socket access

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SocketProvider } from './SocketContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import ProjectBoard from './pages/ProjectBoard';

export default function App() {
  return (
    <Router>
      <SocketProvider>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/project/:id" element={<ProjectBoard />} />
        </Routes>
      </SocketProvider>
    </Router>
  );
}
