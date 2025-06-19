import React, { createContext, useState, useEffect, useContext } from 'react';
import { getUserData, createOrUpdateUser } from '../firebase/userService';

// Tạo context
export const UserContext = createContext();

// Hook để sử dụng context
export const useUser = () => useContext(UserContext);

// Provider component
export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Đăng nhập bằng tên người dùng
  const loginWithUsername = async (username) => {
    try {
      setLoading(true);
      setError(null);
      
      // Kiểm tra tên người dùng hợp lệ
      if (!username || username.trim() === '') {
        throw new Error('Tên người dùng không được để trống');
      }
      
      // Tạo ID người dùng từ tên người dùng (đơn giản hóa)
      const userId = username.toLowerCase().replace(/\s+/g, '_');
      
      // Lấy thông tin người dùng hoặc tạo mới
      let userData = await getUserData(userId);
      
      if (!userData) {
        // Tạo người dùng mới
        const success = await createOrUpdateUser(userId, {
          username: username,
          displayName: username,
        });
        
        if (success) {
          userData = {
            id: userId,
            username: username,
            displayName: username,
          };
        } else {
          throw new Error('Không thể tạo người dùng mới');
        }
      }
      
      // Lưu thông tin người dùng vào localStorage
      localStorage.setItem('currentUser', JSON.stringify(userData));
      
      // Cập nhật state
      setCurrentUser(userData);
      return userData;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Đăng xuất
  const logout = () => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
  };

  // Kiểm tra người dùng đã đăng nhập khi khởi động
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setCurrentUser(userData);
      } catch (err) {
        console.error('Lỗi khi phân tích dữ liệu người dùng:', err);
        localStorage.removeItem('currentUser');
      }
    }
    setLoading(false);
  }, []);

  // Giá trị context
  const value = {
    currentUser,
    loading,
    error,
    loginWithUsername,
    logout,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}; 