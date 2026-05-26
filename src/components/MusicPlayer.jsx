import { useState, useEffect } from "react";
import { usePlayer } from "../context/PlayerContext";
import "./music-player.css";

const MusicPlayer = () => {
  const {
    currentTrack,
    isPlaying,
    progress,
    duration,
    volume,
    togglePlay,
    playNext,
    playPrevious,
    seek,
    setVolume,
    pauseTrack
  } = usePlayer();

  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(volume);
  const [isMinimized, setIsMinimized] = useState(false);

  // Auto-reveal player when a new track is loaded
  useEffect(() => {
    if (currentTrack) {
      setIsMinimized(false);
    }
  }, [currentTrack]);

  if (!currentTrack) return null;

  const formatTime = (time) => {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleSeekChange = (e) => {
    seek(parseFloat(e.target.value));
  };

  const handleVolumeChange = (e) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (newVol > 0) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setVolume(prevVolume || 0.5);
      setIsMuted(false);
    } else {
      setPrevVolume(volume);
      setVolume(0);
      setIsMuted(true);
    }
  };

  return (
    <div className={`music-player-container ${isMinimized ? "minimized" : ""}`}>
      {/* Ambient glow decoration */}
      <div className="music-player-glow"></div>

      {/* Left side: track details */}
      <div className="player-track-info">
        <div className={`player-poster-wrapper ${isPlaying ? "playing" : ""}`}>
          <img src={currentTrack.image || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100"} alt={currentTrack.title} className="player-poster" />
        </div>
        <div className="player-details">
          <div className="player-title">{currentTrack.title}</div>
          <div className="player-artist">{currentTrack.artist || "Неизвестный исполнитель"}</div>
        </div>

        {/* Dynamic visualizer waves */}
        <div className="player-visualizer">
          <div className="visualizer-bar"></div>
          <div className="visualizer-bar"></div>
          <div className="visualizer-bar"></div>
          <div className="visualizer-bar"></div>
        </div>
      </div>

      {/* Middle: Controls and Progress */}
      <div className="player-controls-container">
        <div className="player-buttons">
          {/* Previous Button */}
          <button className="player-btn" onClick={playPrevious} title="Предыдущий трек">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="19 20 9 12 19 4 19 20"></polygon>
              <line x1="5" y1="19" x2="5" y2="5"></line>
            </svg>
          </button>

          {/* Play/Pause Button */}
          <button className="player-btn player-btn-main" onClick={togglePlay} title={isPlaying ? "Пауза" : "Воспроизвести"}>
            {isPlaying ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1"></rect>
                <rect x="14" y="4" width="4" height="16" rx="1"></rect>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: "2px" }}>
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            )}
          </button>

          {/* Next Button */}
          <button className="player-btn" onClick={playNext} title="Следующий трек">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 4 15 12 5 20 5 4"></polygon>
              <line x1="19" y1="5" x2="19" y2="19"></line>
            </svg>
          </button>
        </div>

        {/* Progress Bar slider */}
        <div className="player-progress-bar">
          <span className="player-time">{formatTime(progress)}</span>
          <div className="player-slider-wrapper">
            <input
              type="range"
              min="0"
              max={duration || 30}
              step="0.1"
              value={progress}
              onChange={handleSeekChange}
              className="player-slider"
            />
          </div>
          <span className="player-time">{formatTime(duration || 30)}</span>
        </div>
      </div>

      {/* Right side: volume and close */}
      <div className="player-side-controls">
        <div className="player-volume-container">
          <button className="player-btn" onClick={toggleMute} title={isMuted ? "Включить звук" : "Выключить звук"}>
            {isMuted || volume === 0 ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="1" y1="1" x2="23" y2="23"></line>
                <path d="M9 9v6a3 3 0 0 0 3 3h1.586l4.707 4.707A1 1 0 0 0 20 22V4a1 1 0 0 0-1.707-.707L13.586 8H12a3 3 0 0 0-3 3z"></path>
              </svg>
            ) : volume < 0.5 ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
              </svg>
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="player-volume-slider"
          />
        </div>

        {/* Minimize/Close Button */}
        <button className="player-btn player-btn-close" onClick={() => { pauseTrack(); setIsMinimized(true); }} title="Закрыть плеер">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default MusicPlayer;
