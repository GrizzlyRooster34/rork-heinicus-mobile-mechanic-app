import { useEffect } from 'react';
import { Platform } from 'react-native';

interface BreadcrumbLoggerProps {
  route: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export default function BreadcrumbLogger({ 
  route, 
  userId, 
  metadata 
}: BreadcrumbLoggerProps) {
  useEffect(() => {
    const breadcrumb = {
      route,
      userId: userId || 'anonymous',
      timestamp: new Date().toISOString(),
      platform: Platform.OS,
      metadata: metadata || {},
    };

    // Log to console for development
    console.log('Breadcrumb:', breadcrumb);

    // In production, this would send to analytics service
    // Example: Analytics.track('page_view', breadcrumb);
    
    // Store in local storage for debugging (web only)
    if (Platform.OS === 'web') {
      try {
        const existingBreadcrumbs = JSON.parse(
          localStorage.getItem('heinicus_breadcrumbs') || '[]'
        );
        
        existingBreadcrumbs.push(breadcrumb);
        
        // Keep only last 100 breadcrumbs
        if (existingBreadcrumbs.length > 100) {
          existingBreadcrumbs.splice(0, existingBreadcrumbs.length - 100);
        }
        
        localStorage.setItem(
          'heinicus_breadcrumbs', 
          JSON.stringify(existingBreadcrumbs)
        );
      } catch (error) {
        console.warn('Failed to store breadcrumb:', error);
      }
    }
  }, [route, userId, metadata]);

  // This component doesn't render anything
  return null;
}

// Utility function to get breadcrumbs (for debugging)
export function getBreadcrumbs(): any[] {
  if (Platform.OS === 'web') {
    try {
      return JSON.parse(localStorage.getItem('heinicus_breadcrumbs') || '[]');
    } catch (error) {
      console.warn('Failed to get breadcrumbs:', error);
      return [];
    }
  }
  return [];
}

// Utility function to clear breadcrumbs
export function clearBreadcrumbs(): void {
  if (Platform.OS === 'web') {
    try {
      localStorage.removeItem('heinicus_breadcrumbs');
    } catch (error) {
      console.warn('Failed to clear breadcrumbs:', error);
    }
  }
}