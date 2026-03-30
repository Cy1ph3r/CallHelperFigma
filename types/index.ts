// ========================
// Types & Interfaces
// ========================

// Date Filter Types
export type FilterPeriod = 'today' | 'week' | 'month' | 'year' | 'custom';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface DateFilter {
  period: FilterPeriod;
  range?: DateRange;
}

// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'agent' | 'viewer';
  avatar?: string;
}

// Issue/Problem Types
export interface Issue {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'resolved' | 'pending' | 'closed';
  priority: 'high' | 'medium' | 'low';
  category: string;
  entityType: 'umrah' | 'external' | 'accommodation';
  reportedBy: string;
  reportedAt: Date;
  resolvedAt?: Date;
  assignedTo?: string;
  tags: string[];
  metadata?: Record<string, any>;
}

// Knowledge Base Types
export interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  author: string;
  createdAt: Date;
  updatedAt: Date;
  views: number;
  helpful: number;
  notHelpful: number;
  relatedIssues: string[];
  status: 'draft' | 'published' | 'archived';
}

// Operational Update Types
export interface OperationalUpdate {
  id: string;
  title: string;
  description: string;
  type: 'maintenance' | 'incident' | 'enhancement' | 'announcement';
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  priority: 'high' | 'medium' | 'low';
  startDate: Date;
  endDate?: Date;
  affectedServices: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Training Data Types (وش تعلم رفيق)
export interface TrainingEntry {
  id: string;
  scenario: string;
  correctResponse: string;
  alternativeResponses?: string[];
  category: string;
  submittedBy: string;
  submittedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: Date;
  notes?: string;
}

// Statistics Types
export interface Statistics {
  totalIssues: number;
  activeIssues: number;
  resolvedIssues: number;
  avgResolutionTime: number; // in hours
  satisfactionRate: number; // percentage
  topCategories: CategoryStat[];
  issuesByEntity: EntityStat[];
  issuesByPriority: PriorityStat[];
  timeSeriesData: TimeSeriesData[];
}

export interface CategoryStat {
  category: string;
  count: number;
  percentage: number;
}

export interface EntityStat {
  entityType: string;
  count: number;
  percentage: number;
}

export interface PriorityStat {
  priority: string;
  count: number;
  color: string;
}

export interface TimeSeriesData {
  date: string;
  count: number;
  resolved: number;
  active: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: Date;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Filter & Search Types
export interface FilterOptions {
  dateFilter?: DateFilter;
  status?: string[];
  priority?: string[];
  category?: string[];
  entityType?: string[];
  searchQuery?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationOptions {
  page: number;
  pageSize: number;
}

// Form Types
export interface IssueFormData {
  title: string;
  description: string;
  category: string;
  entityType: 'umrah' | 'external' | 'accommodation';
  priority: 'high' | 'medium' | 'low';
  reportedBy: string;
  tags: string[];
}

export interface KnowledgeFormData {
  title: string;
  content: string;
  category: string;
  tags: string[];
  relatedIssues: string[];
}

export interface TrainingFormData {
  scenario: string;
  correctResponse: string;
  alternativeResponses: string[];
  category: string;
}

export interface UpdateFormData {
  title: string;
  description: string;
  type: 'maintenance' | 'incident' | 'enhancement' | 'announcement';
  priority: 'high' | 'medium' | 'low';
  startDate: Date;
  endDate?: Date;
  affectedServices: string[];
}
