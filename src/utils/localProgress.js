export const saveProgressLocal = (userId, progress) => {
  try {
    const key = `progress_${userId}`;
    localStorage.setItem(key, JSON.stringify(progress));
    return true;
  } catch (err) {
    console.error('Lỗi khi lưu tiến độ local:', err);
    return false;
  }
};

export const getProgressLocal = (userId) => {
  try {
    const key = `progress_${userId}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error('Lỗi khi lấy tiến độ local:', err);
    return null;
  }
};
