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
  }, [audioSrc]);

  // Đảm bảo audio được load đúng cách
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioSrc) return;

    // Gán src cho audio theo cách thủ công
    const fullPath = audioSrc.startsWith('http') ? audioSrc : `${window.location.origin}${audioSrc}`;
    audio.src = fullPath;
    
    // Preload audio
    audio.load();

    // Xử lý khi audio không thể chơi được
    const handleCannotPlay = (e) => {
      console.error('Cannot play audio:', e);
      setIsLoading(false);
    };

    audio.addEventListener('error', handleCannotPlay);

    return () => {
      audio.removeEventListener('error', handleCannotPlay);
    };
  }, [audioSrc]);

  // Lắng nghe các sự kiện của thẻ audio
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleCanPlay = () => {
      setIsLoading(false);
      setAudioLoaded(true);
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleError = (e) => {
      console.error('Error loading audio:', e);
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
    timeoutId.current = setTimeout(() => {
      audio.pause();
    }, remaining);
  }, []);

  const playSegment = useCallback(
    ({ startTime, endTime }) => {
      const audio = audioRef.current;
      if (!audio || isLoading) return;

      lastSegment.current = { startTime, endTime };
      
      // Đảm bảo audio đã được load
      if (!audioLoaded) {
        audio.load();
      }
      
      // Thiết lập thời gian bắt đầu
      audio.currentTime = startTime;
      audio.playbackRate = isSlow ? 0.75 : 1.0;
      
      // Xử lý play promise để xử lý các lỗi autoplay policy
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Phát thành công
            stopAtEnd(endTime);
          })
          .catch(error => {
            console.error('Error playing audio:', error);
            // Trường hợp lỗi autoplay policy
            if (error.name === 'NotAllowedError') {
              // Thông báo cho người dùng
              console.log('Browser requires user interaction before playing audio');
              setIsLoading(false);
            }
          });
      } else {
        stopAtEnd(endTime);
      }
    },
    [isSlow, stopAtEnd, isLoading, audioLoaded]
  );

  const replay = useCallback(() => {
    const { startTime, endTime } = lastSegment.current;
    if (startTime !== undefined && endTime !== undefined) {
      playSegment({ startTime, endTime });
    }
  }, [playSegment]);

  const toggleSlowMotion = useCallback(() => {
    setIsSlow((prev) => {
      const nextVal = !prev;
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
