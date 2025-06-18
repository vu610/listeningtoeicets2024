import React from 'react';
import './FeedbackDisplay.css';

// segments: [{ char, status }]
function FeedbackDisplay({ segments }) {
  // Xử lý hiển thị ký tự đặc biệt
  const renderChar = (char) => {
    // Nếu là khoảng trắng, hiển thị rõ ràng hơn
    if (char === ' ') {
      return <span className="space-char">&nbsp;</span>;
    }
    return char;
  };

  return (
    <div className="feedback-display">
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
};

export default FeedbackDisplay;
