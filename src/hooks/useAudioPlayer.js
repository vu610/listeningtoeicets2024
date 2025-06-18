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

  const lastSegment = useRef({ startTime: 0, endTime: 0 });
  const timeoutId = useRef(null);

  // Reset loading state when audio source changes
  useEffect(() => {
    setIsLoading(true);
  }, [audioSrc]);

  // Lắng nghe các sự kiện của thẻ audio
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleCanPlay = () => setIsLoading(false);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleError = () => {
      console.error('Error loading audio:', audioSrc);
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
  }, [audioSrc]);

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
      audio.currentTime = startTime;
      audio.playbackRate = isSlow ? 0.75 : 1.0;
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('Error playing audio:', error);
        }).then(() => {
          stopAtEnd(endTime);
        });
      } else {
        stopAtEnd(endTime);
      }
    },
    [isSlow, stopAtEnd, isLoading]
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
