import React from 'react';
import FeedbackDisplay from './FeedbackDisplay';
import TranscriptDisplay from './TranscriptDisplay';
import './InteractiveInput.css';

function InteractiveInput({ 
  id, 
  value, 
  onChange, 
  onSubmit, 
  segments, 
  showFeedback, 
  completedSentences = [], 
  isDialogue = false,
  autoCorrect = false,
  accuracy = null
}) {
  const handleKeyDown = (e) => {
    // Ctrl + Enter: Kiểm tra đáp án
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onSubmit();
      return;
    }
    
    // Enter thông thường không làm gì
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
    }
  };

  // Render thông tin độ chính xác nếu có
  const renderAccuracyInfo = () => {
    if (!accuracy || accuracy.value === undefined || accuracy.value === null) {
      return null;
    }
    
    const getAccuracyClass = (value) => {
      if (value >= 80) return 'excellent';
      if (value >= 60) return 'good';
      if (value >= 40) return 'average';
      return 'poor';
    };
    
    const getAccuracyMessage = (value) => {
      if (value >= 80) return 'Tuyệt vời!';
      if (value >= 60) return 'Khá tốt!';
      if (value >= 40) return 'Cần cố gắng hơn!';
      return 'Hãy luyện tập thêm!';
    };
    
    return (
      <div className="input-accuracy-info">
        <div className="accuracy-label">Độ chính xác:</div>
        <div className={`accuracy-value ${getAccuracyClass(accuracy.value)}`}>
          {Math.round(accuracy.value)}%
        </div>
        <div className="accuracy-message">
          {accuracy.isComplete ? 'Tuyệt vời! Đúng hết các từ.' : getAccuracyMessage(accuracy.value)}
          {accuracy.attemptCount > 1 && !accuracy.isComplete && ` (Lần thử thứ ${accuracy.attemptCount})`}
          {accuracy.isComplete && ' Đang chuyển câu tiếp theo...'}
        </div>
      </div>
    );
  };

  // Xác định có nên hiển thị feedback ở trên hay không
  const showFeedbackAbove = showFeedback && segments && segments.length > 0;

  return (
    <div className="interactive-container">
      {/* Hiển thị các câu đã hoàn thành cho Part 3 và Part 4 */}
      {isDialogue && completedSentences.length > 0 && (
        <TranscriptDisplay 
          completedSentences={completedSentences} 
          words={[]} 
          autoCorrect={autoCorrect}
        />
      )}

      {/* Hiển thị feedback ở trên */}
      {showFeedbackAbove && (
        <div className="feedback-container">
          <FeedbackDisplay segments={segments} showAbove={true} autoCorrect={autoCorrect} />
          {renderAccuracyInfo()}
        </div>
      )}
      
      <textarea
        id={id}
        className={showFeedbackAbove ? "text-input" : `text-input ${showFeedback ? 'with-feedback' : ''}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Gõ những gì bạn nghe được vào đây... (Ctrl+Enter để kiểm tra)"
        rows="4"
      />

      {/* Hiển thị feedback overlay chỉ khi không hiển thị ở trên */}
      {showFeedback && !showFeedbackAbove && (
        <FeedbackDisplay segments={segments} autoCorrect={autoCorrect} />
      )}
    </div>
  );
}

export default InteractiveInput;
