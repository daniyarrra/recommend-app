import { createContext, useContext, useState, useEffect, useRef } from "react";

const PlayerContext = createContext();

export const PlayerProvider = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playlist, setPlaylist] = useState([]);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(parseFloat(localStorage.getItem("player-volume")) || 0.5);

  const audioRef = useRef(new Audio());

  useEffect(() => {
    const audio = audioRef.current;

    const onTimeUpdate = () => setProgress(audio.currentTime);
    const onDurationChange = () => setDuration(audio.duration || 0);
    const onEnded = () => playNext();

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("ended", onEnded);
      audio.pause();
    };
  }, [playlist, currentTrack]);

  useEffect(() => {
    audioRef.current.volume = volume;
    localStorage.setItem("player-volume", volume);
  }, [volume]);

  const playTrack = (track, newPlaylist = []) => {
    if (!track || !track.preview_url) return;

    if (newPlaylist.length > 0) {
      setPlaylist(newPlaylist);
    } else if (!playlist.some(t => t.id === track.id)) {
      setPlaylist([track]);
    }

    if (currentTrack && currentTrack.id === track.id) {
      togglePlay();
      return;
    }

    setCurrentTrack(track);
    audioRef.current.src = track.preview_url;
    audioRef.current.play()
      .then(() => setIsPlaying(true))
      .catch(err => console.error("Audio playback error:", err));
  };

  const pauseTrack = () => {
    audioRef.current.pause();
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (!currentTrack) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => console.error("Audio playback error:", err));
    }
  };

  const playNext = () => {
    if (playlist.length === 0 || !currentTrack) return;
    const currentIndex = playlist.findIndex(t => t.id === currentTrack.id);
    if (currentIndex !== -1 && currentIndex < playlist.length - 1) {
      playTrack(playlist[currentIndex + 1]);
    } else if (playlist.length > 0) {
      // Loop back to the first track
      playTrack(playlist[0]);
    }
  };

  const playPrevious = () => {
    if (playlist.length === 0 || !currentTrack) return;
    const currentIndex = playlist.findIndex(t => t.id === currentTrack.id);
    if (currentIndex > 0) {
      playTrack(playlist[currentIndex - 1]);
    } else if (playlist.length > 0) {
      // Go to the last track
      playTrack(playlist[playlist.length - 1]);
    }
  };

  const seek = (time) => {
    audioRef.current.currentTime = time;
    setProgress(time);
  };

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        playlist,
        progress,
        duration,
        volume,
        playTrack,
        pauseTrack,
        togglePlay,
        playNext,
        playPrevious,
        seek,
        setVolume
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => useContext(PlayerContext);
