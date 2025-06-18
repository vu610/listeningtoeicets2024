import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import InteractiveInput from '../components/InteractiveInput';
import TestSelector from '../components/TestSelector';

import compareInput from '../utils/compareInput';
import useAudioPlayer from '../hooks/useAudioPlayer';
import allTests, { getTestByIndex } from '../data/testsIndex';
import './PracticePage.css';

function PracticePage() {
  const { partId } = useParams();
  const navigate = useNavigate();
  const [selectedTestIndex, setSelectedTestIndex] = useState(null);
  const [currentTest, setCurrentTest] = useState(null);
  
  const partKey = `part${partId}`;
  const [sentences, setSentences] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [currentSentence, setCurrentSentence] = useState({});

  const [audioSrc, setAudioSrc] = useState('');
  const [input, setInput] = useState('');
  const [segments, setSegments] = useState([]);
  const [isChecked, setIsChecked] = useState(false);
  const [showScore, setShowScore] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [accuracy, setAccuracy] = useState(0);
  const [attemptCount, setAttemptCount] = useState(0);
  const [autoAdvanceTimeout, setAutoAdvanceTimeout] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);

  // Reset when part changes
  useEffect(() => {
    setSelectedTestIndex(null);
    setCurrentTest(null);
    setSentences([]);
    resetState();
    setCurrentIdx(0);
    setScore({ correct: 0, total: 0 });
    setShowScore(false);
  }, [partId]);

  // Xử lý khi chọn đề
  const handleSelectTest = (testIndex) => {
    const test = getTestByIndex(testIndex);
    if (test) {
      setSelectedTestIndex(testIndex);
      setCurrentTest(test);
      
      const testSentences = test[partKey] || [];
      setSentences(testSentences);
      
      if (testSentences.length > 0) {
        setCurrentSentence(testSentences[0]);
        setAudioSrc(`/audio/${testSentences[0].audioFile}`);
      } else {
        // Nếu không có câu nào trong phần này
        setCurrentSentence({});
        setAudioSrc('');
        alert(`Không có câu hỏi nào trong Part ${partId} của đề này.`);
      }
      
      resetState();
      setCurrentIdx(0);
      setScore({ correct: 0, total: 0 });
      setShowScore(false);
    }
  };

  const resetState = () => {
    setInput('');
    setSegments([]);
    setIsChecked(false);
    setShowAnswer(false);
    setAccuracy(0);
    setAttemptCount(0);
    if (autoAdvanceTimeout) {
      clearTimeout(autoAdvanceTimeout);
      setAutoAdvanceTimeout(null);
    }
  };

  // Cập nhật câu hiện tại khi thay đổi chỉ số
  useEffect(() => {
    if (sentences.length > 0 && currentIdx >= 0 && currentIdx < sentences.length) {
      setCurrentSentence(sentences[currentIdx]);
    }
  }, [currentIdx, sentences]);

  const {
    audioRef,
    playSegment,
    replay,
    toggleSlowMotion,
    isLoading,
  } = useAudioPlayer({ audioSrc });

  // Tính toán phần trăm hoàn thành
  const progress = sentences.length ? ((currentIdx + 1) / sentences.length) * 100 : 0;

  // Tự động phát audio khi chuyển câu
  useEffect(() => {
    if (currentSentence && currentSentence.startTime !== undefined && currentSentence.endTime !== undefined) {
      const timer = setTimeout(() => {
        playSegment({
          startTime: currentSentence.startTime,
          endTime: currentSentence.endTime
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentIdx, currentSentence, playSegment]);

  // Kiểm tra đáp án
  const checkAnswer = () => {
    if (!currentSentence || !currentSentence.transcript) return;
    
    const res = compareInput(input, currentSentence.transcript);
    setSegments(res);
    setIsChecked(true);
    setAttemptCount(prev => prev + 1);
    
    // Sử dụng thông tin độ chính xác từ hàm compareInput
    const wordAccuracy = res.accuracy;
    const currentAccuracy = (wordAccuracy.correctWords / wordAccuracy.totalWords) * 100;
    setAccuracy(currentAccuracy);
    
    // Chỉ cập nhật điểm số nếu là lần kiểm tra đầu tiên cho câu hiện tại
    if (attemptCount === 0) {
      setScore(prev => ({
        correct: prev.correct + (currentAccuracy >= 80 ? 1 : 0), // Đúng ít nhất 80%
        total: prev.total + 1
      }));
    }

    // Nếu đã nhập đúng hết các từ, tự động chuyển câu sau 2 giây
    if (wordAccuracy.isComplete) {
      const timeout = setTimeout(() => {
        goToNextSentence();
      }, 2000);
      setAutoAdvanceTimeout(timeout);
    }
  };

  // Hiển thị đáp án
  const displayAnswer = () => {
    if (!currentSentence || !currentSentence.transcript) return;
    
    setInput(currentSentence.transcript);
    setShowAnswer(true);
    setIsChecked(true);
    setAccuracy(100);
  };

  // Xử lý khi người dùng nhập
  const handleInputChange = (val) => {
    setInput(val);
    
    // Nếu đã hiển thị đáp án, không cho phép sửa
    if (showAnswer) {
      return;
    }
    
    // Nếu đã kiểm tra, cập nhật lại phản hồi khi người dùng tiếp tục nhập
    if (isChecked) {
      const res = compareInput(val, currentSentence.transcript);
      setSegments(res);
      
      // Nếu đã nhập đúng hết các từ, tự động chuyển câu sau 2 giây
      if (res.accuracy && res.accuracy.isComplete) {
        if (autoAdvanceTimeout) {
          clearTimeout(autoAdvanceTimeout);
        }
        const timeout = setTimeout(() => {
          goToNextSentence();
        }, 2000);
        setAutoAdvanceTimeout(timeout);
      } else if (autoAdvanceTimeout) {
        // Nếu không đúng hết và đang có timeout, hủy timeout
        clearTimeout(autoAdvanceTimeout);
        setAutoAdvanceTimeout(null);
      }
    }
  };

  // Chuyển sang câu tiếp theo
  const goToNextSentence = () => {
    if (autoAdvanceTimeout) {
      clearTimeout(autoAdvanceTimeout);
      setAutoAdvanceTimeout(null);
    }
    
    if (currentIdx < sentences.length - 1) {
      setCurrentIdx(currentIdx + 1);
      resetState();
    } else {
      // Đã hoàn thành tất cả câu
      setShowScore(true);
    }
  };

  // Hiển thị màn hình chọn đề nếu chưa chọn
  if (selectedTestIndex === null) {
    return (
      <div className="content-header">
        <h2>Part {partId} - {getPartName(partId)}</h2>
        <TestSelector partId={partId} onSelectTest={handleSelectTest} />
      </div>
    );
  }

  // Hiển thị màn hình kết quả nếu đã hoàn thành
  if (showScore) {
    return (
      <>
        <div className="content-header">
          <h2>Kết quả luyện tập</h2>
        </div>
        <div className="practice-area result-area">
          <div className="result-summary">
            <div className="result-icon">
              <i className="fas fa-trophy"></i>
            </div>
            <h3>Chúc mừng bạn đã hoàn thành!</h3>
            <div className="result-score">
              <p>Điểm số của bạn:</p>
              <div className="score-value">{score.correct}/{score.total}</div>
              <div className="score-percent">
                {Math.round((score.correct / score.total) * 100)}%
              </div>
            </div>
          </div>
          <div className="result-actions">
            <button 
              className="btn btn-outline" 
              onClick={() => setSelectedTestIndex(null)}
            >
              <i className="fas fa-list"></i>
              Chọn đề khác
            </button>
            <button 
              className="btn btn-primary" 
              onClick={() => {
                resetState();
                setCurrentIdx(0);
                setScore({ correct: 0, total: 0 });
                setShowScore(false);
              }}
            >
              <i className="fas fa-redo"></i>
              Luyện lại
            </button>
          </div>
        </div>
      </>
    );
  }

  // Hiển thị thông báo nếu không có câu nào
  if (sentences.length === 0) {
    return (
      <>
        <div className="content-header">
          <h2>Part {partId} - {getPartName(partId)}</h2>
        </div>
        <div className="practice-area result-area">
          <div className="result-summary">
            <div className="result-icon">
              <i className="fas fa-exclamation-circle"></i>
            </div>
            <h3>Không có câu hỏi nào trong phần này</h3>
          </div>
          <div className="result-actions">
            <button 
              className="btn btn-outline" 
              onClick={() => setSelectedTestIndex(null)}
            >
              <i className="fas fa-list"></i>
              Chọn đề khác
            </button>
            <button 
              className="btn btn-primary" 
              onClick={() => navigate('/')}
            >
              <i className="fas fa-home"></i>
              Về trang chủ
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="content-header">
        <h2>Part {partId} - {getPartName(partId)}</h2>
        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${progress}%` }}></div>
        </div>
        <div className="progress-text">
          Câu {currentIdx + 1} / {sentences.length} - Hoàn thành {Math.floor(progress)}%
        </div>
      </div>

      <div className="practice-area">
        {/* Audio ẩn */}
        <audio ref={audioRef} src={audioSrc} style={{ display: 'none' }} />

        <div className="control-buttons">
          <button className="btn btn-primary" onClick={replay} disabled={isLoading}>
            <i className="fas fa-play"></i>
            Nghe lại
          </button>
          <button className="btn btn-secondary" onClick={toggleSlowMotion}>
            <i className="fas fa-clock"></i>
            Phát chậm
          </button>
          <button 
            className="btn btn-outline" 
            onClick={displayAnswer}
            disabled={showAnswer}
          >
            <i className="fas fa-eye"></i>
            Hiển thị đáp án
          </button>
          <button 
            className="btn btn-primary" 
            disabled={isLoading}
            onClick={() => playSegment({ startTime: currentSentence.startTime, endTime: currentSentence.endTime })}
          >
            <i className="fas fa-headphones"></i>
            Nghe câu hiện tại
          </button>
        </div>

        <div className="input-area">
          <label htmlFor="userInput" className="input-label">
            <i className="fas fa-keyboard"></i>
            Nhập câu bạn nghe được:
          </label>
          
          {showAnswer ? (
            // Nếu hiển thị đáp án, hiển thị văn bản đáp án
            <div className="answer-display">
              <div className="answer-label">Đáp án:</div>
              <div className="answer-text">{currentSentence.transcript}</div>
            </div>
          ) : (
            // Nếu không hiển thị đáp án, hiển thị ô nhập và phản hồi
            <InteractiveInput
              id="userInput"
              value={input}
              onChange={handleInputChange}
              onSubmit={checkAnswer}
              segments={segments}
              showFeedback={isChecked}
            />
          )}
          
          {isChecked && segments.accuracy && !showAnswer && (
            <div className="accuracy-display">
              <div className="accuracy-label">Độ chính xác:</div>
              <div className={`accuracy-value ${getAccuracyClass(accuracy)}`}>
                {Math.round(accuracy)}%
              </div>
              <div className="accuracy-message">
                {segments.accuracy.isComplete ? 'Tuyệt vời! Đúng hết các từ.' : getAccuracyMessage(accuracy)}
                {attemptCount > 1 && !segments.accuracy.isComplete && ` (Lần thử thứ ${attemptCount})`}
                {segments.accuracy.isComplete && ' Đang chuyển câu tiếp theo...'}
              </div>
            </div>
          )}
        </div>

        <div className="navigation-buttons">
          <button 
            className="btn btn-outline" 
            onClick={() => {
              if (currentIdx > 0) {
                setCurrentIdx(currentIdx - 1);
                resetState();
              }
            }}
            disabled={currentIdx === 0}
          >
            <i className="fas fa-arrow-left"></i>
            Câu trước
          </button>
          <button 
            className="btn btn-primary" 
            onClick={checkAnswer}
            disabled={showAnswer}
          >
            <i className="fas fa-check"></i>
            Kiểm tra đáp án
          </button>
          <button 
            className="btn btn-outline" 
            onClick={goToNextSentence}
            disabled={currentIdx === sentences.length - 1 && !isChecked}
          >
            <i className="fas fa-arrow-right"></i>
            {currentIdx === sentences.length - 1 ? 'Kết thúc' : 'Câu sau'}
          </button>
        </div>
      </div>
    </>
  );
}

function getPartName(partId) {
  const partNames = {
    '1': 'Mô tả tranh',
    '2': 'Hỏi đáp',
    '3': 'Hội thoại',
    '4': 'Bài nói'
  };
  return partNames[partId] || '';
}

function getAccuracyClass(accuracy) {
  if (accuracy >= 80) return 'excellent';
  if (accuracy >= 60) return 'good';
  if (accuracy >= 40) return 'average';
  return 'poor';
}

function getAccuracyMessage(accuracy) {
  if (accuracy >= 80) return 'Tuyệt vời!';
  if (accuracy >= 60) return 'Khá tốt!';
  if (accuracy >= 40) return 'Cần cố gắng hơn!';
  return 'Hãy luyện tập thêm!';
}

export default PracticePage;
