import { useState, useEffect } from 'react';
import { taskAPI } from '../services/api';

export const useVoiceInput = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [recognition, setRecognition] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';
      
      recognitionInstance.onresult = async (event) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        
        try {
          const response = await taskAPI.parseVoice(text);
          setParsedData(response.data);
        } catch (err) {
          setError('Failed to parse voice input');
          console.error(err);
        }
        
        setIsRecording(false);
      };
      
      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setError(`Speech recognition error: ${event.error}`);
        setIsRecording(false);
      };
      
      recognitionInstance.onend = () => {
        setIsRecording(false);
      };
      
      setRecognition(recognitionInstance);
    } else {
      setError('Speech recognition not supported in this browser');
    }
  }, []);

  const startRecording = () => {
    if (recognition) {
      setTranscript('');
      setParsedData(null);
      setError(null);
      setIsRecording(true);
      recognition.start();
    }
  };

  const stopRecording = () => {
    if (recognition && isRecording) {
      recognition.stop();
    }
  };

  const resetVoiceInput = () => {
    setTranscript('');
    setParsedData(null);
    setError(null);
  };

  return {
    isRecording,
    transcript,
    parsedData,
    error,
    startRecording,
    stopRecording,
    resetVoiceInput,
    isSupported: !!recognition
  };
};