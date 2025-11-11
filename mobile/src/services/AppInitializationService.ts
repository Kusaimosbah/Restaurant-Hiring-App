import { Platform, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationService } from './NotificationService';
import { OfflineService } from './OfflineService';
import { LocationService } from './LocationService';
import { STORAGE_KEYS } from '../config/constants';

export class AppInitializationService {
  private static initialized = false;

  static async initializeApp(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      console.log('🚀 Initializing Restaurant Hiring Mobile App...');

      // Initialize core services in parallel
      await Promise.all([
        this.initializePermissions(),
        this.initializeStorage(),
        this.initializeServices(),
      ]);

      this.initialized = true;
      console.log('✅ App initialization completed successfully');
    } catch (error) {
      console.error('❌ App initialization failed:', error);
      throw error;
    }
  }

  private static async initializePermissions(): Promise<void> {
    console.log('📱 Initializing permissions...');

    if (Platform.OS === 'android') {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      ];

      try {
        const granted = await PermissionsAndroid.requestMultiple(permissions);
        console.log('Android permissions granted:', granted);
      } catch (error) {
        console.warn('Error requesting Android permissions:', error);
      }
    }
  }

  private static async initializeStorage(): Promise<void> {
    console.log('💾 Initializing storage...');
    
    try {
      // Check if this is the first app launch
      const isFirstLaunch = await AsyncStorage.getItem('isFirstLaunch');
      if (isFirstLaunch === null) {
        await AsyncStorage.setItem('isFirstLaunch', 'false');
        // Clear any existing data on first launch
        await this.clearStorageOnFirstLaunch();
      }

      // Initialize default settings
      await this.initializeDefaultSettings();
    } catch (error) {
      console.error('Storage initialization error:', error);
    }
  }

  private static async initializeServices(): Promise<void> {
    console.log('🛠️ Initializing services...');
    
    try {
      // Initialize services that don't require user authentication
      await Promise.all([
        NotificationService.initialize(),
        OfflineService.initialize(),
        LocationService.initialize(),
      ]);
    } catch (error) {
      console.error('Services initialization error:', error);
      // Don't throw error here, let the app continue with limited functionality
    }
  }

  private static async clearStorageOnFirstLaunch(): Promise<void> {
    const keysToKeep = ['isFirstLaunch'];
    const allKeys = await AsyncStorage.getAllKeys();
    const keysToRemove = allKeys.filter(key => !keysToKeep.includes(key));
    
    if (keysToRemove.length > 0) {
      await AsyncStorage.multiRemove(keysToRemove);
      console.log('Cleared storage on first launch');
    }
  }

  private static async initializeDefaultSettings(): Promise<void> {
    const existingSettings = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    
    if (!existingSettings) {
      const defaultSettings = {
        notifications: {
          enabled: true,
          newMessages: true,
          applicationUpdates: true,
          jobMatches: true,
          interviews: true,
          shifts: true,
        },
        privacy: {
          locationSharing: true,
          profileVisibility: 'public',
          onlineStatus: true,
        },
        preferences: {
          language: 'en',
          theme: 'light',
          currency: 'USD',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        sync: {
          autoSync: true,
          syncOnWifiOnly: false,
          backgroundSync: true,
        },
      };

      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(defaultSettings));
      console.log('Default settings initialized');
    }
  }

  static async resetApp(): Promise<void> {
    console.log('🔄 Resetting app...');
    
    try {
      // Clear all storage except first launch flag
      const allKeys = await AsyncStorage.getAllKeys();
      const keysToKeep = ['isFirstLaunch'];
      const keysToRemove = allKeys.filter(key => !keysToKeep.includes(key));
      
      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove);
      }

      // Reset services
      await Promise.all([
        NotificationService.reset(),
        OfflineService.reset(),
      ]);

      this.initialized = false;
      console.log('✅ App reset completed');
    } catch (error) {
      console.error('❌ App reset failed:', error);
      throw error;
    }
  }

  static async getAppInfo(): Promise<{
    isFirstLaunch: boolean;
    version: string;
    platform: string;
    initialized: boolean;
  }> {
    const isFirstLaunch = (await AsyncStorage.getItem('isFirstLaunch')) === null;
    
    return {
      isFirstLaunch,
      version: '1.0.0',
      platform: Platform.OS,
      initialized: this.initialized,
    };
  }
}

export const initializeApp = AppInitializationService.initializeApp;