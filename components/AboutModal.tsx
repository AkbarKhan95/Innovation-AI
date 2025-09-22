

import React from 'react';
import XIcon from './icons/XIcon';
import BotIcon from './icons/BotIcon';
import MessageIcon from './icons/MessageIcon';
import ImageIcon from './icons/ImageIcon';
import VideoIcon from './icons/VideoIcon';
import BrainstormIcon from './icons/BrainstormIcon';
import SearchIcon from './icons/SearchIcon';
import PaletteIcon from './icons/PaletteIcon';
import PaperclipIcon from './icons/PaperclipIcon';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FeatureSection: React.FC<{ title: string; children: React.ReactNode; iconDisplay: React.ReactNode; reverseOrder?: boolean; }> = ({ title, children, iconDisplay, reverseOrder = false }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 items-center py-6 border-b border-border-primary last:border-b-0">
        <div className={`prose prose-sm max-w-none text-text-secondary ${reverseOrder ? 'md:order-2' : 'md:order-1'}`}>
            <h3 className="text-lg font-bold text-text-primary mb-2">{title}</h3>
            {children}
        </div>
        <div className={reverseOrder ? 'md:order-1' : 'md:order-2'}>
            {iconDisplay}
        </div>
    </div>
);

const FeatureIcon: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <div className={`flex items-center justify-center bg-bg-tertiary rounded-lg h-28 md:h-48 lg:h-full w-full shadow-inner ${className} bg-gradient-to-br from-bg-tertiary via-bg-secondary to-bg-tertiary`}>
        {children}
    </div>
);


const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-modal-backdrop backdrop-blur-sm animate-fade-in" onClick={onClose}>
        <div className="bg-bg-secondary shadow-2xl w-[95vw] max-w-lg h-auto max-h-[90vh] rounded-xl flex flex-col md:w-[90vw] md:max-w-4xl" onClick={e => e.stopPropagation()}>
            <header className="flex items-center justify-between flex-shrink-0 p-4 border-b border-border-primary">
                <div className="flex items-center gap-3">
                    <BotIcon className="w-7 h-7 text-bg-accent" />
                    <h2 className="text-xl font-bold text-text-primary">About Innovation AI</h2>
                </div>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-bg-tertiary-hover transition-colors">
                    <XIcon className="w-5 h-5 text-text-secondary" />
                </button>
            </header>
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-none">
                    <p className="text-center text-text-secondary mb-6">
                        Welcome to Innovation AI, your dedicated partner for brainstorming and creative exploration. This app is built to help you generate, visualize, and organize your most ambitious ideas using the power of Google's Gemini models.
                    </p>
                    
                    <FeatureSection 
                        title="Multi-Modal Magic"
                        iconDisplay={
                            <FeatureIcon>
                                <div className="flex items-center space-x-2 md:space-x-4">
                                    <MessageIcon className="w-8 h-8 md:w-12 md:h-12 text-blue-500 opacity-90" />
                                    <ImageIcon className="w-8 h-8 md:w-12 md:h-12 text-green-500 opacity-90" />
                                    <VideoIcon className="w-8 h-8 md:w-12 md:h-12 text-red-500 opacity-90" />
                                </div>
                            </FeatureIcon>
                        }
                    >
                        <p>Engage in dynamic conversations, generate high-quality images, or create stunning videos directly from your prompts. Switch between Chat, Image, and Video modes to bring any concept to life.</p>
                    </FeatureSection>
                    
                    <FeatureSection 
                        title="Versatile File Handling"
                        reverseOrder
                        iconDisplay={
                            <FeatureIcon>
                                <PaperclipIcon className="w-12 h-12 md:w-16 md:h-16 text-indigo-500" />
                            </FeatureIcon>
                        }
                    >
                        <p>Go beyond text prompts. Attach images for editing, documents for summarization, or data for analysis. The AI can understand and work with your files to provide deeper insights and assistance.</p>
                    </FeatureSection>

                    <FeatureSection 
                        title="Brainstorm Board"
                        iconDisplay={
                            <FeatureIcon>
                                <BrainstormIcon className="w-12 h-12 md:w-16 md:h-16 text-purple-500" />
                            </FeatureIcon>
                        }
                    >
                        <p>Never lose a great idea. Send any AI response directly to your Brainstorm Board, a freeform canvas where you can connect concepts, rearrange thoughts, and build a visual map of your project.</p>
                    </FeatureSection>

                    <FeatureSection 
                        title="Grounded & Up-to-Date"
                        reverseOrder
                         iconDisplay={
                            <FeatureIcon>
                                <SearchIcon className="w-12 h-12 md:w-16 md:h-16 text-teal-500" />
                            </FeatureIcon>
                        }
                    >
                        <p>Ask about current events or trending topics. The AI uses Google Search to provide answers grounded in the latest information from the web, complete with source citations for you to explore further.</p>
                    </FeatureSection>

                    <FeatureSection 
                        title="Personalize Your Experience"
                        iconDisplay={
                             <FeatureIcon>
                                <PaletteIcon className="w-12 h-12 md:w-16 md:h-16 text-pink-500" />
                            </FeatureIcon>
                        }
                    >
                        <p>Make the app your own. Choose from a variety of beautiful themes, select a voice for text-to-speech, and customize your profile to create an environment that inspires you.</p>
                    </FeatureSection>
                </div>
            </div>
             <footer className="flex-shrink-0 flex items-center justify-between p-4 border-t border-border-primary bg-bg-tertiary/50">
                <p className="text-sm text-text-secondary">Happy Innovating!</p>
                <button
                    onClick={onClose}
                    className="px-6 py-2 rounded-lg bg-bg-accent text-text-on-accent hover:bg-bg-accent-hover transition-colors font-semibold"
                >
                    Got it
                </button>
            </footer>
        </div>
    </div>
  );
};

export default AboutModal;
