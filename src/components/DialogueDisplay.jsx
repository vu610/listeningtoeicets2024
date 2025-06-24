import React from 'react';
import './DialogueDisplay.css';

function DialogueDisplay({ completedSentences = [], currentLineIdx = 0 }) {
  // Lọc các câu đã hoàn thành để tránh hiển thị lặp lại
  const uniqueCompletedSentences = completedSentences.filter(
    (sentence, index, self) => 
      self.indexOf(sentence) === index
  );

  return (
    <div className="dialogue-display">
      <h2>Đoạn hội thoại</h2>
      {uniqueCompletedSentences.map((sentence, index) => (
        <div 
          key={index} 
          className={`dialogue-line ${index === currentLineIdx ? 'current' : ''}`}
        >
          <p className="content">{sentence}</p>
          <span className="line-number">{index + 1}</span>
        </div>
      ))}
    </div>
  );
}

export default DialogueDisplay; 