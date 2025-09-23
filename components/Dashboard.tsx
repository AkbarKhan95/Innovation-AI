import React, { useRef } from 'react';
import type { ChatSession, User, Theme, VoiceOption } from '../types';
import CheckIcon from './icons/CheckIcon';
import NewBotIcon from './icons/NewBotIcon';
import NewFemaleIcon from './icons/NewFemaleIcon';
import NewMaleIcon from './icons/NewMaleIcon';
import XIcon from './icons/XIcon';
import PencilIcon from './icons/PencilIcon';


interface DashboardProps {
  isOpen: boolean;
  onClose: () => void;
  chatSessions: ChatSession[];
  theme: Theme;
  setTheme: (theme: Theme) => void;
  voice: VoiceOption;
  setVoice: (voice: VoiceOption, sampleText: string) => void;
  handleClearHistory: () => void;
  user: User;
  onUpdateUserPicture: (picture: string) => void;
}

const themes = [
    { name: 'light', label: 'Light', color: '#f3f4f6' },
    { name: 'dark', label: 'Dark', color: '#374151' },
    { name: 'midnight', label: 'Midnight', color: '#000000' },
    { name: 'gradient', label: 'Gradient', gradient: 'linear-gradient(135deg, #000428 0%, #004e92 100%)' },
    { name: 'starlight', label: 'Starlight', gradient: 'linear-gradient(160deg, #0b192f 0%, #172a45 100%)' },
    { name: 'aurora', label: 'Aurora', gradient: 'linear-gradient(135deg, #1e1b4b 0%, #4c1d95 100%)' },
    { name: 'dusk', label: 'Dusk', gradient: 'linear-gradient(135deg, #3a0ca3 0%, #f72585 100%)' },
    { name: 'forest', label: 'Forest', gradient: 'linear-gradient(135deg, #001510 0%, #134e4a 100%)' },
    { name: 'crimson', label: 'Crimson', gradient: 'linear-gradient(135deg, #000000 0%, #1a2a6c 50%, #b21f1f 100%)' },
] as const;

const voiceOptions = [
    { id: 'female', label: 'Female', icon: NewFemaleIcon, sampleText: "Hi! I can read the AI's responses for you in a natural and friendly voice." },
    { id: 'male', label: 'Male', icon: NewMaleIcon, sampleText: "Of course. I can read the text aloud for you with a clear and natural voice." },
    { id: 'female-robot', label: 'AI (Female)', icon: NewBotIcon, sampleText: "Processing request. Voice output initiated. All systems are online." },
    { id: 'male-robot', label: 'AI (Male)', icon: NewBotIcon, sampleText: "Auditory interface engaged. I will recite the generated text for you now." },
] as const;


const Dashboard: React.FC<DashboardProps> = ({ isOpen, onClose, chatSessions, theme, setTheme, voice, setVoice, handleClearHistory, user, onUpdateUserPicture }) => {
  const totalChats = chatSessions.length;
  const totalMessages = chatSessions.reduce((acc, session) => 
    acc + session.messages.filter(msg => msg.sender !== 'system').length, 
    0
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  if (!isOpen) return null;
  
  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(chatSessions, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "innovation_ai_chats.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleEditPictureClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file.');
        return;
      }
      const MAX_SIZE = 5 * 1024 * 1024; // 5MB
      if (file.size > MAX_SIZE) {
        alert('File is too large. Please select an image under 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        onUpdateUserPicture(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };


  const Card: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
    <div className={`bg-bg-tertiary rounded-xl p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-text-secondary mb-4">{title}</h3>
      {children}
    </div>
  );

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-modal-backdrop backdrop-blur-sm animate-fade-in" onClick={onClose}>
        <div className="bg-bg-secondary shadow-2xl h-full w-full md:rounded-xl md:h-[90vh] md:max-h-[800px] md:max-w-4xl flex flex-col" onClick={e => e.stopPropagation()}>
            <header className="flex items-center justify-between flex-shrink-0 p-4 border-b border-border-primary">
                <h2 className="text-xl font-bold text-text-primary">Settings & User Dashboard</h2>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-bg-tertiary-hover transition-colors">
                    <XIcon className="w-5 h-5 text-text-secondary" />
                </button>
            </header>
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
              <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Profile Card */}
                  <Card title="Profile">
                      <div className="flex flex-col items-center text-center">
                        <div className="relative group w-20 h-20 mb-4 rounded-full overflow-hidden">
                            {user.picture ? (
                                <img src={user.picture} alt={user.name} className="w-20 h-20 rounded-full object-cover" />
                            ) : (
                                <div className="w-20 h-20 bg-bg-tertiary rounded-full flex items-center justify-center">
                                    <span className="text-4xl font-bold text-bg-accent">{user.name.charAt(0).toUpperCase()}</span>
                                </div>
                            )}
                            <button
                                onClick={handleEditPictureClick}
                                className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-bg-secondary"
                                aria-label="Change profile picture"
                            >
                                <PencilIcon className="w-8 h-8" />
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept="image/png, image/jpeg, image/gif, image/webp"
                            />
                        </div>
                        <p className="text-xl font-bold text-text-primary">Welcome, {user.name}!</p>
                        <p className="text-sm text-text-secondary">{user.email}</p>
                      </div>
                  </Card>

                  {/* Statistics Card */}
                  <Card title="Statistics">
                    <div className="space-y-4">
                      <div className="text-center">
                        <span className="font-bold text-4xl text-bg-accent">{totalChats}</span>
                        <p className="text-text-secondary text-sm">Total Conversations</p>
                      </div>
                      <div className="text-center">
                        <span className="font-bold text-4xl text-bg-accent">{totalMessages}</span>
                        <p className="text-text-secondary text-sm">Total Messages (User & AI)</p>
                      </div>
                    </div>
                  </Card>
                  
                  {/* Theme Settings Card */}
                  <Card title="Theme Settings">
                    <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      {themes.map((themeItem) => (
                        <div key={themeItem.name} className="flex flex-col items-center">
                          <button
                            onClick={() => setTheme(themeItem.name)}
                            className={`w-full h-14 rounded-lg border-2 transition-all duration-200 relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-bg-secondary ${
                              theme === themeItem.name ? 'border-blue-500' : 'border-border-secondary hover:border-blue-400'
                            }`}
                            style={{
                              background: 'gradient' in themeItem ? themeItem.gradient : themeItem.color,
                            }}
                            aria-label={`Select ${themeItem.label} theme`}
                          >
                            {theme === themeItem.name && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                <CheckIcon className="w-6 h-6 text-white"/>
                              </div>
                            )}
                          </button>
                          <span className="mt-2 text-sm text-text-secondary">{themeItem.label}</span>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Voice Settings Card */}
                  <Card title="Voice Settings">
                    <p className="text-sm text-text-secondary mb-4 -mt-2">Choose the voice for reading messages aloud.</p>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {voiceOptions.map((voiceItem) => (
                        <div key={voiceItem.id} className="flex flex-col items-center">
                          <button
                            onClick={() => setVoice(voiceItem.id, voiceItem.sampleText)}
                            className={`w-full h-16 flex items-center justify-center rounded-lg border-2 transition-all duration-200 relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-bg-secondary bg-bg-secondary ${
                              voice === voiceItem.id ? 'border-blue-500' : 'border-border-secondary hover:border-blue-400'
                            }`}
                            aria-label={`Select ${voiceItem.label} voice`}
                          >
                            <voiceItem.icon className="w-8 h-8 text-text-secondary" />
                            {voice === voiceItem.id && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                <CheckIcon className="w-6 h-6 text-white" />
                              </div>
                            )}
                          </button>
                          <span className="mt-2 text-sm text-text-secondary text-center">{voiceItem.label}</span>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Data Management Card */}
                  <Card title="Data Management" className="md:col-span-2">
                      <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row gap-4">
                        <button
                          onClick={handleExport}
                          className="flex-1 px-4 py-2 bg-bg-accent text-text-on-accent rounded-lg hover:bg-bg-accent-hover transition-colors"
                        >
                          Export All Chats
                        </button>
                        <button
                          onClick={handleClearHistory}
                          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Clear All History
                        </button>
                      </div>
                    </Card>
                </div>
              </div>
            </div>
        </div>
    </div>
  );
};

export default React.memo(Dashboard);