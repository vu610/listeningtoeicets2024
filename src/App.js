import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import PracticePage from './pages/PracticePage';
import Sidebar from './components/Sidebar';
import './App.css';

function App() {
  return (
    <div className="container">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/practice/:partId" element={<PracticePage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
