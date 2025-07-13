import React, { useMemo, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { useProgress } from '../contexts/ProgressContext';
import { useTheme } from '../contexts/ThemeContext';
import UserProfile from './UserProfile';
import ThemeToggle from './ThemeToggle';
import './Sidebar.css';

function Sidebar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const { currentUser } = useUser();
  const { userProgress } = useProgress();
  const { theme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if screen is mobile
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setIsMobileMenuOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [currentPath]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  const parts = [
    { id: 1, name: 'Part 1 - Mô tả tranh', icon: 'fas fa-image' },
    { id: 2, name: 'Part 2 - Hỏi đáp', icon: 'fas fa-question-circle' },
    { id: 3, name: 'Part 3 - Hội thoại', icon: 'fas fa-comments' },
    { id: 4, name: 'Part 4 - Bài nói', icon: 'fas fa-microphone' }
  ];

  // Tính toán số câu đã hoàn thành hôm nay
  const todayCompletedCount = useMemo(() => {
    if (!userProgress.completedSentences) return 0;
    
    const today = new Date().toISOString().split('T')[0];
    return Object.values(userProgress.completedSentences)
      .filter(item => item.completedAt && item.completedAt.startsWith(today))
      .length;
  }, [userProgress.completedSentences]);

  // Tính toán điểm trung bình
  const averageAccuracy = useMemo(() => {
    if (!userProgress.completedSentences) return 0;
    
    const accuracies = Object.values(userProgress.completedSentences)
      .map(item => item.accuracy);
    
    if (accuracies.length === 0) return 0;
    
    const sum = accuracies.reduce((total, acc) => total + acc, 0);
    return sum / accuracies.length;
  }, [userProgress.completedSentences]);

  return (
    <>
      {/* Mobile Header with Hamburger */}
      {isMobile && (
        <div className={`mobile-header ${theme}`}>
          <div className="mobile-logo">
            <Link to="/">
              <i className="fas fa-headphones"></i>
              <span>ENVYIU</span>
            </Link>
          </div>
          <button
            className={`hamburger-menu ${isMobileMenuOpen ? 'active' : ''}`}
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      )}

      {/* Mobile Overlay */}
      {isMobile && isMobileMenuOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <nav className={`sidebar ${theme} ${isMobile ? 'mobile' : ''} ${isMobileMenuOpen ? 'open' : ''}`}>
        {!isMobile && (
          <div className="logo">
            <h1><i className="fas fa-headphones"></i> envyiu</h1>
            <p>Luyện nghe chép chính tả</p>
          </div>
        )}

        {currentUser && <UserProfile />}

        <ul className="nav-menu">
          {parts.map(part => (
            <li key={part.id} className="nav-item">
              <Link
                to={`/practice/${part.id}/select`}
                className={`nav-link ${currentPath === `/practice/${part.id}/select` || currentPath === `/practice/${part.id}` ? 'active' : ''}`}
                data-part={part.id}
              >
                <i className={part.icon}></i>
                <span>{part.name}</span>
              </Link>
            </li>
          ))}
        </ul>

        {currentUser && (
          <>
            <div className="stats-card">
              <div className="stats-title">Tiến độ hôm nay</div>
              <div className="stats-value">{todayCompletedCount}</div>
            </div>

            <div className="stats-card">
              <div className="stats-title">Điểm trung bình</div>
              <div className="stats-value">
                {averageAccuracy > 0 ? `${averageAccuracy.toFixed(1)}%` : 'Chưa có'}
              </div>
            </div>
          </>
        )}

        <div className="sidebar-footer">
          {!isMobile && <ThemeToggle />}
        </div>
      </nav>
    </>
  );
}

export default Sidebar; 