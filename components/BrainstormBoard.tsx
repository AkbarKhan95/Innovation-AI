import React, { useState, useRef, useEffect } from 'react';
import type { BrainstormBoard, BoardNode, BoardEdge } from '../types';
import BoardNodeComponent from './BoardNode';
import PlusIcon from './icons/PlusIcon';
import CenterIcon from './icons/CenterIcon';
import XIcon from './icons/XIcon';

const uuid = () => crypto.randomUUID();

interface BrainstormBoardProps {
    boardData: BrainstormBoard;
    onUpdateBoard: (updater: (board: BrainstormBoard) => BrainstormBoard) => void;
    isOpen: boolean;
    onClose: () => void;
}

const getDistance = (touches: React.TouchList) => {
    return Math.sqrt(
        Math.pow(touches[0].clientX - touches[1].clientX, 2) +
        Math.pow(touches[0].clientY - touches[1].clientY, 2)
    );
};

const getMidpoint = (touches: React.TouchList) => {
    return {
        x: (touches[0].clientX + touches[1].clientX) / 2,
        y: (touches[0].clientY + touches[1].clientY) / 2,
    };
};

const BrainstormBoard: React.FC<BrainstormBoardProps> = ({ boardData, onUpdateBoard, isOpen, onClose }) => {
    const [draggingNode, setDraggingNode] = useState<{ id: string; offset: { x: number; y: number } } | null>(null);
    const [panning, setPanning] = useState<{ start: { x: number; y: number }; startPan: { x: number, y: number } } | null>(null);
    const [pinchState, setPinchState] = useState<{ distance: number; midpoint: { x: number, y: number } } | null>(null);
    const [connectingFromId, setConnectingFromId] = useState<string | null>(null);
    const [pointerPosition, setPointerPosition] = useState({ x: 0, y: 0 });
    const boardRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;


    const handleAddNode = () => {
        const boardRect = boardRef.current?.getBoundingClientRect();
        if (!boardRect) return;

        onUpdateBoard(current => {
            const centerX = (boardRect.width / 2 - current.viewport.pan.x) / current.viewport.zoom;
            const centerY = (boardRect.height / 2 - current.viewport.pan.y) / current.viewport.zoom;
            return {
                ...current,
                nodes: [...current.nodes, {
                    id: uuid(),
                    content: 'New Idea',
                    position: { x: centerX, y: centerY },
                    color: 'bg-yellow-200',
                }]
            };
        });
    };

    const handleResetView = () => {
        onUpdateBoard(current => ({
            ...current,
            viewport: { pan: { x: 0, y: 0 }, zoom: 1 }
        }));
    };

    const handleNodeChange = (nodeId: string, newContent: string) => {
        onUpdateBoard(current => ({
            ...current,
            nodes: current.nodes.map(n => n.id === nodeId ? { ...n, content: newContent } : n)
        }));
    };

    const handleNodeDelete = (nodeId: string) => {
        onUpdateBoard(current => ({
            ...current,
            nodes: current.nodes.filter(n => n.id !== nodeId),
            edges: current.edges.filter(e => e.from !== nodeId && e.to !== nodeId),
        }));
    };

    const handleNodeColorChange = (nodeId: string, newColor: string) => {
        onUpdateBoard(current => ({
            ...current,
            nodes: current.nodes.map(n => n.id === nodeId ? { ...n, color: newColor } : n)
        }));
    };

    const handleStartConnection = (nodeId: string) => {
        setConnectingFromId(nodeId);
    };

    const handleEndConnection = (nodeId: string) => {
        if (connectingFromId && connectingFromId !== nodeId) {
            onUpdateBoard(current => {
                const alreadyExists = current.edges.some(e => (e.from === connectingFromId && e.to === nodeId) || (e.from === nodeId && e.to === connectingFromId));
                if (alreadyExists) return current;
                return {
                    ...current,
                    edges: [...current.edges, { id: uuid(), from: connectingFromId, to: nodeId }]
                };
            });
        }
    };
    
    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button === 1 || (e.button === 0 && e.altKey)) { // Middle mouse or Alt + Left click
            e.preventDefault();
            setPanning({ start: { x: e.clientX, y: e.clientY }, startPan: boardData.viewport.pan });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        setPointerPosition({ x: e.clientX, y: e.clientY });
        
        if (panning) {
            const dx = e.clientX - panning.start.x;
            const dy = e.clientY - panning.start.y;
            onUpdateBoard(current => ({
                ...current,
                viewport: { ...current.viewport, pan: { x: panning.startPan.x + dx, y: panning.startPan.y + dy } }
            }));
        } else if (draggingNode) {
            onUpdateBoard(current => {
                const dx = (e.clientX - draggingNode.offset.x) / current.viewport.zoom;
                const dy = (e.clientY - draggingNode.offset.y) / current.viewport.zoom;
                return {
                    ...current,
                    nodes: current.nodes.map(n => n.id === draggingNode.id ? { ...n, position: { x: dx, y: dy } } : n)
                };
            });
        }
    };

    const handleMouseUp = () => {
        setDraggingNode(null);
        setPanning(null);
        setConnectingFromId(null);
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const zoomFactor = 1.1;
        
        onUpdateBoard(current => {
            const newZoom = e.deltaY < 0 ? current.viewport.zoom * zoomFactor : current.viewport.zoom / zoomFactor;
            const boardRect = boardRef.current!.getBoundingClientRect();
            const mouseX = e.clientX - boardRect.left;
            const mouseY = e.clientY - boardRect.top;
            
            const mouseBeforeZoomX = (mouseX - current.viewport.pan.x) / current.viewport.zoom;
            const mouseBeforeZoomY = (mouseY - current.viewport.pan.y) / current.viewport.zoom;

            const newPanX = mouseX - mouseBeforeZoomX * newZoom;
            const newPanY = mouseY - mouseBeforeZoomY * newZoom;

            return {
                ...current,
                viewport: { zoom: newZoom, pan: { x: newPanX, y: newPanY } }
            };
        });
    };

    const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
        if (e.button !== 0) return;
        const node = boardData.nodes.find(n => n.id === nodeId)!;
        setDraggingNode({
            id: nodeId,
            offset: {
                x: e.clientX - node.position.x * boardData.viewport.zoom,
                y: e.clientY - node.position.y * boardData.viewport.zoom,
            }
        });
    };

     const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            setPanning({ start: { x: touch.clientX, y: touch.clientY }, startPan: boardData.viewport.pan });
        } else if (e.touches.length === 2) {
            setPinchState({
                distance: getDistance(e.touches),
                midpoint: getMidpoint(e.touches)
            });
        }
    };
    
    const handleTouchMove = (e: React.TouchEvent) => {
        if (e.touches.length === 1 && panning && !draggingNode) {
            const touch = e.touches[0];
            const dx = touch.clientX - panning.start.x;
            const dy = touch.clientY - panning.start.y;
            onUpdateBoard(current => ({
                ...current,
                viewport: { ...current.viewport, pan: { x: panning.startPan.x + dx, y: panning.startPan.y + dy } }
            }));
        } else if (e.touches.length === 2 && pinchState) {
            const newDistance = getDistance(e.touches);
            const scale = newDistance / pinchState.distance;
            
            onUpdateBoard(current => {
                 const newZoom = current.viewport.zoom * scale;
                const boardRect = boardRef.current!.getBoundingClientRect();
                const midpoint = getMidpoint(e.touches);
                const mouseX = midpoint.x - boardRect.left;
                const mouseY = midpoint.y - boardRect.top;

                const mouseBeforeZoomX = (mouseX - current.viewport.pan.x) / current.viewport.zoom;
                const mouseBeforeZoomY = (mouseY - current.viewport.pan.y) / current.viewport.zoom;
        
                const newPanX = mouseX - mouseBeforeZoomX * newZoom;
                const newPanY = mouseY - mouseBeforeZoomY * newZoom;

                return {
                    ...current,
                    viewport: { zoom: newZoom, pan: { x: newPanX, y: newPanY } }
                };
            });
            setPinchState({ ...pinchState, distance: newDistance });
        } else if (draggingNode) {
            const touch = e.touches[0];
            onUpdateBoard(current => {
                const dx = (touch.clientX - draggingNode.offset.x) / current.viewport.zoom;
                const dy = (touch.clientY - draggingNode.offset.y) / current.viewport.zoom;
                return {
                    ...current,
                    nodes: current.nodes.map(n => n.id === draggingNode.id ? { ...n, position: { x: dx, y: dy } } : n)
                };
            });
        }
    };
    
    const handleTouchEnd = (e: React.TouchEvent) => {
        setPanning(null);
        setDraggingNode(null);
        setPinchState(null);
    };

    const handleNodeTouchStart = (e: React.TouchEvent, nodeId: string) => {
        e.stopPropagation(); // prevent board pan
        const touch = e.touches[0];
        const node = boardData.nodes.find(n => n.id === nodeId)!;
        setDraggingNode({
            id: nodeId,
            offset: {
                x: touch.clientX - node.position.x * boardData.viewport.zoom,
                y: touch.clientY - node.position.y * boardData.viewport.zoom,
            }
        });
    };

    // FIX: Explicitly type nodePositions to fix type inference issues.
    const nodePositions: Map<string, BoardNode['position']> = new Map(boardData.nodes.map(n => [n.id, n.position]));
    const connectingNodePos = connectingFromId ? nodePositions.get(connectingFromId) : null;
    // FIX: Destructure viewport properties to avoid type inference issues in complex JSX.
    const { pan, zoom } = boardData.viewport;

    return (
        <div className="fixed inset-0 z-30 bg-bg-solid animate-fade-in">
            <div 
                ref={boardRef}
                className="w-full h-full bg-bg-tertiary overflow-hidden relative cursor-default touch-none"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div
                    className="absolute inset-0 bg-grid-pattern"
                    style={{ backgroundPosition: `${pan.x}px ${pan.y}px`, backgroundSize: `${20 * zoom}px ${20 * zoom}px` }}
                ></div>

                <div
                    className="absolute top-0 left-0"
                    style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: 'top left' }}
                >
                    {boardData.nodes.map(node => (
                        <BoardNodeComponent
                            key={node.id}
                            node={node}
                            onMouseDown={handleNodeMouseDown}
                            onTouchStart={handleNodeTouchStart}
                            onChange={handleNodeChange}
                            onDelete={handleNodeDelete}
                            onChangeColor={handleNodeColorChange}
                            onStartConnection={handleStartConnection}
                            onCompleteConnection={handleEndConnection}
                        />
                    ))}
                </div>

                <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{'--tw-bg-opacity': 0.1} as React.CSSProperties}>
                    <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
                        {boardData.edges.map(edge => {
                            const fromNode = nodePositions.get(edge.from);
                            const toNode = nodePositions.get(edge.to);
                            if (!fromNode || !toNode) return null;
                            return <line key={edge.id} x1={fromNode.x} y1={fromNode.y} x2={toNode.x} y2={toNode.y} stroke="var(--text-secondary)" strokeWidth="2" />;
                        })}
                    </g>
                    {connectingFromId && connectingNodePos && (
                        <line 
                            x1={connectingNodePos.x * zoom + pan.x} 
                            y1={connectingNodePos.y * zoom + pan.y} 
                            x2={pointerPosition.x} 
                            y2={pointerPosition.y} 
                            stroke="var(--bg-accent)" strokeWidth="2" strokeDasharray="5,5" 
                        />
                    )}
                </svg>
                
                <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2 p-2 bg-bg-secondary rounded-lg shadow-lg border border-border-primary">
                    <button onClick={handleAddNode} title="Add New Note" className="p-2 hover:bg-bg-tertiary-hover rounded-md">
                        <PlusIcon className="w-5 h-5 text-text-primary" />
                    </button>
                    <button onClick={handleResetView} title="Reset View" className="p-2 hover:bg-bg-tertiary-hover rounded-md">
                        <CenterIcon className="w-5 h-5 text-text-primary" />
                    </button>
                </div>
                <div className="absolute bottom-4 left-4 z-10 p-2 bg-bg-secondary text-text-secondary text-xs rounded-lg shadow-md border border-border-primary">
                    <span className="hidden md:inline">Pan: Alt + Drag / Middle Mouse | Zoom: Scroll</span>
                    <span className="md:hidden">Pan: Drag | Zoom: Pinch</span>
                </div>

                <style>{`
                    .bg-grid-pattern {
                        background-image:
                            linear-gradient(var(--border-primary) 1px, transparent 1px),
                            linear-gradient(to right, var(--border-primary) 1px, transparent 1px);
                    }
                    .touch-none {
                        touch-action: none;
                    }
                `}</style>
            </div>
             <button onClick={onClose} title="Close Board" className="absolute top-4 right-4 z-20 p-3 bg-bg-secondary rounded-full shadow-lg border border-border-primary hover:bg-bg-tertiary-hover transition-colors">
                <XIcon className="w-6 h-6 text-text-primary" />
            </button>
        </div>
    );
}

export default React.memo(BrainstormBoard);