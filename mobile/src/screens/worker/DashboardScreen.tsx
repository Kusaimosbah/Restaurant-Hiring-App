import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  IconButton,
  Chip,
  Avatar,
  Surface,
} from 'react-native-paper';
import { useAuthStore } from '../../stores/authStore';
import { OfflineService } from '../../services/OfflineService';
import { LocationService } from '../../services/LocationService';
import { theme } from '../../config/theme';

interface DashboardStats {
  applicationsSubmitted: number;
  interviewsScheduled: number;
  jobMatches: number;
  profileViews: number;
}

interface RecentActivity {
  id: string;
  type: 'APPLICATION' | 'INTERVIEW' | 'MESSAGE' | 'MATCH';
  title: string;
  description: string;
  timestamp: string;
  status?: string;
}

const WorkerDashboardScreen = ({ navigation }: any) => {
  const { user } = useAuthStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    applicationsSubmitted: 0,
    interviewsScheduled: 0,
    jobMatches: 0,
    profileViews: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  useEffect(() => {
    loadDashboardData();
    setupOfflineListener();
  }, []);

  const setupOfflineListener = () => {
    const removeListener = OfflineService.addNetworkListener((online) => {
      setIsOnline(online);
      if (online) {
        loadDashboardData(); // Refresh data when coming back online
      }
    });

    return removeListener;
  };

  const loadDashboardData = async () => {
    try {
      if (OfflineService.isOnlineStatus()) {
        // Load fresh data from API
        await loadOnlineData();
      } else {
        // Load cached data
        await loadOfflineData();
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Fallback to cached data
      await loadOfflineData();
    }
  };

  const loadOnlineData = async () => {
    // Simulate API calls - replace with actual API integration
    const mockStats = {
      applicationsSubmitted: 12,
      interviewsScheduled: 3,
      jobMatches: 8,
      profileViews: 45,
    };

    const mockActivity: RecentActivity[] = [
      {
        id: '1',
        type: 'APPLICATION',
        title: 'Application Submitted',
        description: 'Server position at The Gourmet Kitchen',
        timestamp: '2 hours ago',
        status: 'pending',
      },
      {
        id: '2',
        type: 'INTERVIEW',
        title: 'Interview Scheduled',
        description: 'Video interview with Marco\'s Pizza',
        timestamp: '5 hours ago',
        status: 'confirmed',
      },
      {
        id: '3',
        type: 'MATCH',
        title: 'New Job Match',
        description: 'Bartender position matches your skills',
        timestamp: '1 day ago',
        status: 'new',
      },
      {
        id: '4',
        type: 'MESSAGE',
        title: 'New Message',
        description: 'Message from Sunset Bistro',
        timestamp: '2 days ago',
        status: 'unread',
      },
    ];

    setStats(mockStats);
    setRecentActivity(mockActivity);

    // Cache the data for offline use
    await OfflineService.storeOfflineData('dashboardStats', mockStats);
    await OfflineService.storeOfflineData('recentActivity', mockActivity);
  };

  const loadOfflineData = async () => {
    const cachedStats = await OfflineService.getOfflineData('dashboardStats');
    const cachedActivity = await OfflineService.getOfflineData('recentActivity');

    if (cachedStats) {
      setStats(cachedStats);
    }

    if (cachedActivity) {
      setRecentActivity(cachedActivity);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setIsRefreshing(false);
  };

  const navigateToJobSearch = () => {
    navigation.navigate('Jobs');
  };

  const navigateToApplications = () => {
    navigation.navigate('Applications');
  };

  const navigateToProfile = () => {
    navigation.navigate('Profile');
  };

  const navigateToMessages = () => {
    navigation.navigate('Messages');
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'APPLICATION':
        return 'file-document-outline';
      case 'INTERVIEW':
        return 'calendar-clock';
      case 'MESSAGE':
        return 'message-outline';
      case 'MATCH':
        return 'star-outline';
      default:
        return 'information-outline';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'confirmed':
        return theme.colors.success;
      case 'pending':
        return theme.colors.warning;
      case 'new':
        return theme.colors.info;
      case 'unread':
        return theme.colors.primary;
      default:
        return theme.colors.onSurface;
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Header */}
      <Surface style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>
              Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}
            </Text>
            <Text style={styles.userName}>{user?.name || 'Worker'}</Text>
          </View>
          <Avatar.Icon
            size={50}
            icon="account"
            style={{ backgroundColor: theme.colors.primary }}
          />
        </View>
        
        {!isOnline && (
          <Chip
            icon="wifi-off"
            mode="outlined"
            style={styles.offlineChip}
            textStyle={styles.offlineText}
          >
            Offline Mode
          </Chip>
        )}
      </Surface>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Button
          mode="contained"
          onPress={navigateToJobSearch}
          style={styles.primaryAction}
          contentStyle={styles.actionContent}
          icon="magnify"
        >
          Find Jobs
        </Button>
        <Button
          mode="outlined"
          onPress={navigateToProfile}
          style={styles.secondaryAction}
          contentStyle={styles.actionContent}
          icon="account-edit"
        >
          Update Profile
        </Button>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <Card style={styles.statCard} onPress={navigateToApplications}>
          <Card.Content style={styles.statContent}>
            <Text style={styles.statNumber}>{stats.applicationsSubmitted}</Text>
            <Text style={styles.statLabel}>Applications</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Text style={styles.statNumber}>{stats.interviewsScheduled}</Text>
            <Text style={styles.statLabel}>Interviews</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Text style={styles.statNumber}>{stats.jobMatches}</Text>
            <Text style={styles.statLabel}>Job Matches</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Text style={styles.statNumber}>{stats.profileViews}</Text>
            <Text style={styles.statLabel}>Profile Views</Text>
          </Card.Content>
        </Card>
      </View>

      {/* Recent Activity */}
      <Card style={styles.activityCard}>
        <Card.Title
          title="Recent Activity"
          right={(props) => (
            <IconButton {...props} icon="chevron-right" onPress={navigateToMessages} />
          )}
        />
        <Card.Content>
          {recentActivity.length > 0 ? (
            recentActivity.map((activity) => (
              <View key={activity.id} style={styles.activityItem}>
                <IconButton
                  icon={getActivityIcon(activity.type)}
                  size={24}
                  iconColor={getStatusColor(activity.status)}
                  style={styles.activityIcon}
                />
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.activityDescription}>{activity.description}</Text>
                  <Text style={styles.activityTimestamp}>{activity.timestamp}</Text>
                </View>
                {activity.status && (
                  <Chip
                    mode="outlined"
                    compact
                    style={[styles.statusChip, { borderColor: getStatusColor(activity.status) }]}
                    textStyle={{ color: getStatusColor(activity.status), fontSize: 10 }}
                  >
                    {activity.status}
                  </Chip>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.noActivity}>No recent activity</Text>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.md,
    elevation: theme.elevation.small,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  greeting: {
    fontSize: 16,
    color: theme.colors.onSurface,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  offlineChip: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.warning,
  },
  offlineText: {
    color: '#fff',
    fontSize: 12,
  },
  quickActions: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  primaryAction: {
    flex: 1,
  },
  secondaryAction: {
    flex: 1,
  },
  actionContent: {
    paddingVertical: theme.spacing.xs,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    elevation: theme.elevation.small,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 14,
    color: theme.colors.onSurface,
    marginTop: theme.spacing.xs,
  },
  activityCard: {
    margin: theme.spacing.md,
    elevation: theme.elevation.small,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  activityIcon: {
    margin: 0,
  },
  activityContent: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.onSurface,
  },
  activityDescription: {
    fontSize: 14,
    color: theme.colors.onSurface,
    marginTop: 2,
  },
  activityTimestamp: {
    fontSize: 12,
    color: theme.colors.outline,
    marginTop: 2,
  },
  statusChip: {
    height: 24,
    marginLeft: theme.spacing.sm,
  },
  noActivity: {
    textAlign: 'center',
    color: theme.colors.onSurface,
    fontStyle: 'italic',
    paddingVertical: theme.spacing.lg,
  },
});

export default WorkerDashboardScreen;