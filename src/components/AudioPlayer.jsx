import { useState, useRef, useEffect } from "react";
import "../styles/audio-player.css";

const PlayIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <polygon points="6 3 20 12 6 21 6 3"/>
    </svg>
);

const PauseIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <rect x="5" y="3" width="5" height="18" rx="1"/>
        <rect x="14" y="3" width="5" height="18" rx="1"/>
    </svg>
);

const VolumeHighIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
    </svg>
);

const VolumeLowIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
    </svg>
);

const VolumeMuteIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
        <line x1="23" y1="9" x2="17" y2="15"/>
        <line x1="17" y1="9" x2="23" y2="15"/>
    </svg>
);

const AudioPlayer = ({ src, variant = "compact" }) => {
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.7);
    const [prevVolume, setPrevVolume] = useState(0.7);
    const [showVolume, setShowVolume] = useState(false);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        audio.volume = volume;

        const updateProgress = () => {
            if (audio.duration) {
                setProgress((audio.currentTime / audio.duration) * 100);
                setCurrentTime(audio.currentTime);
            }
        };

        const onLoaded = () => {
            setDuration(audio.duration);
        };

        const onEnded = () => {
            setIsPlaying(false);
            setProgress(0);
            setCurrentTime(0);
        };

        audio.addEventListener("timeupdate", updateProgress);
        audio.addEventListener("loadedmetadata", onLoaded);
        audio.addEventListener("ended", onEnded);

        return () => {
            audio.removeEventListener("timeupdate", updateProgress);
            audio.removeEventListener("loadedmetadata", onLoaded);
            audio.removeEventListener("ended", onEnded);
        };
    }, []);

    // Sync volume to audio element
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
        } else {
            audio.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleProgressClick = (e) => {
        const audio = audioRef.current;
        if (!audio || !audio.duration) return;
        
        const rect = e.currentTarget.getBoundingClientRect();
        const clickPos = (e.clientX - rect.left) / rect.width;
        audio.currentTime = clickPos * audio.duration;
    };

    const handleVolumeChange = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const clickPos = (e.clientX - rect.left) / rect.width;
        const newVolume = Math.max(0, Math.min(1, clickPos));
        setVolume(newVolume);
    };

    const toggleMute = () => {
        if (volume > 0) {
            setPrevVolume(volume);
            setVolume(0);
        } else {
            setVolume(prevVolume || 0.7);
        }
    };

    const formatTime = (sec) => {
        if (!sec || isNaN(sec)) return "0:00";
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    const VolumeIcon = volume === 0 ? VolumeMuteIcon : volume < 0.5 ? VolumeLowIcon : VolumeHighIcon;

    const isLarge = variant === "large";

    return (
        <div className={`custom-audio-player ${isLarge ? "audio-large" : ""}`}>
            <audio ref={audioRef} src={src} preload="metadata" />
            
            <button 
                className={`audio-play-btn ${isPlaying ? "playing" : ""} ${isLarge ? "audio-play-btn-lg" : ""}`} 
                onClick={togglePlay}
                aria-label={isPlaying ? "Pause" : "Play"}
            >
                {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>

            <div className="audio-track-info">
                <div className="audio-progress-bar" onClick={handleProgressClick}>
                    <div 
                        className="audio-progress-fill" 
                        style={{ width: `${progress}%` }}
                    />
                    <div 
                        className="audio-progress-thumb" 
                        style={{ left: `${progress}%` }}
                    />
                </div>
                <div className="audio-time">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>

            {/* Volume Control */}
            <div 
                className="audio-volume-wrapper"
                onMouseEnter={() => setShowVolume(true)}
                onMouseLeave={() => setShowVolume(false)}
            >
                <button 
                    className="audio-volume-btn" 
                    onClick={toggleMute}
                    aria-label="Toggle mute"
                >
                    <VolumeIcon />
                </button>
                <div className={`audio-volume-slider-container ${showVolume ? "visible" : ""}`}>
                    <div className="audio-volume-slider" onClick={handleVolumeChange}>
                        <div 
                            className="audio-volume-fill" 
                            style={{ width: `${volume * 100}%` }}
                        />
                        <div 
                            className="audio-volume-thumb" 
                            style={{ left: `${volume * 100}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AudioPlayer;
