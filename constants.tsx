import type { Topic, AIModel } from './types';
import SustainabilityIcon from './components/icons/SustainabilityIcon';
import DefenceIcon from './components/icons/DefenceIcon';
import HealthcareIcon from './components/icons/HealthcareIcon';
import DigitalIndiaIcon from './components/icons/DigitalIndiaIcon';
import TransportIcon from './components/icons/TransportIcon';
import EnergyIcon from './components/icons/EnergyIcon';
import ZapIcon from './components/icons/ZapIcon';
import ImageIcon from './components/icons/ImageIcon';
import VideoIcon from './components/icons/VideoIcon';


export const TOPICS: Topic[] = [
  {
    id: 'sustainability',
    name: 'Sustainability',
    description: 'Eco-friendly solutions for a greener tomorrow.',
    icon: SustainabilityIcon,
  },
  {
    id: 'defence',
    name: 'Defence',
    description: 'Strengthening national security with advanced technology.',
    icon: DefenceIcon,
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    description: 'Innovating for accessible and affordable public health.',
    icon: HealthcareIcon,
  },
  {
    id: 'digital_india',
    name: 'Digital India',
    description: 'Leveraging technology for a digitally empowered society.',
    icon: DigitalIndiaIcon,
  },
  {
    id: 'transport',
    name: 'Transport',
    description: 'Building smarter, faster, and cleaner mobility solutions.',
    icon: TransportIcon,
  },
  {
    id: 'energy',
    name: 'Energy',
    description: 'Securing India’s energy future with sustainable sources.',
    icon: EnergyIcon,
  },
];

export const AVAILABLE_MODELS: AIModel[] = [
    {
        id: 'gemini-2.5-flash',
        name: 'Chat',
        description: 'A creative AI partner for brainstorming, text generation, and bringing your innovative ideas to life.',
        type: 'Text',
        provider: 'google',
        icon: ZapIcon,
    },
    {
        id: 'imagen-4.0-generate-001',
        name: 'Image',
        description: 'Generate high-quality, photorealistic images from simple text descriptions.',
        type: 'Image',
        provider: 'google',
        icon: ImageIcon,
    },
    {
        id: 'veo-2.0-generate-001',
        name: 'Video',
        description: 'Create stunning, high-definition videos from text prompts and bring your concepts to life.',
        type: 'Video',
        provider: 'google',
        icon: VideoIcon,
    }
];