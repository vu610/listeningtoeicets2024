import React from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import UserLogin from '../components/UserLogin';
import './HomePage.css';

const parts = [
  { id: 1, name: 'Part 1 - Mô tả tranh', icon: 'fas fa-image' },
  { id: 2, name: 'Part 2 - Hỏi đáp', icon: 'fas fa-question-circle' },
  { id: 3, name: 'Part 3 - Hội thoại', icon: 'fas fa-comments' },
  { id: 4, name: 'Part 4 - Bài nói', icon: 'fas fa-microphone' }
];

function HomePage() {
  const { currentUser, loading } = useUser();

  if (loading) {
    return (
      <div className="home-content loading">
        <div className="loading-spinner"></div>
        <p>Đang tải...</p>
      </div>
    );
  }

  // Nếu chưa đăng nhập, hiển thị màn hình đăng nhập
  if (!currentUser) {
    return <UserLogin />;
  }

  return (
    <div className="home-content">
      <div className="welcome-card">
        <h1>Xin chào, {currentUser.displayName}!</h1>
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
