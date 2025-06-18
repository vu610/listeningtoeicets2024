import React from 'react';
import './Controls.css';

function Controls({ onReplay, onShowAnswer, onToggleSlow, onPrev, onNext }) {
  return (
    <div className="controls">
      <button className="btn" onClick={onReplay}>Nghe lại</button>
      <button className="btn" onClick={onToggleSlow}>Phát chậm</button>
      <button className="btn" onClick={onShowAnswer}>Hiện đáp án</button>
      <button className="btn" onClick={onPrev}>Câu trước</button>
      <button className="btn" onClick={onNext}>Câu sau</button>
    </div>
  );
}

export default Controls;
