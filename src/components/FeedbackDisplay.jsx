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
        <span className="feedback-content">
          <span className="missing">___</span>
          <span className="expected">{correctedText}</span>
        </span>
      );
    } else if (status === 'incorrect' && autoCorrect && correctedText) {
      // Từ sai và đã bật tự động sửa
      return (
        <span className="feedback-content">
          <span className="incorrect">{text}</span>
          <span className="expected">{correctedText}</span>
        </span>
      );
    } else {
      // Từ đúng hoặc không bật tự động sửa
      return <span className={status === 'correct' ? 'correct' : (status === 'incorrect' ? 'incorrect' : '')}>{text}</span>;
    }
  };

  // Nếu không có segments hoặc segments là mảng rỗng
  if (!segments || segments.length === 0) {
    return null;
  }
  
  const containerClass = showAbove ? 'feedback-display' : 'feedback-display';

  return (
    <div className={containerClass}>
      <h3>
        <i className="fas fa-check-circle"></i>
        Kết quả kiểm tra
      </h3>
      <div className="feedback-content">
        {segments.map((seg, idx) => (
          <span key={idx} style={{marginRight: '5px'}}>
            {renderWord(seg)}{' '}
          </span>
        ))}
      </div>
    </div>
  );
}

export default FeedbackDisplay;
