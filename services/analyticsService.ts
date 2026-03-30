/**
 * Analytics Service
 * 
 * Frontend service to fetch real analytics from backend API
 * Replaces mock data with actual database statistics
 */

// Types
export interface SummaryStats {
  totalCalls: number;
  callsToday: number;
  activeCalls: number;
  resolvedCalls: number;
  pendingCalls: number;
  avgResolutionTime: number;
  resolutionRate: number;
  totalUsers: number;
  activeUsers: number;
  trends: {
    calls: number;
  };
}

export interface TimeSeriesDataPoint {
  date: string;
  count: number;
  resolved: number;
  active: number;
  pending: number;
}

export interface HourlyDataPoint {
  hour: number;
  name: string;
  value: number;
}

export interface CategoryStat {
  category: string;
  count: number;
  percentage: number | string;
}

export interface PriorityStat {
  priority: string;
  count: number;
  color: string;
}

export interface EntityStat {
  entityType: string;
  count: number;
  percentage: number | string;
}

export interface DistributionStats {
  topCategories: CategoryStat[];
  issuesByPriority: PriorityStat[];
  issuesByEntity: EntityStat[];
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  usersByRole: {
    admin: number;
    moderator: number;
    user: number;
  };
  usersByStatus: {
    active: number;
    inactive: number;
  };
}

// Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const API_TIMEOUT = 10000; // 10 seconds

/**
 * Get auth token from localStorage
 */
function getAuthToken(): string | null {
  try {
    const token = localStorage.getItem('token');
    return token;
  } catch (error) {
    console.error('❌ Failed to get auth token:', error);
  }
  return null;
}

/**
 * Fetch data from API
 */
async function fetchAPI<T>(endpoint: string): Promise<T> {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
  
  try {
    const response = await fetch(`${API_BASE_URL}/analytics${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'API request failed');
    }
    
    return data.data;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Get summary statistics
 */
export async function getSummaryStats(): Promise<SummaryStats> {
  try {
    return await fetchAPI<SummaryStats>('/summary');
  } catch (error) {
    console.error('❌ Error fetching summary stats:', error);
    throw error;
  }
}

/**
 * Get time series data
 * @param period - Time period ('7d', '30d', '90d')
 */
export async function getTimeSeriesData(period: string = '7d'): Promise<TimeSeriesDataPoint[]> {
  try {
    return await fetchAPI<TimeSeriesDataPoint[]>(`/time-series?period=${period}`);
  } catch (error) {
    console.error('❌ Error fetching time series data:', error);
    throw error;
  }
}

/**
 * Get hourly activity distribution
 */
export async function getHourlyActivity(): Promise<HourlyDataPoint[]> {
  try {
    return await fetchAPI<HourlyDataPoint[]>('/hourly');
  } catch (error) {
    console.error('❌ Error fetching hourly activity:', error);
    throw error;
  }
}

/**
 * Get distribution statistics
 */
export async function getDistributionStats(): Promise<DistributionStats> {
  try {
    return await fetchAPI<DistributionStats>('/distribution');
  } catch (error) {
    console.error('❌ Error fetching distribution stats:', error);
    throw error;
  }
}

/**
 * Get user statistics
 */
export async function getUserStats(): Promise<UserStats> {
  try {
    return await fetchAPI<UserStats>('/users');
  } catch (error) {
    console.error('❌ Error fetching user stats:', error);
    throw error;
  }
}

/**
 * Get all analytics (combined)
 * @param period - Time period for time series
 */
export async function getAllAnalytics(period: string = '7d'): Promise<{
  summary: SummaryStats;
  timeSeries: TimeSeriesDataPoint[];
  hourly: HourlyDataPoint[];
  distribution: DistributionStats;
  users: UserStats;
}> {
  try {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
    
    const response = await fetch(`${API_BASE_URL}/analytics?period=${period}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'API request failed');
    }
    
    return data.data;
  } catch (error) {
    console.error('❌ Error fetching all analytics:', error);
    throw error;
  }
}

export default {
  getSummaryStats,
  getTimeSeriesData,
  getHourlyActivity,
  getDistributionStats,
  getUserStats,
  getAllAnalytics
};
