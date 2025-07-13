import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './PracticePage.css';

import InteractiveInput from '../components/InteractiveInput';
import DialogueDisplay from '../components/DialogueDisplay';
import TestSelector from '../components/TestSelector';
import HelpGuide from '../components/HelpGuide';
import ProgressIndicator from '../components/ProgressIndicator';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ProgressBar from '../components/ui/ProgressBar';
import { useToast, ToastContainer } from '../components/ui/Toast';
import { useUser } from '../contexts/UserContext';
import { useProgress } from '../contexts/ProgressContext';

import compareInput from '../utils/compareInput';
import useAudioPlayer from '../hooks/useAudioPlayer';
// eslint-disable-next-line no-unused-vars
import allTests, { getTestByIndex } from '../data/testsIndex';

// Helper function to get part name
const getPartName = (partId) => {
  const partNames = {
    '1': 'Photographs',
    '2': 'Question-Response',
    '3': 'Conversations',
    '4': 'Talks'
  };
  return partNames[partId] || `Part ${partId}`;
};

function PracticePage({ initialSelectMode = false }) {
  const { partId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useUser();
  const {
    saveCompletedSentence,
    saveLastPosition,
    isCompletedSentence,
    getLastPosition
  } = useProgress();

  // Toast notifications
  const { toasts, success, error, warning, info, removeToast } = useToast();
  
  console.log("PracticePage render - partId:", partId, "initialSelectMode:", initialSelectMode);
  
  // Determine if we should show test selection based on URL
  const showTestSelection = window.location.pathname.includes('/select') || initialSelectMode;
  
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

  // Thêm state cho tính năng tự động phát lại audio
  const [autoReplayEnabled, setAutoReplayEnabled] = useState(false);
  const [autoReplayInterval, setAutoReplayInterval] = useState(10); // 10 giây mặc định
  const [autoReplayTimeout, setAutoReplayTimeout] = useState(null);
  const [autoPlayTimeout, setAutoPlayTimeout] = useState(null);
  
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

  // Khởi tạo useAudioPlayer trước
  const {
    audioRef,
    playSegment,
    replay,
    toggleSlowMotion,
    isLoading,
    isPlaying,
    isSlow,
  } = useAudioPlayer({
    audioSrc
  });

  const resetState = useCallback(() => {
    setInput('');
    setSegments([]);
    setIsChecked(false);
    setShowAnswer(false);
    setAccuracy(0);
    setAttemptCount(0);
    setErrorMessage('');

    // Cleanup tất cả các timeout
    if (autoAdvanceTimeout) {
      clearTimeout(autoAdvanceTimeout);
      setAutoAdvanceTimeout(null);
    }
    if (autoReplayTimeout) {
      clearTimeout(autoReplayTimeout);
      setAutoReplayTimeout(null);
    }
    if (autoPlayTimeout) {
      clearTimeout(autoPlayTimeout);
      setAutoPlayTimeout(null);
    }
  }, [autoAdvanceTimeout, autoReplayTimeout, autoPlayTimeout]);

  // Handle back to test selection
  const handleBackToTestSelection = useCallback(() => {
    console.log("Going back to test selection");

    // Stop audio if playing
    if (audioRef.current) {
      audioRef.current.pause();
    }

    // Reset states
    setSelectedTestIndex(null);
    setCurrentTest(null);

    // Navigate to select route
    navigate(`/practice/${partId}/select`);
  }, [navigate, partId, audioRef]);

  // Reset when part changes - simplified
  useEffect(() => {
    // Reset test selection when part changes
    setSelectedTestIndex(null);
    setCurrentTest(null);
    setSentences([]);
    setCurrentIdx(0);
    setCurrentSentence({});
    setAudioSrc('');
  }, [partId]);

  // Load last position when conditions are met - moved after handleSelectTest definition

  // Lấy tên file audio chuẩn từ sourceTest
  const getAudioFileName = useCallback((sourceTest) => {
    if (!sourceTest) return '';

    const testNumber = sourceTest.match(/\d+/);
    if (!testNumber) return '';

    const formattedNumber = testNumber[0].padStart(2, '0');
    return `Test_${formattedNumber}.mp3`;
  }, []);

  // Lấy câu tiếp theo chưa hoàn thành
  const findNextUncompletedSentence = useCallback((startIdx) => {
    console.log("Tìm câu tiếp theo chưa hoàn thành từ vị trí:", startIdx);
    if (!currentUser || sentences.length === 0 || !selectedTestIndex) return startIdx;

    // Special handling for Part 2 - only consider questions
    if (partId === '2') {
      const isQuestion = (sentence) => sentence && sentence.id && sentence.id.includes('_question');

      // Find next uncompleted question from current position
      for (let i = startIdx; i < sentences.length; i++) {
        const sentence = sentences[i];
        if (isQuestion(sentence) && !isCompletedSentence(partId, selectedTestIndex, i)) {
          console.log(`Found uncompleted question: ${i}`);
          return i;
        }
      }

      // If not found, search from beginning
      for (let i = 0; i < startIdx; i++) {
        const sentence = sentences[i];
        if (isQuestion(sentence) && !isCompletedSentence(partId, selectedTestIndex, i)) {
          console.log(`Found uncompleted question (from start): ${i}`);
          return i;
        }
      }

      // If all completed, return first question
      for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i];
        if (isQuestion(sentence)) {
          console.log(`All questions completed, returning to first: ${i}`);
          return i;
        }
      }

      return startIdx;
    }

    // Xử lý cho các Part khác
    // Kiểm tra từ vị trí hiện tại đến cuối
    for (let i = startIdx; i < sentences.length; i++) {
      if (!isCompletedSentence(partId, selectedTestIndex, i)) {
        console.log(`Tìm thấy câu chưa hoàn thành: ${i}`);
        return i;
      }
    }

    // Nếu không tìm thấy, quay lại từ đầu
    for (let i = 0; i < startIdx; i++) {
      if (!isCompletedSentence(partId, selectedTestIndex, i)) {
        console.log(`Tìm thấy câu chưa hoàn thành (từ đầu): ${i}`);
        return i;
      }
    }

    // Nếu tất cả câu đã hoàn thành
    console.log("Tất cả câu đã hoàn thành!");
    return startIdx;
  }, [currentUser, sentences.length, selectedTestIndex, partId, isCompletedSentence, sentences]);

  // Xử lý khi chọn đề
  const handleSelectTest = useCallback((testIndex) => {
    console.log("handleSelectTest được gọi với testIndex:", testIndex);
    const test = getTestByIndex(testIndex);
    if (test) {
      console.log("Đã tìm thấy đề thi:", test.name || `Test ${testIndex + 1}`);
      setSelectedTestIndex(testIndex);
      setCurrentTest(test);
      
      // Navigate away from select route when test is selected
      if (window.location.pathname.includes('/select')) {
        navigate(`/practice/${partId}`, { replace: true });
      }
      
      const testSentences = test[partKey] || [];
      console.log(`Đề thi có ${testSentences.length} câu trong part${partId}`);
      setSentences(testSentences);
      
      if (testSentences.length > 0) {
        // Tìm câu đầu tiên phù hợp
        let firstSentenceIndex = 0;
        
        // Đối với Part 2, tìm câu hỏi đầu tiên
        if (partId === '2') {
          for (let i = 0; i < testSentences.length; i++) {
            if (testSentences[i].id && testSentences[i].id.includes('_question')) {
              firstSentenceIndex = i;
              break;
            }
          }
        }
        
        const firstSentence = testSentences[firstSentenceIndex];
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
        
        console.log("Audio source đã được đặt:", `${process.env.PUBLIC_URL}/audio/${audioFileName}`);
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
      
      // Lưu vị trí học tập - chỉ lưu sau khi đã thiết lập tất cả state
      if (currentUser) {
        // Sử dụng setTimeout để đảm bảo các state đã được cập nhật
        setTimeout(() => {
          // Tìm câu đầu tiên chưa hoàn thành
          const firstUncompletedIndex = findNextUncompletedSentence(0);
          console.log(`Tải câu chưa hoàn thành đầu tiên: ${firstUncompletedIndex}`);
          
          // Cập nhật state
          if (firstUncompletedIndex > 0) {
            setCurrentIdx(firstUncompletedIndex);
          }
          
          // Lưu vị trí học tập
          saveLastPosition(partId, testIndex, firstUncompletedIndex);
        }, 100);
      }
    } else {
      console.error("Không tìm thấy đề thi với chỉ số:", testIndex);
    }
  }, [currentUser, partId, partKey, isDialogueOrTalk, isPart3, isPart4, saveLastPosition, resetState, findNextUncompletedSentence, getAudioFileName, navigate]);

  // Load last position when conditions are met - placed after handleSelectTest definition
  useEffect(() => {
    if (!currentUser || !partId || showTestSelection || selectedTestIndex !== null) {
      return;
    }

    const lastPosition = getLastPosition(partId);
    if (lastPosition && lastPosition.testIndex !== undefined) {
      console.log(`Loading last position: Part ${partId}, Test ${lastPosition.testIndex}, Sentence ${lastPosition.sentenceIndex}`);

      // Use setTimeout to avoid calling handleSelectTest before it's defined
      const timer = setTimeout(() => {
        handleSelectTest(lastPosition.testIndex);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [currentUser, partId, getLastPosition, selectedTestIndex, showTestSelection, handleSelectTest]);

  // Update current sentence when index changes
  useEffect(() => {
    if (sentences.length > 0 && currentIdx >= 0 && currentIdx < sentences.length) {
      const sentence = sentences[currentIdx];
      setCurrentSentence(sentence);

      // Handle dialogue or talk in Part 3 and Part 4
      if (isDialogueOrTalk) {
        try {
          if (isPart3 && sentence.conversation) {
            console.log(`Loading dialogue for Part 3, sentence ${currentIdx + 1}, lines: ${sentence.conversation.length}`);
            setDialogLines(sentence.conversation);
            setCurrentLineIdx(0);
          } else if (isPart4 && sentence.talk) {
            console.log(`Loading talk for Part 4, sentence ${currentIdx + 1}, lines: ${sentence.talk.length}`);
            setDialogLines(sentence.talk);
            setCurrentLineIdx(0);
          } else {
            console.error(`No dialogue/talk data found for sentence ${currentIdx + 1}`);
            setDialogLines([]);
            setCurrentLineIdx(0);
          }
        } catch (error) {
          console.error(`Error loading dialogue/talk data: ${error.message}`);
          setDialogLines([]);
          setCurrentLineIdx(0);
        }
        setCompletedSentences([]);
      }

      // Update audio source
      const audioFileName = getAudioFileName(sentence.sourceTest);
      setAudioSrc(`${process.env.PUBLIC_URL}/audio/${audioFileName}`);
    }
  }, [currentIdx, sentences, isPart3, isPart4, isDialogueOrTalk, getAudioFileName]);

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
  const getCurrentLine = useCallback(() => {
    if (!isDialogueOrTalk || !dialogLines || dialogLines.length === 0) {
      return null;
    }

    // Kiểm tra xem chỉ số hiện tại có hợp lệ không
    if (currentLineIdx < 0 || currentLineIdx >= dialogLines.length) {
      console.error(`Chỉ số dòng không hợp lệ: ${currentLineIdx}, tổng số dòng: ${dialogLines.length}`);
      // Trả về dòng đầu tiên nếu chỉ số không hợp lệ
      return dialogLines[0];
    }

    const currentLine = dialogLines[currentLineIdx];
    if (!currentLine) {
      console.error(`Không tìm thấy dòng với chỉ số ${currentLineIdx}`);
      return null;
    }

    return currentLine;
  }, [isDialogueOrTalk, dialogLines, currentLineIdx]);

  // Auto-play audio when sentence or line changes - với kiểm soát tốt hơn
  useEffect(() => {
    if (!currentSentence || !audioSrc) return;

    // Cleanup timeout cũ trước khi tạo mới
    if (autoPlayTimeout) {
      clearTimeout(autoPlayTimeout);
      setAutoPlayTimeout(null);
    }

    const timer = setTimeout(() => {
      try {
        // Kiểm tra lại điều kiện trước khi phát
        if (!currentSentence || !audioSrc) return;

        // Handle differently for Part 3/4 and other Parts
        if (isDialogueOrTalk) {
          const currentLine = getCurrentLine();
          if (currentLine && currentLine.startTime !== undefined && currentLine.endTime !== undefined) {
            console.log(`Auto-playing dialogue/talk line: ${currentLine.startTime}s to ${currentLine.endTime}s`);
            playSegment({
              startTime: currentLine.startTime,
              endTime: currentLine.endTime
            });
          }
        } else if (currentSentence.startTime !== undefined && currentSentence.endTime !== undefined) {
          console.log(`Auto-playing segment: ${currentSentence.startTime}s to ${currentSentence.endTime}s`);
          playSegment({
            startTime: currentSentence.startTime,
            endTime: currentSentence.endTime
          });
        }
      } catch (error) {
        console.error('Error auto-playing audio:', error);
      }
    }, 500);

    setAutoPlayTimeout(timer);

    return () => {
      clearTimeout(timer);
      setAutoPlayTimeout(null);
    };
  }, [currentIdx, currentLineIdx, currentSentence, audioSrc, playSegment, isDialogueOrTalk, getCurrentLine]);



  // Lấy transcript của câu hiện tại
  const getCurrentTranscript = useCallback(() => {
    if (!currentSentence) return '';

    // Xử lý khác nhau cho Part 3/4 và các Part khác
    if (isDialogueOrTalk) {
      const currentLine = getCurrentLine();
      return currentLine ? currentLine.transcript : '';
    } else {
      // Handle Part 2 with different data formats
      if (partId === '2') {
        // If this is a question, find the corresponding answer
        if (currentSentence.id && currentSentence.id.includes('_question')) {
          const questionId = currentSentence.id;
          const baseId = questionId.replace('_question', '');

          // Look for answer in sentences - prioritize _a (first answer) for dictation practice
          const answerSentence = sentences.find(s =>
            s.id === `${baseId}_answer` || s.id === `${baseId}_a`
          );

          if (answerSentence) {
            return answerSentence.transcript;
          }

          console.error(`No answer found for question: ${questionId}`);
          return '';
        }
        // If this is an answer, return its transcript
        return currentSentence.transcript || '';
      }

      return currentSentence.transcript || '';
    }
  }, [currentSentence, isDialogueOrTalk, getCurrentLine, partId, sentences]);



  // Cập nhật hàm handleInputChange để không kiểm tra realtime
  const handleInputChange = (val) => {
    console.log("handleInputChange called with:", val);
    setInput(val);
    
    if (showAnswer) return;
    
    // Xóa phần kiểm tra realtime
    if (isChecked) {
      // Chỉ cập nhật input, không kiểm tra lại
      setIsChecked(false);
    }
  };

  // Cập nhật hàm kiểm tra đáp án
  const checkAnswer = useCallback(() => {
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

      // Show toast notification based on accuracy
      if (currentAccuracy >= 90) {
        success(`Tuyệt vời! Độ chính xác: ${Math.round(currentAccuracy)}%`, 2000);
      } else if (currentAccuracy >= 70) {
        success(`Tốt! Độ chính xác: ${Math.round(currentAccuracy)}%`, 2000);
      } else if (currentAccuracy >= 50) {
        warning(`Khá! Độ chính xác: ${Math.round(currentAccuracy)}%`, 2000);
      } else {
        error(`Cần cố gắng hơn! Độ chính xác: ${Math.round(currentAccuracy)}%`, 2000);
      }
    }

    // Không còn tự động chuyển câu khi đúng hết các từ
    if (autoAdvanceTimeout) {
      clearTimeout(autoAdvanceTimeout);
      setAutoAdvanceTimeout(null);
    }

    // Lưu câu đã hoàn thành
    if (currentUser && currentAccuracy > 0) {
      // Sử dụng setTimeout để đảm bảo các state đã được cập nhật
      setTimeout(() => {
        saveCompletedSentence(partId, selectedTestIndex, currentIdx, currentAccuracy);
      }, 0);
    }
  }, [getCurrentTranscript, input, attemptCount, success, warning, error, autoAdvanceTimeout, currentUser, partId, selectedTestIndex, currentIdx, saveCompletedSentence]);

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
    
    // Hủy timeout nếu có
    if (autoAdvanceTimeout) {
      clearTimeout(autoAdvanceTimeout);
      setAutoAdvanceTimeout(null);
    }
  };

  // Chuyển tới câu/dòng tiếp theo - Logic cải thiện
  const moveToNextItem = useCallback(() => {
    console.log("moveToNextItem được gọi");
    console.log("State hiện tại:", {
      currentIdx,
      sentencesLength: sentences.length,
      isDialogueOrTalk,
      currentLineIdx,
      dialogLinesLength: dialogLines ? dialogLines.length : 0,
      showAnswer,
      isChecked
    });

    // Clear any existing timeouts
    if (autoAdvanceTimeout) {
      clearTimeout(autoAdvanceTimeout);
      setAutoAdvanceTimeout(null);
    }

    // Xử lý riêng cho Part 3/4 (Dialogue/Talk)
    if (isDialogueOrTalk && dialogLines && dialogLines.length > 0) {
      const currentTranscript = getCurrentTranscript();

      if (currentTranscript) {
        // Thêm câu đã hoàn thành vào danh sách hiển thị
        setCompletedSentences(prev => [...prev, currentTranscript]);

        // Lưu tiến độ cho dòng hiện tại
        if (currentUser) {
          saveCompletedSentence(partId, selectedTestIndex, currentIdx, {
            userInput: input,
            transcript: currentTranscript,
            accuracy: accuracy,
            lineIndex: currentLineIdx
          });
        }

        // Kiểm tra xem còn dòng tiếp theo trong đối thoại/bài nói không
        if (currentLineIdx < dialogLines.length - 1) {
          console.log("Chuyển sang dòng tiếp theo trong đối thoại/bài nói");
          setCurrentLineIdx(prevIdx => prevIdx + 1);
          resetState();
          return;
        } else {
          console.log("Đã hoàn thành tất cả dòng, chuyển sang câu tiếp theo");
          // Reset dialogue state và chuyển sang câu tiếp theo
          setCompletedSentences([]);
          setCurrentLineIdx(0);
        }
      }
    }

    // Xử lý cho Part 2 - chỉ điều hướng giữa các câu hỏi
    if (partId === '2') {
      const isQuestion = (sentence) => sentence && sentence.id && sentence.id.includes('_question');

      // Tìm câu hỏi tiếp theo sau vị trí hiện tại
      let nextIndex = currentIdx + 1;
      while (nextIndex < sentences.length && !isQuestion(sentences[nextIndex])) {
        nextIndex++;
      }

      if (nextIndex < sentences.length) {
        console.log(`Chuyển đến câu hỏi tiếp theo: ${nextIndex}`);
        setCurrentIdx(nextIndex);
        resetState();

        // Lưu vị trí học tập
        if (currentUser) {
          setTimeout(() => {
            saveLastPosition(partId, selectedTestIndex, nextIndex);
          }, 0);
        }
        return;
      } else {
        console.log("Đã đến câu hỏi cuối cùng, hiển thị điểm số");
        setShowScore(true);
        return;
      }
    }

    // Xử lý chung cho các Part khác
    const nextIndex = currentIdx + 1;

    if (nextIndex < sentences.length) {
      console.log(`Chuyển sang câu tiếp theo: ${nextIndex}`);

      // Lưu tiến độ cho câu hiện tại nếu đã kiểm tra
      if (currentUser && isChecked && getCurrentTranscript()) {
        saveCompletedSentence(partId, selectedTestIndex, currentIdx, {
          userInput: input,
          transcript: getCurrentTranscript(),
          accuracy: accuracy
        });
      }

      setCurrentIdx(nextIndex);
      resetState();
      setCompletedSentences([]);
      setCurrentLineIdx(0);

      // Lưu vị trí học tập
      if (currentUser) {
        setTimeout(() => {
          saveLastPosition(partId, selectedTestIndex, nextIndex);
        }, 0);
      }
    } else {
      console.log("Đã đến câu cuối cùng, hiển thị điểm số");

      // Lưu tiến độ cho câu cuối cùng nếu đã kiểm tra
      if (currentUser && isChecked && getCurrentTranscript()) {
        saveCompletedSentence(partId, selectedTestIndex, currentIdx, {
          userInput: input,
          transcript: getCurrentTranscript(),
          accuracy: accuracy
        });
      }

      setShowScore(true);
    }
  }, [
    autoAdvanceTimeout,
    isDialogueOrTalk,
    getCurrentTranscript,
    currentLineIdx,
    dialogLines,
    resetState,
    currentIdx,
    sentences.length,
    currentUser,
    partId,
    selectedTestIndex,
    saveLastPosition,
    saveCompletedSentence,
    input,
    accuracy,
    isChecked,
    showAnswer
  ]);

  // Quay lại câu trước
  const goToPreviousQuestion = useCallback(() => {
    if (currentIdx > 0) {
      const prevIndex = currentIdx - 1;
      setCurrentIdx(prevIndex);
      resetState();
      setCompletedSentences([]);
      setCurrentLineIdx(0);
      
      // Lưu vị trí học tập
      if (currentUser) {
        setTimeout(() => {
          console.log(`Lưu vị trí (quay lại): Part ${partId}, Test ${selectedTestIndex}, Câu ${prevIndex}`);
          saveLastPosition(partId, selectedTestIndex, prevIndex);
        }, 0);
      }
    }
  }, [currentIdx, resetState, currentUser, partId, selectedTestIndex, saveLastPosition]);

  // Phát audio hiện tại
  const playCurrentAudio = useCallback(() => {
    if (!currentSentence) {
      console.error("Không thể phát audio: không có câu hiện tại");
      setErrorMessage('Không thể phát audio: không có câu hiện tại');
      return;
    }

    setErrorMessage('');

    try {
      if (isDialogueOrTalk) {
        const currentLine = getCurrentLine();
        if (currentLine && currentLine.startTime !== undefined && currentLine.endTime !== undefined) {
          console.log(`Playing dialogue/talk line: ${currentLine.startTime}s to ${currentLine.endTime}s`);
          playSegment({
            startTime: currentLine.startTime,
            endTime: currentLine.endTime
          });
        } else {
          console.error("Không thể phát audio: thông tin thời gian không hợp lệ");
          setErrorMessage('Không thể phát audio: thông tin thời gian không hợp lệ');
        }
      } else if (currentSentence.startTime !== undefined && currentSentence.endTime !== undefined) {
        console.log('Playing current audio segment');
        playSegment({
          startTime: currentSentence.startTime,
          endTime: currentSentence.endTime
        });
      } else {
        console.error("Không thể phát audio: thông tin thời gian không hợp lệ");
        setErrorMessage('Không thể phát audio: thông tin thời gian không hợp lệ');
      }
    } catch (error) {
      console.error(`Lỗi khi phát audio: ${error.message}`);
      setErrorMessage(`Lỗi khi phát audio: ${error.message}`);
    }
  }, [currentSentence, isDialogueOrTalk, getCurrentLine, playSegment]);

  // Bật/tắt tự động phát lại audio
  const toggleAutoReplay = useCallback(() => {
    setAutoReplayEnabled(prev => {
      const newValue = !prev;
      console.log(`Auto replay ${newValue ? 'enabled' : 'disabled'}`);
      return newValue;
    });
  }, []);

  // Bắt đầu tự động phát lại
  const startAutoReplay = useCallback(() => {
    // Dừng timer cũ nếu có
    if (autoReplayTimeout) {
      clearTimeout(autoReplayTimeout);
      setAutoReplayTimeout(null);
    }

    if (!autoReplayEnabled || !currentSentence || !audioSrc) {
      return;
    }

    const scheduleNextReplay = () => {
      const timer = setTimeout(() => {
        if (autoReplayEnabled && currentSentence && audioSrc) {
          console.log(`Auto-replaying after ${autoReplayInterval} seconds`);
          playCurrentAudio();
          // Lên lịch cho lần phát tiếp theo
          scheduleNextReplay();
        }
      }, autoReplayInterval * 1000);
      setAutoReplayTimeout(timer);
    };

    scheduleNextReplay();
  }, [autoReplayEnabled, autoReplayInterval, currentSentence, audioSrc, autoReplayTimeout, playCurrentAudio]);

  // Dừng tự động phát lại
  const stopAutoReplay = useCallback(() => {
    if (autoReplayTimeout) {
      clearTimeout(autoReplayTimeout);
      setAutoReplayTimeout(null);
      console.log('Auto replay stopped');
    }
  }, [autoReplayTimeout]);

  // Thay đổi khoảng thời gian tự động phát lại
  const changeAutoReplayInterval = useCallback((newInterval) => {
    setAutoReplayInterval(newInterval);
    console.log(`Auto replay interval changed to ${newInterval} seconds`);

    // Nếu đang bật tự động phát lại, khởi động lại với interval mới
    if (autoReplayEnabled) {
      stopAutoReplay();
      setTimeout(() => startAutoReplay(), 100);
    }
  }, [autoReplayEnabled, stopAutoReplay, startAutoReplay]);

  // Quản lý tự động phát lại khi bật/tắt hoặc khi chuyển câu
  useEffect(() => {
    if (autoReplayEnabled && currentSentence && audioSrc) {
      // Bắt đầu tự động phát lại khi bật tính năng hoặc chuyển câu mới
      startAutoReplay();
    } else {
      // Dừng tự động phát lại khi tắt tính năng hoặc không có câu/audio
      stopAutoReplay();
    }

    // Cleanup khi component unmount hoặc dependencies thay đổi
    return () => {
      stopAutoReplay();
    };
  }, [autoReplayEnabled, currentIdx, currentLineIdx, currentSentence, audioSrc, startAutoReplay, stopAutoReplay]);

  // Kiểm tra xem có phải là câu hoặc dòng cuối cùng không
  const isLastItem = useCallback(() => {
    if (isDialogueOrTalk) {
      return currentIdx === sentences.length - 1 && currentLineIdx === dialogLines.length - 1;
    } else {
      return currentIdx === sentences.length - 1;
    }
  }, [isDialogueOrTalk, currentIdx, sentences.length, currentLineIdx, dialogLines.length]);

  // Xử lý phím tắt
  const handleKeyDown = useCallback((e) => {
    // Thêm log để debug
    console.log("Key pressed:", e.key, e.code, e.target.tagName);
    
    // Bỏ qua tất cả sự kiện phím tắt nếu đang focus vào textarea
    if (e.target.matches('textarea, input')) {
      // Chỉ xử lý Ctrl+Enter khi đang ở trong textarea
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (!showAnswer && getCurrentTranscript() && input.trim() !== '') {
          checkAnswer();
        }
      }
      return;
    }
    
    // F1: Mở/đóng hướng dẫn
    if (e.key === 'F1') {
      e.preventDefault();
      // Sẽ được xử lý bởi component HelpGuide
    }
    
    // Ctrl+Space: Nghe lại (thay thế Ctrl+R)
    if (e.code === 'Space' && e.ctrlKey && !e.shiftKey) {
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
      console.log("Alt+ArrowRight được nhấn, gọi moveToNextItem");
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

    // Đánh dấu user interaction ngay khi component mount để cho phép auto-play
    document.querySelector('body').setAttribute('data-user-interacted', 'true');

    // Đánh dấu khi người dùng tương tác với trang web
    const markUserInteraction = () => {
      document.querySelector('body').setAttribute('data-user-interacted', 'true');
    };

    // Thêm các sự kiện để theo dõi tương tác người dùng
    document.addEventListener('click', markUserInteraction);
    document.addEventListener('keydown', markUserInteraction);
    document.addEventListener('touchstart', markUserInteraction);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', markUserInteraction);
      document.removeEventListener('keydown', markUserInteraction);
      document.removeEventListener('touchstart', markUserInteraction);
    };
  }, [handleKeyDown]);

  // Cleanup tất cả timeout khi component unmount
  useEffect(() => {
    return () => {
      // Cleanup tất cả các timeout để tránh memory leak
      if (autoAdvanceTimeout) {
        clearTimeout(autoAdvanceTimeout);
      }
      if (autoReplayTimeout) {
        clearTimeout(autoReplayTimeout);
      }
      if (autoPlayTimeout) {
        clearTimeout(autoPlayTimeout);
      }

      // Dừng audio nếu đang phát
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [autoAdvanceTimeout, autoReplayTimeout, autoPlayTimeout, audioRef]);

  // Hiển thị màn hình chọn đề nếu chưa chọn
  if (selectedTestIndex === null) {
    console.log("Hiển thị màn hình chọn đề - partId:", partId);
    return (
      <div className="practice-container">
        <Card className="practice-header-card" variant="elevated" padding="lg">
          <div className="flex items-center gap-md">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/`)}
              icon={<i className="fas fa-arrow-left"></i>}
              className="back-button"
              title="Quay lại trang chính"
            />
            <h1 className="text-2xl font-semibold m-0">
              Part {partId} - {getPartName(partId)}
            </h1>
          </div>
        </Card>

        <div className="practice-area">
          <Card variant="glass" padding="xl" className="test-selector-card">
            <TestSelector partId={partId} onSelectTest={handleSelectTest} />
          </Card>
        </div>
      </div>
    );
  }

  // Hiển thị màn hình kết quả nếu đã hoàn thành
  if (showScore) {
    const percentage = Math.round((score.correct / score.total) * 100);
    const getScoreColor = (percent) => {
      if (percent >= 90) return 'success';
      if (percent >= 70) return 'primary';
      if (percent >= 50) return 'warning';
      return 'danger';
    };

    return (
      <div className="practice-container">
        <Card className="result-header-card" variant="elevated" padding="lg">
          <h2 className="text-2xl font-semibold text-center m-0">
            <i className="fas fa-trophy mr-sm"></i>
            Kết quả luyện tập
          </h2>
        </Card>

        <div className="practice-area">
          <Card variant="glass" padding="xl" className="result-card">
            <div className="result-summary text-center">
              <div className="result-icon mb-lg">
                <i className="fas fa-trophy text-4xl" style={{color: 'var(--light-warning)'}}></i>
              </div>
              <h3 className="text-xl font-semibold mb-lg">Chúc mừng bạn đã hoàn thành!</h3>

              <div className="result-score mb-xl">
                <p className="text-lg mb-md">Điểm số của bạn:</p>
                <div className="score-display mb-md">
                  <span className="score-value text-3xl font-bold">
                    {score.correct}/{score.total}
                  </span>
                </div>
                <div className="score-progress mb-md">
                  <ProgressBar
                    value={score.correct}
                    max={score.total}
                    color={getScoreColor(percentage)}
                    size="lg"
                    showLabel={true}
                    label={`${percentage}%`}
                    animated={true}
                  />
                </div>
              </div>

              <div className="result-actions flex gap-md justify-center">
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={handleBackToTestSelection}
                  icon={<i className="fas fa-list"></i>}
                >
                  Chọn đề khác
                </Button>
                <Button
                  variant="primary"
                  size="lg"
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
                  icon={<i className="fas fa-redo"></i>}
                >
                  Làm lại
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Hiển thị thông báo nếu không có câu nào
  if (sentences.length === 0) {
    return (
      <div className="practice-container">
        <Card className="empty-state-card" variant="elevated" padding="xl">
          <div className="text-center">
            <div className="empty-icon mb-lg">
              <i className="fas fa-exclamation-circle text-4xl" style={{color: 'var(--light-warning)'}}></i>
            </div>
            <h3 className="text-xl font-semibold mb-md">Không có câu hỏi nào trong phần này</h3>
            <p className="text-base text-secondary mb-xl">
              Phần {partId} - {getPartName(partId)} hiện tại chưa có dữ liệu.
            </p>
            <div className="flex gap-md justify-center">
              <Button
                variant="secondary"
                size="lg"
                onClick={handleBackToTestSelection}
                icon={<i className="fas fa-list"></i>}
              >
                Chọn đề khác
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/')}
                icon={<i className="fas fa-home"></i>}
              >
                Về trang chủ
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="practice-container">
      {!currentUser ? (
        <Card className="login-required-card" variant="elevated" padding="xl">
          <div className="text-center">
            <div className="login-icon mb-lg">
              <i className="fas fa-user-lock text-4xl" style={{color: 'var(--light-primary)'}}></i>
            </div>
            <h2 className="text-2xl font-semibold mb-md">Bạn cần đăng nhập để luyện tập</h2>
            <p className="text-base text-secondary mb-xl">
              Vui lòng quay lại trang chủ để đăng nhập và bắt đầu luyện tập.
            </p>
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/')}
              icon={<i className="fas fa-home"></i>}
            >
              Quay lại trang chủ
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {!currentTest || showTestSelection ? (
            <Card className="test-selection-card" variant="glass" padding="xl">
              <h2 className="text-2xl font-semibold text-center mb-xl">Chọn đề luyện tập</h2>
              <TestSelector
                onSelectTest={handleSelectTest}
                partId={partId}
              />
            </Card>
          ) : (
            <>
              {/* Compact Header */}
              <div className="practice-header-compact">
                <div className="header-left">
                  <button
                    className="back-button"
                    onClick={() => navigate(`/`)}
                    title="Quay lại trang chính"
                  >
                    &#8592;
                  </button>
                  <span className="header-title">{getPartName(partId)} - {currentTest.name}</span>
                </div>

                <div className="header-center">
                  <div className="progress-mini">
                    <span className="progress-text-mini">
                      {currentIdx + 1}/{sentences.length} ({Math.floor(progress)}%)
                      {isDialogueOrTalk && dialogLines.length > 0 && (
                        <span> - {currentLineIdx + 1}/{dialogLines.length}</span>
                      )}
                    </span>
                    <div className="progress-bar-mini">
                      <div className="progress-fill-mini" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                </div>

                <div className="header-right">
                  <button
                    className="btn btn-outline btn-xs"
                    onClick={handleBackToTestSelection}
                    title="Chọn đề khác"
                  >
                    <i className="fas fa-list"></i>
                  </button>
                </div>
              </div>

              {/* Progress Indicator - Moved below header */}
              <div className="progress-indicator-compact">
                <ProgressIndicator
                  partId={partId}
                  testIndex={selectedTestIndex}
                  currentSentenceIndex={currentIdx}
                  totalSentences={sentences.length}
                  onSentenceClick={(idx) => {
                    if (idx !== currentIdx) {
                      setCurrentIdx(idx);
                      resetState();
                      setCompletedSentences([]);
                      setCurrentLineIdx(0);

                      if (currentUser) {
                        setTimeout(() => {
                          saveLastPosition(partId, selectedTestIndex, idx);
                        }, 0);
                      }
                    }
                  }}
                />
              </div>

              {/* Main Content Area - Flexbox Layout */}
              <div className="practice-main">
                <div className="practice-content">
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
                    <div className="flex items-center gap-sm p-md rounded-md" style={{background: 'var(--light-card-bg)', border: '1px solid var(--light-card-border)'}}>
                      <LoadingSpinner size="sm" color="primary" />
                      <span className="text-sm">Đang tải audio...</span>
                    </div>
                  ) : isPlaying ? (
                    <div className="flex items-center gap-sm p-md rounded-md" style={{background: 'var(--light-success)', color: 'white'}}>
                      <i className="fas fa-volume-up"></i>
                      <span className="text-sm">Đang phát audio</span>
                    </div>
                  ) : null}
                </div>

                {/* Display current dialogue/transcript */}
                {isDialogueOrTalk && completedSentences.length > 0 && (
                  <div className="completed-dialogue">
                    <h4>Đoạn hội thoại đã hoàn thành:</h4>
                    {completedSentences.map((sentence, index) => (
                      <div key={index} className="completed-line">
                        {sentence}
                      </div>
                    ))}
                  </div>
                )}

                {/* Current dialogue line display */}
                {isDialogueOrTalk && dialogLines && dialogLines.length > 0 && (
                  <div className="dialogue-navigation">
                    <div className="dialogue-controls">
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => {
                          if (currentLineIdx > 0) {
                            setCurrentLineIdx(prevIdx => prevIdx - 1);
                            resetState();
                          }
                        }}
                        disabled={currentLineIdx <= 0}
                      >
                        <i className="fas fa-step-backward"></i>
                        Dòng trước
                      </button>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => {
                          if (currentLineIdx < dialogLines.length - 1) {
                            setCurrentLineIdx(prevIdx => prevIdx + 1);
                            resetState();
                          } else {
                            // Nếu đã ở dòng cuối, chuyển sang câu tiếp theo
                            const nextIndex = currentIdx + 1;
                            if (nextIndex < sentences.length) {
                              setCurrentIdx(nextIndex);
                              setCompletedSentences([]);
                              setCurrentLineIdx(0);
                              resetState();
                            }
                          }
                        }}
                        disabled={currentLineIdx >= dialogLines.length - 1 && currentIdx >= sentences.length - 1}
                      >
                        <i className="fas fa-step-forward"></i>
                        Dòng sau
                      </button>
                    </div>
                  </div>
                )}

                {/* Hiển thị đoạn hội thoại hoặc bài nói đã hoàn thành */}
                {isDialogueOrTalk && completedSentences.length > 0 && (
                  <DialogueDisplay
                    completedSentences={completedSentences}
                    currentLineIdx={currentLineIdx}
                  />
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

              </div>

              {/* Controls Section */}
              <div className="practice-controls">
                <div className="control-group">
                  
                  <div className="control-buttons">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={playCurrentAudio}
                      disabled={isLoading}
                      loading={isLoading}
                      icon={<i className="fas fa-headphones"></i>}
                      title="Nghe câu hiện tại"
                    >
                      Nghe câu
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setErrorMessage('');
                        replay();
                      }}
                      disabled={isLoading}
                      icon={<i className="fas fa-redo"></i>}
                      title="Nghe lại (Ctrl+Space)"
                    >
                      Nghe lại
                    </Button>
                    <Button
                      variant={isSlow ? 'success' : 'secondary'}
                      size="sm"
                      onClick={toggleSlowMotion}
                      disabled={isLoading}
                      icon={<i className="fas fa-clock"></i>}
                      title="Phát chậm (Alt+S)"
                    >
                      {isSlow ? 'Tắt chậm' : 'Phát chậm'}
                    </Button>
                  </div>
                </div>

                <div className="control-group">
                  <h4>Trợ giúp</h4>
                  <div className="control-buttons">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={displayAnswer}
                      disabled={showAnswer || !getCurrentTranscript()}
                      icon={<i className="fas fa-eye"></i>}
                      title="Hiển thị đáp án (Alt+A)"
                    >
                      Đáp án
                    </Button>
                    <Button
                      variant={autoCorrect ? 'success' : 'secondary'}
                      size="sm"
                      onClick={toggleAutoCorrect}
                      disabled={!getCurrentTranscript() || showAnswer}
                      icon={<i className="fas fa-magic"></i>}
                      title="Bật/tắt tự động sửa (Alt+C)"
                    >
                      {autoCorrect ? 'Tắt sửa' : 'Tự sửa'}
                    </Button>
                    <Button
                      variant={autoReplayEnabled ? 'success' : 'secondary'}
                      size="sm"
                      onClick={toggleAutoReplay}
                      disabled={!getCurrentTranscript() || showAnswer}
                      icon={<i className="fas fa-repeat"></i>}
                      title="Bật/tắt tự động phát lại audio"
                    >
                      {autoReplayEnabled ? 'Tắt lặp' : 'Tự lặp'}
                    </Button>
                  </div>

                  {/* Auto Replay Config */}
                  {autoReplayEnabled && (
                    <div className="auto-replay-config">
                      <span className="text-sm">Phát lại sau:</span>
                      <select
                        value={autoReplayInterval}
                        onChange={(e) => changeAutoReplayInterval(parseInt(e.target.value))}
                        className="form-select"
                      >
                        <option value={5}>5s</option>
                        <option value={10}>10s</option>
                        <option value={15}>15s</option>
                        <option value={20}>20s</option>
                        <option value={30}>30s</option>
                        <option value={60}>60s</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="control-group">
                  <HelpGuide />
                </div>
              </div>
              </div>

              {/* Footer Navigation */}
              <div className="practice-footer">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={goToPreviousQuestion}
                  disabled={currentIdx === 0}
                  icon={<i className="fas fa-arrow-left"></i>}
                  title="Câu trước (Alt+←)"
                >
                  Trước
                </Button>

                <Button
                  variant="primary"
                  size="lg"
                  onClick={checkAnswer}
                  disabled={showAnswer || !getCurrentTranscript() || input.trim() === ''}
                  icon={<i className="fas fa-check"></i>}
                  title="Kiểm tra đáp án (Ctrl+Enter)"
                >
                  Kiểm tra
                </Button>

                <Button
                  variant="success"
                  size="md"
                  onClick={moveToNextItem}
                  icon={<i className="fas fa-arrow-right"></i>}
                  title="Câu tiếp theo (Alt+→)"
                >
                  Tiếp theo
                </Button>
              </div>
            </>
          )}
        </>
      )}

      {/* Toast Notifications */}
      <ToastContainer
        toasts={toasts.map(toast => ({
          ...toast,
          onClose: () => removeToast(toast.id)
        }))}
        position="top-right"
      />
    </div>
  );
}

// Utility functions
function getAccuracyClass(accuracy) {
  if (accuracy >= 90) return 'excellent';
  if (accuracy >= 70) return 'good';
  if (accuracy >= 50) return 'fair';
  if (accuracy >= 30) return 'poor';
  return 'very-poor';
}

function getAccuracyMessage(accuracy) {
  if (accuracy >= 90) return 'Tuyệt vời!';
  if (accuracy >= 70) return 'Tốt';
  if (accuracy >= 50) return 'Khá';
  if (accuracy >= 30) return 'Cần cố gắng hơn';
  return 'Cần luyện tập nhiều hơn';
}

// Export utility functions for potential future use
export { getAccuracyClass, getAccuracyMessage };

export default PracticePage;
