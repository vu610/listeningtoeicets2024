import React from 'react';
import './TranscriptDisplay.css';

function TranscriptDisplay({ words }) {
  return (
    <p className="transcript-display">
      {words.map((w, idx) => (
        <span key={idx} className={w.status}>{w.text} </span>
      ))}
    </p>
  );
}

TranscriptDisplay.defaultProps = {
  words: [],
};

export default TranscriptDisplay;
