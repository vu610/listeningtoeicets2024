import { useRef, useState, useEffect, useCallback } from 'react';

/**
 * Custom hook để phát một đoạn audio theo startTime, endTime.
 * Trả về các hàm điều khiển và trạng thái.
 */
export default function useAudioPlayer({ audioSrc }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSlow, setIsSlow] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [audioLoaded, setAudioLoaded] = useState(false);

  const lastSegment = useRef({ startTime: 0, endTime: 0 });
  const timeoutId = useRef(null);

  // Reset states when audio source changes
  useEffect(() => {
    setIsLoading(true);
    setAudioLoaded(false);
    
    // Đảm bảo audio được load đúng cách
    const audio = audioRef.current;
    if (audio && audioSrc) {
      console.log('Loading audio source:', audioSrc);
      audio.src = audioSrc;
      audio.load();
      
      // Kiểm tra xem audio đã load xong chưa
      const checkLoaded = () => {
        if (audio.readyState >= 2) { // HAVE_CURRENT_DATA or higher
          setIsLoading(false);
          setAudioLoaded(true);
          console.log('Audio loaded successfully');
        } else {
          console.log('Audio not ready yet, waiting...');
          setTimeout(checkLoaded, 500);
        }
      };
      
      checkLoaded();
    }
  }, [audioSrc]);

  // Lắng nghe các sự kiện của thẻ audio
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleCanPlay = () => {
      console.log('Audio can play now');
      setIsLoading(false);
      setAudioLoaded(true);
    };
    
    const handlePlay = () => {
      console.log('Audio playback started');
      setIsPlaying(true);
    };
    
    const handlePause = () => {
      console.log('Audio playback paused');
      setIsPlaying(false);
    };
    
    const handleError = (e) => {
      console.error('Error loading audio:', e.target.error);
      setIsLoading(false);
    };

    audio.addEventListener('canplaythrough', handleCanPlay);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('canplaythrough', handleCanPlay);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
      if (timeoutId.current) clearTimeout(timeoutId.current);
    };
  }, []);

  const stopAtEnd = useCallback((endTime) => {
    if (timeoutId.current) clearTimeout(timeoutId.current);
    const audio = audioRef.current;
    if (!audio) return;

    const remaining = Math.max(0, (endTime - audio.currentTime) * 1000 / audio.playbackRate);
    console.log(`Setting timeout to stop audio after ${remaining}ms`);
    timeoutId.current = setTimeout(() => {
      console.log('Stopping audio at end time');
      audio.pause();
    }, remaining);
  }, []);

  const forcePlay = useCallback((audio) => {
    // Trước khi phát, tạm thời đặt volume = 0 để tránh tiếng click
    const originalVolume = audio.volume;
    audio.volume = 0;
    
    // Phát audio và khôi phục volume
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          // Khôi phục volume sau một khoảng thời gian ngắn
          setTimeout(() => {
            audio.volume = originalVolume;
          }, 50);
        })
        .catch(error => {
          console.error('Error playing audio:', error);
          audio.volume = originalVolume;
        });
    } else {
      audio.volume = originalVolume;
    }
    
    return playPromise;
  }, []);

  const playSegment = useCallback(
    ({ startTime, endTime }) => {
      const audio = audioRef.current;
      if (!audio) {
        console.error('Audio element not found');
        return;
      }
      
      if (isLoading) {
        console.log('Audio still loading, cannot play');
        return;
      }

      console.log(`Playing segment from ${startTime}s to ${endTime}s`);
      lastSegment.current = { startTime, endTime };
      
      try {
        // Dừng audio hiện tại nếu đang phát
        audio.pause();
        
        // Thiết lập thời gian bắt đầu
        audio.currentTime = startTime;
        audio.playbackRate = isSlow ? 0.75 : 1.0;
        
        console.log('Starting playback...');
        
        // Kiểm tra nếu document chưa có tương tác từ người dùng
        if (document.readyState !== 'complete' || 
            !document.querySelector('body').hasAttribute('data-user-interacted')) {
          console.log('Auto-play prevented: waiting for user interaction');
          // Không tự động phát, chỉ chuẩn bị sẵn sàng để người dùng nhấn play
          return;
        }
        
        forcePlay(audio)
          .then(() => {
            console.log('Playback started successfully');
            stopAtEnd(endTime);
          })
          .catch(error => {
            console.error('Error starting playback:', error);
            if (error.name === 'NotAllowedError') {
              console.log('Playback not allowed: user interaction required');
              // Không thử lại khi lỗi là do chưa có tương tác người dùng
              return;
            }
            
            // Thử lại một lần nữa sau một khoảng thời gian với các lỗi khác
            setTimeout(() => {
              console.log('Retrying playback...');
              audio.currentTime = startTime;
              forcePlay(audio)
                .then(() => stopAtEnd(endTime))
                .catch(e => console.error('Retry failed:', e));
            }, 500);
          });
      } catch (error) {
        console.error('Exception during playback:', error);
      }
    },
    [isSlow, stopAtEnd, isLoading, forcePlay]
  );

  const replay = useCallback(() => {
    console.log('Replay requested');
    const { startTime, endTime } = lastSegment.current;
    if (startTime !== undefined && endTime !== undefined) {
      playSegment({ startTime, endTime });
    } else {
      console.log('No segment to replay');
    }
  }, [playSegment]);

  const toggleSlowMotion = useCallback(() => {
    setIsSlow((prev) => {
      const nextVal = !prev;
      console.log(`Slow motion ${nextVal ? 'enabled' : 'disabled'}`);
      const audio = audioRef.current;
      if (audio) {
        audio.playbackRate = nextVal ? 0.75 : 1.0;
        
        // Nếu đang phát, áp dụng tốc độ mới ngay lập tức
        if (!audio.paused) {
          console.log('Applying new playback rate to currently playing audio');
          const currentTime = audio.currentTime;
          const { startTime, endTime } = lastSegment.current;
          if (startTime !== undefined && endTime !== undefined) {
            // Dừng timer hiện tại nếu có
            if (timeoutId.current) clearTimeout(timeoutId.current);
            // Tính toán lại thời gian còn lại và cài đặt timer mới
            stopAtEnd(endTime);
          }
        }
      }
      return nextVal;
    });
  }, [stopAtEnd]);

  return {
    audioRef,
    playSegment,
    replay,
    toggleSlowMotion,
    isLoading,
    isPlaying,
    isSlow,
  };
}
