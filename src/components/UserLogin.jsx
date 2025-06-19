import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import './UserLogin.css';

function UserLogin({ onLoginSuccess }) {
  const { loginWithUsername, error } = useUser();
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setLocalError('Vui lòng nhập tên của bạn');
      return;
    }
    
    setIsLoading(true);
    setLocalError('');
    
    try {
      const user = await loginWithUsername(username);
      if (user) {
        if (onLoginSuccess) {
          onLoginSuccess(user);
        }
      } else {
        setLocalError('Đăng nhập không thành công. Vui lòng thử lại.');
      }
    } catch (err) {
      setLocalError(err.message || 'Đã xảy ra lỗi. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="user-login-container">
      <div className="user-login-card">
        <h2>Chào mừng bạn!</h2>
        <p>Nhập tên của bạn để bắt đầu học tập</p>
        
        <form onSubmit={handleSubmit} className="user-login-form">
          <div className="form-group">
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập tên của bạn"
              autoComplete="name"
              disabled={isLoading}
              className="user-login-input"
            />
          </div>
          
          {(localError || error) && (
            <div className="error-message">
              {localError || error}
            </div>
          )}
          
          <button 
            type="submit" 
            className="user-login-button" 
            disabled={isLoading}
          >
            {isLoading ? 'Đang xử lý...' : 'Bắt đầu học'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default UserLogin; 