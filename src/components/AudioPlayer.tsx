"use client";

import { useReducer, useRef, useEffect, useState } from "react";
import { ToolCard } from "./ToolCard";
import { downloadFileFromUrl } from "../lib/download-browser";

interface AudioPlayerProps {
  title: string;
  text: string;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || !isFinite(seconds)) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

const LOADING_STAGES = [
  { label: "Connecting to speech engine…", delay: 0 },
  { label: "Generating speech…", delay: 2000 },
  { label: "Streaming audio…", delay: 6000 },
  { label: "Almost ready…", delay: 12000 },
];

function useLoadingStage(isLoading: boolean) {
  const [stage, setStage] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setStage(0);
      setElapsed(0);
      return;
    }
    const start = Date.now();
    const tick = setInterval(() => {
      const ms = Date.now() - start;
      setElapsed(Math.floor(ms / 1000));
      const next = LOADING_STAGES.findLastIndex((s) => ms >= s.delay);
      if (next >= 0) setStage(next);
    }, 200);
    return () => clearInterval(tick);
  }, [isLoading]);

  return { label: LOADING_STAGES[stage].label, elapsed };
}

type AudioState = {
  isPlaying: boolean;
  isLoading: boolean;
  audioUrl: string | null;
  error: string | null;
  currentTime: number;
  duration: number;
};

type AudioAction =
  | { type: 'START_LOAD' }
  | { type: 'LOAD_SUCCESS'; url: string }
  | { type: 'LOAD_ERROR'; error: string }
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'TIME_UPDATE'; currentTime: number }
  | { type: 'DURATION_UPDATE'; duration: number };

function audioReducer(state: AudioState, action: AudioAction): AudioState {
  switch (action.type) {
    case 'START_LOAD': return { ...state, isLoading: true, error: null };
    case 'LOAD_SUCCESS': return { ...state, isLoading: false, audioUrl: action.url };
    case 'LOAD_ERROR': return { ...state, isLoading: false, error: action.error };
    case 'PLAY': return { ...state, isPlaying: true };
    case 'PAUSE': return { ...state, isPlaying: false };
    case 'TIME_UPDATE': return { ...state, currentTime: action.currentTime };
    case 'DURATION_UPDATE': return { ...state, duration: action.duration };
    default: return state;
  }
}

export function AudioPlayer({ title, text }: AudioPlayerProps) {
  const [state, dispatch] = useReducer(audioReducer, {
    isPlaying: false,
    isLoading: false,
    audioUrl: null,
    error: null,
    currentTime: 0,
    duration: 0,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const loadingStage = useLoadingStage(state.isLoading);

  // Clean up object URL when unmounted
  useEffect(() => {
    return () => {
      if (state.audioUrl) {
        URL.revokeObjectURL(state.audioUrl);
      }
    };
  }, [state.audioUrl]);

  async function handlePlayToggle() {
    if (state.error) return;

    // Valid cached audio
    if (state.audioUrl && audioRef.current) {
      if (state.isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      return;
    }

    // Fetch new audio
    if (!state.audioUrl && !state.isLoading) {
      dispatch({ type: 'START_LOAD' });
      try {
        const response = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });

        if (!response.ok) {
          const body = await response.json().catch(() => null);
          const msg = body?.error || `TTS failed (${response.status})`;
          throw new Error(msg);
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        dispatch({ type: 'LOAD_SUCCESS', url });

        // Create the audio element
        const audio = new Audio(url);
        audioRef.current = audio;

        // Bind events for timeline sync
        audio.addEventListener("timeupdate", () =>
          dispatch({ type: 'TIME_UPDATE', currentTime: audio.currentTime }),
        );
        audio.addEventListener("loadedmetadata", () =>
          dispatch({ type: 'DURATION_UPDATE', duration: audio.duration }),
        );
        audio.addEventListener("play", () => dispatch({ type: 'PLAY' }));
        audio.addEventListener("pause", () => dispatch({ type: 'PAUSE' }));
        audio.addEventListener("ended", () => dispatch({ type: 'PAUSE' }));

        // Auto-play once loaded
        await audio.play();
      } catch (err) {
        console.error(err);
        dispatch({ type: 'LOAD_ERROR', error: err instanceof Error ? err.message : "Failed to generate audio." });
      }
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    dispatch({ type: 'TIME_UPDATE', currentTime: time });
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleDownload = () => {
    if (!state.audioUrl) return;
    downloadFileFromUrl(
      state.audioUrl,
      `${title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.mp3`,
    );
  };

  // Calculate generic status for the wrapper
  const status = state.isLoading ? "loading" : state.error ? "error" : "success";

  return (
    <ToolCard
      title={title || "Generated Audio"}
      subtitle={
        state.error ? (
          <span className="text-red-500">{state.error}</span>
        ) : state.isLoading ? (
          <span className="text-[var(--accent-color)] animate-pulse">
            {loadingStage.label} ({loadingStage.elapsed}s)
          </span>
        ) : (
          "OpenAI Speech Synthesis"
        )
      }
      status={status}
      onDownload={state.audioUrl ? handleDownload : undefined}
      downloadTooltip="Download MP3"
      icon={
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" x2="12" y1="19" y2="22" />
        </svg>
      }
    >
      <div className="flex flex-col gap-3 p-4 w-full">
        {/* Control Row */}
        <div className="flex items-center gap-4">
          <button
            onClick={handlePlayToggle}
            disabled={state.isLoading || !!state.error}
            className="w-12 h-12 shrink-0 flex items-center justify-center rounded-full bg-accent text-accent-foreground hover:bg-accent-theme/90 transition-all disabled:opacity-50 active:scale-95 shadow-md flex-col"
          >
            {state.isLoading ? (
              <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
              </svg>
            ) : state.isPlaying ? (
              <svg
                className="w-5 h-5 fill-current ml-[1px]"
                viewBox="0 0 24 24"
              >
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg className="w-5 h-5 fill-current ml-1" viewBox="0 0 24 24">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            )}
          </button>

          {/* Shuttle & Timestamps */}
          <div className="flex flex-col flex-1 gap-1.5 min-w-0">
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={state.duration || 100}
                value={state.currentTime}
                onChange={handleSeek}
                disabled={!state.audioUrl}
                className="w-full h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-accent"
                style={{
                  background: state.audioUrl
                    ? `linear-gradient(to right, var(--accent) ${(state.currentTime / state.duration) * 100}%, var(--border) ${(state.currentTime / state.duration) * 100}%)`
                    : undefined,
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-text/50">
              <span>{formatTime(state.currentTime)}</span>
              <span>{formatTime(state.duration)}</span>
            </div>
          </div>
        </div>

        {/* Animated Waveform Visualizer Plugin */}
        <div
          className="flex items-center justify-center gap-[3px] h-6 mt-1 transition-opacity duration-300"
          style={{ opacity: state.isPlaying ? 0.4 : state.isLoading ? 0.25 : 0.1 }}
        >
          {[...Array(32)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-current rounded-full transition-all duration-150 origin-bottom"
              style={{
                height: state.isPlaying || state.isLoading ? "100%" : "20%",
                animation: state.isPlaying
                  ? `wave 1.2s ease-in-out infinite alternate ${i * 0.05}s`
                  : state.isLoading
                    ? `wave 2s ease-in-out infinite alternate ${i * 0.08}s`
                    : "none",
              }}
            />
          ))}
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
                @keyframes wave {
                    0% { height: 10%; }
                    50% { height: 100%; }
                    100% { height: 20%; }
                }
                `,
        }}
      />
    </ToolCard>
  );
}
