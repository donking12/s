"use client";

import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  isRecording: boolean;
  audioStream: MediaStream | null;
}

export default function AudioVisualizer({ isRecording, audioStream }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    if (!isRecording || !audioStream) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      // Draw static flat lines
      drawStaticWave();
      return;
    }

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioContextClass();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(audioStream);
    
    source.connect(analyser);
    analyser.fftSize = 256;
    
    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      
      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);
      
      canvasCtx.fillStyle = '#121826';
      canvasCtx.fillRect(0, 0, width, height);
      
      const barWidth = (width / bufferLength) * 1.5;
      let barHeight;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 1.6;
        
        // Gradient styling
        const gradient = canvasCtx.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, '#0d9488');
        gradient.addColorStop(0.5, '#14b8a6');
        gradient.addColorStop(1, '#6366f1');
        
        canvasCtx.fillStyle = gradient;
        canvasCtx.fillRect(x, height - barHeight, barWidth - 2, barHeight);
        
        x += barWidth;
      }
    };
    
    draw();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [isRecording, audioStream]);

  const drawStaticWave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;
    
    canvasCtx.fillStyle = '#121826';
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Render idle state digital grid
    canvasCtx.strokeStyle = 'rgba(20, 184, 166, 0.2)';
    canvasCtx.lineWidth = 1.5;
    canvasCtx.beginPath();
    canvasCtx.moveTo(0, canvas.height / 2);
    
    for (let i = 0; i < canvas.width; i += 10) {
      const amplitude = Math.sin(i * 0.05) * 4;
      canvasCtx.lineTo(i, (canvas.height / 2) + amplitude);
    }
    canvasCtx.stroke();
  };

  useEffect(() => {
    drawStaticWave();
  }, []);

  return (
    <div className="relative w-full rounded-xl overflow-hidden bg-darkCard border border-slate-800 p-3">
      <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
        <span className={`h-2.5 w-2.5 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-teal-500'}`} />
        <span className="text-xs font-mono tracking-wider text-slate-400">
          {isRecording ? 'LIVE VISUALIZER / بث مباشر' : 'AUDIO FEED / الإشارة الصوتية'}
        </span>
      </div>
      <canvas 
        ref={canvasRef} 
        className="w-full h-24 block" 
        width={600} 
        height={96}
      />
    </div>
  );
}
