import React from 'react';
import './FeedbackDisplay.css';

// segments: [{ char, status }]
function FeedbackDisplay({ segments, showAbove = false }) {
  // Xử lý hiển thị ký tự đặc biệt
  const renderChar = (char) => {
    // Nếu là khoảng trắng, hiển thị rõ ràng hơn
    if (char === ' ') {
      return <span className="space-char">&nbsp;</span>;
    }
    return char;
  };

  // Nếu không có segments hoặc segments là mảng rỗng
  if (!segments || segments.length === 0) {
    return null;
  }
  
  const containerClass = showAbove ? 'feedback-display-above' : 'feedback-display';

  return (
    <div className={containerClass}>
      {segments.map((seg, idx) => (
        <span key={idx} className={`char-${seg.status}`}>
          {renderChar(seg.char)}
        </span>
      ))}
    </div>
  );
}

FeedbackDisplay.defaultProps = {
  segments: [],
  showAbove: false
};

export default FeedbackDisplay;
