

import React, { useState, useRef, useEffect } from 'react';
import type { User } from '../types';
import UserIcon from './icons/UserIcon';
import DashboardIcon from './icons/DashboardIcon';
import LogoutIcon from './icons/LogoutIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';

interface UserMenuProps {
    user: User;
    isCollapsed: boolean;
    onLogout: () => void;
    onOpenSettings: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ user, isCollapsed, onLogout, onOpenSettings }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleOpenSettings = () => {
        onOpenSettings();
        setIsOpen(false);
    };

    const handleLogout = () => {
        onLogout();
        setIsOpen(false);
    };


    return (
        <div className="relative border-t border-border-primary pt-2" ref={menuRef}>
             {isOpen && (
                <>
                    {/* Menu for Expanded Sidebar & All Mobile Views */}
                    <div className={`absolute bottom-full left-0 right-0 mb-2 w-full bg-bg-solid rounded-lg shadow-xl border border-border-primary overflow-hidden animate-slide-in-bottom ${isCollapsed ? 'md:hidden' : ''}`}>
                        <button
                          onClick={handleOpenSettings}
                          className="w-full flex items-center gap-3 text-left px-3 py-2.5 text-sm text-text-primary hover:bg-bg-tertiary transition-colors"
                        >
                          <DashboardIcon className="w-5 h-5" />
                          <span>User Dashboard</span>
                        </button>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 text-left px-3 py-2.5 text-sm text-red-600 hover:bg-bg-tertiary transition-colors"
                        >
                          <LogoutIcon className="w-5 h-5" />
                          <span>Logout</span>
                        </button>
                    </div>

                    {/* Popover for Collapsed Sidebar (Desktop Only) */}
                    <div className={`hidden ${isCollapsed ? 'md:block' : ''} absolute bottom-full left-full ml-2 mb-2 w-64 bg-bg-solid rounded-xl shadow-2xl border border-border-primary overflow-hidden animate-fade-in z-50 p-2 origin-bottom-left`}>
                        {/* User info header */}
                        <div className="flex items-center gap-3 p-2 border-b border-border-primary mb-2">
                            {user.picture ? (
                                <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                                <div className="w-10 h-10 bg-bg-tertiary rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-lg font-bold text-bg-accent">{user.name.charAt(0).toUpperCase()}</span>
                                </div>
                            )}
                            <div className="flex-1 overflow-hidden">
                                <p className="truncate font-semibold text-sm text-text-primary">{user.name}</p>
                                <p className="truncate text-xs text-text-secondary">{user.email}</p>
                            </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="space-y-1">
                            <button
                                onClick={handleOpenSettings}
                                className="w-full flex items-center gap-3 text-left px-2 py-2 text-sm text-text-primary rounded-md hover:bg-bg-tertiary-hover transition-colors"
                            >
                                <DashboardIcon className="w-5 h-5 text-text-secondary" /> 
                                <span>Settings & Dashboard</span>
                            </button>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 text-left px-2 py-2 text-sm text-red-500 rounded-md hover:bg-red-500/10 hover:text-red-600 transition-colors"
                            >
                                <LogoutIcon className="w-5 h-5" />
                                <span>Log out</span>
                            </button>
                        </div>
                    </div>
                </>
             )}

            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center gap-3 p-2 rounded-lg group text-left hover:bg-bg-tertiary-hover transition-colors ${isCollapsed ? 'justify-center' : ''}`}
            >
                {user.picture ? (
                    <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full flex-shrink-0 object-cover" />
                ) : (
                    <div className="w-10 h-10 bg-bg-tertiary rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-bold text-bg-accent">{user.name.charAt(0).toUpperCase()}</span>
                    </div>
                )}
                <div className={`flex-1 overflow-hidden ${isCollapsed ? 'md:hidden' : ''}`}>
                    <p className={`truncate font-bold text-text-primary`}>{user.name}</p>
                    <p className={`truncate text-xs text-text-secondary`}>{user.email}</p>
                </div>
                {!isCollapsed && (
                    <ChevronDownIcon className={`w-5 h-5 text-text-secondary transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                )}
            </button>
        </div>
    );
};

export default UserMenu;