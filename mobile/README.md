# Restaurant Hiring Mobile App

A React Native mobile application for the Restaurant Hiring platform, providing workers and employers with mobile-optimized workflows, offline capabilities, and push notifications.

## 🚀 Features

### Core Features
- **Cross-Platform**: iOS and Android support using React Native
- **Offline-First**: Full offline capabilities with automatic sync when online
- **Push Notifications**: Real-time notifications for messages, applications, and job matches
- **Real-time Chat**: WebSocket-based messaging with typing indicators
- **Location Services**: GPS-based job search and distance calculations
- **Biometric Auth**: Secure authentication with device biometrics

### Worker Features
- **Job Search**: Browse and filter available positions with AI-powered matching
- **Application Management**: Track application status and interview schedules
- **Profile Management**: Update skills, experience, and availability
- **Real-time Messaging**: Chat with employers and recruiters
- **Push Notifications**: Get notified of new job matches and messages

### Employer Features
- **Candidate Management**: View and manage job applications
- **Job Posting**: Create and manage job listings
- **Analytics Dashboard**: Track hiring metrics and performance
- **Real-time Communication**: Chat with candidates
- **Team Collaboration**: Multi-user employer accounts

## 🏗️ Architecture

### Tech Stack
- **Framework**: React Native 0.73.4
- **Language**: TypeScript
- **State Management**: Zustand
- **Navigation**: React Navigation 6
- **UI Library**: React Native Paper (Material Design)
- **Storage**: AsyncStorage + SQLite
- **Networking**: Axios + Socket.IO
- **Push Notifications**: Firebase Cloud Messaging
- **Maps**: React Native Maps
- **Charts**: React Native Chart Kit

### Project Structure
```
src/
├── App.tsx                 # Main app component with navigation
├── config/
│   ├── theme.ts           # Material Design theme configuration
│   └── constants.ts       # App constants and configuration
├── services/
│   ├── AuthService.ts     # Authentication API calls
│   ├── NotificationService.ts  # Push notification handling
│   ├── OfflineService.ts  # Offline data management
│   ├── LocationService.ts # GPS and location services
│   └── AppInitializationService.ts  # App startup logic
├── stores/
│   └── authStore.ts       # Authentication state management
├── screens/
│   ├── auth/              # Login, register, forgot password
│   ├── worker/            # Worker-specific screens
│   ├── employer/          # Employer-specific screens
│   └── shared/            # Shared screens (chat, notifications)
└── components/            # Reusable UI components
```

## 🛠️ Setup & Installation

### Prerequisites
- Node.js >= 16
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development)

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd mobile

# Install dependencies
npm install --legacy-peer-deps

# iOS setup (Mac only)
cd ios && pod install && cd ..

# Android setup
# Ensure Android SDK is installed and configured
```

### Environment Configuration
Create `.env` file in the mobile directory:
```env
API_BASE_URL=https://your-api-domain.com/api
WEBSOCKET_URL=https://your-api-domain.com
GOOGLE_MAPS_API_KEY=your_google_maps_key
FIREBASE_CONFIG=your_firebase_config
```

## 🚀 Running the App

### Development
```bash
# Start Metro bundler
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

### Production Build
```bash
# Android
npm run build:android

# iOS
npm run build:ios
```

## 📱 App Features Deep Dive

### Offline Capabilities
- **Data Caching**: Jobs, applications, and messages cached locally
- **Offline Actions**: Queue actions when offline, sync when online
- **Smart Sync**: Automatic background sync with conflict resolution
- **Offline Indicators**: Clear UI feedback when offline

### Push Notifications
- **Message Notifications**: New chat messages
- **Application Updates**: Status changes on job applications
- **Job Matches**: New AI-powered job recommendations
- **Interview Reminders**: Scheduled interview notifications
- **Custom Channels**: Categorized notifications with user preferences

### Real-time Features
- **Live Chat**: Instant messaging with typing indicators
- **Online Status**: Real-time user presence
- **Live Updates**: Job status and application changes
- **Background Sync**: Continuous data synchronization

### Security
- **JWT Authentication**: Secure token-based authentication
- **Biometric Login**: Fingerprint/Face ID support
- **Encrypted Storage**: Sensitive data encryption
- **SSL/TLS**: Secure API communication
- **Permission Management**: Granular app permissions

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### E2E Tests
```bash
# Detox (if configured)
npm run e2e:ios
npm run e2e:android
```

## 📦 Dependencies

### Core Dependencies
- `react-native`: Cross-platform mobile framework
- `@react-navigation/native`: Navigation library
- `react-native-paper`: Material Design UI components
- `zustand`: State management
- `axios`: HTTP client
- `socket.io-client`: WebSocket client

### Platform Services
- `@react-native-async-storage/async-storage`: Local storage
- `@react-native-firebase/messaging`: Push notifications
- `react-native-geolocation-service`: Location services
- `react-native-keychain`: Secure storage
- `@react-native-community/netinfo`: Network status

### UI & UX
- `react-native-vector-icons`: Icon library
- `react-native-charts-wrapper`: Data visualization
- `react-native-image-picker`: Camera/gallery access
- `react-native-document-picker`: File selection

## 🚀 Deployment

### Android
1. Generate signed APK/AAB
2. Upload to Google Play Console
3. Configure app signing and release management

### iOS
1. Configure provisioning profiles
2. Archive and upload to App Store Connect
3. Submit for App Store review

## 🔧 Configuration

### Push Notifications Setup
1. Firebase project configuration
2. APNs certificates (iOS)
3. FCM server key configuration
4. Notification channels setup

### Maps Integration
1. Google Maps API key
2. Platform-specific configuration
3. Location permissions setup

## 📝 API Integration

The mobile app integrates with the Restaurant Hiring backend API:

### Authentication Endpoints
- `POST /auth/signin` - User login
- `POST /auth/signup` - User registration
- `POST /auth/refresh` - Token refresh
- `POST /auth/logout` - User logout

### Job Management
- `GET /jobs` - List available jobs
- `POST /jobs/{id}/apply` - Apply to job
- `GET /applications` - User applications

### Real-time Communication
- `WebSocket /socket.io` - Real-time messaging
- `POST /messages` - Send message
- `GET /conversations` - Chat history

## 🐛 Debugging

### Common Issues
1. **Metro bundler issues**: Clear cache with `npx react-native start --reset-cache`
2. **Android build errors**: Clean build with `cd android && ./gradlew clean`
3. **iOS build errors**: Clean derived data in Xcode
4. **Package conflicts**: Use `--legacy-peer-deps` flag

### Debugging Tools
- React Native Debugger
- Flipper integration
- Chrome DevTools
- Native debugging tools

## 🤝 Contributing

1. Follow TypeScript best practices
2. Use ESLint and Prettier for code formatting
3. Write unit tests for new features
4. Update documentation for API changes
5. Follow semantic versioning

## 📄 License

This project is part of the Restaurant Hiring platform and follows the same licensing terms.

---

## 🎯 Next Steps

### Planned Features
- [ ] Video calling for interviews
- [ ] Calendar integration
- [ ] Advanced filtering options
- [ ] Multi-language support
- [ ] Dark mode theme
- [ ] Accessibility improvements

### Performance Optimizations
- [ ] Image caching and optimization
- [ ] Bundle size optimization
- [ ] Memory usage optimization
- [ ] Battery usage optimization

The mobile application provides a comprehensive, production-ready solution for restaurant hiring with modern mobile app features and excellent user experience.