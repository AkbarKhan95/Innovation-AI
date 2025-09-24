

import React, { useState, useRef, useEffect } from 'react';
import type { ChatSession, User } from '../types';
import { AVAILABLE_MODELS } from '../constants';
import PlusIcon from './icons/PlusIcon';
import MessageIcon from './icons/MessageIcon';
import ThreeDotsIcon from './icons/ThreeDotsIcon';
import TrashIcon from './icons/TrashIcon';
import PencilIcon from './icons/PencilIcon';
import SearchIcon from './icons/SearchIcon';
import UserMenu from './UserMenu';
import MenuIcon from './icons/MenuIcon';

interface SidebarProps {
  chatSessions: ChatSession[];
  currentSessionId: string | null;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onRenameChat: (id: string, newTitle: string) => void;
  editingSessionId: string | null;
  setEditingSessionId: (id: string | null) => void;
  isSidebarOpen: boolean;
  isCollapsed: boolean;
  toggleCollapse: () => void;
  user: User;
  onLogout: () => void;
  onGoToHome: () => void;
  onOpenSettings: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  chatSessions,
  currentSessionId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onRenameChat,
  editingSessionId,
  setEditingSessionId,
  isSidebarOpen,
  isCollapsed,
  toggleCollapse,
  user,
  onLogout,
  onGoToHome,
  onOpenSettings,
}) => {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleFinishRename = (id: string, newTitle: string) => {
    onRenameChat(id, newTitle);
    setEditingSessionId(null);
  };

  const filteredChatSessions = chatSessions.filter(session =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside className={`sidebar fixed inset-y-0 left-0 z-40 bg-bg-tertiary backdrop-blur-lg transform transition-all duration-[400ms] ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 w-80 ${isCollapsed ? 'md:w-20' : 'md:w-80'}`}>
      <div className="flex flex-col h-full p-2 border-r border-border-primary">
        
        <div className={`flex items-center p-2 mb-2 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
            <button onClick={onGoToHome} className={`text-xl font-bold text-text-primary ${isCollapsed ? 'hidden' : ''} transition-colors hover:text-bg-accent`}>
                Innovation AI
            </button>
            <button onClick={toggleCollapse} title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'} className="p-2 rounded-full hover:bg-bg-tertiary-hover transition-colors">
                <MenuIcon isOpen={isSidebarOpen} className="w-6 h-6 text-text-secondary md:hidden" />
                <MenuIcon isOpen={!isCollapsed} className="w-6 h-6 text-text-secondary hidden md:block" />
            </button>
        </div>

        <div className={`relative mb-2 ${isCollapsed ? 'hidden' : ''}`}>
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary pointer-events-none" />
            <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-bg-secondary border-none rounded-lg pl-10 pr-4 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                aria-label="Search chats"
            />
        </div>

        <button 
          onClick={onNewChat} 
          title="New Chat" 
          className={`w-full flex items-center gap-3 p-3 mb-2 rounded-lg text-left text-sm font-medium transition-all duration-200 ease-in-out bg-bg-accent text-text-on-accent hover:bg-bg-accent-hover ${isCollapsed ? 'justify-center' : ''}`}
        >
          <PlusIcon className="w-5 h-5 flex-shrink-0" />
          <p className={`truncate flex-1 font-semibold ${isCollapsed ? 'hidden' : ''}`}>New Chat</p>
        </button>
        
        <nav className="flex-1 overflow-y-auto space-y-2">
          {filteredChatSessions.map((session) => {
            const model = AVAILABLE_MODELS.find(m => m.id === session.modelId);
            const IconComponent = model ? model.icon : MessageIcon;

            return (
              <div
                key={session.id}
                className="group relative"
              >
               {editingSessionId === session.id ? (
                  <div className={`flex items-center gap-3 p-2 w-full ${isCollapsed ? 'justify-center' : ''}`}>
                    <IconComponent className="w-5 h-5 flex-shrink-0 text-text-secondary" />
                    <input
                      type="text"
                      defaultValue={session.title}
                      className={`flex-1 bg-transparent border border-blue-500 rounded-md px-1 py-0.5 text-sm text-text-primary focus:outline-none ${isCollapsed ? 'hidden' : ''}`}
                      autoFocus
                      onBlur={(e) => handleFinishRename(session.id, e.target.value)}
                      onKeyDown={(e) => {
                          if (e.key === 'Enter') handleFinishRename(session.id, (e.target as HTMLInputElement).value);
                          if (e.key === 'Escape') setEditingSessionId(null);
                      }}
                    />
                  </div>
                ) : (
                   <div
                    className={`w-full flex items-center justify-between rounded-lg
                      ${
                        currentSessionId === session.id
                          ? 'bg-bg-accent text-text-on-accent'
                          : 'text-text-secondary hover:bg-bg-tertiary-hover hover:text-text-primary'
                      }
                    `}
                  >
                    <button
                      onClick={() => onSelectChat(session.id)}
                      title={session.title}
                      className={`flex-1 flex items-center gap-3 p-2 rounded-lg text-left text-sm font-medium transition-all duration-200 ease-in-out ${isCollapsed ? 'justify-center' : ''}`}
                      aria-label={`Select chat: ${session.title}`}
                    >
                      <IconComponent className="w-5 h-5 flex-shrink-0" />
                      <p className={`truncate flex-1 ${isCollapsed ? 'hidden' : ''}`}>{session.title}</p>
                    </button>

                    {!isCollapsed && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === session.id ? null : session.id);
                        }}
                        title="More options"
                        aria-label={`Options for chat: ${session.title}`}
                        className="p-1.5 rounded-full mr-1 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 hover:bg-black/10 dark:hover:bg-white/10"
                      >
                        <ThreeDotsIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                )}
                
                {openMenuId === session.id && !isCollapsed && (
                  <div ref={menuRef} className="absolute right-0 top-full mt-1 z-20 w-40 bg-bg-solid rounded-lg shadow-xl border border-border-primary overflow-hidden animate-fade-in">
                      <button
                        onClick={() => {
                          setEditingSessionId(session.id);
                          setOpenMenuId(null);
                        }}
                        className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm text-text-primary hover:bg-bg-tertiary transition-colors"
                      >
                        <PencilIcon className="w-4 h-4" />
                        <span>Rename</span>
                      </button>
                      <button
                        onClick={() => {
                          onDeleteChat(session.id);
                          setOpenMenuId(null);
                        }}
                        className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm text-red-600 hover:bg-bg-tertiary transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                        <span>Delete chat</span>
                      </button>
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        
        <UserMenu 
          user={user}
          isCollapsed={isCollapsed}
          onLogout={onLogout}
          onOpenSettings={onOpenSettings}
        />

      </div>
    </aside>
  );
};

export default React.memo(Sidebar);