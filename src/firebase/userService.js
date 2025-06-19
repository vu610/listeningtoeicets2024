import { auth, db } from './config';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';

// Tạo hoặc cập nhật thông tin người dùng
export const createOrUpdateUser = async (userId, userData) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      // Tạo người dùng mới
      await setDoc(userRef, {
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      // Cập nhật thông tin người dùng
      await updateDoc(userRef, {
        ...userData,
        updatedAt: serverTimestamp(),
      });
    }
    return true;
  } catch (error) {
    console.error("Lỗi khi tạo/cập nhật người dùng:", error);
    return false;
  }
};

// Lấy thông tin người dùng
export const getUserData = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error("Lỗi khi lấy thông tin người dùng:", error);
    return null;
  }
};

// Lưu tiến độ học tập của người dùng
export const saveUserProgress = async (userId, progress) => {
  try {
    const userProgressRef = doc(db, 'userProgress', userId);
    const progressDoc = await getDoc(userProgressRef);
    
    if (!progressDoc.exists()) {
      await setDoc(userProgressRef, {
        ...progress,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(userProgressRef, {
        ...progress,
        updatedAt: serverTimestamp(),
      });
    }
    return true;
  } catch (error) {
    console.error("Lỗi khi lưu tiến độ học tập:", error);
    return false;
  }
};

// Lấy tiến độ học tập của người dùng
export const getUserProgress = async (userId) => {
  try {
    const userProgressRef = doc(db, 'userProgress', userId);
    const progressDoc = await getDoc(userProgressRef);
    
    if (progressDoc.exists()) {
      return progressDoc.data();
    } else {
      return null;
    }
  } catch (error) {
    console.error("Lỗi khi lấy tiến độ học tập:", error);
    return null;
  }
}; 