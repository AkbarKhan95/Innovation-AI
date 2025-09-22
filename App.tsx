import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';

// Types
import type { Message, ChatSession, User, Theme, VoiceOption, AIModel, Topic, GroundingChunk, BrainstormBoard, BoardNode, BoardEdge } from './types';
import type { Chat } from '@google/genai';

// Services
import { createChat, generateChatResponseStream, generateTitle, generateImage, editImage, generateVideo, getVideosOperation, refineVisualPrompt, refineVideoPrompt, refineAnimationPrompt, generateSuggestions } from './services/geminiService';

// Components
import Sidebar from './components/Sidebar';
import ModelSelector from './components/ModelSelector';
import LoginPage from './components/LoginPage';
import MenuIcon from './components/icons/MenuIcon';
import UserIcon from './components/icons/UserIcon';
import BotIcon from './components/icons/BotIcon';
import MessageContent from './components/MessageContent';
import LoadingSpinner from './components/LoadingSpinner';
import PaperclipIcon from './components/icons/PaperclipIcon';
import SendIcon from './components/icons/SendIcon';
import XIcon from './components/icons/XIcon';
import FileIcon from './components/icons/FileIcon';
import BrainstormIcon from './components/icons/BrainstormIcon';
import CopyIcon from './components/icons/CopyIcon';
import SpeakerIcon from './components/icons/SpeakerIcon';
import StopIcon from './components/icons/StopIcon';
import GroundingSources from './components/GroundingSources';
import RegenerateIcon from './components/icons/RegenerateIcon';
import CheckIcon from './components/icons/CheckIcon';
import ChatModelSwitcher from './components/ChatModelSwitcher';
import MicrophoneIcon from './components/icons/MicrophoneIcon';
import Greeting from './components/Greeting';
import VideoIcon from './components/icons/VideoIcon';
import ImageIcon from './components/icons/ImageIcon';
import DownloadIcon from './components/icons/DownloadIcon';
import AddToBoardIcon from './components/icons/AddToBoardIcon';
import PencilIcon from './components/icons/PencilIcon';
import TermsModal from './components/TermsModal';
import PdfIcon from './components/icons/PdfIcon';
import SuggestionChips from './components/SuggestionChips';

// Hooks
import { useSpeechSynthesis } from './hooks/useSpeechSynthesis';

// Constants
import { AVAILABLE_MODELS } from './constants';

// Lazy-loaded components for faster initial load
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const BrainstormBoardComponent = React.lazy(() => import('./components/BrainstormBoard'));
const Modal = React.lazy(() => import('./components/Modal'));
const AboutModal = React.lazy(() => import('./components/AboutModal'));

// Fix for SpeechRecognition API types not being in default TypeScript lib
interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
}
interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionResult {
    readonly isFinal: boolean;
    readonly length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionAlternative {
    readonly transcript: string;
}
interface SpeechRecognitionErrorEvent extends Event {
    readonly error: string;
}
interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    onend: (() => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onstart: (() => void) | null;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    start(): void;
    stop(): void;
}
type SpeechRecognitionStatic = new () => SpeechRecognition;
declare global {
    interface Window {
        SpeechRecognition?: SpeechRecognitionStatic;
        webkitSpeechRecognition?: SpeechRecognitionStatic;
    }
}


// Helper function to create user-friendly error messages from API responses.
const getFriendlyErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
        try {
            // Attempt to parse the error message as JSON, which some APIs return.
            const parsedError = JSON.parse(error.message);
            if (parsedError && parsedError.error) {
                const { message, status } = parsedError.error;
                if (status === 'RESOURCE_EXHAUSTED') {
                    return `You have exceeded your usage quota for this feature. Please check your API key's billing status or try again later.`;
                }
                // Return the user-friendly message from the API error object.
                return message || 'An unexpected error occurred.';
            }
        } catch (e) {
            // If parsing fails, it's likely a standard error message string.
            return error.message;
        }
        // Fallback for non-JSON error messages.
        return error.message;
    }
    // Fallback for non-Error objects.
    return 'An unknown error occurred.';
};

const videoLoadingMessages = ["🎬 Directing your scene...", "💡 Adjusting the lighting...", "🎥 Camera is rolling...", "🎞️ Rendering the final cut... this can take a few minutes."];


const App: React.FC = () => {
    // State
    const [user, setUser] = useState<User | null>(null);
    const [termsAccepted, setTermsAccepted] = useState(() => localStorage.getItem('termsAccepted') === 'true');
    const [isTermsModalOpen, setIsTermsModalOpen] = useState(!termsAccepted);
    const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isDashboardOpen, setDashboardOpen] = useState(false);
    const [isBoardOpen, setBoardOpen] = useState(false);
    const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
    const [hasSeenAboutModal, setHasSeenAboutModal] = useState(() => localStorage.getItem('hasSeenAboutModal') === 'true');
    const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
    const [theme, setTheme] = useState<Theme>('light');
    const [voice, setVoice] = useState<VoiceOption>('female');
    const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
    const [isClearConfirmModalOpen, setClearConfirmModalOpen] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [attachedFile, setAttachedFile] = useState<Message['file'] | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [editingMessage, setEditingMessage] = useState<Message | null>(null);
    const [editText, setEditText] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [videoLoadingMessage, setVideoLoadingMessage] = useState('');


    // Refs
    const chatRef = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const pendingPrompt = useRef<{ sessionId: string, prompt: string, file?: Message['file'] } | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const speechRecognition = useRef<SpeechRecognition | null>(null);
    const editTextAreaRef = useRef<HTMLTextAreaElement>(null);
    const initialCheckCompleted = useRef(false);
    const chatSessionsRef = useRef(chatSessions);


    // Custom Hooks
    const { speakingMessageId, toggleReadAloud, playSample } = useSpeechSynthesis(voice);

    // Derived State
    const currentSession = chatSessions.find(s => s.id === currentSessionId);
    const lastAiMessage = [...(currentSession?.messages ?? [])].reverse().find(m => m.sender === 'ai');
    const isAnyVideoLoading = currentSession?.messages.some(m => m.loading === 'video') ?? false;
    
    // Effects
    useEffect(() => {
        chatSessionsRef.current = chatSessions;
    }, [chatSessions]);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) setUser(JSON.parse(storedUser));
        
        const storedTheme = localStorage.getItem('theme') as Theme | null;
        if (storedTheme) {
            setTheme(storedTheme);
            document.documentElement.setAttribute('data-theme', storedTheme);
        } else {
             document.documentElement.setAttribute('data-theme', 'light');
        }
    }, []);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth <= 768) {
                setSidebarOpen(false);
            } else {
                setSidebarOpen(true);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (user) {
            const storedSessions = localStorage.getItem(`sessions-${user.email}`);
            setChatSessions(storedSessions ? JSON.parse(storedSessions) : []);
        }
    }, [user]);

    // Debounced effect to save chat sessions to local storage.
    // This prevents the app from hanging by avoiding rapid, successive writes during streaming.
    useEffect(() => {
        if (user) {
            const saveTimeout = setTimeout(() => {
                localStorage.setItem(`sessions-${user.email}`, JSON.stringify(chatSessions));
            }, 100); // Debounce save operation by 100ms

            return () => {
                clearTimeout(saveTimeout);
            };
        }
    }, [chatSessions, user]);

     useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);
    
    useEffect(() => {
        // When the board is open, we temporarily store the pre-board state of the sidebar.
        // When the board closes, we restore it. This allows the sidebar to be fully hidden
        // without losing the user's collapsed/expanded preference.
        if (isBoardOpen) {
            // Use a session storage to remember the state just for this session
            sessionStorage.setItem('sidebarCollapsedBeforeBoard', String(isCollapsed));
            setIsCollapsed(true); // Force collapse for hiding
        } else if (sessionStorage.getItem('sidebarCollapsedBeforeBoard') !== null) {
            // Restore the previous state when the board is closed
            const wasCollapsed = sessionStorage.getItem('sidebarCollapsedBeforeBoard') === 'true';
            setIsCollapsed(wasCollapsed);
            sessionStorage.removeItem('sidebarCollapsedBeforeBoard');
        } else {
            // Default behavior: save collapse state to local storage
             localStorage.setItem('sidebarCollapsed', String(isCollapsed));
        }
    }, [isCollapsed, isBoardOpen]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [currentSession?.messages, currentSession?.isLoading]);

    useEffect(() => {
        if (pendingPrompt.current && currentSession && currentSession.id === pendingPrompt.current.sessionId) {
            handleSendMessage(pendingPrompt.current.prompt, pendingPrompt.current.file);
            pendingPrompt.current = null;
        }
    }, [currentSession]);

    // Effect to robustly show the About modal on the first visit after login.
    // The ref ensures this check only happens once per session.
    useEffect(() => {
        if (user && !initialCheckCompleted.current) {
            const seen = localStorage.getItem('hasSeenAboutModal') === 'true';
            if (!seen && !currentSessionId) {
                setIsAboutModalOpen(true);
            }
            initialCheckCompleted.current = true;
        }
    }, [user, currentSessionId]);

    // Effect for cycling video loading messages
    useEffect(() => {
        let intervalId: ReturnType<typeof setInterval> | null = null;
        
        if (isAnyVideoLoading) {
            let messageIndex = 0;
            setVideoLoadingMessage(videoLoadingMessages[0]);
            
            intervalId = setInterval(() => {
                messageIndex = (messageIndex + 1) % videoLoadingMessages.length;
                setVideoLoadingMessage(videoLoadingMessages[messageIndex]);
            }, 4000);
        } else {
             setVideoLoadingMessage('');
        }

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [isAnyVideoLoading]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            const scrollHeight = textareaRef.current.scrollHeight;
            textareaRef.current.style.height = `${scrollHeight}px`;
        }
    }, [prompt]);

     // Auto-resize edit textarea
    useEffect(() => {
        if (editTextAreaRef.current) {
            editTextAreaRef.current.style.height = 'auto';
            const scrollHeight = editTextAreaRef.current.scrollHeight;
            editTextAreaRef.current.style.height = `${scrollHeight}px`;
        }
    }, [editText]);


    // Handlers
    const handleAcceptTerms = () => {
        localStorage.setItem('termsAccepted', 'true');
        setTermsAccepted(true);
        setIsTermsModalOpen(false);
    };
    
    const handleLogin = (loggedInUser: User) => {
        setUser(loggedInUser);
        localStorage.setItem('user', JSON.stringify(loggedInUser));
    };

    const handleLogout = () => {
        setUser(null);
        setChatSessions([]);
        setCurrentSessionId(null);
        localStorage.removeItem('user');
    };

    const handleUpdateUserPicture = (pictureDataUrl: string) => {
        if (!user) return;
        const updatedUser = { ...user, picture: pictureDataUrl };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    };

    const handleSetVoice = (newVoice: VoiceOption, sampleText: string) => {
        setVoice(newVoice);
        playSample(newVoice, sampleText);
    };

    const handleNewChat = (modelId: AIModel['id'] = 'gemini-2.5-flash', initialPrompt?: string) => {
        const newSession: ChatSession = {
            id: crypto.randomUUID(),
            title: initialPrompt ? 'New Idea' : 'New Chat',
            messages: [],
            modelId: modelId,
            board: { nodes: [], edges: [], viewport: { pan: { x: 0, y: 0 }, zoom: 1 } },
        };
        setChatSessions(prev => [newSession, ...prev]);
        setCurrentSessionId(newSession.id);
        chatRef.current = null;
        if (window.innerWidth < 768) {
            setSidebarOpen(false);
        }

        if (initialPrompt) {
            pendingPrompt.current = { sessionId: newSession.id, prompt: initialPrompt };
        }
    };
    
    const handlePromptWithTopic = (topic: Topic) => {
        let prompt = '';
        switch (topic.id) {
            case 'sustainability':
                prompt = `Draft a high-tech, sustainable city blueprint for a major Indian metro. Using current data, focus on a circular economy for waste, clean urban mobility, and next-gen green energy solutions. Present as an actionable proposal.`;
                break;
            case 'defence':
                prompt = `Using the latest global defense trends, devise a strategy for India's technological military superiority. Propose three cutting-edge R&D projects: AI-driven cyber warfare, autonomous border surveillance swarms, and advanced stealth materials. Give them compelling codenames.`;
                break;
            case 'healthcare':
                prompt = `Blueprint an AI-first public health platform for rural India, referencing the latest telehealth innovations. Detail its core features for low-bandwidth diagnostics, multi-lingual AI assistants, and a streamlined doctor-patient connection system. How would you pilot this?`;
                break;
            case 'digital_india':
                prompt = `Using the latest information from the live internet, outline a strategy for "Digital India 2.0". Identify the top 3 emerging technologies that could have the biggest impact by 2030 and propose a flagship government program for each.`;
                break;
            case 'transport':
                prompt = `Design a smart, unified public transport blueprint for a tier-2 Indian city. The plan must integrate electric buses, metro, and last-mile EVs into a single app. Citing recent smart city projects, detail the tech stack for real-time tracking, unified payment, and AI-powered route optimization.`;
                break;
            case 'energy':
                prompt = `Based on current global energy policies, draft a national mission to establish India as a Green Hydrogen superpower. Detail the plan for solar-powered production, innovative storage and transport, and industrial application in sectors like steel and fertilizer manufacturing.`;
                break;
            default:
                prompt = `Tell me about innovative ideas related to ${topic.name} in India. Format your response with clear headings and lists.`;
        }

        if (!currentSession || currentSession.messages.length > 0) {
            handleNewChat('gemini-2.5-flash', prompt);
        } else {
            handleSendMessage(prompt);
        }
    };
    
    const updateAIMessage = (messageId: string, updates: Partial<Message>) => {
        setChatSessions(prev => prev.map(session => {
            if (session.id !== currentSessionId) return session;
            
            const updatedMessages = session.messages.map(msg => {
                if (msg.id === messageId) {
                    return { ...msg, ...updates };
                }
                return msg;
            });
            return { ...session, messages: updatedMessages };
        }));
    };

    const generateVisualResponse = async (text: string, modelType: 'Image' | 'Video') => {
        if (!currentSession) return;

        setChatSessions(prev => prev.map(s => s.id === currentSession.id ? { ...s, isLoading: true } : s));

        const aiResponseMessage: Message = { 
            id: crypto.randomUUID(), 
            sender: 'ai', 
            text: '',
            loading: modelType === 'Image' ? 'image' : 'video' 
        };

        setChatSessions(prev => prev.map(s =>
            s.id === currentSession!.id ? { ...s, messages: [...s.messages, aiResponseMessage] } : s
        ));
        
        try {
            if (modelType === 'Image') {
                const modelId = 'imagen-4.0-generate-001';
                const refinedPrompt = await refineVisualPrompt(text);
                const imageUrl = await generateImage(refinedPrompt, modelId);
                updateAIMessage(aiResponseMessage.id, { imageUrl, text: "Your image is ready!", loading: false });
            } else if (modelType === 'Video') {
                const modelId = 'veo-2.0-generate-001';
                const refinedPrompt = await refineVideoPrompt(text);
                let operation = await generateVideo(refinedPrompt, modelId);
                while (!operation.done) {
                    await new Promise(resolve => setTimeout(resolve, 10000));
                    operation = await getVideosOperation(operation);
                }
                const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
                if (downloadLink) {
                    const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
                    if (!videoResponse.ok) throw new Error(`Failed to fetch video: ${videoResponse.statusText}`);
                    const videoBlob = await videoResponse.blob();
                    const videoUrl = URL.createObjectURL(videoBlob);
                    updateAIMessage(aiResponseMessage.id, { videoUrl, text: "Your video is ready!", loading: false });
                } else {
                    throw new Error("Video generation failed to produce a result.");
                }
            }
        } catch (error) {
            console.error("Error generating visual content:", error);
            const errorMessage = getFriendlyErrorMessage(error);
            updateAIMessage(aiResponseMessage.id, { text: `Sorry, I ran into an error: ${errorMessage}`, loading: false });
        } finally {
            setChatSessions(prev => prev.map(s => s.id === currentSession.id ? { ...s, isLoading: false } : s));
        }
    };

    const handleVisualize = (text: string) => {
        generateVisualResponse(text, 'Image');
    };

    const handleConvertToVideo = (text: string) => {
        generateVisualResponse(text, 'Video');
    };

    const handleSelectChat = (id: string) => {
        if (id !== currentSessionId) {
            setCurrentSessionId(id);
            chatRef.current = null;
        }
        if (window.innerWidth < 768) {
            setSidebarOpen(false);
        }
    };

    const handleDeleteChat = (id: string) => {
        setChatSessions(prev => prev.filter(s => s.id !== id));
        if (currentSessionId === id) {
            setCurrentSessionId(null);
            chatRef.current = null;
        }
    };
    
    const handleRenameChat = (id: string, newTitle: string) => {
        if (newTitle.trim()) {
            setChatSessions(prev => prev.map(s => s.id === id ? { ...s, title: newTitle } : s));
        }
        setEditingSessionId(null);
    };

    const handleClearHistory = () => {
        setClearConfirmModalOpen(true);
    };

    const handleConfirmClearHistory = () => {
        setChatSessions([]);
        setCurrentSessionId(null);
        chatRef.current = null;
        setClearConfirmModalOpen(false);
        setDashboardOpen(false);
    };
    
    const handleGoToHome = () => {
        setCurrentSessionId(null);
        chatRef.current = null;
        if (window.innerWidth < 768) {
            setSidebarOpen(false);
        }
    };

    const handleModelChange = (modelId: AIModel['id']) => {
        if (!currentSession) return;
        setChatSessions(prev => prev.map(s => s.id === currentSession.id ? { ...s, modelId } : s));
        // Reset the chatRef so a new chat instance is created with the new model
        chatRef.current = null;
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (currentSession?.isLoading || (!prompt.trim() && !attachedFile)) return;
        handleSendMessage(prompt, attachedFile || undefined);
        setPrompt('');
        setAttachedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
    };

    const handlePdfQuickAction = (actionPrompt: string) => {
        if (currentSession?.isLoading || !attachedFile || attachedFile.type !== 'application/pdf') return;
        handleSendMessage(actionPrompt, attachedFile);
        setPrompt('');
        setAttachedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSendMessage = async (prompt: string, file?: Message['file'], options: { isRegeneration?: boolean, historyForApi?: Message[] } = {}) => {
        if (!currentSession) return;
        const { isRegeneration = false, historyForApi } = options;
        const historyForApiCall = isRegeneration ? historyForApi : currentSession.messages;
        const modelId = currentSession.modelId || 'gemini-2.5-flash';
        const model = AVAILABLE_MODELS.find(m => m.id === modelId);

        setChatSessions(prev => prev.map(s => s.id === currentSession.id ? { ...s, isLoading: true } : s));

        // --- TEXT MODEL LOGIC ---
        if (model?.type === 'Text') {
            const userMessage: Message = { id: crypto.randomUUID(), sender: 'user', text: prompt, file };
            const aiMessageId = crypto.randomUUID();
            const aiResponseMessage: Message = { id: aiMessageId, sender: 'ai', text: '', loading: 'text' };

            if (!isRegeneration) {
                setChatSessions(prev => prev.map(s =>
                    s.id === currentSession.id ? { ...s, messages: [...s.messages, userMessage, aiResponseMessage] } : s
                ));
            } else {
                 setChatSessions(prev => prev.map(s =>
                    s.id === currentSession.id ? { ...s, messages: [...s.messages, aiResponseMessage] } : s
                ));
            }

            try {
                if (!chatRef.current || isRegeneration) {
                    chatRef.current = createChat(modelId, historyForApiCall!);
                }
                const stream = await generateChatResponseStream(chatRef.current, prompt, modelId, file);

                let isFirstChunk = true;

                for await (const chunk of stream) {
                    if (isFirstChunk) {
                        updateAIMessage(aiMessageId, { text: chunk.text, groundingChunks: chunk.groundingChunks ?? undefined, loading: false });
                        isFirstChunk = false;
                    } else {
                        updateAIMessage(aiMessageId, { text: chunk.text, groundingChunks: chunk.groundingChunks ?? undefined });
                    }
                }
                
                if (isFirstChunk) { // Handle cases where the stream is empty and no error occurred
                    setChatSessions(prev => prev.map(s => {
                        if (s.id !== currentSessionId) return s;
                        return { ...s, messages: s.messages.filter(m => m.id !== aiMessageId) };
                    }));
                }
            } catch (error) {
                console.error("Error generating text content:", error);
                updateAIMessage(aiMessageId, { text: `Sorry, I ran into an error: ${getFriendlyErrorMessage(error)}`, loading: false });
            } finally {
                setChatSessions(prev => prev.map(s => s.id === currentSession.id ? { ...s, isLoading: false } : s));
                
                // Use a timeout to ensure the state update from streaming is processed before generating suggestions.
                setTimeout(async () => {
                    const finalCurrentSession = chatSessionsRef.current.find(s => s.id === currentSession.id);
                    if (finalCurrentSession && finalCurrentSession.messages.length > 0) {
                        const suggestions = await generateSuggestions(finalCurrentSession.messages);
                        if (suggestions.length > 0) {
                            updateAIMessage(aiMessageId, { suggestions });
                        }
                    }
                }, 0);

                const shouldGenerateTitle = !isRegeneration && (historyForApiCall?.length ?? 0) === 0 && prompt.length > 10;
                if (shouldGenerateTitle) {
                    generateTitle(prompt).then(newTitle => handleRenameChat(currentSession.id, newTitle));
                }
            }
        } else {
            // --- IMAGE/VIDEO MODEL LOGIC ---
            const aiResponseMessage: Message = { id: crypto.randomUUID(), sender: 'ai', text: '', groundingChunks: [] };

            if (!isRegeneration) {
                const userMessage: Message = { id: crypto.randomUUID(), sender: 'user', text: prompt, file };
                setChatSessions(prev => prev.map(s =>
                    s.id === currentSession.id ? { ...s, messages: [...s.messages, userMessage, aiResponseMessage] } : s
                ));
            } else {
                setChatSessions(prev => prev.map(s =>
                    s.id === currentSession.id ? { ...s, messages: [...s.messages, aiResponseMessage] } : s
                ));
            }

            try {
                if (model?.type === 'Image') {
                    updateAIMessage(aiResponseMessage.id, { loading: 'image' });
                    if (file && file.type.startsWith('image/')) {
                        // Image Editing: Use the user's prompt directly.
                        const { imageUrl } = await editImage(prompt, file);
                        updateAIMessage(aiResponseMessage.id, { imageUrl, text: "Your edited image is ready!", loading: false });
                    } else {
                        // Image Generation: Refine the prompt for better quality.
                        const refinedPrompt = await refineVisualPrompt(prompt);
                        const imageUrl = await generateImage(refinedPrompt, modelId);
                        updateAIMessage(aiResponseMessage.id, { imageUrl, text: "Your image is ready!", loading: false });
                    }
                } else if (model?.type === 'Video') {
                    updateAIMessage(aiResponseMessage.id, { text: "", loading: 'video' });
                    let refinedPrompt: string;
                     if (file && file.type.startsWith('image/')) {
                        // Image-to-Video: Use the animation-focused refiner.
                        refinedPrompt = await refineAnimationPrompt(prompt);
                    } else {
                        // Text-to-Video: Use the cinematic refiner.
                        refinedPrompt = await refineVideoPrompt(prompt);
                    }

                    let operation = await generateVideo(refinedPrompt, modelId, file);
                    while (!operation.done) {
                        await new Promise(resolve => setTimeout(resolve, 10000));
                        operation = await getVideosOperation(operation);
                    }
                    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
                    if (downloadLink) {
                        const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
                        if (!videoResponse.ok) throw new Error(`Failed to fetch video: ${videoResponse.statusText}`);
                        const videoBlob = await videoResponse.blob();
                        const videoUrl = URL.createObjectURL(videoBlob);
                        updateAIMessage(aiResponseMessage.id, { videoUrl, text: "Your video is ready!", loading: false });
                    } else {
                        updateAIMessage(aiResponseMessage.id, { text: "Sorry, video generation failed.", loading: false });
                    }
                }
            } catch (error) {
                console.error("Error generating visual content:", error);
                const errorMessage = getFriendlyErrorMessage(error);
                updateAIMessage(aiResponseMessage.id, { text: `Sorry, I ran into an error: ${errorMessage}`, loading: false });
            } finally {
                setChatSessions(prev => prev.map(s => s.id === currentSession.id ? { ...s, isLoading: false } : s));
                const shouldGenerateTitle = !isRegeneration && (historyForApiCall?.length ?? 0) === 0 && prompt.length > 10;
                if (shouldGenerateTitle) {
                    generateTitle(prompt).then(newTitle => handleRenameChat(currentSession.id, newTitle));
                }
            }
        }
    };


    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedMessageId(id);
        setTimeout(() => setCopiedMessageId(null), 2000);
    };

    const handleUpdateBoard = useCallback((updater: (board: BrainstormBoard) => BrainstormBoard) => {
        if (!currentSessionId) return;
        setChatSessions(sessions => sessions.map(s => {
            if (s.id !== currentSessionId) {
                return s;
            }
            const boardToUpdate = s.board ?? { nodes: [], edges: [], viewport: { pan: { x: 0, y: 0 }, zoom: 1 } };
            return { ...s, board: updater(boardToUpdate) };
        }));
    }, [currentSessionId]);

    const handleAddToBoard = (text: string) => {
        if (!currentSession) return;

        const board = currentSession.board ?? { nodes: [], edges: [], viewport: { pan: { x: 0, y: 0 }, zoom: 1 } };
        const { pan, zoom } = board.viewport;
        
        // Use window dimensions as an approximation of the board's viewport size.
        const viewWidth = window.innerWidth;
        const viewHeight = window.innerHeight;

        // Calculate the center of the viewport in board coordinates.
        const centerX = (viewWidth / 2 - pan.x) / zoom;
        const centerY = (viewHeight / 2 - pan.y) / zoom;
        
        // Add a small random offset to prevent nodes from stacking perfectly on top of each other.
        const offsetX = (Math.random() - 0.5) * 50;
        const offsetY = (Math.random() - 0.5) * 50;
        
        const newNode: BoardNode = {
            id: crypto.randomUUID(),
            content: text,
            position: { x: centerX + offsetX, y: centerY + offsetY },
            color: 'bg-yellow-200'
        };

        handleUpdateBoard(currentBoard => ({ ...currentBoard, nodes: [...currentBoard.nodes, newNode] }));
        handleOpenBoard();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const MAX_FILE_SIZE_MB = 20;
            const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
            if (file.size > MAX_FILE_SIZE_BYTES) {
                alert(`File size exceeds the limit of ${MAX_FILE_SIZE_MB}MB. Please choose a smaller file.`);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                setAttachedFile({
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    dataUrl: e.target?.result as string,
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRegenerate = async () => {
        if (!currentSession || currentSession.isLoading) return;
        let lastUserMessageIndex = -1;
        for (let i = currentSession.messages.length - 1; i >= 0; i--) {
            if (currentSession.messages[i].sender === 'user') {
                lastUserMessageIndex = i;
                break;
            }
        }
        if (lastUserMessageIndex === -1) return;
        const lastUserMessage = currentSession.messages[lastUserMessageIndex];
        const historyForApi = currentSession.messages.slice(0, lastUserMessageIndex);
        setChatSessions(prev =>
            prev.map(s =>
                s.id === currentSession.id
                    ? { ...s, messages: s.messages.slice(0, lastUserMessageIndex + 1) }
                    : s
            )
        );
        setTimeout(() => {
            handleSendMessage(lastUserMessage.text, lastUserMessage.file, {
                isRegeneration: true,
                historyForApi: historyForApi,
            });
        }, 0);
    };
    
    const handleToggleRecording = () => {
        if (isRecording) {
            speechRecognition.current?.stop();
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Sorry, your browser doesn't support speech recognition.");
            return;
        }
        
        const recognition = new SpeechRecognition();
        recognition.interimResults = true;
        recognition.continuous = true;
        speechRecognition.current = recognition;

        recognition.onstart = () => setIsRecording(true);
        recognition.onend = () => {
            setIsRecording(false);
            speechRecognition.current = null;
        };
        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            setIsRecording(false);
        };
        recognition.onresult = (event) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }
            if (finalTranscript) {
                 setPrompt(prev => prev ? `${prev.trim()} ${finalTranscript}` : finalTranscript);
            }
        };
        recognition.start();
    };

    const handleStartEdit = (message: Message) => {
        setEditingMessage(message);
        setEditText(message.text);
        setIsEditModalOpen(true);
    };

    const handleCancelEdit = () => {
        setEditingMessage(null);
        setEditText('');
        setIsEditModalOpen(false);
    };

    const handleSaveEdit = async () => {
        if (!currentSession || !editingMessage) return;

        const trimmedEditText = editText.trim();
        const trimmedOriginalText = editingMessage.text.trim();

        if (trimmedEditText === '' || trimmedEditText === trimmedOriginalText) {
            handleCancelEdit();
            return;
        }

        const editedMessageIndex = currentSession.messages.findIndex(m => m.id === editingMessage.id);
        if (editedMessageIndex === -1) return;

        const editedUserMessage = { ...currentSession.messages[editedMessageIndex], text: editText };
        const messagesForUiUpdate = [...currentSession.messages.slice(0, editedMessageIndex), editedUserMessage];
        const historyForApi = currentSession.messages.slice(0, editedMessageIndex);
        
        // This is a critical step: update the state to reflect the edit and remove the old AI response
        setChatSessions(prev =>
            prev.map(s =>
                s.id === currentSession.id
                    ? { ...s, messages: messagesForUiUpdate }
                    : s
            )
        );
        
        handleCancelEdit(); // This resets the editing state variables

        // Enqueue the regeneration call to run after the state update
        setTimeout(() => {
            handleSendMessage(editedUserMessage.text, editedUserMessage.file, {
                isRegeneration: true,
                historyForApi: historyForApi,
            });
        }, 0);
    };

    const handleToggleSidebar = () => setSidebarOpen(!isSidebarOpen);
    const handleToggleCollapse = () => {
        // On mobile, the collapse button should act as a close button.
        if (window.innerWidth < 768) {
            setSidebarOpen(false);
        } else {
            setIsCollapsed(prev => !prev);
        }
    };
    const handleOpenDashboard = () => setDashboardOpen(true);
    const handleCloseDashboard = () => setDashboardOpen(false);
    
    const handleOpenBoard = () => setBoardOpen(true);
    const handleCloseBoard = () => setBoardOpen(false);
    const handleOpenAboutModal = () => setIsAboutModalOpen(true);
    const handleCloseAboutModal = () => {
        setIsAboutModalOpen(false);
        // Mark as seen so it doesn't pop up again on this device.
        if (!hasSeenAboutModal) {
            localStorage.setItem('hasSeenAboutModal', 'true');
            setHasSeenAboutModal(true);
        }
    };

    return (
        <div className="flex h-screen bg-bg-primary text-text-primary overflow-hidden font-sans">
            <TermsModal
                isOpen={isTermsModalOpen}
                onAccept={handleAcceptTerms}
                onClose={() => setIsTermsModalOpen(false)}
                showAcceptButton={!termsAccepted}
            />

            {!user ? (
                <LoginPage onLogin={handleLogin} onViewTerms={() => setIsTermsModalOpen(true)} />
            ) : (
            <>
                <div className={`${isBoardOpen ? 'md:hidden' : ''}`}>
                    <Sidebar
                        chatSessions={chatSessions}
                        currentSessionId={currentSessionId}
                        onNewChat={() => handleNewChat()}
                        onSelectChat={handleSelectChat}
                        onDeleteChat={handleDeleteChat}
                        onRenameChat={handleRenameChat}
                        editingSessionId={editingSessionId}
                        setEditingSessionId={setEditingSessionId}
                        isSidebarOpen={isSidebarOpen}
                        isCollapsed={isCollapsed}
                        toggleCollapse={handleToggleCollapse}
                        user={user}
                        onLogout={handleLogout}
                        onGoToHome={handleGoToHome}
                        onOpenSettings={handleOpenDashboard}
                    />
                </div>

                <main className={`flex-1 flex flex-col transition-all duration-[400ms] ease-in-out origin-left ${
                    isBoardOpen ? 'md:ml-0' : (isCollapsed ? 'md:ml-20' : 'md:ml-80')
                }`}>
                    {!currentSession ? (
                        <>
                            <header className="flex-shrink-0 flex items-center justify-center p-3 border-b border-border-primary bg-bg-secondary backdrop-blur-sm relative">
                                <button onClick={handleToggleSidebar} className="absolute left-3 p-2 rounded-full hover:bg-bg-tertiary-hover md:hidden">
                                    <MenuIcon className="w-6 h-6 text-text-secondary" isOpen={isSidebarOpen} />
                                </button>
                                <h1 className="text-lg font-semibold truncate text-text-primary text-center">
                                    Innovation AI
                                </h1>
                            </header>
                            <ModelSelector onSelectModel={handleNewChat} onPromptWithTopic={handlePromptWithTopic} onOpenAbout={handleOpenAboutModal} />
                        </>
                    ) : (
                        <div className="flex flex-col h-full">
                            {/* Chat Header */}
                            <header className="flex-shrink-0 flex items-center justify-center p-3 border-b border-border-primary bg-bg-secondary backdrop-blur-sm relative">
                                <button onClick={handleToggleSidebar} className="absolute left-3 p-2 rounded-full hover:bg-bg-tertiary-hover md:hidden">
                                    <MenuIcon className="w-6 h-6 text-text-secondary" isOpen={isSidebarOpen} />
                                </button>
                                <h1 className="text-lg font-semibold truncate text-text-primary text-center">
                                    {currentSession.title}
                                </h1>
                                <button onClick={handleOpenBoard} className="absolute right-3 flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-bg-tertiary-hover transition-colors text-sm font-medium">
                                    <BrainstormIcon className="w-5 h-5"/>
                                    <span className="hidden sm:inline">Brainstorm Board</span>
                                </button>
                            </header>
                            
                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto">
                            <div className="max-w-4xl mx-auto px-4 py-6">
                                {currentSession.messages.length === 0 && !currentSession.isLoading ? (
                                    <Greeting user={user} onPromptWithTopic={handlePromptWithTopic} />
                                ) : (
                                    <div className="space-y-10">
                                        {(() => {
                                            let lastUserMessageIndex = -1;
                                            for (let i = currentSession.messages.length - 1; i >= 0; i--) {
                                                if (currentSession.messages[i].sender === 'user') {
                                                    lastUserMessageIndex = i;
                                                    break;
                                                }
                                            }
                                            return currentSession.messages.map((msg, index) => {
                                                const isLastUserMessage = index === lastUserMessageIndex;
                                                const isLastAiMessageInHistory = msg.id === lastAiMessage?.id;
                                                const hasContent = (msg.text && msg.text.trim().length > 0) || msg.imageUrl || msg.videoUrl;

                                                return (
                                                    <div key={msg.id} className={`flex w-full items-start gap-3 animate-bubble-in ${ msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                        
                                                        {msg.sender === 'ai' && (
                                                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-bg-tertiary">
                                                            <BotIcon className="w-7 h-7 text-bg-accent" />
                                                        </div>
                                                        )}

                                                        <div className={`flex flex-col gap-1 max-w-[85%] md:max-w-xl group ${ msg.sender === 'user' ? 'items-end' : 'items-start' }`}>
                                                            
                                                            <div className={`
                                                                px-5 py-4 rounded-2xl border transition-all
                                                                ${msg.sender === 'user'
                                                                    ? 'bg-bg-accent text-text-on-accent rounded-br-lg border-transparent'
                                                                    : `bg-bg-secondary text-text-primary rounded-bl-lg border-border-primary`
                                                                }
                                                            `}>
                                                                <div className="max-w-none">
                                                                    {msg.loading === 'video' ? (
                                                                        <div className="flex flex-col items-center justify-center p-2 text-center">
                                                                            <p className="text-text-secondary text-sm mb-2 animate-fade-in">{videoLoadingMessage}</p>
                                                                            <LoadingSpinner />
                                                                        </div>
                                                                    ) : msg.loading ? (
                                                                        <LoadingSpinner />
                                                                    ) : (
                                                                        <MessageContent text={msg.text} isStreaming={msg.loading === 'text'} sender={msg.sender} />
                                                                    )}
                                                                    {msg.imageUrl && (
                                                                        <div className="mt-2 relative">
                                                                            {msg.loading === 'image' && <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg"><LoadingSpinner /></div>}
                                                                            <img src={msg.imageUrl} alt="Generated content" className="rounded-lg w-full h-auto" />
                                                                            <a href={msg.imageUrl} download={`innovation-ai-image-${msg.id}.png`} className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"><DownloadIcon className="w-4 h-4" /></a>
                                                                        </div>
                                                                    )}
                                                                    {msg.videoUrl && (
                                                                        <div className="mt-2 relative">
                                                                            <video src={msg.videoUrl} controls className="rounded-lg w-full h-auto"></video>
                                                                            <a href={msg.videoUrl} download={`innovation-ai-video-${msg.id}.mp4`} className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"><DownloadIcon className="w-4 h-4" /></a>
                                                                        </div>
                                                                    )}
                                                                    {msg.file && msg.sender === 'user' && (
                                                                        <div className="mt-2 p-2 bg-black/20 rounded-lg flex items-center gap-2 max-w-xs">
                                                                            {msg.file.type.startsWith('image/') ? <ImageIcon className="w-5 h-5" /> : msg.file.type === 'application/pdf' ? <PdfIcon className="w-5 h-5" /> : <FileIcon className="w-5 h-5" />}
                                                                            <span className="text-sm truncate">{msg.file.name}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {msg.sender === 'ai' && msg.groundingChunks && msg.groundingChunks.length > 0 && <GroundingSources chunks={msg.groundingChunks} />}
                                                            </div>
                                                            
                                                            {msg.sender === 'ai' && hasContent && !msg.loading && (
                                                                <div className="flex w-full justify-end items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                                                    <button onClick={() => handleCopy(msg.text, msg.id)} title="Copy" className="p-1.5 rounded-full hover:bg-bg-tertiary-hover text-text-secondary">
                                                                        {copiedMessageId === msg.id ? <CheckIcon className="w-4 h-4 text-green-500" /> : <CopyIcon className="w-4 h-4" />}
                                                                    </button>
                                                                    <button onClick={() => toggleReadAloud(msg)} title={speakingMessageId === msg.id ? "Stop" : "Read Aloud"} className="p-1.5 rounded-full hover:bg-bg-tertiary-hover text-text-secondary">
                                                                        {speakingMessageId === msg.id ? <StopIcon className="w-4 h-4 text-bg-accent" /> : <SpeakerIcon className="w-4 h-4" />}
                                                                    </button>
                                                                    <button onClick={() => handleVisualize(msg.text)} title="Visualize Idea" className="p-1.5 rounded-full hover:bg-bg-tertiary-hover text-text-secondary">
                                                                    <ImageIcon className="w-4 h-4" />
                                                                    </button>
                                                                    <button onClick={() => handleConvertToVideo(msg.text)} title="Create Video" className="p-1.5 rounded-full hover:bg-bg-tertiary-hover text-text-secondary">
                                                                    <VideoIcon className="w-4 h-4" />
                                                                    </button>
                                                                    <button onClick={() => handleAddToBoard(msg.text)} title="Add to Brainstorm Board" className="p-1.5 rounded-full hover:bg-bg-tertiary-hover text-text-secondary">
                                                                    <AddToBoardIcon className="w-4 h-4" />
                                                                    </button>
                                                                    {isLastAiMessageInHistory && !currentSession.isLoading && (
                                                                        <button onClick={handleRegenerate} title="Regenerate" className="p-1.5 rounded-full hover:bg-bg-tertiary-hover text-text-secondary">
                                                                            <RegenerateIcon className="w-4 h-4" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            )}
                                                            {msg.sender === 'user' && isLastUserMessage && !currentSession.isLoading && !editingMessage && (
                                                                <div className="flex justify-end items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                                                    <button onClick={() => handleStartEdit(msg)} title="Edit & Regenerate" className="p-1.5 rounded-full hover:bg-bg-tertiary-hover text-text-secondary">
                                                                        <PencilIcon className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            )}
                                                            {isLastAiMessageInHistory && !currentSession.isLoading && msg.suggestions && msg.suggestions.length > 0 && (
                                                                <SuggestionChips
                                                                    suggestions={msg.suggestions}
                                                                    onSelect={(suggestion) => handleSendMessage(suggestion)}
                                                                />
                                                            )}
                                                        </div>

                                                        {msg.sender === 'user' && (
                                                            user.picture ? (
                                                                <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                                                            ) : (
                                                                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-bg-tertiary">
                                                                    <span className="text-lg font-bold text-bg-accent">{user.name.charAt(0).toUpperCase()}</span>
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                );
                                            });
                                        })()}
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                            </div>

                            {/* Input Area */}
                            <div className="flex-shrink-0 p-4 bg-bg-primary">
                                <div className="max-w-4xl mx-auto">
                                <div className="mb-3 flex justify-center">
                                        <ChatModelSwitcher 
                                            currentModelId={currentSession.modelId || 'gemini-2.5-flash'}
                                            onSelectModel={handleModelChange}
                                            disabled={!!currentSession.isLoading}
                                        />
                                </div>
                                {attachedFile && attachedFile.type === 'application/pdf' && !currentSession.isLoading && (
                                        <div className="flex items-center justify-center gap-2 mb-2 animate-fade-in">
                                            <button
                                                type="button"
                                                onClick={() => handlePdfQuickAction('Summarize this document.')}
                                                className="px-3 py-1.5 text-xs font-medium rounded-full bg-bg-tertiary hover:bg-bg-tertiary-hover text-text-secondary transition-colors"
                                            >
                                                Summarize Document
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handlePdfQuickAction('Extract key points from this document as a bulleted list.')}
                                                className="px-3 py-1.5 text-xs font-medium rounded-full bg-bg-tertiary hover:bg-bg-tertiary-hover text-text-secondary transition-colors"
                                            >
                                                Extract Key Points
                                            </button>
                                        </div>
                                    )}
                                <form onSubmit={handleFormSubmit}>
                                    <div className="flex flex-col p-2 bg-bg-secondary border border-border-primary rounded-2xl focus-within:ring-2 focus-within:ring-blue-500 transition-shadow">
                                            {attachedFile && (
                                                <div className="flex items-center gap-2 p-1.5 mb-2 mx-2 bg-bg-tertiary rounded-md max-w-xs animate-fade-in">
                                                    {attachedFile.type.startsWith('image/') ? <ImageIcon className="w-5 h-5 text-text-secondary" /> : attachedFile.type === 'application/pdf' ? <PdfIcon className="w-5 h-5 text-text-secondary" /> : <FileIcon className="w-5 h-5 text-text-secondary" />}
                                                    <span className="text-sm text-text-secondary truncate">{attachedFile.name}</span>
                                                    <button type="button" onClick={() => setAttachedFile(null)} className="p-0.5 rounded-full hover:bg-bg-tertiary-hover">
                                                        <XIcon className="w-4 h-4 text-text-secondary"/>
                                                    </button>
                                                </div>
                                            )}
                                            <div className="flex items-end gap-2">
                                                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 rounded-full hover:bg-bg-tertiary-hover text-text-secondary flex-shrink-0" aria-label="Attach file">
                                                    <PaperclipIcon className="w-5 h-5" />
                                                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,video/*,application/pdf,.txt,.md,.csv" />
                                                </button>
                                                <textarea
                                                    ref={textareaRef}
                                                    value={prompt}
                                                    onChange={(e) => setPrompt(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && !e.shiftKey) {
                                                            e.preventDefault();
                                                            handleFormSubmit(e);
                                                        }
                                                    }}
                                                    placeholder={isRecording ? 'Listening...' : attachedFile && attachedFile.type === 'application/pdf' ? 'Ask a question about the PDF or use a quick action...' : attachedFile ? `Describe what to do with ${attachedFile.name}...` : `Ask anything or drop a file...`}
                                                    className="flex-1 bg-transparent resize-none border-none focus:outline-none max-h-48 text-text-primary placeholder:text-text-secondary py-2"
                                                    rows={1}
                                                    disabled={!!currentSession.isLoading}
                                                />
                                                <button type="button" onClick={handleToggleRecording} className={`p-2 rounded-full hover:bg-bg-tertiary-hover flex-shrink-0 ${isRecording ? 'text-red-500' : 'text-text-secondary'}`} aria-label={isRecording ? 'Stop recording' : 'Start recording'}>
                                                    <MicrophoneIcon className="w-5 h-5" />
                                                </button>
                                                <button type="submit" disabled={!!currentSession.isLoading || (!prompt.trim() && !attachedFile)} className="p-2 rounded-full bg-bg-accent text-text-on-accent transition-colors hover:bg-bg-accent-hover disabled:bg-bg-accent-disabled disabled:cursor-not-allowed flex-shrink-0" aria-label="Send message">
                                                    <SendIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                </form>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </>
            )}

            <Suspense fallback={<div className="fixed inset-0 bg-modal-backdrop z-40 flex items-center justify-center"><LoadingSpinner /></div>}>
                <AboutModal isOpen={isAboutModalOpen} onClose={handleCloseAboutModal} />
                <Dashboard 
                    isOpen={isDashboardOpen}
                    onClose={handleCloseDashboard}
                    chatSessions={chatSessions}
                    theme={theme}
                    setTheme={setTheme}
                    voice={voice}
                    setVoice={handleSetVoice}
                    handleClearHistory={handleClearHistory}
                    user={user}
                    onUpdateUserPicture={handleUpdateUserPicture}
                />
                {currentSession && (
                     <BrainstormBoardComponent
                        isOpen={isBoardOpen}
                        onClose={handleCloseBoard}
                        boardData={currentSession.board || { nodes: [], edges: [], viewport: { pan: {x:0, y:0}, zoom: 1}}}
                        onUpdateBoard={handleUpdateBoard}
                     />
                )}
                <Modal
                    isOpen={isClearConfirmModalOpen}
                    onClose={() => setClearConfirmModalOpen(false)}
                    onConfirm={handleConfirmClearHistory}
                    title="Clear All Chats?"
                    isDestructive
                    confirmText="Delete All"
                >
                    <p>Are you sure you want to delete all your conversations? This action cannot be undone.</p>
                </Modal>
                <Modal
                    isOpen={isEditModalOpen}
                    onClose={handleCancelEdit}
                    onConfirm={handleSaveEdit}
                    title="Edit Message"
                    confirmText="Save & Regenerate"
                >
                    <textarea
                        ref={editTextAreaRef}
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSaveEdit();
                            }
                            if (e.key === 'Escape') {
                                handleCancelEdit();
                            }
                        }}
                        className="w-full bg-bg-input border border-border-secondary rounded-lg resize-none p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-text-primary min-h-[120px]"
                        autoFocus
                    />
                </Modal>
            </Suspense>
        </div>
    );
};

export default App;