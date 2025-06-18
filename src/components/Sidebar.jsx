import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

function Sidebar() {
  const location = useLocation();
  const currentPath = location.pathname;
  
  const parts = [
    { id: 1, name: 'Part 1 - Mô tả tranh', icon: 'fas fa-image' },
    { id: 2, name: 'Part 2 - Hỏi đáp', icon: 'fas fa-question-circle' },
    { id: 3, name: 'Part 3 - Hội thoại', icon: 'fas fa-comments' },
    { id: 4, name: 'Part 4 - Bài nói', icon: 'fas fa-microphone' }
  ];

  return (
    <nav className="sidebar">
      <div className="logo">
        <h1><i className="fas fa-headphones"></i> TOEIC Pro</h1>
        <p>Luyện nghe chép chính tả</p>
      </div>
      
      <ul className="nav-menu">
        {parts.map(part => (
          <li key={part.id} className="nav-item">
            <Link 
              to={`/practice/${part.id}`} 
              className={`nav-link ${currentPath === `/practice/${part.id}` ? 'active' : ''}`}
              data-part={part.id}
            >
              <i className={part.icon}></i>
              <span>{part.name}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="stats-card">
        <div className="stats-title">Tiến độ hôm nay</div>
        <div className="stats-value">12/20</div>
      </div>

      <div className="stats-card">
        <div className="stats-title">Điểm trung bình</div>
        <div className="stats-value">85%</div>
      </div>
    </nav>
  );
}

export default Sidebar; 