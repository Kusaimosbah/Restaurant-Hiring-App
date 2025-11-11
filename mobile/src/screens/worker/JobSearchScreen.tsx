import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  FlatList,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  Chip,
  IconButton,
  Searchbar,
  FAB,
  Badge,
} from 'react-native-paper';
import { OfflineService } from '../../services/OfflineService';
import { LocationService } from '../../services/LocationService';
import { theme } from '../../config/theme';

interface Job {
  id: string;
  title: string;
  restaurantName: string;
  location: string;
  distance?: string;
  salary: string;
  type: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'TEMPORARY';
  skills: string[];
  description: string;
  postedDate: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  matchScore?: number;
  isApplied: boolean;
}

const JobSearchScreen = ({ navigation }: any) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [filters, setFilters] = useState({
    type: '',
    salary: '',
    distance: '',
  });

  useEffect(() => {
    loadJobs();
    setupOfflineListener();
  }, []);

  const setupOfflineListener = () => {
    const removeListener = OfflineService.addNetworkListener((online) => {
      setIsOnline(online);
      if (online) {
        loadJobs(); // Refresh jobs when coming back online
      }
    });

    return removeListener;
  };

  const loadJobs = async () => {
    try {
      if (OfflineService.isOnlineStatus()) {
        await loadOnlineJobs();
      } else {
        await loadOfflineJobs();
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
      await loadOfflineJobs(); // Fallback to cached data
    } finally {
      setIsLoading(false);
    }
  };

  const loadOnlineJobs = async () => {
    // Simulate API call - replace with actual API integration
    const mockJobs: Job[] = [
      {
        id: '1',
        title: 'Server - Fine Dining',
        restaurantName: 'The Gourmet Kitchen',
        location: 'Downtown Seattle',
        distance: '2.3 km',
        salary: '$18-22/hour + tips',
        type: 'FULL_TIME',
        skills: ['Customer Service', 'Fine Dining', 'Wine Knowledge'],
        description: 'Seeking experienced server for upscale dining establishment...',
        postedDate: '2 hours ago',
        urgency: 'HIGH',
        matchScore: 95,
        isApplied: false,
      },
      {
        id: '2',
        title: 'Line Cook',
        restaurantName: 'Marco\'s Italian Bistro',
        location: 'Capitol Hill',
        distance: '3.1 km',
        salary: '$16-20/hour',
        type: 'PART_TIME',
        skills: ['Italian Cuisine', 'Grill', 'Prep'],
        description: 'Join our kitchen team at a busy Italian restaurant...',
        postedDate: '5 hours ago',
        urgency: 'MEDIUM',
        matchScore: 87,
        isApplied: false,
      },
      {
        id: '3',
        title: 'Bartender',
        restaurantName: 'Sunset Lounge',
        location: 'Belltown',
        distance: '1.8 km',
        salary: '$15/hour + tips',
        type: 'PART_TIME',
        skills: ['Mixology', 'Customer Service', 'Cash Handling'],
        description: 'Looking for skilled bartender for busy weekend shifts...',
        postedDate: '1 day ago',
        urgency: 'LOW',
        matchScore: 78,
        isApplied: true,
      },
    ];

    setJobs(mockJobs);
    
    // Cache jobs for offline use
    await OfflineService.cacheJobsData(mockJobs);
  };

  const loadOfflineJobs = async () => {
    const cachedJobs = await OfflineService.getCachedJobs();
    setJobs(cachedJobs);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadJobs();
    setIsRefreshing(false);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // In a real app, this would trigger a new API call or filter existing jobs
  };

  const handleApplyToJob = async (job: Job) => {
    try {
      if (!isOnline) {
        // Store offline action
        await OfflineService.storeOfflineAction({
          type: 'APPLY_TO_JOB',
          endpoint: `/jobs/${job.id}/apply`,
          method: 'POST',
          data: { jobId: job.id },
        });
      }

      // Update local state
      setJobs(prevJobs =>
        prevJobs.map(j =>
          j.id === job.id ? { ...j, isApplied: true } : j
        )
      );

      // Navigate to application form or confirmation
      navigation.navigate('JobApplication', { job });
    } catch (error) {
      console.error('Error applying to job:', error);
    }
  };

  const getJobTypeColor = (type: string) => {
    switch (type) {
      case 'FULL_TIME':
        return theme.colors.success;
      case 'PART_TIME':
        return theme.colors.info;
      case 'CONTRACT':
        return theme.colors.warning;
      case 'TEMPORARY':
        return theme.colors.onSurface;
      default:
        return theme.colors.primary;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'HIGH':
        return theme.colors.error;
      case 'MEDIUM':
        return theme.colors.warning;
      case 'LOW':
        return theme.colors.success;
      default:
        return theme.colors.onSurface;
    }
  };

  const renderJobItem = ({ item: job }: { item: Job }) => (
    <Card style={styles.jobCard}>
      <Card.Content>
        <View style={styles.jobHeader}>
          <View style={styles.jobTitleContainer}>
            <Text style={styles.jobTitle}>{job.title}</Text>
            {job.matchScore && (
              <Badge
                style={[styles.matchBadge, { backgroundColor: theme.colors.success }]}
              >
                {job.matchScore}% match
              </Badge>
            )}
          </View>
          <IconButton
            icon={job.isApplied ? 'check-circle' : 'bookmark-outline'}
            iconColor={job.isApplied ? theme.colors.success : theme.colors.onSurface}
            size={24}
          />
        </View>

        <Text style={styles.restaurantName}>{job.restaurantName}</Text>
        
        <View style={styles.jobMeta}>
          <Text style={styles.location}>📍 {job.location}</Text>
          {job.distance && <Text style={styles.distance}>{job.distance}</Text>}
        </View>

        <Text style={styles.salary}>{job.salary}</Text>

        <View style={styles.chipsContainer}>
          <Chip
            mode="outlined"
            compact
            style={[styles.typeChip, { borderColor: getJobTypeColor(job.type) }]}
            textStyle={{ color: getJobTypeColor(job.type), fontSize: 12 }}
          >
            {job.type.replace('_', ' ')}
          </Chip>
          <Chip
            mode="outlined"
            compact
            style={[styles.urgencyChip, { borderColor: getUrgencyColor(job.urgency) }]}
            textStyle={{ color: getUrgencyColor(job.urgency), fontSize: 12 }}
          >
            {job.urgency}
          </Chip>
        </View>

        <View style={styles.skillsContainer}>
          {job.skills.slice(0, 3).map((skill, index) => (
            <Chip
              key={index}
              mode="flat"
              compact
              style={styles.skillChip}
              textStyle={styles.skillText}
            >
              {skill}
            </Chip>
          ))}
          {job.skills.length > 3 && (
            <Text style={styles.moreSkills}>+{job.skills.length - 3} more</Text>
          )}
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {job.description}
        </Text>

        <View style={styles.jobFooter}>
          <Text style={styles.postedDate}>{job.postedDate}</Text>
          <View style={styles.actionsContainer}>
            <Button
              mode="outlined"
              compact
              onPress={() => navigation.navigate('JobDetails', { job })}
              style={styles.detailsButton}
            >
              Details
            </Button>
            <Button
              mode="contained"
              compact
              onPress={() => handleApplyToJob(job)}
              disabled={job.isApplied}
              style={styles.applyButton}
            >
              {job.isApplied ? 'Applied' : 'Apply'}
            </Button>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search jobs..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchBar}
          icon="magnify"
          clearIcon="close"
        />
        {!isOnline && (
          <Chip
            icon="wifi-off"
            mode="outlined"
            style={styles.offlineChip}
            textStyle={styles.offlineText}
          >
            Offline
          </Chip>
        )}
      </View>

      <FlatList
        data={jobs}
        renderItem={renderJobItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.jobsList}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />

      <FAB
        icon="filter"
        style={styles.fab}
        onPress={() => navigation.navigate('JobFilters', { filters, setFilters })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  searchContainer: {
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  searchBar: {
    flex: 1,
    elevation: theme.elevation.small,
  },
  offlineChip: {
    backgroundColor: theme.colors.warning,
  },
  offlineText: {
    color: '#fff',
    fontSize: 10,
  },
  jobsList: {
    padding: theme.spacing.md,
  },
  jobCard: {
    marginBottom: theme.spacing.md,
    elevation: theme.elevation.small,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.xs,
  },
  jobTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    flex: 1,
  },
  matchBadge: {
    fontSize: 10,
  },
  restaurantName: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '500',
    marginBottom: theme.spacing.xs,
  },
  jobMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  location: {
    fontSize: 14,
    color: theme.colors.onSurface,
  },
  distance: {
    fontSize: 12,
    color: theme.colors.outline,
  },
  salary: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.success,
    marginBottom: theme.spacing.sm,
  },
  chipsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  typeChip: {
    height: 28,
  },
  urgencyChip: {
    height: 28,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
    alignItems: 'center',
  },
  skillChip: {
    height: 24,
    backgroundColor: theme.colors.primaryContainer,
  },
  skillText: {
    fontSize: 10,
    color: theme.colors.primary,
  },
  moreSkills: {
    fontSize: 12,
    color: theme.colors.outline,
    fontStyle: 'italic',
  },
  description: {
    fontSize: 14,
    color: theme.colors.onSurface,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postedDate: {
    fontSize: 12,
    color: theme.colors.outline,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  detailsButton: {
    minWidth: 80,
  },
  applyButton: {
    minWidth: 80,
  },
  fab: {
    position: 'absolute',
    margin: theme.spacing.md,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
});

export default JobSearchScreen;