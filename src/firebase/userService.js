// Dịch vụ quản lý người dùng và tiến độ học tập sử dụng localStorage
// Không sử dụng Firebase để lưu trữ dữ liệu
import { STORAGE_KEYS } from './config';

// Lưu dữ liệu người dùng
export const createOrUpdateUser = async (userId, userData) => {
  try {
    // Lấy dữ liệu hiện tại
    const allUserData = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_DATA) || '{}');
    
    // Cập nhật dữ liệu người dùng
    allUserData[userId] = {
      ...userData,
      updatedAt: new Date().toISOString()
    };
    
    // Lưu lại vào localStorage
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(allUserData));
    return true;
  } catch (error) {
    console.error("Lỗi khi lưu thông tin người dùng:", error);
    return false;
  }
};

// Lấy thông tin người dùng
export const getUserData = async (userId) => {
  try {
    const allUserData = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_DATA) || '{}');
    const userData = allUserData[userId];
    
    if (userData) {
      return { id: userId, ...userData };
    } else {
      return null;
    }
  } catch (error) {
    console.error("Lỗi khi đọc thông tin người dùng:", error);
    return null;
  }
};

// Lưu tiến độ học tập
export const saveUserProgress = async (userId, progress) => {
  try {
    // Lấy dữ liệu tiến độ hiện tại
    const allProgress = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_PROGRESS) || '{}');
    
    // Cập nhật tiến độ người dùng
    allProgress[userId] = {
      ...progress,
      updatedAt: new Date().toISOString()
    };
    
    // Lưu lại vào localStorage
    localStorage.setItem(STORAGE_KEYS.USER_PROGRESS, JSON.stringify(allProgress));
    return true;
  } catch (error) {
    console.error("Lỗi khi lưu tiến độ học tập:", error);
    return false;
  }
};

// Lấy tiến độ học tập
export const getUserProgress = async (userId) => {
  try {
    const allProgress = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_PROGRESS) || '{}');
    return allProgress[userId] || null;
  } catch (error) {
    console.error("Lỗi khi đọc tiến độ học tập:", error);
    return null;
  }
}; 