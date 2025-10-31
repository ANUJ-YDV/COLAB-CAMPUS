import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SocketProvider } from './SocketContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import ProjectBoard from './pages/ProjectBoard';
import SocketTest from './pages/SocketTest';
import DocumentEditor from './pages/DocumentEditor';
import Messages from './pages/Messages';

function App() {
  return (
    <SocketProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/project/:id" element={<ProjectBoard />} />
          <Route path="/project/:projectId/document" element={<DocumentEditor />} />
          <Route path="/socket-test" element={<SocketTest />} />
        </Routes>
      </Router>
    </SocketProvider>
  );
}

export default App;
