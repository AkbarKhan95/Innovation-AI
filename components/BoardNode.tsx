import React, { useState, useRef, useEffect } from 'react';
import type { BoardNode } from '../types';
import TrashIcon from './icons/TrashIcon';
import PaletteIcon from './icons/PaletteIcon';
import LinkIcon from './icons/LinkIcon';

interface BoardNodeProps {
    node: BoardNode;
    onMouseDown: (event: React.MouseEvent, nodeId: string) => void;
    onTouchStart: (event: React.TouchEvent, nodeId: string) => void;
    onChange: (nodeId: string, newContent: string) => void;
    onDelete: (nodeId: string) => void;
    onChangeColor: (nodeId: string, newColor: string) => void;
    onStartConnection: (nodeId: string) => void;
    onCompleteConnection: (nodeId: string) => void;
}

const colors = ['bg-yellow-200', 'bg-blue-200', 'bg-green-200', 'bg-pink-200', 'bg-purple-200'];

const BoardNode: React.FC<BoardNodeProps> = ({ node, onMouseDown, onTouchStart, onChange, onDelete, onChangeColor, onStartConnection, onCompleteConnection }) => {
    const [isColorPickerOpen, setColorPickerOpen] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        // Auto-resize textarea
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [node.content]);

    return (
        <div 
            style={{ 
                left: node.position.x, 
                top: node.position.y,
                transform: `translate(-50%, -50%)`,
            } as React.CSSProperties}
            className={`absolute w-56 p-3 rounded-lg shadow-xl cursor-grab select-none transition-shadow duration-200 hover:shadow-2xl text-gray-800 ${node.color}`}
            onMouseDown={e => onMouseDown(e, node.id)}
            onTouchStart={e => onTouchStart(e, node.id)}
            onMouseUp={e => { e.stopPropagation(); onCompleteConnection(node.id); }}
        >
             <div className="absolute -top-3 -right-3 flex items-center gap-1 opacity-0 hover:opacity-100 focus-within:opacity-100 transition-opacity">
                <div className="relative">
                    <button 
                        onMouseDown={e => e.stopPropagation()} 
                        onClick={() => setColorPickerOpen(!isColorPickerOpen)} 
                        className="p-1.5 bg-bg-secondary rounded-full shadow-md hover:bg-bg-tertiary" 
                        title="Change color"
                    >
                        <PaletteIcon className="w-4 h-4 text-text-secondary" />
                    </button>
                    {isColorPickerOpen && (
                        <div className="absolute top-full right-0 mt-1 p-1 bg-bg-secondary rounded-md shadow-lg flex gap-1">
                            {colors.map(color => (
                                <button
                                    key={color}
                                    onClick={() => { onChangeColor(node.id, color); setColorPickerOpen(false); }}
                                    className={`w-6 h-6 rounded-full ${color} border-2 ${node.color === color ? 'border-blue-500' : 'border-transparent'}`}
                                />
                            ))}
                        </div>
                    )}
                </div>
                <button 
                    onMouseDown={e => e.stopPropagation()} 
                    onClick={() => onDelete(node.id)} 
                    className="p-1.5 bg-bg-secondary rounded-full shadow-md hover:bg-red-100" 
                    title="Delete note"
                >
                    <TrashIcon className="w-4 h-4 text-red-500" />
                </button>
             </div>

            <textarea
                ref={textareaRef}
                value={node.content}
                onChange={e => onChange(node.id, e.target.value)}
                onMouseDown={e => e.stopPropagation()} // Prevent drag start
                className="w-full bg-transparent resize-none border-none focus:outline-none text-sm leading-snug"
                rows={1}
            />

            <div 
                className="absolute right-[-8px] top-1/2 -translate-y-1/2 w-4 h-4 bg-gray-500 border-2 border-white dark:border-gray-800 rounded-full cursor-crosshair transition-transform hover:scale-125"
                title="Drag to connect"
                onMouseDown={e => { e.stopPropagation(); onStartConnection(node.id); }}
            />
        </div>
    );
};

export default BoardNode;
