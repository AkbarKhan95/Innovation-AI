import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Types
import type { Message, ChatSession, User, Theme, VoiceOption, AIModel, Topic, GroundingChunk, BrainstormBoard, BoardNode, BoardEdge } from './types';
import type { Chat } from '@google/genai';

// Services
import { createChat, generateChatResponseStream, generateTitle, generateImage, editImage, generateVideo, getVideosOperation, refineVisualPrompt, refineVideoPrompt } from './services/geminiService';

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
import VisualizeIcon from './components/icons/VisualizeIcon';
import PencilIcon from './components/icons/PencilIcon';

// Hooks
import { useSpeechSynthesis } from './hooks/useSpeechSynthesis';

// Constants
import { AVAILABLE_MODELS } from './constants';

// Lazy-loaded components for faster initial load
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const BrainstormBoardComponent = React.lazy(() => import('./components/BrainstormBoard'));
const Modal = React.lazy(() => import('./components/Modal'));

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
    const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isThinking, setIsThinking] = useState(false); // For text model loading indicator
    const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isDashboardOpen, setDashboardOpen] = useState(false);
    const [isBoardOpen, setBoardOpen] = useState(false);
    const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
    const [theme, setTheme] = useState<Theme>('light');
    const [voice, setVoice] = useState<VoiceOption>('male-robot');
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

    // Custom Hooks
    const { speakingMessageId, toggleReadAloud, playSample } = useSpeechSynthesis(voice);

    // Derived State
    const currentSession = chatSessions.find(s => s.id === currentSessionId);
    const lastAiMessage = [...(currentSession?.messages ?? [])].reverse().find(m => m.sender === 'ai');
    const isAnyVideoLoading = currentSession?.messages.some(m => m.loading === 'video') ?? false;
    
    // Effects
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
        if (user) {
            const storedSessions = localStorage.getItem(`sessions-${user.email}`);
            setChatSessions(storedSessions ? JSON.parse(storedSessions) : []);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            localStorage.setItem(`sessions-${user.email}`, JSON.stringify(chatSessions));
        }
    }, [chatSessions, user]);

     useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);
    
    useEffect(() => {
        localStorage.setItem('sidebarCollapsed', String(isCollapsed));
    }, [isCollapsed]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [currentSession?.messages, isLoading, isThinking]);

    useEffect(() => {
        if (pendingPrompt.current && currentSession && currentSession.id === pendingPrompt.current.sessionId) {
            handleSendMessage(pendingPrompt.current.prompt, pendingPrompt.current.file);
            pendingPrompt.current = null;
        }
    }, [currentSession]);

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

    const handleSetVoice = (newVoice: VoiceOption, sampleText: string) => {
        setVoice(newVoice);
        playSample(newVoice, sampleText);
    };

    const handleNewChat = (modelId: AIModel['id'] = 'gemini-2.5-flash', initialPrompt?: string) => {
        const newSession: ChatSession = {
            id: uuidv4(),
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
        const prompt = `Tell me about innovative ideas related to ${topic.name} in India. Format your response with clear headings and lists.`;
        
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

        setIsLoading(true);

        const aiResponseMessage: Message = { 
            id: uuidv4(), 
            sender: 'ai', 
            text: '',
            loading: modelType === 'Image' ? 'image' : 'video' 
        };

        setChatSessions(prev => prev.map(s =>
            s.id === currentSession.id ? { ...s, messages: [...s.messages, aiResponseMessage] } : s
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
            setIsLoading(false);
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
        if (isLoading || (!prompt.trim() && !attachedFile)) return;
        handleSendMessage(prompt, attachedFile || undefined);
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

        setIsLoading(true);

        // --- TEXT MODEL LOGIC ---
        if (model?.type === 'Text') {
            setIsThinking(true);

            if (!isRegeneration) {
                const userMessage: Message = { id: uuidv4(), sender: 'user', text: prompt, file };
                setChatSessions(prev => prev.map(s =>
                    s.id === currentSession.id ? { ...s, messages: [...s.messages, userMessage] } : s
                ));
            }

            try {
                if (!chatRef.current || isRegeneration) {
                    chatRef.current = createChat(modelId, historyForApiCall!);
                }
                const stream = await generateChatResponseStream(chatRef.current, prompt, modelId, file);

                let isFirstChunk = true;
                let aiMessageId: string | null = null;

                for await (const chunk of stream) {
                    if (isFirstChunk) {
                        setIsThinking(false);
                        const newAiMessage: Message = {
                            id: uuidv4(),
                            sender: 'ai',
                            text: chunk.text,
                            groundingChunks: chunk.groundingChunks ?? undefined
                        };
                        aiMessageId = newAiMessage.id;
                        setChatSessions(prev => prev.map(s =>
                            s.id === currentSessionId ? { ...s, messages: [...s.messages, newAiMessage] } : s
                        ));
                        isFirstChunk = false;
                    } else if (aiMessageId) {
                        updateAIMessage(aiMessageId, { text: chunk.text, groundingChunks: chunk.groundingChunks ?? undefined });
                    }
                }
                if (isFirstChunk) { // Handle cases where the stream is empty
                    setIsThinking(false);
                }
            } catch (error) {
                console.error("Error generating text content:", error);
                setIsThinking(false);
                const errorMessage: Message = { id: uuidv4(), sender: 'ai', text: `Sorry, I ran into an error: ${getFriendlyErrorMessage(error)}` };
                setChatSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, errorMessage] } : s));
            } finally {
                setIsLoading(false);
                const shouldGenerateTitle = !isRegeneration && (historyForApiCall?.length ?? 0) === 0 && prompt.length > 10;
                if (shouldGenerateTitle) {
                    generateTitle(prompt).then(newTitle => handleRenameChat(currentSession.id, newTitle));
                }
            }
        } else {
            // --- IMAGE/VIDEO MODEL LOGIC ---
            setIsThinking(false);
            const aiResponseMessage: Message = { id: uuidv4(), sender: 'ai', text: '', groundingChunks: [] };

            if (!isRegeneration) {
                const userMessage: Message = { id: uuidv4(), sender: 'user', text: prompt, file };
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
                    const refinedPrompt = await refineVisualPrompt(prompt);
                    if (file && file.type.startsWith('image/')) {
                        const { imageUrl, text } = await editImage(refinedPrompt, file);
                        updateAIMessage(aiResponseMessage.id, { imageUrl, text: "Your edited image is ready!", loading: false });
                    } else {
                        const imageUrl = await generateImage(refinedPrompt, modelId);
                        updateAIMessage(aiResponseMessage.id, { imageUrl, text: "Your image is ready!", loading: false });
                    }
                } else if (model?.type === 'Video') {
                    updateAIMessage(aiResponseMessage.id, { text: "", loading: 'video' });
                    const refinedPrompt = await refineVideoPrompt(prompt);
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
                setIsLoading(false);
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
        const newNode: BoardNode = {
            id: uuidv4(),
            content: text,
            position: { x: 100, y: 100 }, // Position can be randomized or centered later
            color: 'bg-yellow-200'
        };
        handleUpdateBoard(board => ({ ...board, nodes: [...board.nodes, newNode] }));
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const MAX_FILE_SIZE_MB = 10;
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
        if (!currentSession || isLoading) return;
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

    if (!user) {
        return <LoginPage onLogin={handleLogin} />;
    }

    return (
        <div className="flex h-screen bg-bg-primary text-text-primary overflow-hidden font-sans">
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

            <main className={`flex-1 flex flex-col transition-all duration-[400ms] ease-in-out origin-left ${isCollapsed ? 'md:ml-20' : 'md:ml-80'}`}>
                 {!currentSession ? (
                    <>
                        <header className="flex-shrink-0 flex items-center justify-center p-3 border-b border-border-primary bg-bg-secondary/80 backdrop-blur-sm relative">
                            <button onClick={handleToggleSidebar} className="absolute left-3 p-2 rounded-full hover:bg-bg-tertiary-hover md:hidden">
                                <MenuIcon className="w-6 h-6 text-text-secondary" isOpen={isSidebarOpen} />
                            </button>
                            <h1 className="text-lg font-semibold truncate text-text-primary text-center">
                                Innovation AI
                            </h1>
                        </header>
                        <ModelSelector onSelectModel={handleNewChat} onPromptWithTopic={handlePromptWithTopic} />
                    </>
                ) : (
                    <div className="flex flex-col h-full">
                        {/* Chat Header */}
                        <header className="flex-shrink-0 flex items-center justify-center p-3 border-b border-border-primary bg-bg-secondary/80 backdrop-blur-sm relative">
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
                            {currentSession.messages.length === 0 && !isThinking ? (
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
                                            const isLastAiMessage = msg.id === lastAiMessage?.id;
                                            const isStreaming = isLoading && isLastAiMessage && currentSession.modelId === 'gemini-2.5-flash';
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
                                                            px-4 py-3 rounded-2xl border transition-all
                                                            ${msg.sender === 'user'
                                                                ? 'bg-bg-accent text-text-on-accent rounded-br-lg border-transparent'
                                                                : `bg-bg-secondary text-text-primary rounded-bl-lg border-border-primary`
                                                            }
                                                        `}>
                                                            <div className={`prose prose-sm max-w-none ${msg.sender === 'user' ? 'prose-invert' : 'dark:prose-invert'}`}>
                                                                {msg.loading === 'video' ? (
                                                                    <div className="flex flex-col items-center justify-center p-2 text-center">
                                                                        <p className="text-text-secondary text-sm mb-2 animate-fade-in">{videoLoadingMessage}</p>
                                                                        <LoadingSpinner />
                                                                    </div>
                                                                ) : msg.loading ? (
                                                                    <LoadingSpinner />
                                                                ) : (
                                                                    <MessageContent text={msg.text} isStreaming={isStreaming} />
                                                                )}
                                                                {msg.imageUrl && (
                                                                     <div className="mt-2 relative">
                                                                        {msg.loading === 'image' && <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg"><LoadingSpinner /></div>}
                                                                        <img src={msg.imageUrl} alt="Generated content" className="rounded-lg w-full h-auto" />
                                                                        <a href={msg.imageUrl} download={`innovation-ai-image-${msg.id}.jpg`} className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"><DownloadIcon className="w-4 h-4" /></a>
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
                                                                        {msg.file.type.startsWith('image/') ? <ImageIcon className="w-5 h-5" /> : <FileIcon className="w-5 h-5" />}
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
                                                                  <VisualizeIcon className="w-4 h-4" />
                                                                </button>
                                                                 <button onClick={() => handleConvertToVideo(msg.text)} title="Create Video" className="p-1.5 rounded-full hover:bg-bg-tertiary-hover text-text-secondary">
                                                                  <VideoIcon className="w-4 h-4" />
                                                                </button>
                                                                <button onClick={() => handleAddToBoard(msg.text)} title="Add to Brainstorm Board" className="p-1.5 rounded-full hover:bg-bg-tertiary-hover text-text-secondary">
                                                                  <AddToBoardIcon className="w-4 h-4" />
                                                                </button>
                                                                {isLastAiMessage && !isLoading && (
                                                                    <button onClick={handleRegenerate} title="Regenerate" className="p-1.5 rounded-full hover:bg-bg-tertiary-hover text-text-secondary">
                                                                        <RegenerateIcon className="w-4 h-4" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                        {msg.sender === 'user' && isLastUserMessage && !isLoading && !editingMessage && (
                                                            <div className="flex justify-end items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                                                <button onClick={() => handleStartEdit(msg)} title="Edit & Regenerate" className="p-1.5 rounded-full hover:bg-bg-tertiary-hover text-text-secondary">
                                                                    <PencilIcon className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {msg.sender === 'user' && (
                                                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-bg-tertiary">
                                                            <UserIcon className="w-6 h-6 text-text-secondary" />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            )}
                            {isThinking && (
                                <div className="flex w-full items-start gap-3 animate-bubble-in justify-start mt-10">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-bg-tertiary">
                                        <BotIcon className="w-7 h-7 text-bg-accent" />
                                    </div>
                                    <div className="px-4 py-3 rounded-2xl border bg-bg-secondary text-text-primary rounded-bl-lg border-border-primary">
                                        <LoadingSpinner />
                                    </div>
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
                                        disabled={isLoading}
                                    />
                               </div>
                               <form onSubmit={handleFormSubmit}>
                                   <div className="flex flex-col p-2 bg-bg-secondary border border-border-primary rounded-2xl focus-within:ring-2 focus-within:ring-blue-500 transition-shadow">
                                        {attachedFile && (
                                            <div className="flex items-center gap-2 p-1.5 mb-2 mx-2 bg-bg-tertiary rounded-md max-w-xs animate-fade-in">
                                                {attachedFile.type.startsWith('image/') ? <ImageIcon className="w-5 h-5 text-text-secondary" /> : <FileIcon className="w-5 h-5 text-text-secondary" />}
                                                <span className="text-sm text-text-secondary truncate">{attachedFile.name}</span>
                                                <button type="button" onClick={() => setAttachedFile(null)} className="p-0.5 rounded-full hover:bg-bg-tertiary-hover">
                                                    <XIcon className="w-4 h-4 text-text-secondary"/>
                                                </button>
                                            </div>
                                        )}
                                        <div className="flex items-end gap-2">
                                            <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 rounded-full hover:bg-bg-tertiary-hover text-text-secondary flex-shrink-0" aria-label="Attach file">
                                                <PaperclipIcon className="w-5 h-5" />
                                                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
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
                                                placeholder={isRecording ? 'Listening...' : `Ask anything or drop a file...`}
                                                className="flex-1 bg-transparent resize-none border-none focus:outline-none max-h-48 text-text-primary placeholder:text-text-secondary py-2"
                                                rows={1}
                                                disabled={isLoading}
                                            />
                                            <button type="button" onClick={handleToggleRecording} className={`p-2 rounded-full hover:bg-bg-tertiary-hover flex-shrink-0 ${isRecording ? 'text-red-500' : 'text-text-secondary'}`} aria-label={isRecording ? 'Stop recording' : 'Start recording'}>
                                                <MicrophoneIcon className="w-5 h-5" />
                                            </button>
                                            <button type="submit" disabled={isLoading || (!prompt.trim() && !attachedFile)} className="p-2 rounded-full bg-bg-accent text-text-on-accent transition-colors hover:bg-bg-accent-hover disabled:bg-bg-accent-disabled disabled:cursor-not-allowed flex-shrink-0" aria-label="Send message">
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

            <Suspense fallback={<div className="fixed inset-0 bg-modal-backdrop z-40 flex items-center justify-center"><LoadingSpinner /></div>}>
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