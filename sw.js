

const CACHE_NAME = 'innovation-ai-cache-v1';
// This list includes all local assets and key CDN dependencies for offline-first functionality.
const urlsToCache = [
  '/',
  '/index.html',
  '/index.tsx',
  '/metadata.json',
  '/types.ts',
  '/constants.tsx',
  '/services/geminiService.ts',
  '/App.tsx',
  '/components/Sidebar.tsx',
  '/components/Dashboard.tsx',
  '/components/LoadingSpinner.tsx',
  '/components/LoginPage.tsx',
  '/components/MessageContent.tsx',
  '/components/ModelSelector.tsx',
  '/components/GroundingSources.tsx',
  '/components/Greeting.tsx',
  '/components/TermsModal.tsx',
  '/components/AboutModal.tsx',
  '/components/icons/ArrowLeftIcon.tsx',
  '/components/icons/BotIcon.tsx',
  '/components/icons/CheckIcon.tsx',
  '/components/icons/ChevronDownIcon.tsx',
  '/components/icons/CollapseIcon.tsx',
  '/components/icons/CopyIcon.tsx',
  '/components/icons/DefenceIcon.tsx',
  '/components/icons/DigitalIndiaIcon.tsx',
  '/components/icons/DownloadIcon.tsx',
  '/components/icons/EnergyIcon.tsx',
  '/components/icons/FileIcon.tsx',
  '/components/icons/GoogleIcon.tsx',
  '/components/icons/HealthcareIcon.tsx',
  '/components/icons/ImageIcon.tsx',
  '/components/icons/LogoutIcon.tsx',
  '/components/icons/MicrosoftIcon.tsx',
  '/components/icons/MicrophoneIcon.tsx',
  '/components/icons/NewBotIcon.tsx',
  '/components/icons/NewFemaleIcon.tsx',
  '/components/icons/NewMaleIcon.tsx',
  '/components/icons/PaletteIcon.tsx',
  '/components/icons/PaperclipIcon.tsx',
  '/components/icons/PencilIcon.tsx',
  '/components/icons/RegenerateIcon.tsx',
  '/components/icons/SearchIcon.tsx',
  '/components/icons/SendIcon.tsx',
  '/components/icons/SparklesIcon.tsx',
  '/components/icons/SpeakerIcon.tsx',
  '/components/icons/StopIcon.tsx',
  '/components/icons/SustainabilityIcon.tsx',
  '/components/icons/ThreeDotsIcon.tsx',
  '/components/icons/TrashIcon.tsx',
  '/components/icons/TransportIcon.tsx',
  '/components/icons/UserIcon.tsx',
  '/components/icons/VideoIcon.tsx',
  '/components/icons/XIcon.tsx',
  '/components/icons/ZapIcon.tsx',
  '/components/icons/MenuIcon.tsx',
  '/components/icons/PlusIcon.tsx',
  '/components/icons/DashboardIcon.tsx',
  '/components/icons/MessageIcon.tsx',
  'https://cdn.tailwindcss.com',
  'https://aistudiocdn.com/react@^19.1.1',
  'https://aistudiocdn.com/react-dom@^19.1.1/client',
  'https://aistudiocdn.com/@google/genai@^1.19.0',
  'https://aistudiocdn.com/uuid@^13.0.0',
  '/components/BrainstormBoard.tsx',
  '/components/BoardNode.tsx',
  '/components/icons/BrainstormIcon.tsx',
  '/components/icons/AddToBoardIcon.tsx',
  '/components/icons/CenterIcon.tsx',
   '/components/icons/LinkIcon.tsx'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching app shell');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Let the browser handle non-GET requests.
  if (event.request.method !== 'GET') {
    return;
  }
  
  // For API calls, always fetch from the network.
  if (event.request.url.includes('googleapis.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // For all other requests, try serving from cache first.
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response.
        if (response) {
          return response;
        }
        // Not in cache - fetch from network.
        return fetch(event.request);
      })
  );
});