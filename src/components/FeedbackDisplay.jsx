import React from 'react';
import './FeedbackDisplay.css';

// segments: [{ text, correctedText, status }]
function FeedbackDisplay({ 
  segments = [], 
  showAbove = false, 
  autoCorrect = false 
}) {
  // Xử lý hiển thị từ đặc biệt
  const renderWord = (segment) => {
    const { text, correctedText, status } = segment;
    
    if (status === 'missing') {
      // Từ bị thiếu
      return (
        <span className="word-correction">
          <span className="missing-word">___</span>
          <span className="corrected-text">{correctedText}</span>
        </span>
      );
    } else if (status === 'incorrect' && autoCorrect && correctedText) {
      // Từ sai và đã bật tự động sửa
      return (
        <span className="word-correction">
          <span className="original-text">{text}</span>
          <span className="corrected-text">{correctedText}</span>
        </span>
      );
    } else {
      // Từ đúng hoặc không bật tự động sửa
      return text;
    }
  };

  // Nếu không có segments hoặc segments là mảng rỗng
  if (!segments || segments.length === 0) {
    return null;
  }
  
  const containerClass = showAbove ? 'feedback-display-above' : 'feedback-display';

  return (
    <div className={containerClass}>
      {segments.map((seg, idx) => (
        <span key={idx} className={`word-${seg.status}`}>
          {renderWord(seg)} {' '}
        </span>
      ))}
    </div>
  );
}

export default FeedbackDisplay;
