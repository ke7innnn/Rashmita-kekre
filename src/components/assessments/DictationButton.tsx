'use client';

import React, { useState } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';

interface DictationButtonProps {
  onTranscript: (text: string) => void;
  className?: string;
}

export default function DictationButton({ onTranscript, className = '' }: DictationButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      alert('Speech recognition is not supported in this browser. Please type directly.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          onTranscript(transcript);
        }
      };

      recognition.onerror = (err: any) => {
        console.error('Speech recognition error:', err);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggleListening}
      className={`p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs font-semibold ${
        isListening
          ? 'bg-rose-500 text-white animate-pulse shadow-[0_0_12px_rgba(244,63,94,0.5)]'
          : 'bg-white/10 hover:bg-white/20 text-white/80 hover:text-white border border-white/15'
      } ${className}`}
      title={isListening ? 'Stop dictation' : 'Start voice dictation'}
    >
      {isListening ? (
        <>
          <MicOff className="w-3.5 h-3.5" /> Listening...
        </>
      ) : (
        <>
          <Mic className="w-3.5 h-3.5 text-emerald-400" /> Dictate
        </>
      )}
    </button>
  );
}
