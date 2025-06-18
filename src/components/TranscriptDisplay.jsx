import React from 'react';
import './TranscriptDisplay.css';

function TranscriptDisplay({ words, completedSentences = [] }) {
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
            <span key={idx} className={w.status}>{w.text} </span>
          ))}
        </p>
      )}
    </div>
  );
}

TranscriptDisplay.defaultProps = {
  words: [],
  completedSentences: [],
};

export default TranscriptDisplay;
