import type { FC } from 'react';

export interface GroundingChunk {
  web: {
    uri: string;
    title: string;
  };
}

export interface Message {
  id: string;
  sender: 'user' | 'ai' | 'system';
  text: string;
  imageUrl?: string;
  videoUrl?: string;
  file?: {
    name:string;
    type: string;
    dataUrl: string; // base64
    size?: number;
  };
  groundingChunks?: GroundingChunk[];
  suggestions?: string[];
  loading?: 'image' | 'video' | 'text' | false;
}

export interface BoardNode {
  id: string;
  content: string;
  position: { x: number; y: number };
  color: string;
}

export interface BoardEdge {
  id: string;
  from: string; // from node id
  to: string; // to node id
}

export interface BrainstormBoard {
  nodes: BoardNode[];
  edges: BoardEdge[];
  viewport: {
    pan: { x: number; y: number };
    zoom: number;
  };
}

export interface ChatSession {
  id:string;
  title: string;
  messages: Message[];
  modelId?: AIModel['id'];
  board?: BrainstormBoard;
  isLoading?: boolean;
}

export interface Topic {
  id: string;
  name: string;
  description: string;
  icon: FC<{ className?: string }>;
}

export interface User {
  name: string;
  email: string;
  picture?: string;
}

export interface AIModel {
    id: 'gemini-2.5-flash' | 'imagen-4.0-generate-001' | 'veo-2.0-generate-001';
    name: string;
    description: string;
    type: 'Text' | 'Image' | 'Video';
    provider: 'google';
    icon: FC<{ className?: string }>;
}

export type Theme = 'light' | 'dark' | 'midnight' | 'gradient' | 'starlight' | 'aurora' | 'dusk' | 'forest' | 'crimson';
export type VoiceOption = 'female' | 'male' | 'female-robot' | 'male-robot';