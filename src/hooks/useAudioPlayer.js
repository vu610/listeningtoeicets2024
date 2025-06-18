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
        forcePlay(audio)
          .then(() => {
            console.log('Playback started successfully');
            stopAtEnd(endTime);
          })
          .catch(error => {
            console.error('Error starting playback:', error);
            // Thử lại một lần nữa sau một khoảng thời gian
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
      }
      return nextVal;
    });
  }, []);

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
