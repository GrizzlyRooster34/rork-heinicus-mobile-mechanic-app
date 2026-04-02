import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/colors';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { router } from 'expo-router';
import * as Icons from 'lucide-react-native';

interface Props {
  children: ReactNode;
  screenName?: string;
  fallbackRoute?: string;
}

export function ScreenErrorBoundary({ children, screenName, fallbackRoute = '/' }: Props) {
  const handleNavigateBack = () => {
    try {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace(fallbackRoute);
      }
    } catch (error) {
      // If navigation fails, try to go to root
      router.replace('/');
    }
  };

  const fallback = (
    <View style={styles.container}>
      <Icons.AlertTriangle size={48} color={Colors.error} />
      <Text style={styles.title}>Screen Error</Text>
      <Text style={styles.message}>
        {screenName ? `The ${screenName} screen` : 'This screen'} encountered an error.
      </Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.navButton} onPress={handleNavigateBack}>
          <Icons.ArrowLeft size={16} color={Colors.white} />
          <Text style={styles.navButtonText}>Go Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.homeButton} 
          onPress={() => router.replace('/')}
        >
          <Icons.Home size={16} color={Colors.primary} />
          <Text style={styles.homeButtonText}>Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ErrorBoundary 
      level="screen" 
      fallback={fallback}
      onError={(error, errorInfo) => {
        console.error(`Screen Error in ${screenName || 'unknown screen'}:`, error);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  navButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  homeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderColor: Colors.primary,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  homeButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});