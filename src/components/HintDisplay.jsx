import React, { useState, useEffect, useCallback } from 'react';
import './HintDisplay.css';

function HintDisplay({ transcript, userInput, show, onAutoHide }) {
  const [hintWord, setHintWord] = useState('');
  const [hintPosition, setHintPosition] = useState(-1);
  const [inputPrefix, setInputPrefix] = useState('');
  const [hideTimeout, setHideTimeout] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(5);
  const AUTO_HIDE_TIME = 5; // Thời gian tự động ẩn (giây)

  // Hàm để tự động ẩn gợi ý
  const autoHideHint = useCallback(() => {
    if (onAutoHide && typeof onAutoHide === 'function') {
      onAutoHide();
    }
  }, [onAutoHide]);

  // Reset timeout khi component unmount
  useEffect(() => {
    return () => {
      if (hideTimeout) {
        clearTimeout(hideTimeout);
      }
    };
  }, [hideTimeout]);

  // Đếm ngược thời gian
  useEffect(() => {
    if (show && hintWord) {
      setTimeRemaining(AUTO_HIDE_TIME);
      
      const timer = setInterval(() => {
        setTimeRemaining(prevTime => {
          const newTime = prevTime - 1;
          if (newTime <= 0) {
            clearInterval(timer);
          }
          return newTime;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [show, hintWord]);

  useEffect(() => {
    if (!show || !transcript || !userInput) {
      setHintWord('');
      setHintPosition(-1);
      setInputPrefix('');
      return;
    }

    // Chuẩn hoá transcript và input (loại bỏ dấu câu, chuyển thành chữ thường)
    const normalizeText = (text) => {
      return text.toLowerCase().replace(/[.,!?;:'"()\[\]{}\-_]/g, '').trim();
    };

    const normalizedTranscript = normalizeText(transcript);
    const normalizedInput = normalizeText(userInput);

    // Tách transcript và input thành mảng từ
    const transcriptWords = normalizedTranscript.split(/\s+/);
    const inputWords = normalizedInput.split(/\s+/);
    
    // Trường hợp input rỗng hoặc chỉ có khoảng trắng
    if (normalizedInput === '') {
      setHintWord(transcriptWords[0] || '');
      setHintPosition(0);
      setInputPrefix('');
      
      // Đặt timeout để tự động ẩn sau AUTO_HIDE_TIME giây
      if (hideTimeout) clearTimeout(hideTimeout);
      const timeout = setTimeout(() => {
        autoHideHint();
      }, AUTO_HIDE_TIME * 1000);
      setHideTimeout(timeout);
      
      return;
    }

    // Xác định vị trí từ hiện tại đang nhập và tiền tố đã nhập
    let currentWordPosition;
    let prefix = '';
    
    if (userInput.endsWith(' ')) {
      // Người dùng đã nhập xong từ, gợi ý từ tiếp theo
      currentWordPosition = inputWords.length;
      prefix = '';
    } else {
      // Người dùng đang nhập dở từ
      currentWordPosition = inputWords.length - 1;
      prefix = inputWords[currentWordPosition] || '';
    }
    
    // Kiểm tra xem vị trí hiện tại có nằm trong transcript không
    if (currentWordPosition < transcriptWords.length) {
      const targetWord = transcriptWords[currentWordPosition];
      
      // Kiểm tra xem từ đang nhập có phải là tiền tố của từ mục tiêu không
      if (targetWord && targetWord.toLowerCase().startsWith(prefix.toLowerCase())) {
        setHintWord(targetWord);
        setHintPosition(currentWordPosition);
        setInputPrefix(prefix);
        
        // Đặt timeout để tự động ẩn sau AUTO_HIDE_TIME giây
        if (hideTimeout) clearTimeout(hideTimeout);
        const timeout = setTimeout(() => {
          autoHideHint();
        }, AUTO_HIDE_TIME * 1000);
        setHideTimeout(timeout);
      } else {
        // Tìm từ phù hợp nhất trong transcript
        let bestMatch = '';
        let bestPosition = -1;
        
        for (let i = 0; i < transcriptWords.length; i++) {
          const word = transcriptWords[i];
          if (word.toLowerCase().startsWith(prefix.toLowerCase())) {
            bestMatch = word;
            bestPosition = i;
            break;
          }
        }
        
        if (bestMatch) {
          setHintWord(bestMatch);
          setHintPosition(bestPosition);
          setInputPrefix(prefix);
          
          // Đặt timeout để tự động ẩn sau AUTO_HIDE_TIME giây
          if (hideTimeout) clearTimeout(hideTimeout);
          const timeout = setTimeout(() => {
            autoHideHint();
          }, AUTO_HIDE_TIME * 1000);
          setHideTimeout(timeout);
        } else {
          setHintWord('');
          setHintPosition(-1);
          setInputPrefix('');
        }
      }
    } else {
      setHintWord('');
      setHintPosition(-1);
      setInputPrefix('');
    }
  }, [transcript, userInput, show, hideTimeout, autoHideHint, AUTO_HIDE_TIME]);

  // Tính toán phần từ cần hiển thị (chỉ phần còn lại)
  const displayHint = () => {
    if (!hintWord) return '';
    
    // Nếu người dùng đã nhập xong từ (kết thúc bằng khoảng trắng), hiển thị toàn bộ từ gợi ý
    if (userInput.endsWith(' ')) {
      return hintWord;
    }
    
    // Nếu từ gợi ý bắt đầu bằng từ đang nhập, chỉ hiển thị phần còn lại
    if (hintWord.toLowerCase().startsWith(inputPrefix.toLowerCase())) {
      return hintWord.substring(inputPrefix.length);
    }
    
    return hintWord;
  };

  const displayInputPrefix = () => {
    if (userInput.endsWith(' ')) {
      return '';
    }
    return inputPrefix;
  };

  if (!show || !hintWord) {
    return null;
  }

  return (
    <div className="hint-display">
      <div className="hint-label">
        <i className="fas fa-lightbulb"></i> Gợi ý:
      </div>
      <div className="hint-content">
        <span className="hint-typed">{displayInputPrefix()}</span>
        <span className="hint-word">{displayHint()}</span>
      </div>
      <div className="hint-timer">
        Tự động ẩn sau <span className="countdown">{timeRemaining}</span> giây
      </div>
    </div>
  );
}

export default HintDisplay; 