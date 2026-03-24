/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import Hls, { Level } from 'hls.js';
import { Channel } from '../types';
import { X, Settings, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PlayerProps {
  channel: Channel;
  onClose: () => void;
}

export const Player: React.FC<PlayerProps> = ({ channel, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [levels, setLevels] = useState<Level[]>([]);
  const [currentLevel, setCurrentLevel] = useState<number>(-1); // -1 is Auto
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const url = channel.url;
    setIsLoading(true);
    setError(null);

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        // Buffering optimization for stability
        backBufferLength: 90,
        maxBufferLength: 120, // Increased for better stability
        maxMaxBufferLength: 240, // Increased for better stability
        maxBufferSize: 120 * 1024 * 1024, // 120MB buffer
        
        // Retry logic for network resilience
        manifestLoadingMaxRetry: 6,
        manifestLoadingRetryDelay: 1000,
        levelLoadingMaxRetry: 6,
        levelLoadingRetryDelay: 1000,
        fragLoadingMaxRetry: 10,
        fragLoadingRetryDelay: 1000,
        
        // Quality start
        startLevel: -1,
        abrEwmaDefaultEstimate: 5000000,
        
        // Stalling prevention
        nudgeOffset: 0.1,
        nudgeMaxRetry: 5,
      });

      hls.loadSource(url);
      hls.attachMedia(video);
      hlsRef.current = hls;

      let recoveryAttempts = 0;
      const MAX_RECOVERY_ATTEMPTS = 3;

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setLevels(data.levels);
        setIsLoading(false);
        recoveryAttempts = 0;
        video.play().catch(e => console.error("Autoplay failed:", e));
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        setCurrentLevel(hls.currentLevel);
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          if (recoveryAttempts >= MAX_RECOVERY_ATTEMPTS) {
            console.error("Max recovery attempts reached. Stopping playback.");
            setError(`Playback failed after multiple attempts: ${data.details}`);
            hls.destroy();
            return;
          }

          recoveryAttempts++;
          
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.warn(`Network error (${data.details}), attempt ${recoveryAttempts}/${MAX_RECOVERY_ATTEMPTS}...`);
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.warn(`Media error (${data.details}), attempt ${recoveryAttempts}/${MAX_RECOVERY_ATTEMPTS}...`);
              hls.recoverMediaError();
              break;
            default:
              console.error("Fatal unrecoverable error:", data.details);
              setError(`Fatal error: ${data.details}`);
              hls.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
        video.play();
      });
      video.addEventListener('error', () => {
        setError("Native playback failed");
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [channel]);

  const handleQualityChange = (index: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = index;
      setCurrentLevel(index);
      setShowQualityMenu(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 p-6 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto">
          <h2 className="text-2xl font-bold text-white drop-shadow-lg">{channel.name}</h2>
          <p className="text-white/60 text-sm font-medium">{channel.groupTitle || 'General'}</p>
        </div>
        
        <div className="flex items-center gap-3 pointer-events-auto">
          {levels.length > 0 && (
            <div className="relative">
              <button 
                onClick={() => setShowQualityMenu(!showQualityMenu)}
                className={`p-2.5 rounded-xl transition-all flex items-center gap-2 ${
                  showQualityMenu ? 'bg-orange-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                <Settings size={20} className={showQualityMenu ? 'animate-spin-slow' : ''} />
                <span className="text-xs font-bold uppercase tracking-widest">
                  {currentLevel === -1 ? 'Auto' : `${levels[currentLevel]?.height}p`}
                </span>
              </button>

              <AnimatePresence>
                {showQualityMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full right-0 mt-2 w-48 bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-30"
                  >
                    <div className="p-2">
                      <button
                        onClick={() => handleQualityChange(-1)}
                        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                          currentLevel === -1 ? 'bg-orange-500 text-white' : 'text-white/40 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <span>Auto Quality</span>
                        {currentLevel === -1 && <Check size={14} />}
                      </button>
                      <div className="h-px bg-white/5 my-1" />
                      {levels.map((level, index) => (
                        <button
                          key={index}
                          onClick={() => handleQualityChange(index)}
                          className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                            currentLevel === index ? 'bg-orange-500 text-white' : 'text-white/40 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <span>{level.height}p</span>
                          {currentLevel === index && <Check size={14} />}
                        </button>
                      )).reverse()}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <button 
            onClick={onClose}
            className="p-2.5 bg-white/10 hover:bg-red-500/20 hover:text-red-500 rounded-xl transition-all text-white"
          >
            <X size={24} />
          </button>
        </div>
      </div>
      
      {/* Video Container */}
      <div className="flex-1 relative flex items-center justify-center bg-black group">
        <video
          ref={videoRef}
          className="w-full h-full max-h-screen object-contain"
          controls
          autoPlay
          playsInline
        />

        {/* Loading Overlay */}
        <AnimatePresence>
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm"
            >
              <Loader2 className="text-orange-500 animate-spin mb-4" size={48} />
              <p className="text-white/60 font-bold uppercase tracking-widest text-xs">Optimizing Stream...</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Overlay */}
        {error && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 p-6 text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
              <X className="text-red-500" size={32} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Playback Error</h3>
            <p className="text-white/40 max-w-md mb-6">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-white text-black rounded-2xl font-bold hover:bg-orange-500 hover:text-white transition-all"
            >
              Retry Connection
            </button>
          </div>
        )}
      </div>

      {/* Bottom Info (Hidden when controls are active usually, but here we keep it simple) */}
      <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/90 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="flex items-center gap-4">
          <div className="px-3 py-1 bg-orange-500 rounded-lg text-[10px] font-black uppercase tracking-widest text-white">
            {currentLevel === -1 ? 'Adaptive' : `${levels[currentLevel]?.height}p HD`}
          </div>
          <div className="h-1 w-1 bg-white/20 rounded-full" />
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest">
            {channel.url.split('.').pop()?.toUpperCase()} Stream
          </p>
        </div>
      </div>
    </div>
  );
};
