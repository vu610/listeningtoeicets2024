import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

const parts = [
  { id: 1, name: 'Part 1 - Mô tả tranh', icon: 'fas fa-image' },
  { id: 2, name: 'Part 2 - Hỏi đáp', icon: 'fas fa-question-circle' },
  { id: 3, name: 'Part 3 - Hội thoại', icon: 'fas fa-comments' },
  { id: 4, name: 'Part 4 - Bài nói', icon: 'fas fa-microphone' }
];

function HomePage() {
  return (
    <div className="home-content">
      <div className="welcome-card">
        <h1>Luyện Nghe Chép Chính Tả TOEIC</h1>
        <p>Chọn phần bạn muốn luyện tập:</p>
        
        <div className="part-grid">
          {parts.map((part) => (
            <Link key={part.id} to={`/practice/${part.id}`} className="part-card">
              <i className={part.icon}></i>
              <h3>{part.name}</h3>
              <span className="part-card-arrow">
                <i className="fas fa-arrow-right"></i>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default HomePage;
