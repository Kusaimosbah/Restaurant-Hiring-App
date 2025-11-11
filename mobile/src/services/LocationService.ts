import Geolocation from 'react-native-geolocation-service';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { LOCATION_CONFIG } from '../config/constants';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface LocationError {
  code: number;
  message: string;
}

class LocationServiceClass {
  private watchId: number | null = null;
  private hasPermission = false;

  async initialize(): Promise<void> {
    console.log('📍 Initializing Location Service...');
    
    try {
      this.hasPermission = await this.requestLocationPermission();
      console.log('✅ Location Service initialized');
    } catch (error) {
      console.error('❌ Location Service initialization failed:', error);
    }
  }

  private async requestLocationPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        const result = await Geolocation.requestAuthorization('whenInUse');
        return result === 'granted';
      }

      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'Restaurant Hiring needs access to your location to find nearby jobs and restaurants.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }

      return false;
    } catch (error) {
      console.error('Location permission request error:', error);
      return false;
    }
  }

  async getCurrentLocation(): Promise<LocationData> {
    return new Promise((resolve, reject) => {
      if (!this.hasPermission) {
        reject({
          code: 1,
          message: 'Location permission not granted',
        } as LocationError);
        return;
      }

      Geolocation.getCurrentPosition(
        (position) => {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          };
          resolve(locationData);
        },
        (error) => {
          console.error('Get current location error:', error);
          reject({
            code: error.code,
            message: this.getLocationErrorMessage(error.code),
          } as LocationError);
        },
        {
          accuracy: {
            android: 'high',
            ios: 'best',
          },
          enableHighAccuracy: true,
          timeout: LOCATION_CONFIG.TIMEOUT,
          maximumAge: LOCATION_CONFIG.MAXIMUM_AGE,
          distanceFilter: LOCATION_CONFIG.DISTANCE_FILTER,
          forceRequestLocation: true,
          forceLocationManager: false,
          showLocationDialog: true,
          interval: 5000,
          fastestInterval: 2000,
        }
      );
    });
  }

  startLocationTracking(
    onLocationUpdate: (location: LocationData) => void,
    onError?: (error: LocationError) => void
  ): boolean {
    if (!this.hasPermission) {
      onError?.({
        code: 1,
        message: 'Location permission not granted',
      });
      return false;
    }

    if (this.watchId !== null) {
      this.stopLocationTracking();
    }

    this.watchId = Geolocation.watchPosition(
      (position) => {
        const locationData: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };
        onLocationUpdate(locationData);
      },
      (error) => {
        console.error('Location tracking error:', error);
        onError?.({
          code: error.code,
          message: this.getLocationErrorMessage(error.code),
        });
      },
      {
        accuracy: {
          android: 'high',
          ios: 'best',
        },
        enableHighAccuracy: true,
        distanceFilter: LOCATION_CONFIG.DISTANCE_FILTER,
        interval: 5000,
        fastestInterval: 2000,
        forceRequestLocation: true,
        showLocationDialog: true,
      }
    );

    return true;
  }

  stopLocationTracking(): void {
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
      console.log('Location tracking stopped');
    }
  }

  private getLocationErrorMessage(code: number): string {
    switch (code) {
      case 1:
        return 'Location access denied';
      case 2:
        return 'Location unavailable';
      case 3:
        return 'Location request timed out';
      case 4:
        return 'Google Play Services not available';
      case 5:
        return 'Location settings not satisfied';
      default:
        return 'Unknown location error';
    }
  }

  async openLocationSettings(): Promise<void> {
    try {
      await Geolocation.openLocationSettings();
    } catch (error) {
      console.error('Error opening location settings:', error);
      Alert.alert(
        'Location Settings',
        'Please enable location services in your device settings.',
        [{ text: 'OK' }]
      );
    }
  }

  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    return distance;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  formatDistance(distanceKm: number): string {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)}m`;
    }
    return `${distanceKm.toFixed(1)}km`;
  }

  isLocationServiceEnabled(): Promise<boolean> {
    return new Promise((resolve) => {
      this.getCurrentLocation()
        .then(() => resolve(true))
        .catch(() => resolve(false));
    });
  }

  hasLocationPermission(): boolean {
    return this.hasPermission;
  }

  async requestPermissionIfNeeded(): Promise<boolean> {
    if (!this.hasPermission) {
      this.hasPermission = await this.requestLocationPermission();
    }
    return this.hasPermission;
  }
}

export const LocationService = new LocationServiceClass();