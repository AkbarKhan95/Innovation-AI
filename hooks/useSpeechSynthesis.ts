import { useState, useEffect, useRef, useCallback } from 'react';
import type { VoiceOption } from '../types';

const chunkText = (text: string, maxLength = 250): string[] => {
    const chunks: string[] = [];
    if (!text) return chunks;
    let remainingText = text;
    while (remainingText.length > 0) {
        if (remainingText.length <= maxLength) {
            chunks.push(remainingText);
            break;
        }
        let slice = remainingText.substring(0, maxLength);
        let breakPoint = -1;
        const sentenceEnd = Math.max(slice.lastIndexOf('.'), slice.lastIndexOf('!'), slice.lastIndexOf('?'));
        if (sentenceEnd > -1) breakPoint = sentenceEnd + 1;
        else breakPoint = slice.lastIndexOf(' ') > -1 ? slice.lastIndexOf(' ') + 1 : maxLength;
        
        const chunk = remainingText.substring(0, breakPoint);
        chunks.push(chunk);
        remainingText = remainingText.substring(breakPoint);
    }
    return chunks.map(c => c.trim()).filter(c => c.length > 0);
};

export const useSpeechSynthesis = (defaultVoice: VoiceOption) => {
    const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
    const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
    const speechQueueRef = useRef<string[]>([]);
    const activeUtterance = useRef<SpeechSynthesisUtterance | null>(null);

    useEffect(() => {
        const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) setAvailableVoices(voices);
        };
        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
        return () => { window.speechSynthesis.onvoiceschanged = null; };
    }, []);
    
    useEffect(() => {
        return () => {
            if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
        };
    }, []);

    const findVoice = useCallback((voiceOption: VoiceOption): SpeechSynthesisVoice | null => {
        if (availableVoices.length === 0) return null;
        const lang = 'en';
        const isFemale = voiceOption.includes('female');
        const femaleNames = ['female', 'zira', 'samantha', 'susan', 'karen', 'tessa'];
        const maleNames = ['male', 'david', 'alex', 'daniel', 'tom', 'oliver'];
        const targetNames = isFemale ? femaleNames : maleNames;
        const preferredVoices = availableVoices.filter(v => v.lang.startsWith(lang) && targetNames.some(name => v.name.toLowerCase().includes(name)));
        if (preferredVoices.length > 0) {
            const googleVoice = preferredVoices.find(v => v.name.toLowerCase().includes('google'));
            if (googleVoice) return googleVoice;
            const microsoftVoice = preferredVoices.find(v => v.name.toLowerCase().includes('microsoft'));
            if (microsoftVoice) return microsoftVoice;
            return preferredVoices[0];
        }
        return availableVoices.find(v => v.lang.startsWith(lang)) || availableVoices[0] || null;
    }, [availableVoices]);

    const applyVoiceSettings = (utterance: SpeechSynthesisUtterance, voiceOption: VoiceOption) => {
        // Fine-tuned settings for more natural and pleasant-sounding voices.
        switch (voiceOption) {
            // Voice 1: Female (Girl) - A clear, friendly female voice with a natural pace.
            case 'female':
                utterance.pitch = 1.2;
                utterance.rate = 1.0;
                break;
            // Voice 2: Male (Boy) - A more natural, slightly higher-pitched, and energetic boy's voice.
            case 'male':
                utterance.pitch = 1.05;
                utterance.rate = 1.1;
                break;
            // Voice 3: AI (Female) - A higher-pitched, clear synthetic voice that is not overly robotic.
            case 'female-robot':
                utterance.pitch = 1.4;
                utterance.rate = 0.9;
                break;
            // Voice 4: AI (Male) - A deep, resonant, and steady robotic voice, distinct from the boy's voice.
            case 'male-robot':
                utterance.pitch = 0.5;
                utterance.rate = 0.85;
                break;
            default:
                utterance.pitch = 1;
                utterance.rate = 1;
                break;
        }
    };

    const toggleReadAloud = useCallback((message: { id: string, text: string }) => {
        const isStopping = speakingMessageId === message.id;
        speechQueueRef.current = [];
        activeUtterance.current = null;
        if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
        if (isStopping) {
            setSpeakingMessageId(null);
            return;
        }

        const playNextChunk = () => {
            if (speechQueueRef.current.length === 0) {
                setSpeakingMessageId(null);
                activeUtterance.current = null;
                return;
            }
            const chunk = speechQueueRef.current.shift();
            if (!chunk) return;
            const utterance = new SpeechSynthesisUtterance(chunk);
            const selectedVoice = findVoice(defaultVoice);
            if (selectedVoice) utterance.voice = selectedVoice;
            applyVoiceSettings(utterance, defaultVoice);
            activeUtterance.current = utterance;
            utterance.onend = () => {
                if (activeUtterance.current === utterance) playNextChunk();
            };
            utterance.onerror = (event) => {
                if (event.error !== 'interrupted') {
                    console.error("Speech synthesis error:", event.error);
                    speechQueueRef.current = [];
                    activeUtterance.current = null;
                    setSpeakingMessageId(null);
                }
            };
            window.speechSynthesis.speak(utterance);
        };

        const textChunks = chunkText(message.text);
        if (textChunks.length > 0) {
            speechQueueRef.current = textChunks;
            setSpeakingMessageId(message.id);
            playNextChunk();
        } else {
            setSpeakingMessageId(null);
        }
    }, [speakingMessageId, defaultVoice, findVoice]);

    const playSample = useCallback((voiceOption: VoiceOption, text: string) => {
        if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const selectedVoice = findVoice(voiceOption);
        if (selectedVoice) utterance.voice = selectedVoice;
        applyVoiceSettings(utterance, voiceOption);
        window.speechSynthesis.speak(utterance);
    }, [findVoice]);
    
    return { speakingMessageId, toggleReadAloud, playSample };
};