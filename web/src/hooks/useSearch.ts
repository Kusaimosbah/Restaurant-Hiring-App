import { useState, useEffect, useCallback } from 'react';
import { SearchFilters, SearchResult, SavedSearch } from '@/lib/services/SearchService';

/**
 * Custom hooks for search functionality
 */

// Generic search hook
export function useSearch<T>(
  searchType: 'jobs' | 'applications' | 'workers',
  initialFilters: SearchFilters = {}
) {
  const [results, setResults] = useState<SearchResult<T>>({
    data: [],
    total: 0,
    facets: {
      workTypes: [],
      locations: [],
      experienceLevels: [],
      salaryRanges: [],
      skills: [],
      statuses: []
    },
    suggestions: [],
    relatedQueries: []
  });
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (searchFilters?: SearchFilters) => {
    const finalFilters = searchFilters || filters;
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();

      // Build query parameters from filters
      Object.entries(finalFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            value.forEach(item => queryParams.append(key, item.toString()));
          } else if (typeof value === 'object' && key === 'yearsOfExperience') {
            if (value.min !== undefined) queryParams.append('experienceMin', value.min.toString());
            if (value.max !== undefined) queryParams.append('experienceMax', value.max.toString());
          } else if (value instanceof Date) {
            queryParams.append(key, value.toISOString());
          } else {
            queryParams.append(key, value.toString());
          }
        }
      });

      const response = await fetch(`/api/search/${searchType}?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setResults(data);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }, [searchType, filters]);

  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setResults({
      data: [],
      total: 0,
      facets: {
        workTypes: [],
        locations: [],
        experienceLevels: [],
        salaryRanges: [],
        skills: [],
        statuses: []
      },
      suggestions: [],
      relatedQueries: []
    });
  }, []);

  return {
    results,
    filters,
    loading,
    error,
    search,
    updateFilters,
    clearFilters
  };
}

// Job search hook
export function useJobSearch(initialFilters: SearchFilters = {}) {
  return useSearch<any>('jobs', initialFilters);
}

// Application search hook
export function useApplicationSearch(initialFilters: SearchFilters = {}) {
  return useSearch<any>('applications', initialFilters);
}

// Worker search hook
export function useWorkerSearch(initialFilters: SearchFilters = {}) {
  return useSearch<any>('workers', initialFilters);
}

// Search suggestions hook
export function useSearchSuggestions(searchType: 'jobs' | 'applications' | 'workers') {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const getSuggestions = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/search/${searchType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  }, [searchType]);

  return { suggestions, loading, getSuggestions };
}

// Saved searches hook
export function useSavedSearches() {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSavedSearches = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/search/saved');
      
      if (!response.ok) {
        throw new Error('Failed to fetch saved searches');
      }

      const data = await response.json();
      setSavedSearches(data.savedSearches || []);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch saved searches');
    } finally {
      setLoading(false);
    }
  }, []);

  const saveSearch = useCallback(async (searchData: {
    name: string;
    description?: string;
    filters: SearchFilters;
    searchType: 'jobs' | 'applications' | 'workers';
    alertsEnabled?: boolean;
  }) => {
    try {
      const response = await fetch('/api/search/saved', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchData),
      });

      if (!response.ok) {
        throw new Error('Failed to save search');
      }

      const data = await response.json();
      setSavedSearches(prev => [...prev, data.savedSearch]);
      return data.savedSearch;

    } catch (error) {
      throw error;
    }
  }, []);

  const updateSavedSearch = useCallback(async (
    id: string,
    updates: Partial<SavedSearch>
  ) => {
    try {
      const response = await fetch('/api/search/saved', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...updates }),
      });

      if (!response.ok) {
        throw new Error('Failed to update saved search');
      }

      const data = await response.json();
      setSavedSearches(prev => 
        prev.map(search => search.id === id ? data.savedSearch : search)
      );
      return data.savedSearch;

    } catch (error) {
      throw error;
    }
  }, []);

  const deleteSavedSearch = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/search/saved?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete saved search');
      }

      setSavedSearches(prev => prev.filter(search => search.id !== id));

    } catch (error) {
      throw error;
    }
  }, []);

  const executeSavedSearch = useCallback(async (searchId: string) => {
    try {
      const response = await fetch('/api/search/saved/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ searchId }),
      });

      if (!response.ok) {
        throw new Error('Failed to execute saved search');
      }

      const results = await response.json();
      
      // Update last executed timestamp
      setSavedSearches(prev =>
        prev.map(search =>
          search.id === searchId
            ? { ...search, lastExecuted: new Date() }
            : search
        )
      );

      return results;

    } catch (error) {
      throw error;
    }
  }, []);

  // Load saved searches on mount
  useEffect(() => {
    fetchSavedSearches();
  }, [fetchSavedSearches]);

  return {
    savedSearches,
    loading,
    error,
    fetchSavedSearches,
    saveSearch,
    updateSavedSearch,
    deleteSavedSearch,
    executeSavedSearch
  };
}

// Quick search hook with debouncing
export function useQuickSearch(
  searchType: 'jobs' | 'applications' | 'workers',
  debounceMs: number = 300
) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults([]);
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      // Get both results and suggestions
      const [resultsResponse, suggestionsResponse] = await Promise.all([
        fetch(`/api/search/${searchType}?q=${encodeURIComponent(searchQuery)}&limit=5`, {
          method: 'GET',
        }),
        fetch(`/api/search/${searchType}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: searchQuery }),
        })
      ]);

      if (resultsResponse.ok) {
        const resultsData = await resultsResponse.json();
        setResults(resultsData.data || []);
      }

      if (suggestionsResponse.ok) {
        const suggestionsData = await suggestionsResponse.json();
        setSuggestions(suggestionsData.suggestions || []);
      }

    } catch (error) {
      console.error('Quick search error:', error);
    } finally {
      setLoading(false);
    }
  }, [searchType]);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      search(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, search, debounceMs]);

  return {
    query,
    setQuery,
    results,
    suggestions,
    loading
  };
}