import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, OFFLINE_SYNC } from '../config/constants';

export interface OfflineAction {
  id: string;
  type: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  timestamp: number;
  retries: number;
}

export interface OfflineData {
  jobs: any[];
  applications: any[];
  messages: any[];
  profile: any;
  lastSync: number;
}

class OfflineServiceClass {
  private isOnline = true;
  private syncInProgress = false;
  private listeners: ((isOnline: boolean) => void)[] = [];
  private syncTimer: NodeJS.Timeout | null = null;

  async initialize(): Promise<void> {
    console.log('📱 Initializing Offline Service...');

    // Listen to network state changes
    NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected || false;
      
      console.log('Network state changed:', {
        isConnected: state.isConnected,
        type: state.type,
        isInternetReachable: state.isInternetReachable,
      });

      // Notify listeners
      this.listeners.forEach(listener => listener(this.isOnline));

      // If we came back online, try to sync
      if (!wasOnline && this.isOnline) {
        this.syncOfflineData();
      }
    });

    // Get initial network state
    const netInfo = await NetInfo.fetch();
    this.isOnline = netInfo.isConnected || false;

    // Set up periodic sync when online
    this.setupPeriodicSync();

    console.log('✅ Offline Service initialized');
  }

  private setupPeriodicSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.syncOfflineData();
      }
    }, OFFLINE_SYNC.SYNC_INTERVAL_MS);
  }

  addNetworkListener(listener: (isOnline: boolean) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  isOnlineStatus(): boolean {
    return this.isOnline;
  }

  async storeOfflineAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retries'>): Promise<void> {
    try {
      const offlineAction: OfflineAction = {
        ...action,
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        retries: 0,
      };

      const stored = await AsyncStorage.getItem('offlineActions');
      const actions: OfflineAction[] = stored ? JSON.parse(stored) : [];
      actions.push(offlineAction);

      await AsyncStorage.setItem('offlineActions', JSON.stringify(actions));
      console.log('Stored offline action:', offlineAction.type);
    } catch (error) {
      console.error('Error storing offline action:', error);
    }
  }

  async getOfflineActions(): Promise<OfflineAction[]> {
    try {
      const stored = await AsyncStorage.getItem('offlineActions');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting offline actions:', error);
      return [];
    }
  }

  async removeOfflineAction(actionId: string): Promise<void> {
    try {
      const actions = await this.getOfflineActions();
      const filtered = actions.filter(action => action.id !== actionId);
      await AsyncStorage.setItem('offlineActions', JSON.stringify(filtered));
    } catch (error) {
      console.error('Error removing offline action:', error);
    }
  }

  async storeOfflineData(key: keyof OfflineData, data: any): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_DATA);
      const offlineData: OfflineData = stored ? JSON.parse(stored) : {
        jobs: [],
        applications: [],
        messages: [],
        profile: null,
        lastSync: 0,
      };

      offlineData[key] = data;
      offlineData.lastSync = Date.now();

      await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_DATA, JSON.stringify(offlineData));
      console.log(`Stored offline data for: ${key}`);
    } catch (error) {
      console.error(`Error storing offline data for ${key}:`, error);
    }
  }

  async getOfflineData(key?: keyof OfflineData): Promise<any> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_DATA);
      const offlineData: OfflineData = stored ? JSON.parse(stored) : {
        jobs: [],
        applications: [],
        messages: [],
        profile: null,
        lastSync: 0,
      };

      return key ? offlineData[key] : offlineData;
    } catch (error) {
      console.error('Error getting offline data:', error);
      return key ? [] : {};
    }
  }

  async syncOfflineData(): Promise<void> {
    if (this.syncInProgress || !this.isOnline) {
      return;
    }

    this.syncInProgress = true;
    console.log('🔄 Starting offline data sync...');

    try {
      const actions = await this.getOfflineActions();
      const failedActions: OfflineAction[] = [];

      for (const action of actions) {
        try {
          await this.executeOfflineAction(action);
          await this.removeOfflineAction(action.id);
          console.log(`✅ Synced offline action: ${action.type}`);
        } catch (error) {
          console.error(`❌ Failed to sync action ${action.type}:`, error);
          
          action.retries++;
          if (action.retries < OFFLINE_SYNC.MAX_RETRY_ATTEMPTS) {
            failedActions.push(action);
          } else {
            console.log(`Removing failed action after ${action.retries} retries:`, action.type);
            await this.removeOfflineAction(action.id);
          }
        }
      }

      // Update failed actions with retry count
      if (failedActions.length > 0) {
        await AsyncStorage.setItem('offlineActions', JSON.stringify(failedActions));
      }

      console.log('✅ Offline data sync completed');
    } catch (error) {
      console.error('❌ Offline data sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  private async executeOfflineAction(action: OfflineAction): Promise<void> {
    // This would integrate with your API service
    // For now, we'll simulate the execution
    console.log(`Executing offline action: ${action.type}`);
    
    // TODO: Implement actual API calls based on action type
    switch (action.type) {
      case 'SEND_MESSAGE':
        // await ChatService.sendMessage(action.data);
        break;
      case 'APPLY_TO_JOB':
        // await JobService.applyToJob(action.data);
        break;
      case 'UPDATE_PROFILE':
        // await ProfileService.updateProfile(action.data);
        break;
      default:
        console.log(`Unknown action type: ${action.type}`);
    }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  async clearOfflineData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.OFFLINE_DATA,
        'offlineActions',
      ]);
      console.log('Cleared offline data');
    } catch (error) {
      console.error('Error clearing offline data:', error);
    }
  }

  getLastSyncTime(): Promise<number> {
    return this.getOfflineData('lastSync');
  }

  async reset(): Promise<void> {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    
    this.listeners = [];
    this.syncInProgress = false;
    
    await this.clearOfflineData();
    console.log('Offline service reset');
  }

  // Utility methods for common offline scenarios
  async cacheJobsData(jobs: any[]): Promise<void> {
    await this.storeOfflineData('jobs', jobs);
  }

  async getCachedJobs(): Promise<any[]> {
    return await this.getOfflineData('jobs') || [];
  }

  async cacheApplicationsData(applications: any[]): Promise<void> {
    await this.storeOfflineData('applications', applications);
  }

  async getCachedApplications(): Promise<any[]> {
    return await this.getOfflineData('applications') || [];
  }

  async cacheMessagesData(messages: any[]): Promise<void> {
    await this.storeOfflineData('messages', messages);
  }

  async getCachedMessages(): Promise<any[]> {
    return await this.getOfflineData('messages') || [];
  }

  async cacheProfileData(profile: any): Promise<void> {
    await this.storeOfflineData('profile', profile);
  }

  async getCachedProfile(): Promise<any> {
    return await this.getOfflineData('profile');
  }
}

export const OfflineService = new OfflineServiceClass();