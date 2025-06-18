import React from 'react';
import FeedbackDisplay from './FeedbackDisplay';
import './InteractiveInput.css';

function InteractiveInput({ id, value, onChange, onSubmit, segments, showFeedback }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="interactive-container">
      {showFeedback && (
        <FeedbackDisplay segments={segments} />
      )}
      <textarea
        id={id}
        className={`text-input ${showFeedback ? 'with-feedback' : ''}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Gõ những gì bạn nghe được vào đây..."
        rows="4"
      />
    </div>
  );
}

export default InteractiveInput;
