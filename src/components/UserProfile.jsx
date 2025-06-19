import React from 'react';
import { useUser } from '../contexts/UserContext';
import './UserProfile.css';

function UserProfile() {
  const { currentUser, logout } = useUser();

  if (!currentUser) {
    return null;
  }

  return (
    <div className="user-profile">
      <div className="user-info">
        <div className="user-avatar">
          {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : '?'}
        </div>
        <div className="user-name">
          {currentUser.displayName || 'Người dùng'}
        </div>
      </div>
      <button className="logout-button" onClick={logout}>
        <i className="fas fa-sign-out-alt"></i>
        Đăng xuất
      </button>
    </div>
  );
}

export default UserProfile; 