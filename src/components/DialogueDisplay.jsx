import React from 'react';
import './DialogueDisplay.css';

function DialogueDisplay({ completedSentences = [] }) {
  return (
    <div className="dialogue-display">
      {completedSentences.map((sentence, index) => (
        <div key={index} className="dialogue-line">
          <span className="dialogue-text">{sentence}</span>
        </div>
      ))}
    </div>
  );
}

export default DialogueDisplay; 