import React, { useMemo } from 'react';
import { useProgress } from '../contexts/ProgressContext';
import './ProgressIndicator.css';

function ProgressIndicator({ partId, testIndex, currentSentenceIndex, totalSentences, onSentenceClick }) {
  const { userProgress, isCompletedSentence } = useProgress();
  
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
      .map(([_, value]) => typeof value?.accuracy === 'number' ? value.accuracy : 0)
      .filter(acc => acc > 0); // Chỉ lấy những accuracy hợp lệ

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

  // Tạo danh sách chỉ báo câu
  const sentenceIndicators = useMemo(() => {
    if (!partId || testIndex === undefined || totalSentences <= 0) {
      return [];
    }

    const indicators = [];
    for (let i = 0; i < totalSentences; i++) {
      const isCompleted = isCompletedSentence(partId, testIndex, i);
      const isCurrent = i === currentSentenceIndex;
      
      // Lấy độ chính xác nếu có
      let accuracy = 0;
      if (isCompleted && userProgress.completedSentences) {
        const key = `${partId}_${testIndex}_${i}`;
        const completedData = userProgress.completedSentences[key];
        accuracy = typeof completedData?.accuracy === 'number' ? completedData.accuracy : 0;
      }

      indicators.push({
        index: i,
        isCompleted,
        isCurrent,
        accuracy
      });
    }
    
    return indicators;
  }, [partId, testIndex, totalSentences, currentSentenceIndex, isCompletedSentence, userProgress.completedSentences]);
  
  if (!partId || testIndex === undefined) {
    return null;
  }
  
  return (
    <div className="progress-indicator">
      <div className="progress-stats">
        <div className="progress-stat">
          <span className="stat-label">Đã hoàn thành:</span>
          <span className="stat-value">{completedCount}/{totalSentences}</span>
        </div>
        
        {completedCount > 0 && (
          <div className="progress-stat">
            <span className="stat-label">Độ chính xác trung bình:</span>
            <span
              className="stat-value accuracy"
              style={{ color: getAccuracyColor(averageAccuracy) }}
            >
              {typeof averageAccuracy === 'number' ? averageAccuracy.toFixed(1) : '0.0'}%
            </span>
          </div>
        )}
      </div>

      {/* Hiển thị chỉ báo cho từng câu */}
      {totalSentences > 0 && (
        <div className="sentence-indicators">
          {sentenceIndicators.map((indicator) => (
            <div
              key={indicator.index}
              className={`sentence-indicator ${indicator.isCompleted ? 'completed' : ''} ${indicator.isCurrent ? 'current' : ''}`}
              style={indicator.isCompleted ? { backgroundColor: getAccuracyColor(indicator.accuracy) } : {}}
              onClick={() => onSentenceClick && onSentenceClick(indicator.index)}
              title={`Câu ${indicator.index + 1}${indicator.isCompleted && typeof indicator.accuracy === 'number' ? ` - Độ chính xác: ${indicator.accuracy.toFixed(1)}%` : ''}`}
            >
              {indicator.index + 1}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProgressIndicator; 