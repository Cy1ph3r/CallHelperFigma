/**
 * Analytics Service
 * 
 * Calculates real statistics from MongoDB using aggregations
 * Replaces mock data with actual database queries
 */

import CallLog from '../models/CallLog.js';
import User from '../models/User.js';
import Case from '../models/Case.js';
import KnowledgeBase from '../models/KnowledgeBase.js';

/**
 * Get summary statistics
 * @returns {Promise<Object>} Summary stats
 */
export async function getSummaryStats() {
  try {
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    
    // Total calls
    const totalCalls = await CallLog.countDocuments();
    
    // Calls by status
    const statusStats = await CallLog.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const resolvedCalls = statusStats.find(s => s._id === 'resolved')?.count || 0;
    const pendingCalls = statusStats.find(s => s._id === 'pending')?.count || 0;
    const escalatedCalls = statusStats.find(s => s._id === 'escalated')?.count || 0;
    const closedCalls = statusStats.find(s => s._id === 'closed')?.count || 0;

    // "Active" isn't a persisted status in CallLog; treat non-final calls as active.
    const activeCalls = pendingCalls + escalatedCalls;
    
    // Calls today
    const callsToday = await CallLog.countDocuments({
      createdAt: { $gte: todayStart }
    });
    
    // Average resolution time (in hours)
    const resolutionTimeStats = await CallLog.aggregate([
      {
        $match: {
          status: 'resolved',
          updatedAt: { $exists: true }
        }
      },
      {
        $project: {
          resolutionTime: {
            $divide: [
              { $subtract: ['$updatedAt', '$createdAt'] },
              1000 * 60 * 60 // Convert to hours
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgResolutionTime: { $avg: '$resolutionTime' }
        }
      }
    ]);
    
    const avgResolutionTime = resolutionTimeStats[0]?.avgResolutionTime || 0;
    
    // Total users
    const totalUsers = await User.countDocuments();
    
    // Active users (logged in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const activeUsers = await User.countDocuments({
      lastLogin: { $gte: sevenDaysAgo }
    });
    
    // Resolution rate
    const resolutionRate = totalCalls > 0 
      ? ((resolvedCalls / totalCalls) * 100).toFixed(1)
      : 0;
    
    // Calculate trends (compare with last week)
    const lastWeekStart = new Date();
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    
    const callsLastWeek = await CallLog.countDocuments({
      createdAt: { $gte: lastWeekStart, $lt: todayStart }
    });
    
    const callsTrend = callsLastWeek > 0
      ? (((callsToday - callsLastWeek) / callsLastWeek) * 100).toFixed(1)
      : 0;
    
    return {
      success: true,
      data: {
        totalCalls,
        callsToday,
        activeCalls,
        resolvedCalls,
        pendingCalls,
        escalatedCalls,
        closedCalls,
        avgResolutionTime: Number(avgResolutionTime.toFixed(1)),
        resolutionRate: Number(resolutionRate),
        totalUsers,
        activeUsers,
        trends: {
          calls: Number(callsTrend)
        }
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Error getting summary stats:', error);
    throw error;
  }
}

/**
 * Get time series data
 * @param {string} period - Time period ('7d', '30d', '90d')
 * @returns {Promise<Object>} Time series data
 */
export async function getTimeSeriesData(period = '7d') {
  try {
    // Parse period
    const days = parseInt(period) || 7;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Aggregate calls by day
    const timeSeriesData = await CallLog.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 },
          resolved: {
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
          },
          active: {
            $sum: {
              $cond: [
                { $in: ["$status", ["pending", "escalated"]] },
                1,
                0
              ]
            }
          },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          escalated: {
            $sum: { $cond: [{ $eq: ['$status', 'escalated'] }, 1, 0] }
          },
          closed: {
            $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] }
          }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          count: 1,
          resolved: 1,
          active: 1,
          pending: 1,
          escalated: 1,
          closed: 1
        }
      }
    ]);
    
    // Fill in missing dates with zero values
    const filledData = [];
    const currentDate = new Date(startDate);
    const endDate = new Date();
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const existingData = timeSeriesData.find(d => d.date === dateStr);
      
      filledData.push({
        date: dateStr,
        count: existingData?.count || 0,
        resolved: existingData?.resolved || 0,
        active: existingData?.active || 0,
        pending: existingData?.pending || 0,
        escalated: existingData?.escalated || 0,
        closed: existingData?.closed || 0
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return {
      success: true,
      data: filledData,
      period: period,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Error getting time series data:', error);
    throw error;
  }
}

/**
 * Get hourly activity distribution
 * @returns {Promise<Object>} Hourly activity data
 */
export async function getHourlyActivity() {
  try {
    const hourlyData = await CallLog.aggregate([
      {
        $project: {
          hour: { $hour: '$createdAt' }
        }
      },
      {
        $group: {
          _id: '$hour',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    // Fill in all 24 hours
    const filledData = Array.from({ length: 24 }, (_, hour) => {
      const existing = hourlyData.find(d => d._id === hour);
      return {
        hour: hour,
        name: `${hour}:00`,
        value: existing?.count || 0
      };
    });
    
    return {
      success: true,
      data: filledData,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Error getting hourly activity:', error);
    throw error;
  }
}

/**
 * Get distribution statistics
 * @returns {Promise<Object>} Distribution stats
 */
export async function getDistributionStats() {
  try {
    // Calls by category
    const categoryStats = await CallLog.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);
    
    const totalCalls = await CallLog.countDocuments();
    
    const topCategories = categoryStats.map(stat => ({
      category: stat._id || 'غير محدد',
      count: stat.count,
      percentage: totalCalls > 0 ? ((stat.count / totalCalls) * 100).toFixed(1) : 0
    }));
    
    // Calls by priority (from Cases reference)
    const priorityStats = await Case.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    const priorityColors = {
      'Critical': '#ef4444',
      'High': '#f59e0b',
      'Medium': '#3b82f6',
      'Low': '#10b981'
    };
    
    const issuesByPriority = priorityStats.map(stat => ({
      priority: stat._id || 'Medium',
      count: stat.count,
      color: priorityColors[stat._id] || '#6b7280'
    }));
    
    // Calls by user type/entity
    const entityStats = await CallLog.aggregate([
      {
        $group: {
          _id: '$entityType',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    const issuesByEntity = entityStats.map(stat => ({
      entityType: stat._id || 'غير محدد',
      count: stat.count,
      percentage: totalCalls > 0 ? ((stat.count / totalCalls) * 100).toFixed(1) : 0
    }));
    
    return {
      success: true,
      data: {
        topCategories,
        issuesByPriority,
        issuesByEntity
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Error getting distribution stats:', error);
    throw error;
  }
}

/**
 * Get user statistics
 * @returns {Promise<Object>} User stats
 */
export async function getUserStats() {
  try {
    // Total users
    const totalUsers = await User.countDocuments();
    
    // Users by role
    const roleStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const usersByRole = {
      admin: roleStats.find(r => r._id === 'admin')?.count || 0,
      moderator: roleStats.find(r => r._id === 'moderator')?.count || 0,
      user: roleStats.find(r => r._id === 'user')?.count || 0
    };
    
    // Active users (logged in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const activeUsers = await User.countDocuments({
      lastLogin: { $gte: sevenDaysAgo },
      isActive: true
    });
    
    // Users by status
    const activeCount = await User.countDocuments({ isActive: true });
    const inactiveCount = await User.countDocuments({ isActive: false });
    
    return {
      success: true,
      data: {
        totalUsers,
        activeUsers,
        usersByRole,
        usersByStatus: {
          active: activeCount,
          inactive: inactiveCount
        }
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Error getting user stats:', error);
    throw error;
  }
}

/**
 * Get knowledge base statistics
 * @returns {Promise<Object>} KB stats
 */
export async function getKnowledgeBaseStats() {
  try {
    const totalArticles = await KnowledgeBase.countDocuments();
    const publishedArticles = await KnowledgeBase.countDocuments({ isPublished: true });
    
    // Most viewed articles
    const mostViewed = await KnowledgeBase.find()
      .sort({ viewCount: -1 })
      .limit(5)
      .select('title viewCount helpfulCount category');
    
    // Articles by category
    const categoryStats = await KnowledgeBase.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    return {
      success: true,
      data: {
        totalArticles,
        publishedArticles,
        mostViewed,
        byCategory: categoryStats
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Error getting knowledge base stats:', error);
    throw error;
  }
}

export default {
  getSummaryStats,
  getTimeSeriesData,
  getHourlyActivity,
  getDistributionStats,
  getUserStats,
  getKnowledgeBaseStats
};
