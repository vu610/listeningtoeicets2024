import React, { createContext, useState, useEffect, useContext } from 'react';
import { useUser } from './UserContext';
import { getUserProgress, saveUserProgress } from '../firebase/userService';
import { getProgressLocal, saveProgressLocal } from '../utils/localProgress';

// Tạo context
export const ProgressContext = createContext();

// Hook để sử dụng context
export const useProgress = () => useContext(ProgressContext);

// Provider component
export const ProgressProvider = ({ children }) => {
  const { currentUser } = useUser();
  const [userProgress, setUserProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Lấy tiến độ học tập khi người dùng đăng nhập
  useEffect(() => {
    const fetchUserProgress = async () => {
      if (!currentUser) {
        setUserProgress({});
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const progress = await getUserProgress(currentUser.id);
        if (progress) {
          setUserProgress(progress);
          saveProgressLocal(currentUser.id, progress);
        } else {
          const localProgress = getProgressLocal(currentUser.id);
          if (localProgress) {
            setUserProgress(localProgress);
          } else {
            // Khởi tạo tiến độ mới nếu chưa có
            setUserProgress({
              completedSentences: {},
              lastPosition: {},
            });
          }
        }
      } catch (err) {
        console.error('Lỗi khi lấy tiến độ học tập:', err);
        const localProgress = getProgressLocal(currentUser.id);
        if (localProgress) {
          setUserProgress(localProgress);
        } else {
          setError('Không thể lấy tiến độ học tập');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserProgress();
  }, [currentUser]);

  // Lưu tiến độ học tập
  const saveProgress = async (progressData) => {
    if (!currentUser) return false;

    try {
      setLoading(true);
      const newProgress = {
        ...userProgress,
        ...progressData,
      };

      const success = await saveUserProgress(currentUser.id, newProgress);
      setUserProgress(newProgress);
      saveProgressLocal(currentUser.id, newProgress);
      return success;
    } catch (err) {
      console.error('Lỗi khi lưu tiến độ học tập:', err);
      setError('Không thể lưu tiến độ học tập');
      saveProgressLocal(currentUser.id, {
        ...userProgress,
        ...progressData,
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Lưu câu đã hoàn thành
  const saveCompletedSentence = async (partId, testIndex, sentenceIndex, accuracy) => {
    if (!currentUser) return false;

    try {
      const sentenceKey = `${partId}_${testIndex}_${sentenceIndex}`;
      const completedSentences = {
        ...userProgress.completedSentences,
        [sentenceKey]: {
          accuracy,
          completedAt: new Date().toISOString(),
        },
      };

      return await saveProgress({ completedSentences });
    } catch (err) {
      console.error('Lỗi khi lưu câu đã hoàn thành:', err);
      return false;
    }
  };

  // Lưu vị trí học tập cuối cùng
  const saveLastPosition = async (partId, testIndex, sentenceIndex) => {
    if (!currentUser) return false;

    try {
      const lastPosition = {
        ...userProgress.lastPosition,
        [partId]: {
          testIndex,
          sentenceIndex,
          updatedAt: new Date().toISOString(),
        },
      };

      return await saveProgress({ lastPosition });
    } catch (err) {
      console.error('Lỗi khi lưu vị trí học tập:', err);
      return false;
    }
  };

  // Kiểm tra câu đã hoàn thành chưa
  const isCompletedSentence = (partId, testIndex, sentenceIndex) => {
    if (!userProgress.completedSentences) return false;
    
    const sentenceKey = `${partId}_${testIndex}_${sentenceIndex}`;
    return !!userProgress.completedSentences[sentenceKey];
  };

  // Lấy vị trí học tập cuối cùng
  const getLastPosition = (partId) => {
    if (!userProgress.lastPosition || !userProgress.lastPosition[partId]) {
      return null;
    }
    
    return userProgress.lastPosition[partId];
  };

  // Giá trị context
  const value = {
    userProgress,
    loading,
    error,
    saveCompletedSentence,
    saveLastPosition,
    isCompletedSentence,
    getLastPosition,
  };

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
}; 