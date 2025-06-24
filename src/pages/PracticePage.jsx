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
// eslint-disable-next-line no-unused-vars
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    
    // Chỉ tải lại vị trí khi chưa chọn đề
    if (selectedTestIndex !== null) return;
    
    // Lấy vị trí học tập cuối cùng
    const lastPosition = getLastPosition(partId);
    if (lastPosition) {
      const { testIndex, sentenceIndex } = lastPosition;
      
      // Nếu có vị trí học tập cuối cùng, tải đề thi đó
      if (testIndex !== undefined) {
        console.log(`Tải lại vị trí học tập: Part ${partId}, Test ${testIndex}, Câu ${sentenceIndex}`);
        
        // Tải đề thi - handleSelectTest được gọi sau khi được định nghĩa
        setTimeout(() => {
          handleSelectTest(testIndex);
        }, 0);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, partId, getLastPosition, selectedTestIndex]);

  // Lấy tên file audio chuẩn từ sourceTest
  const getAudioFileName = (sourceTest) => {
    if (!sourceTest) return '';
    
    const testNumber = sourceTest.match(/\d+/);
    if (!testNumber) return '';
    
    const formattedNumber = testNumber[0].padStart(2, '0');
    return `Test_${formattedNumber}.mp3`;
  };

  const resetState = useCallback(() => {
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
  }, [autoAdvanceTimeout]);

  // Tìm câu tiếp theo chưa hoàn thành
  const findNextUncompletedSentence = useCallback((startIdx) => {
    console.log("Tìm câu tiếp theo chưa hoàn thành từ vị trí:", startIdx);
    if (!currentUser || sentences.length === 0 || !selectedTestIndex) return startIdx;

    // Xử lý đặc biệt cho Part 2
    if (partId === '2') {
      // Tìm câu hỏi tiếp theo (bỏ qua các câu trả lời)
      let nextQuestionIdx = startIdx;
      
      // Đảm bảo vị trí bắt đầu là một câu hỏi
      if (nextQuestionIdx < sentences.length) {
        const currentSentence = sentences[nextQuestionIdx];
        if (currentSentence && currentSentence.id && !currentSentence.id.includes('_question')) {
          // Nếu không phải câu hỏi, tìm câu hỏi tiếp theo
          while (nextQuestionIdx < sentences.length) {
            const s = sentences[nextQuestionIdx];
            if (s.id && s.id.includes('_question')) {
              break;
            }
            nextQuestionIdx++;
          }
        }
      }
      
      // Kiểm tra từ vị trí hiện tại đến cuối
      for (let i = nextQuestionIdx; i < sentences.length; i++) {
        const s = sentences[i];
        // Chỉ xét các câu hỏi
        if (s.id && s.id.includes('_question')) {
          if (!isCompletedSentence(partId, selectedTestIndex, i)) {
            console.log(`Tìm thấy câu hỏi chưa hoàn thành: ${i}`);
            return i;
          }
        }
      }

      // Nếu không tìm thấy, quay lại từ đầu
      for (let i = 0; i < nextQuestionIdx; i++) {
        const s = sentences[i];
        // Chỉ xét các câu hỏi
        if (s.id && s.id.includes('_question')) {
          if (!isCompletedSentence(partId, selectedTestIndex, i)) {
            console.log(`Tìm thấy câu hỏi chưa hoàn thành (từ đầu): ${i}`);
            return i;
          }
        }
      }
      
      // Nếu tất cả câu đã hoàn thành, trả về câu hỏi đầu tiên
      for (let i = 0; i < sentences.length; i++) {
        const s = sentences[i];
        if (s.id && s.id.includes('_question')) {
          console.log(`Tất cả câu đã hoàn thành, trở về câu hỏi đầu tiên: ${i}`);
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
    const test = getTestByIndex(testIndex);
    if (test) {
      setSelectedTestIndex(testIndex);
      setCurrentTest(test);
      
      const testSentences = test[partKey] || [];
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
    }
  }, [currentUser, partId, partKey, isDialogueOrTalk, isPart3, isPart4, saveLastPosition, resetState, findNextUncompletedSentence]);

  // Cập nhật câu hiện tại khi thay đổi chỉ số
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (sentences.length > 0 && currentIdx >= 0 && currentIdx < sentences.length) {
      const sentence = sentences[currentIdx];
      setCurrentSentence(sentence);
      
      // Xử lý đối thoại hoặc bài nói trong Part 3 và Part 4
      if (isDialogueOrTalk) {
        try {
          if (isPart3 && sentence.conversation) {
            console.log(`Tải đối thoại cho Part 3, câu ${currentIdx + 1}, số dòng: ${sentence.conversation.length}`);
            setDialogLines(sentence.conversation);
            setCurrentLineIdx(0);
          } else if (isPart4 && sentence.talk) {
            console.log(`Tải bài nói cho Part 4, câu ${currentIdx + 1}, số dòng: ${sentence.talk.length}`);
            setDialogLines(sentence.talk);
            setCurrentLineIdx(0);
          } else {
            console.error(`Không tìm thấy dữ liệu hội thoại/bài nói cho câu ${currentIdx + 1}`);
            setDialogLines([]);
            setCurrentLineIdx(0);
          }
        } catch (error) {
          console.error(`Lỗi khi tải dữ liệu đối thoại/bài nói: ${error.message}`);
          setDialogLines([]);
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
    isPlaying,
    isSlow,
  } = useAudioPlayer({
    audioSrc
  });

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
      // Xử lý part2 với nhiều định dạng dữ liệu khác nhau
      if (partId === '2') {
        // Kiểm tra cấu trúc câu hỏi part2
        if (currentSentence.id && currentSentence.id.includes('_question')) {
          // Tìm câu trả lời tương ứng
          const questionId = currentSentence.id;
          const baseId = questionId.replace('_question', '');
          
          // Tìm trong sentences
          for (let i = 0; i < sentences.length; i++) {
            const s = sentences[i];
            // Kiểm tra cấu trúc cũ (answer)
            if (s.id === `${baseId}_answer`) {
              return s.transcript;
            }
            // Kiểm tra cấu trúc mới (a, b, c)
            if (s.id === `${baseId}_a` || s.id === `${baseId}_b` || s.id === `${baseId}_c`) {
              // Lấy câu trả lời đầu tiên (a) làm mặc định
              if (s.id === `${baseId}_a`) {
                return s.transcript;
              }
            }
          }
          console.error(`Không tìm thấy câu trả lời cho câu hỏi: ${questionId}`);
          return '';
        }
        // Nếu đây là câu trả lời, trả về transcript của nó
        return currentSentence.transcript || '';
      }
      
      return currentSentence.transcript || '';
    }
  };

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
    
    // Hủy timeout nếu có
    if (autoAdvanceTimeout) {
      clearTimeout(autoAdvanceTimeout);
      setAutoAdvanceTimeout(null);
    }
  };

  // Chuyển tới câu/dòng tiếp theo
  const moveToNextItem = useCallback(() => {
    console.log("moveToNextItem được gọi");
    console.log("State hiện tại:", {
      currentIdx,
      sentencesLength: sentences.length,
      autoAdvanceTimeout: !!autoAdvanceTimeout,
      isDialogueOrTalk,
      currentLineIdx,
      dialogLinesLength: dialogLines ? dialogLines.length : 0
    });
    
    if (autoAdvanceTimeout) {
      clearTimeout(autoAdvanceTimeout);
      setAutoAdvanceTimeout(null);
    }
    
    // Xử lý riêng cho Part 3/4
    if (isDialogueOrTalk && dialogLines && dialogLines.length > 0) {
      const currentTranscript = getCurrentTranscript();
      
      if (currentTranscript) {
        // Thêm câu đã hoàn thành vào danh sách hiển thị
        setCompletedSentences(prev => [...prev, currentTranscript]);
        
        // Kiểm tra xem còn dòng tiếp theo trong đối thoại/bài nói không
        if (currentLineIdx < dialogLines.length - 1) {
          // Nếu còn, chuyển tới dòng tiếp theo
          console.log("Chuyển sang dòng tiếp theo trong đối thoại/bài nói");
          console.log(`Từ dòng ${currentLineIdx} đến dòng ${currentLineIdx + 1}`);
          setCurrentLineIdx(prevIdx => prevIdx + 1);
          resetState();
          return;
        } else {
          console.log("Đã đến dòng cuối cùng của đối thoại/bài nói, chuyển sang câu tiếp theo");
        }
      }
    }
    
    // Xử lý cho Part 2 - bỏ qua các câu trả lời
    if (partId === '2') {
      let nextIndex = currentIdx + 1;
      
      // Tìm câu hỏi tiếp theo (bỏ qua các câu trả lời)
      while (nextIndex < sentences.length) {
        const nextSentence = sentences[nextIndex];
        if (nextSentence.id && nextSentence.id.includes('_question')) {
          break;
        }
        nextIndex++;
      }
      
      if (nextIndex < sentences.length) {
        console.log(`Chuyển đến câu hỏi tiếp theo: ${nextIndex}`);
        setCurrentIdx(nextIndex);
        resetState();
        
        // Lưu vị trí học tập
        if (currentUser) {
          setTimeout(() => {
            console.log(`Lưu vị trí: Part ${partId}, Test ${selectedTestIndex}, Câu ${nextIndex}`);
            saveLastPosition(partId, selectedTestIndex, nextIndex);
          }, 0);
        }
        return;
      } else {
        console.log("Đã đến câu cuối cùng, hiển thị điểm số");
        setShowScore(true);
        return;
      }
    }
    
    // Lưu chỉ số câu tiếp theo trước khi cập nhật state
    const nextIndex = currentIdx + 1;
    console.log("Chuẩn bị chuyển đến câu:", nextIndex);
    
    // Xử lý chung: chuyển tới câu tiếp theo hoặc kết thúc
    if (currentIdx < sentences.length - 1) {
      console.log("Chuyển sang câu tiếp theo");
      
      // Tìm câu tiếp theo chưa hoàn thành
      const nextUncompletedIndex = findNextUncompletedSentence(nextIndex);
      console.log(`Chuyển đến câu chưa hoàn thành: ${nextUncompletedIndex}`);
      
      setCurrentIdx(nextUncompletedIndex);
      resetState();
      setCompletedSentences([]);
      setCurrentLineIdx(0);
      
      // Lưu vị trí học tập với chỉ số đã được tính toán trước
      if (currentUser) {
        setTimeout(() => {
          console.log(`Lưu vị trí: Part ${partId}, Test ${selectedTestIndex}, Câu ${nextUncompletedIndex}`);
          saveLastPosition(partId, selectedTestIndex, nextUncompletedIndex);
        }, 0);
      }
    } else {
      console.log("Đã đến câu cuối cùng, hiển thị điểm số");
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
    findNextUncompletedSentence,
    sentences
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
  const playCurrentAudio = () => {
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
    
    // Space: Phát/tạm dừng audio
    if (e.code === 'Space') {
      e.preventDefault();
      playCurrentAudio();
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
                <h1>
                  <button 
                    className="back-button"
                    onClick={() => navigate(`/`)}
                    title="Quay lại trang chính"
                  >
                    &#8592;
                  </button>
                  {getPartName(partId)} - {currentTest.name}
                </h1>
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
                    onClick={playCurrentAudio}
                    disabled={isLoading}
                    title="Nghe câu hiện tại (Space)"
                  >
                    <i className="fas fa-headphones"></i>
                    Nghe câu hiện tại
                  </button>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => {
                      setErrorMessage('');
                      replay();
                    }}
                    disabled={isLoading}
                    title="Nghe lại (Ctrl+Space)"
                  >
                    <i className="fas fa-redo"></i>
                    Nghe lại
                  </button>
                  <button 
                    className={`btn ${isSlow ? 'btn-success' : 'btn-secondary'}`}
                    onClick={toggleSlowMotion}
                    disabled={isLoading}
                    title="Phát chậm (Alt+S)"
                  >
                    <i className="fas fa-clock"></i>
                    {isSlow ? 'Tắt phát chậm' : 'Phát chậm'}
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
                  <DialogueDisplay 
                    completedSentences={completedSentences} 
                    currentLineIdx={currentLineIdx}
                  />
                )}

                {/* Hiển thị thông tin về dòng hiện tại trong Part 3/4 */}
                {isDialogueOrTalk && dialogLines && dialogLines.length > 0 && (
                  <div className="dialogue-navigation">
                    <div className="dialogue-progress">
                      <span className="dialogue-progress-text">
                        Dòng {currentLineIdx + 1} / {dialogLines.length}
                      </span>
                      <div className="dialogue-progress-bar">
                        <div 
                          className="dialogue-progress-fill" 
                          style={{ width: `${((currentLineIdx + 1) / dialogLines.length) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="dialogue-buttons">
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
                    className="btn btn-success" 
                    onClick={moveToNextItem}
                    title="Câu tiếp theo (Alt+→)"
                  >
                    <i className="fas fa-arrow-right"></i>
                    Câu tiếp theo
                  </button>
                  <button 
                    className="btn btn-outline" 
                    onClick={() => setSelectedTestIndex(null)}
                    title="Quay lại chọn đề thi"
                  >
                    <i className="fas fa-list"></i>
                    Chọn đề khác
                  </button>
                </div>
                
                {/* Chỉ hiển thị nút Next lớn khi không ở trạng thái hiển thị đáp án */}
                {!showAnswer && (
                  <div className="big-next-button-container">
                    <button 
                      className="big-next-button" 
                      onClick={moveToNextItem}
                      title="Câu tiếp theo (Alt+→)"
                    >
                      <i className="fas fa-arrow-right"></i>
                      Chuyển sang câu tiếp theo
                    </button>
                  </div>
                )}
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

// Các hàm tiện ích ở cuối file
// eslint-disable-next-line no-unused-vars
function getAccuracyClass(accuracy) {
  if (accuracy >= 90) return 'excellent';
  if (accuracy >= 70) return 'good';
  if (accuracy >= 50) return 'fair';
  if (accuracy >= 30) return 'poor';
  return 'very-poor';
}

// eslint-disable-next-line no-unused-vars
function getAccuracyMessage(accuracy) {
  if (accuracy >= 90) return 'Tuyệt vời!';
  if (accuracy >= 70) return 'Tốt';
  if (accuracy >= 50) return 'Khá';
  if (accuracy >= 30) return 'Cần cố gắng hơn';
  return 'Cần luyện tập nhiều hơn';
}

export default PracticePage;
