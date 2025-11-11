// Service Worker for Restaurant Hiring Platform PWA
const CACHE_NAME = 'restaurant-hire-v1';
const STATIC_CACHE_NAME = 'restaurant-hire-static-v1';
const DYNAMIC_CACHE_NAME = 'restaurant-hire-dynamic-v1';
const API_CACHE_NAME = 'restaurant-hire-api-v1';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/jobs',
  '/messages',
  '/profile',
  '/offline',
  '/manifest.json',
  // Add critical CSS and JS files
  '/_next/static/css/',
  '/_next/static/js/',
  // Icons
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// API endpoints to cache
const CACHEABLE_API_ROUTES = [
  '/api/dashboard/stats',
  '/api/jobs',
  '/api/profile',
  '/api/notifications',
];

// Pages that require authentication
const AUTH_REQUIRED_ROUTES = [
  '/dashboard',
  '/profile',
  '/messages',
  '/applications',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS.filter(asset => !asset.includes('/_next/')));
      }),
      
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (
              cacheName !== STATIC_CACHE_NAME &&
              cacheName !== DYNAMIC_CACHE_NAME &&
              cacheName !== API_CACHE_NAME &&
              cacheName !== CACHE_NAME
            ) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Take control of all clients
      self.clients.claim()
    ])
  );
});

// Fetch event - handle all network requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
  } else if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(handleStaticAssets(request));
  } else {
    event.respondWith(handlePageRequest(request));
  }
});

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful API responses
    if (networkResponse.ok && CACHEABLE_API_ROUTES.some(route => url.pathname.startsWith(route))) {
      const cache = await caches.open(API_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network request failed, trying cache:', url.pathname);
    
    // Try cache if network fails
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response for API calls
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'This feature is not available offline',
        offline: true,
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Handle static assets with cache-first strategy
async function handleStaticAssets(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Failed to load static asset:', request.url);
    return new Response('Asset not available offline', { status: 503 });
  }
}

// Handle page requests with cache-first for static, network-first for dynamic
async function handlePageRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Check if user is authenticated for protected routes
    if (AUTH_REQUIRED_ROUTES.some(route => url.pathname.startsWith(route))) {
      const authResponse = await checkAuthentication(request);
      if (!authResponse.authenticated) {
        return Response.redirect('/auth/signin', 302);
      }
    }
    
    // Try network first for dynamic content
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful page responses
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
  } catch (error) {
    console.log('Network request failed, trying cache:', url.pathname);
    
    // Try cache if network fails
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlineResponse = await caches.match('/offline');
      if (offlineResponse) {
        return offlineResponse;
      }
    }
    
    return new Response('Page not available offline', { 
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Check authentication status
async function checkAuthentication(request) {
  try {
    // This is a simplified check - in practice, you'd verify JWT tokens
    const authRequest = new Request('/api/auth/session', {
      method: 'GET',
      credentials: 'same-origin',
    });
    
    const response = await fetch(authRequest);
    return {
      authenticated: response.ok,
      user: response.ok ? await response.json() : null,
    };
  } catch (error) {
    return { authenticated: false, user: null };
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Background sync:', event.tag);
  
  if (event.tag === 'sync-offline-actions') {
    event.waitUntil(syncOfflineActions());
  }
});

// Sync offline actions when connection is restored
async function syncOfflineActions() {
  try {
    const offlineActions = await getOfflineActions();
    
    for (const action of offlineActions) {
      try {
        await processOfflineAction(action);
        await removeOfflineAction(action.id);
      } catch (error) {
        console.error('Failed to sync offline action:', error);
      }
    }
  } catch (error) {
    console.error('Failed to sync offline actions:', error);
  }
}

// Get offline actions from IndexedDB
async function getOfflineActions() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('OfflineActions', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['actions'], 'readonly');
      const store = transaction.objectStore('actions');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    };
    
    request.onerror = () => reject(request.error);
  });
}

// Process individual offline action
async function processOfflineAction(action) {
  const { type, data, endpoint } = action;
  
  switch (type) {
    case 'application':
      return await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
    case 'message':
      return await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
    case 'profile_update':
      return await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
    default:
      if (endpoint) {
        return await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      }
  }
}

// Remove processed offline action
async function removeOfflineAction(actionId) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('OfflineActions', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['actions'], 'readwrite');
      const store = transaction.objectStore('actions');
      const deleteRequest = store.delete(actionId);
      
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    };
    
    request.onerror = () => reject(request.error);
  });
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Push notification received');
  
  if (!event.data) {
    return;
  }
  
  const data = event.data.json();
  const { title, body, icon, badge, tag, data: notificationData } = data;
  
  const options = {
    body,
    icon: icon || '/icons/icon-192x192.png',
    badge: badge || '/icons/badge-72x72.png',
    tag: tag || 'general',
    data: notificationData,
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/icons/action-view.png',
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/action-dismiss.png',
      },
    ],
    requireInteraction: true,
    vibrate: [200, 100, 200],
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.action);
  
  event.notification.close();
  
  const { action, notification } = event;
  const { data } = notification;
  
  if (action === 'view' || !action) {
    const url = data?.url || '/dashboard';
    
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(url) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window if app is not open
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
    );
  }
});

// Message handling for client communication
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CLAIM_CLIENTS':
      self.clients.claim();
      break;
      
    case 'CACHE_CLEAR':
      event.waitUntil(clearCaches());
      break;
      
    case 'OFFLINE_ACTION':
      event.waitUntil(storeOfflineAction(payload));
      break;
      
    default:
      console.log('Unknown message type:', type);
  }
});

// Clear all caches
async function clearCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
}

// Store offline action in IndexedDB
async function storeOfflineAction(action) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('OfflineActions', 1);
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('actions')) {
        const store = db.createObjectStore('actions', { keyPath: 'id', autoIncrement: true });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['actions'], 'readwrite');
      const store = transaction.objectStore('actions');
      
      const actionWithTimestamp = {
        ...action,
        timestamp: Date.now(),
      };
      
      const addRequest = store.add(actionWithTimestamp);
      addRequest.onsuccess = () => resolve();
      addRequest.onerror = () => reject(addRequest.error);
    };
    
    request.onerror = () => reject(request.error);
  });
}