// File cấu hình ứng dụng
// Không sử dụng Firebase nữa, chỉ lưu trữ cục bộ

// Các khóa localStorage
export const STORAGE_KEYS = {
  USER_DATA: 'userData',
  USER_PROGRESS: 'userProgress',
  CURRENT_USER: 'currentUser'
};

// Các cấu hình khác của ứng dụng
export const APP_CONFIG = {
  appName: 'TOEIC Dictation App',
  version: '1.0.0',
  storageType: 'localStorage'
}; 