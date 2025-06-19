import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import PracticePage from './pages/PracticePage';
import Sidebar from './components/Sidebar';
import { UserProvider } from './contexts/UserContext';
import { ProgressProvider } from './contexts/ProgressContext';
import './App.css';

function App() {
  return (
    <UserProvider>
      <ProgressProvider>
        <div className="container">
          <Sidebar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/practice/:partId" element={<PracticePage />} />
            </Routes>
          </main>
        </div>
      </ProgressProvider>
    </UserProvider>
  );
}

export default App;
