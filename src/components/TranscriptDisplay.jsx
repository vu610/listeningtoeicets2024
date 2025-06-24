import React from 'react';
import './TranscriptDisplay.css';

function TranscriptDisplay({ words, completedSentences = [], autoCorrect = false }) {
  // Lọc các câu đã hoàn thành để tránh hiển thị lặp lại
  const uniqueCompletedSentences = completedSentences.filter(
    (sentence, index, self) => 
      self.indexOf(sentence) === index
  );

  // Xử lý hiển thị từ đặc biệt
  const renderWord = (segment) => {
    const { text, correctedText, status } = segment;
    
    if (status === 'incorrect' && autoCorrect && correctedText) {
      // Từ sai và đã bật tự động sửa
      return (
        <span className="word-correction">
          <span className="word-incorrect">{text}</span>
          <span className="word-correction-text">{correctedText}</span>
        </span>
      );
    } else if (status === 'correct') {
      return <span className="word-correct">{text}</span>;
    } else if (status === 'incorrect') {
      return <span className="word-incorrect">{text}</span>;
    } else if (status === 'missing') {
      return <span className="word-missing">{text || '___'}</span>;
    } else {
      // Các trường hợp khác
      return <span>{text}</span>;
    }
  };

  return (
    <div className="transcript-display-container">
      {/* Hiển thị các câu đã hoàn thành */}
      {uniqueCompletedSentences.length > 0 && (
        <div className="completed-sentences">
          {uniqueCompletedSentences.map((sentence, idx) => (
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
            <span key={idx} style={{marginRight: '5px'}}>
              {renderWord(w)}
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
