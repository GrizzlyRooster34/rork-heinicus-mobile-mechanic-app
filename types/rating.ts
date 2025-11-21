export interface RatingCategory {
  id: string;
  name: string;
  description: string;
  weight: number; // For calculating overall rating
}

export interface Rating {
  id: string;
  jobId: string;
  customerId: string;
  mechanicId: string;
  overallRating: number; // 1-5 stars
  categoryRatings: {
    [categoryId: string]: number;
  };
  createdAt: Date;
  updatedAt?: Date;
}

export interface Review {
  id: string;
  jobId: string;
  customerId: string;
  mechanicId: string;
  rating: number; // 1-5 stars
  title: string;
  comment: string;
  photos?: ReviewPhoto[];
  isAnonymous: boolean;
  isVerified: boolean; // Whether customer completed actual service
  isModerated: boolean;
  moderationStatus: 'pending' | 'approved' | 'rejected';
  moderationReason?: string;
  moderatedAt?: Date;
  moderatedBy?: string;
  createdAt: Date;
  updatedAt?: Date;
  helpfulCount: number;
  reportCount: number;
  response?: MechanicResponse;
}

export interface ReviewPhoto {
  id: string;
  url: string;
  caption?: string;
  uploadedAt: Date;
}

export interface MechanicResponse {
  id: string;
  mechanicId: string;
  message: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface MechanicRatingProfile {
  mechanicId: string;
  overallRating: number;
  totalReviews: number;
  ratingDistribution: {
    [stars: number]: number; // Count of reviews for each star rating
  };
  categoryAverages: {
    [categoryId: string]: number;
  };
  recentReviews: Review[];
  badges: RatingBadge[];
  rankingPosition?: number;
  lastUpdated: Date;
}

export interface RatingBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  criteria: string;
  earnedAt: Date;
}

export interface ReviewReport {
  id: string;
  reviewId: string;
  reporterId: string;
  reason: 'inappropriate' | 'spam' | 'fake' | 'offensive' | 'other';
  description?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export interface RatingAnalytics {
  mechanicId: string;
  period: 'week' | 'month' | 'quarter' | 'year';
  averageRating: number;
  totalReviews: number;
  responseRate: number; // Percentage of reviews responded to
  ratingTrend: {
    date: Date;
    rating: number;
    reviewCount: number;
  }[];
  topCompliments: string[];
  improvementAreas: string[];
  customerSatisfactionScore: number;
  repeatCustomerRate: number;
}

export interface RatingIncentive {
  id: string;
  name: string;
  description: string;
  type: 'discount' | 'points' | 'badge' | 'priority';
  value: number;
  criteria: {
    minRating?: number;
    includePhoto?: boolean;
    minWords?: number;
    timeframe?: number; // days after service
  };
  isActive: boolean;
  createdAt: Date;
}

export interface CustomerRatingActivity {
  customerId: string;
  totalReviews: number;
  averageRatingGiven: number;
  recentReviews: Review[];
  incentivesEarned: RatingIncentive[];
  points: number;
  level: 'bronze' | 'silver' | 'gold' | 'platinum';
  badges: RatingBadge[];
}

export interface RatingNotification {
  id: string;
  userId: string;
  type: 'new_review' | 'review_response' | 'rating_milestone' | 'badge_earned' | 'review_reminder';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: Date;
}

export interface RatingFilter {
  minRating?: number;
  maxRating?: number;
  hasPhotos?: boolean;
  isVerified?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  sortBy?: 'newest' | 'oldest' | 'highest_rated' | 'lowest_rated' | 'most_helpful';
}

export interface RatingStats {
  totalRatings: number;
  averageRating: number;
  fiveStarCount: number;
  fourStarCount: number;
  threeStarCount: number;
  twoStarCount: number;
  oneStarCount: number;
  percentageRecommended: number;
  responseRate: number;
  averageResponseTime: number; // in hours
}

// Pre-defined rating categories
export const RATING_CATEGORIES: RatingCategory[] = [
  {
    id: 'punctuality',
    name: 'Punctuality',
    description: 'Arrived on time and completed work as scheduled',
    weight: 0.2
  },
  {
    id: 'quality',
    name: 'Quality of Work',
    description: 'Service was performed to high standards',
    weight: 0.3
  },
  {
    id: 'communication',
    name: 'Communication',
    description: 'Clear explanations and responsive to questions',
    weight: 0.2
  },
  {
    id: 'value',
    name: 'Value for Money',
    description: 'Fair pricing for the service provided',
    weight: 0.15
  },
  {
    id: 'professionalism',
    name: 'Professionalism',
    description: 'Courteous, respectful, and clean work area',
    weight: 0.15
  }
];

// Pre-defined review templates
export const REVIEW_TEMPLATES = {
  excellent: {
    title: 'Excellent Service!',
    suggestions: [
      'Professional and knowledgeable',
      'Fixed the problem quickly',
      'Great communication throughout',
      'Fair pricing and quality work',
      'Would definitely recommend'
    ]
  },
  good: {
    title: 'Good Service',
    suggestions: [
      'Service was completed satisfactorily',
      'Mechanic was professional',
      'Problem was resolved',
      'Reasonable pricing'
    ]
  },
  average: {
    title: 'Average Experience',
    suggestions: [
      'Service was adequate',
      'Some room for improvement',
      'Got the job done'
    ]
  },
  poor: {
    title: 'Disappointing Experience',
    suggestions: [
      'Service did not meet expectations',
      'Communication could be better',
      'Quality of work was lacking'
    ]
  }
};

// Achievement badges
export const RATING_BADGES = [
  {
    id: 'five_star_hero',
    name: '5-Star Hero',
    description: 'Maintained 5-star rating for 3 months',
    icon: '⭐',
    color: '#FFD700',
    criteria: 'averageRating >= 4.8 AND totalReviews >= 20'
  },
  {
    id: 'customer_favorite',
    name: 'Customer Favorite',
    description: 'Received 50+ positive reviews',
    icon: '❤️',
    color: '#FF6B6B',
    criteria: 'totalReviews >= 50 AND averageRating >= 4.5'
  },
  {
    id: 'quick_responder',
    name: 'Quick Responder',
    description: 'Responds to reviews within 24 hours',
    icon: '⚡',
    color: '#4ECDC4',
    criteria: 'averageResponseTime <= 24'
  },
  {
    id: 'quality_champion',
    name: 'Quality Champion',
    description: 'Consistently rated 5 stars for quality',
    icon: '🏆',
    color: '#45B7D1',
    criteria: 'qualityRating >= 4.8 AND totalReviews >= 30'
  },
  {
    id: 'punctuality_pro',
    name: 'Punctuality Pro',
    description: 'Always on time, never late',
    icon: '🕐',
    color: '#96CEB4',
    criteria: 'punctualityRating >= 4.9 AND totalReviews >= 25'
  }
];

export type RatingSubmissionData = {
  jobId: string;
  overallRating: number;
  categoryRatings: { [categoryId: string]: number };
  title: string;
  comment: string;
  photos?: string[];
  isAnonymous: boolean;
};

export type RatingFilterOptions = {
  mechanicId?: string;
  minRating?: number;
  hasPhotos?: boolean;
  isVerified?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: 'newest' | 'oldest' | 'highest' | 'lowest' | 'helpful';
};