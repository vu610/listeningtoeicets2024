import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import InteractiveInput from '../components/InteractiveInput';
import DialogueDisplay from '../components/DialogueDisplay';
import TestSelector from '../components/TestSelector';
import HelpGuide from '../components/HelpGuide';
import ProgressIndicator from '../components/ProgressIndicator';
import { useUser } from '../contexts/UserContext';
import { useProgress } from '../contexts/ProgressContext';

import compareInput from '../utils/compareInput';
import useAudioPlayer from '../hooks/useAudioPlayer';
import allTests, { getTestByIndex } from '../data/testsIndex';
import './PracticePage.css';

function PracticePage() {
  const { partId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useUser();
  const { 
    saveCompletedSentence, 
    saveLastPosition, 
    isCompletedSentence, 
    getLastPosition 
  } = useProgress();
  
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
  const [errorMessage, setErrorMessage] = useState('');
  
  // Thêm state cho phần đối thoại và bài nói
  const [completedSentences, setCompletedSentences] = useState([]);
  const [dialogLines, setDialogLines] = useState([]);
  const [currentLineIdx, setCurrentLineIdx] = useState(0);
  
  // Thêm state cho tính năng tự động sửa lỗi
  const [autoCorrect, setAutoCorrect] = useState(false);

  // Xác định loại phần
  const isPart3 = partId === '3';
  const isPart4 = partId === '4';
  const isDialogueOrTalk = isPart3 || isPart4;

  // Reset khi thay đổi phần
  useEffect(() => {
    setSelectedTestIndex(null);
    setCurrentTest(null);
    setSentences([]);
    resetState();
    setCurrentIdx(0);
    setScore({ correct: 0, total: 0 });
    setShowScore(false);
    setCompletedSentences([]);
    setDialogLines([]);
    setCurrentLineIdx(0);
    setAutoCorrect(false);
  }, [partId]);

  // Kiểm tra và tải tiến độ học tập khi chọn phần
  useEffect(() => {
    if (!currentUser || !partId) return;
    
    // Lấy vị trí học tập cuối cùng
    const lastPosition = getLastPosition(partId);
    if (lastPosition) {
      const { testIndex, sentenceIndex } = lastPosition;
      
      // Nếu có vị trí học tập cuối cùng, tải đề thi đó
      if (testIndex !== undefined) {
        handleSelectTest(testIndex);
        
        // Đặt câu hiện tại sau khi đề thi được tải
        if (sentenceIndex !== undefined) {
          setTimeout(() => {
            setCurrentIdx(sentenceIndex);
          }, 500);
        }
      }
    }
  }, [currentUser, partId, getLastPosition]);

  // Lấy tên file audio chuẩn từ sourceTest
  const getAudioFileName = (sourceTest) => {
    if (!sourceTest) return '';
    
    const testNumber = sourceTest.match(/\d+/);
    if (!testNumber) return '';
    
    const formattedNumber = testNumber[0].padStart(2, '0');
    return `Test_${formattedNumber}.mp3`;
  };

  // Xử lý khi chọn đề
  const handleSelectTest = (testIndex) => {
    const test = getTestByIndex(testIndex);
    if (test) {
      setSelectedTestIndex(testIndex);
      setCurrentTest(test);
      
      const testSentences = test[partKey] || [];
      setSentences(testSentences);
      
      if (testSentences.length > 0) {
        const firstSentence = testSentences[0];
        setCurrentSentence(firstSentence);
        
        // Nếu là Part 3 hoặc Part 4, chuẩn bị dữ liệu đối thoại hoặc bài nói
        if (isDialogueOrTalk) {
          if (isPart3 && firstSentence.conversation) {
            setDialogLines(firstSentence.conversation);
            setCurrentLineIdx(0);
          } else if (isPart4 && firstSentence.talk) {
            setDialogLines(firstSentence.talk);
            setCurrentLineIdx(0);
          }
        }
        
        // Đặt audio source
        const audioFileName = getAudioFileName(firstSentence.sourceTest);
        setAudioSrc(`${process.env.PUBLIC_URL}/audio/${audioFileName}`);
      } else {
        setCurrentSentence({});
        setAudioSrc('');
        alert(`Không có câu hỏi nào trong Part ${partId} của đề này.`);
      }
      
      resetState();
      setCurrentIdx(0);
      setScore({ correct: 0, total: 0 });
      setShowScore(false);
      setCompletedSentences([]);
      setCurrentLineIdx(0);
    }
    
    // Lưu vị trí học tập
    if (currentUser) {
      saveLastPosition(partId, testIndex, 0);
    }
  };

  const resetState = () => {
    setInput('');
    setSegments([]);
    setIsChecked(false);
    setShowAnswer(false);
    setAccuracy(0);
    setAttemptCount(0);
    setErrorMessage('');
    if (autoAdvanceTimeout) {
      clearTimeout(autoAdvanceTimeout);
      setAutoAdvanceTimeout(null);
    }
  };

  // Cập nhật câu hiện tại khi thay đổi chỉ số
  useEffect(() => {
    if (sentences.length > 0 && currentIdx >= 0 && currentIdx < sentences.length) {
      const sentence = sentences[currentIdx];
      setCurrentSentence(sentence);
      
      // Xử lý đối thoại hoặc bài nói trong Part 3 và Part 4
      if (isDialogueOrTalk) {
        if (isPart3 && sentence.conversation) {
          setDialogLines(sentence.conversation);
          setCurrentLineIdx(0);
        } else if (isPart4 && sentence.talk) {
          setDialogLines(sentence.talk);
          setCurrentLineIdx(0);
        }
        setCompletedSentences([]);
      }
      
      // Cập nhật audio source
      const audioFileName = getAudioFileName(sentence.sourceTest);
      setAudioSrc(`${process.env.PUBLIC_URL}/audio/${audioFileName}`);
    }
  }, [currentIdx, sentences, isPart3, isPart4, isDialogueOrTalk]);

  const {
    audioRef,
    playSegment,
    replay,
    toggleSlowMotion,
    isLoading,
    isPlaying
  } = useAudioPlayer({ audioSrc });

  // Xử lý lỗi audio khi load
  useEffect(() => {
    const handleAudioError = (e) => {
      console.error('Không thể phát audio:', e);
      setErrorMessage('Không thể phát audio. Vui lòng tải lại trang hoặc nhấn nút "Nghe lại".');
    };

    const audio = audioRef.current;
    if (audio) {
      audio.addEventListener('error', handleAudioError);
      return () => {
        audio.removeEventListener('error', handleAudioError);
      };
    }
  }, [audioRef]);

  // Tính toán phần trăm hoàn thành
  const progress = sentences.length ? ((currentIdx + 1) / sentences.length) * 100 : 0;

  // Lấy dòng hiện tại trong đối thoại hoặc bài nói
  const getCurrentLine = () => {
    if (!isDialogueOrTalk || dialogLines.length === 0 || currentLineIdx >= dialogLines.length) {
      return null;
    }
    return dialogLines[currentLineIdx];
  };

  // Tự động phát audio khi chuyển câu hoặc dòng mới
  useEffect(() => {
    if (!currentSentence) return;
    
    const timer = setTimeout(() => {
      // Xử lý khác nhau cho Part 3/4 và các Part khác
      if (isDialogueOrTalk) {
        const currentLine = getCurrentLine();
        if (currentLine && currentLine.startTime !== undefined && currentLine.endTime !== undefined) {
          console.log(`Playing dialogue/talk line: ${currentLine.startTime}s to ${currentLine.endTime}s`);
          playSegment({
            startTime: currentLine.startTime,
            endTime: currentLine.endTime
          });
        }
      } else if (currentSentence.startTime !== undefined && currentSentence.endTime !== undefined) {
        console.log(`Playing segment: ${currentSentence.startTime}s to ${currentSentence.endTime}s`);
        playSegment({
          startTime: currentSentence.startTime,
          endTime: currentSentence.endTime
        });
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [currentIdx, currentLineIdx, currentSentence, playSegment, isDialogueOrTalk, dialogLines]);

  // Lấy transcript của câu hiện tại
  const getCurrentTranscript = () => {
    if (!currentSentence) return '';
    
    // Xử lý khác nhau cho Part 3/4 và các Part khác
    if (isDialogueOrTalk) {
      const currentLine = getCurrentLine();
      return currentLine ? currentLine.transcript : '';
    } else {
      return currentSentence.transcript || '';
    }
  };

  // Cập nhật hàm handleInputChange để không kiểm tra realtime
  const handleInputChange = (val) => {
    setInput(val);
    
    if (showAnswer) return;
    
    // Xóa phần kiểm tra realtime
    if (isChecked) {
      // Chỉ cập nhật input, không kiểm tra lại
      setIsChecked(false);
    }
  };

  // Cập nhật hàm kiểm tra đáp án
  const checkAnswer = () => {
    const transcript = getCurrentTranscript();
    if (!transcript) return;
    
    const res = compareInput(input, transcript);
    setSegments(res);
    setIsChecked(true);
    setAttemptCount(prev => prev + 1);
    
    const wordAccuracy = res.accuracy;
    const currentAccuracy = (wordAccuracy.correctWords / wordAccuracy.totalWords) * 100;
    setAccuracy(currentAccuracy);
    
    // Cập nhật điểm nếu là lần kiểm tra đầu tiên
    if (attemptCount === 0) {
      setScore(prev => ({
        correct: prev.correct + (currentAccuracy >= 80 ? 1 : 0),
        total: prev.total + 1
      }));
    }

    // Nếu đúng hết các từ, tự động chuyển sau 2 giây
    if (wordAccuracy.isComplete) {
      const timeout = setTimeout(() => {
        moveToNextItem();
      }, 2000);
      setAutoAdvanceTimeout(timeout);
    }

    // Lưu câu đã hoàn thành
    if (currentUser && currentAccuracy > 0) {
      saveCompletedSentence(partId, selectedTestIndex, currentIdx, currentAccuracy);
    }
  };

  // Cập nhật hàm bật/tắt tự động sửa lỗi
  const toggleAutoCorrect = () => {
    setAutoCorrect(prevState => !prevState);
    
    // Khi bật tự động sửa lỗi, kiểm tra lại đầu vào nếu đã kiểm tra trước đó
    if (!autoCorrect && isChecked && input.trim() !== '') {
      const transcript = getCurrentTranscript();
      if (transcript) {
        const res = compareInput(input, transcript);
        setSegments(res);
      }
    }
  };

  // Hiển thị đáp án
  const displayAnswer = () => {
    const transcript = getCurrentTranscript();
    if (!transcript) return;
    
    setInput(transcript);
    setShowAnswer(true);
    setIsChecked(true);
    setAccuracy(100);
    
    // Tự động chuyển câu sau 3 giây
    const timeout = setTimeout(() => {
      moveToNextItem();
    }, 3000);
    setAutoAdvanceTimeout(timeout);
  };

  // Chuyển tới câu/dòng tiếp theo
  const moveToNextItem = () => {
    if (autoAdvanceTimeout) {
      clearTimeout(autoAdvanceTimeout);
      setAutoAdvanceTimeout(null);
    }
    
    // Xử lý riêng cho Part 3/4
    if (isDialogueOrTalk) {
      const currentTranscript = getCurrentTranscript();
      
      if (currentTranscript) {
        // Thêm câu đã hoàn thành vào danh sách hiển thị
        setCompletedSentences(prev => [...prev, currentTranscript]);
        
        // Kiểm tra xem còn dòng tiếp theo trong đối thoại/bài nói không
        if (currentLineIdx < dialogLines.length - 1) {
          // Nếu còn, chuyển tới dòng tiếp theo
          setCurrentLineIdx(prevIdx => prevIdx + 1);
          resetState();
          return;
        }
      }
    }
    
    // Xử lý chung: chuyển tới câu tiếp theo hoặc kết thúc
    if (currentIdx < sentences.length - 1) {
      setCurrentIdx(currentIdx + 1);
      resetState();
      setCompletedSentences([]);
      setCurrentLineIdx(0);
    } else {
      setShowScore(true);
    }
    
    // Lưu vị trí học tập
    if (currentUser) {
      saveLastPosition(partId, selectedTestIndex, currentIdx + 1);
    }
  };

  // Quay lại câu trước
  const goToPreviousQuestion = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
      resetState();
      setCompletedSentences([]);
      setCurrentLineIdx(0);
    }
  };

  // Phát audio hiện tại
  const playCurrentAudio = () => {
    if (!currentSentence) return;
    
    setErrorMessage('');
    
    if (isDialogueOrTalk) {
      const currentLine = getCurrentLine();
      if (currentLine && currentLine.startTime !== undefined && currentLine.endTime !== undefined) {
        console.log(`Playing dialogue/talk line: ${currentLine.startTime}s to ${currentLine.endTime}s`);
        playSegment({
          startTime: currentLine.startTime,
          endTime: currentLine.endTime
        });
      }
    } else if (currentSentence.startTime !== undefined && currentSentence.endTime !== undefined) {
      console.log('Playing current audio segment');
      playSegment({
        startTime: currentSentence.startTime,
        endTime: currentSentence.endTime
      });
    }
  };

  // Kiểm tra xem có phải là câu hoặc dòng cuối cùng không
  const isLastItem = () => {
    if (isDialogueOrTalk) {
      return currentIdx === sentences.length - 1 && currentLineIdx === dialogLines.length - 1;
    } else {
      return currentIdx === sentences.length - 1;
    }
  };

  // Xử lý phím tắt
  const handleKeyDown = useCallback((e) => {
    // F1: Mở/đóng hướng dẫn
    if (e.key === 'F1') {
      e.preventDefault();
      // Sẽ được xử lý bởi component HelpGuide
    }
    
    // Space: Phát/tạm dừng audio
    if (e.code === 'Space' && !e.target.matches('textarea, input')) {
      e.preventDefault();
      playCurrentAudio();
    }
    
    // Ctrl + Enter: Kiểm tra đáp án
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      if (!showAnswer && getCurrentTranscript() && input.trim() !== '') {
        checkAnswer();
      }
    }
    
    // Alt + R: Nghe lại
    if (e.key === 'r' && e.altKey) {
      e.preventDefault();
      setErrorMessage('');
      replay();
    }
    
    // Alt + S: Phát chậm
    if (e.key === 's' && e.altKey) {
      e.preventDefault();
      toggleSlowMotion();
    }
    
    // Alt + A: Hiển thị đáp án
    if (e.key === 'a' && e.altKey) {
      e.preventDefault();
      if (!showAnswer && getCurrentTranscript()) {
        displayAnswer();
      }
    }
    
    // Alt + C: Bật/tắt tự động sửa
    if (e.key === 'c' && e.altKey) {
      e.preventDefault();
      if (!showAnswer && getCurrentTranscript()) {
        toggleAutoCorrect();
      }
    }
    
    // Alt + →: Câu tiếp theo
    if (e.key === 'ArrowRight' && e.altKey) {
      e.preventDefault();
      if ((!isChecked && !showAnswer) && isLastItem()) return;
      moveToNextItem();
    }
    
    // Alt + ←: Câu trước
    if (e.key === 'ArrowLeft' && e.altKey) {
      e.preventDefault();
      if (currentIdx > 0) {
        goToPreviousQuestion();
      }
    }
  }, [
    currentIdx, 
    input, 
    isChecked, 
    showAnswer, 
    playCurrentAudio, 
    checkAnswer, 
    replay, 
    toggleSlowMotion, 
    displayAnswer, 
    toggleAutoCorrect, 
    moveToNextItem, 
    goToPreviousQuestion, 
    getCurrentTranscript,
    isLastItem
  ]);
  
  // Đăng ký sự kiện phím tắt
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

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
                setCompletedSentences([]);
                setCurrentLineIdx(0);
                
                // Nếu là Part 3/4, khởi tạo lại dữ liệu đối thoại/bài nói
                if (isDialogueOrTalk && sentences.length > 0) {
                  if (isPart3 && sentences[0].conversation) {
                    setDialogLines(sentences[0].conversation);
                  } else if (isPart4 && sentences[0].talk) {
                    setDialogLines(sentences[0].talk);
                  }
                }
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
    <div className="practice-container">
      {!currentUser ? (
        <div className="login-required-message">
          <h2>Bạn cần đăng nhập để luyện tập</h2>
          <p>Vui lòng quay lại trang chủ để đăng nhập.</p>
          <button 
            className="return-home-button"
            onClick={() => navigate('/')}
          >
            Quay lại trang chủ
          </button>
        </div>
      ) : (
        <>
          {!currentTest ? (
            <div className="test-selection">
              <h2>Chọn đề luyện tập</h2>
              <TestSelector 
                onSelectTest={handleSelectTest} 
                partId={partId}
              />
            </div>
          ) : (
            <div className="practice-content">
              <div className="practice-header">
                <h2>{getPartName(partId)}</h2>
                <div className="practice-meta">
                  <span className="test-name">{currentTest.name}</span>
                </div>
                
                {/* Hiển thị tiến độ học tập */}
                <ProgressIndicator 
                  partId={partId} 
                  testIndex={selectedTestIndex}
                />
              </div>

              <div className="content-header">
                <h2>Part {partId} - {getPartName(partId)}</h2>
                <div className="progress-container">
                  <div className="progress-bar" style={{ width: `${progress}%` }}></div>
                </div>
                <div className="progress-text">
                  Câu {currentIdx + 1} / {sentences.length} - Hoàn thành {Math.floor(progress)}%
                  {isDialogueOrTalk && dialogLines.length > 0 && (
                    <span> - Dòng {currentLineIdx + 1}/{dialogLines.length}</span>
                  )}
                </div>
              </div>

              <div className="practice-area">
                <audio 
                  ref={audioRef} 
                  src={audioSrc} 
                  preload="auto" 
                  style={{ display: 'none' }} 
                />

                {errorMessage && (
                  <div className="error-message">
                    <i className="fas fa-exclamation-circle"></i>
                    {errorMessage}
                  </div>
                )}

                <div className="audio-status">
                  {isLoading ? (
                    <div className="loading-status">
                      <i className="fas fa-circle-notch fa-spin"></i> Đang tải audio...
                    </div>
                  ) : isPlaying ? (
                    <div className="playing-status">
                      <i className="fas fa-volume-up"></i> Đang phát audio
                    </div>
                  ) : null}
                </div>

                <div className="control-buttons">
                  <button 
                    className="btn btn-primary" 
                    onClick={() => {
                      setErrorMessage('');
                      replay();
                    }}
                    disabled={isLoading}
                    title="Nghe lại (Alt+R)"
                  >
                    <i className="fas fa-play"></i>
                    Nghe lại
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    onClick={toggleSlowMotion}
                    title="Phát chậm (Alt+S)"
                  >
                    <i className="fas fa-clock"></i>
                    Phát chậm
                  </button>
                  <button 
                    className="btn btn-outline" 
                    onClick={displayAnswer}
                    disabled={showAnswer || !getCurrentTranscript()}
                    title="Hiển thị đáp án (Alt+A)"
                  >
                    <i className="fas fa-eye"></i>
                    Hiển thị đáp án
                  </button>
                  <button 
                    className="btn btn-primary" 
                    disabled={isLoading || !getCurrentTranscript()}
                    onClick={playCurrentAudio}
                    title="Nghe câu hiện tại (Space)"
                  >
                    <i className="fas fa-headphones"></i>
                    Nghe câu hiện tại
                  </button>
                  <button 
                    className={`btn ${autoCorrect ? 'btn-success' : 'btn-outline'}`} 
                    onClick={toggleAutoCorrect}
                    disabled={!getCurrentTranscript() || showAnswer}
                    title="Bật/tắt tự động sửa (Alt+C)"
                  >
                    <i className="fas fa-magic"></i>
                    {autoCorrect ? 'Tắt tự động sửa' : 'Bật tự động sửa'}
                  </button>
                  
                  {/* Thêm component HelpGuide */}
                  <HelpGuide />
                </div>

                {/* Hiển thị đoạn hội thoại hoặc bài nói đã hoàn thành */}
                {isDialogueOrTalk && completedSentences.length > 0 && (
                  <DialogueDisplay completedSentences={completedSentences} />
                )}

                <div className="input-area">
                  <label htmlFor="userInput" className="input-label">
                    <i className="fas fa-keyboard"></i>
                    Nhập câu bạn nghe được:
                  </label>
                  
                  {showAnswer ? (
                    <div className="answer-display">
                      <div className="answer-label">Đáp án:</div>
                      <div className="answer-text">{getCurrentTranscript()}</div>
                    </div>
                  ) : (
                    <InteractiveInput
                      id="userInput"
                      value={input}
                      onChange={handleInputChange}
                      onSubmit={checkAnswer}
                      segments={segments}
                      showFeedback={isChecked}
                      autoCorrect={autoCorrect}
                      accuracy={isChecked && segments && segments.accuracy ? {
                        value: accuracy,
                        isComplete: segments.accuracy.isComplete,
                        attemptCount: attemptCount
                      } : null}
                    />
                  )}
                </div>

                <div className="navigation-buttons">
                  <button 
                    className="btn btn-outline" 
                    onClick={goToPreviousQuestion}
                    disabled={currentIdx === 0}
                    title="Câu trước (Alt+←)"
                  >
                    <i className="fas fa-arrow-left"></i>
                    Câu trước
                  </button>
                  <button 
                    className="btn btn-primary" 
                    onClick={checkAnswer}
                    disabled={showAnswer || !getCurrentTranscript() || input.trim() === ''}
                    title="Kiểm tra đáp án (Ctrl+Enter)"
                  >
                    <i className="fas fa-check"></i>
                    Kiểm tra đáp án
                  </button>
                  <button 
                    className="btn btn-outline" 
                    onClick={moveToNextItem}
                    disabled={(!isChecked && !showAnswer) && isLastItem()}
                    title="Tiếp theo (Alt+→)"
                  >
                    <i className="fas fa-arrow-right"></i>
                    {isLastItem() ? 'Kết thúc' : 'Tiếp theo'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
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
