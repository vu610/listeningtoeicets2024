import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import PracticePage from './pages/PracticePage';
import Sidebar from './components/Sidebar';
import { UserProvider } from './contexts/UserContext';
import { ProgressProvider } from './contexts/ProgressContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './components/ui/Toast';
import './App.css';

function App() {
  return (
    <UserProvider>
      <ProgressProvider>
        <ThemeProvider>
          <ToastProvider>
            <div className="container">
              <Sidebar />
              <main className="main-content">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/practice/:partId" element={<PracticePage />} />
                  <Route path="/practice/:partId/select" element={<PracticePage key="select-test" initialSelectMode={true} />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
            </div>
          </ToastProvider>
        </ThemeProvider>
      </ProgressProvider>
    </UserProvider>
  );
}

export default App;
