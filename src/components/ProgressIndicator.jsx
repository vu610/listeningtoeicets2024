import React, { useMemo } from 'react';
import { useProgress } from '../contexts/ProgressContext';
import './ProgressIndicator.css';

function ProgressIndicator({ partId, testIndex }) {
  const { userProgress } = useProgress();
  
  // Tính toán số câu đã hoàn thành trong phần này
  const completedCount = useMemo(() => {
    if (!userProgress.completedSentences || !partId || testIndex === undefined) {
      return 0;
    }
    
    const prefix = `${partId}_${testIndex}_`;
    return Object.keys(userProgress.completedSentences)
      .filter(key => key.startsWith(prefix))
      .length;
  }, [userProgress.completedSentences, partId, testIndex]);
  
  // Tính toán điểm trung bình
  const averageAccuracy = useMemo(() => {
    if (!userProgress.completedSentences || !partId || testIndex === undefined || completedCount === 0) {
      return 0;
    }
    
    const prefix = `${partId}_${testIndex}_`;
    const accuracies = Object.entries(userProgress.completedSentences)
      .filter(([key]) => key.startsWith(prefix))
      .map(([_, value]) => value.accuracy);
    
    if (accuracies.length === 0) return 0;
    
    const sum = accuracies.reduce((total, acc) => total + acc, 0);
    return sum / accuracies.length;
  }, [userProgress.completedSentences, partId, testIndex, completedCount]);
  
  // Lấy màu dựa trên độ chính xác
  const getAccuracyColor = (accuracy) => {
    if (accuracy >= 90) return '#4caf50'; // Xanh lá
    if (accuracy >= 70) return '#8bc34a'; // Xanh lá nhạt
    if (accuracy >= 50) return '#ffc107'; // Vàng
    if (accuracy >= 30) return '#ff9800'; // Cam
    return '#f44336'; // Đỏ
  };
  
  if (!partId || testIndex === undefined) {
    return null;
  }
  
  return (
    <div className="progress-indicator">
      <div className="progress-stats">
        <div className="progress-stat">
          <span className="stat-label">Đã hoàn thành:</span>
          <span className="stat-value">{completedCount}</span>
        </div>
        
        {completedCount > 0 && (
          <div className="progress-stat">
            <span className="stat-label">Độ chính xác trung bình:</span>
            <span 
              className="stat-value accuracy" 
              style={{ color: getAccuracyColor(averageAccuracy) }}
            >
              {averageAccuracy.toFixed(1)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProgressIndicator; 