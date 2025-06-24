import React from 'react';
import './TranscriptDisplay.css';

function TranscriptDisplay({ words, completedSentences = [], autoCorrect = false }) {
  // Xử lý hiển thị từ đặc biệt
  const renderWord = (segment) => {
    const { text, correctedText, status } = segment;
    
    if (status === 'incorrect' && autoCorrect && correctedText) {
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

  return (
    <div className="transcript-display-container">
      {/* Hiển thị các câu đã hoàn thành */}
      {completedSentences.length > 0 && (
        <div className="completed-sentences">
          {completedSentences.map((sentence, idx) => (
            <p key={idx} className="completed-sentence">
              {sentence}
            </p>
          ))}
        </div>
      )}
      
      {/* Hiển thị câu hiện tại đang nhập */}
      {words.length > 0 && (
        <p className="transcript-display">
          {words.map((w, idx) => (
            <span key={idx} className={`word-${w.status}`}>
              {renderWord(w)} {' '}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}

TranscriptDisplay.defaultProps = {
  words: [],
  completedSentences: [],
  autoCorrect: false
};

export default TranscriptDisplay;
