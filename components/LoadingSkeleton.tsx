import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { Colors } from '@/constants/colors';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ 
  width = '100%', 
  height = 16, 
  borderRadius = 4, 
  style 
}: SkeletonProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ]).start(() => animate());
    };

    animate();
  }, [animatedValue]);

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.surface, Colors.border],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor,
        },
        style,
      ]}
    />
  );
}

interface SkeletonCardProps {
  showAvatar?: boolean;
  showTitle?: boolean;
  showSubtitle?: boolean;
  showContent?: boolean;
  lines?: number;
  style?: ViewStyle;
}

export function SkeletonCard({
  showAvatar = false,
  showTitle = true,
  showSubtitle = false,
  showContent = true,
  lines = 3,
  style,
}: SkeletonCardProps) {
  return (
    <View style={[styles.card, style]}>
      {showAvatar && (
        <View style={styles.avatarContainer}>
          <Skeleton width={48} height={48} borderRadius={24} />
        </View>
      )}
      
      <View style={styles.content}>
        {showTitle && (
          <Skeleton width="70%" height={18} style={styles.title} />
        )}
        
        {showSubtitle && (
          <Skeleton width="50%" height={14} style={styles.subtitle} />
        )}
        
        {showContent && (
          <View style={styles.textLines}>
            {Array.from({ length: lines }).map((_, index) => (
              <Skeleton
                key={index}
                width={index === lines - 1 ? '60%' : '100%'}
                height={14}
                style={styles.textLine}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

interface SkeletonListProps {
  itemCount?: number;
  showAvatar?: boolean;
  showTitle?: boolean;
  showSubtitle?: boolean;
  showContent?: boolean;
  lines?: number;
  style?: ViewStyle;
}

export function SkeletonList({
  itemCount = 5,
  showAvatar = false,
  showTitle = true,
  showSubtitle = false,
  showContent = true,
  lines = 2,
  style,
}: SkeletonListProps) {
  return (
    <View style={[styles.list, style]}>
      {Array.from({ length: itemCount }).map((_, index) => (
        <SkeletonCard
          key={index}
          showAvatar={showAvatar}
          showTitle={showTitle}
          showSubtitle={showSubtitle}
          showContent={showContent}
          lines={lines}
          style={styles.listItem}
        />
      ))}
    </View>
  );
}

interface SkeletonButtonProps {
  width?: number | string;
  height?: number;
  style?: ViewStyle;
}

export function SkeletonButton({ 
  width = 120, 
  height = 40, 
  style 
}: SkeletonButtonProps) {
  return (
    <Skeleton
      width={width}
      height={height}
      borderRadius={8}
      style={style}
    />
  );
}

interface SkeletonImageProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonImage({ 
  width = '100%', 
  height = 200, 
  borderRadius = 8, 
  style 
}: SkeletonImageProps) {
  return (
    <Skeleton
      width={width}
      height={height}
      borderRadius={borderRadius}
      style={style}
    />
  );
}

interface SkeletonServiceCardProps {
  style?: ViewStyle;
}

export function SkeletonServiceCard({ style }: SkeletonServiceCardProps) {
  return (
    <View style={[styles.serviceCard, style]}>
      <View style={styles.serviceCardHeader}>
        <Skeleton width={48} height={48} borderRadius={24} />
        <View style={styles.serviceCardInfo}>
          <Skeleton width="80%" height={18} />
          <Skeleton width="60%" height={14} style={{ marginTop: 4 }} />
        </View>
      </View>
      
      <View style={styles.serviceCardContent}>
        <Skeleton width="100%" height={14} />
        <Skeleton width="70%" height={14} style={{ marginTop: 4 }} />
      </View>
      
      <View style={styles.serviceCardFooter}>
        <Skeleton width="40%" height={14} />
        <Skeleton width="30%" height={16} />
      </View>
    </View>
  );
}

interface SkeletonQuoteCardProps {
  style?: ViewStyle;
}

export function SkeletonQuoteCard({ style }: SkeletonQuoteCardProps) {
  return (
    <View style={[styles.quoteCard, style]}>
      <View style={styles.quoteCardHeader}>
        <Skeleton width="70%" height={18} />
        <Skeleton width="25%" height={20} />
      </View>
      
      <Skeleton width="100%" height={14} style={{ marginVertical: 8 }} />
      <Skeleton width="80%" height={14} style={{ marginBottom: 16 }} />
      
      <View style={styles.quoteBreakdown}>
        <View style={styles.quoteRow}>
          <Skeleton width="30%" height={14} />
          <Skeleton width="20%" height={14} />
        </View>
        <View style={styles.quoteRow}>
          <Skeleton width="25%" height={14} />
          <Skeleton width="20%" height={14} />
        </View>
        <View style={styles.quoteRow}>
          <Skeleton width="35%" height={16} />
          <Skeleton width="25%" height={16} />
        </View>
      </View>
      
      <View style={styles.quoteActions}>
        <SkeletonButton width="45%" height={40} />
        <SkeletonButton width="45%" height={40} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: Colors.surface,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatarContainer: {
    marginBottom: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 12,
  },
  textLines: {
    gap: 6,
  },
  textLine: {
    // No additional styles needed
  },
  list: {
    gap: 12,
  },
  listItem: {
    // No additional styles needed
  },
  serviceCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  serviceCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  serviceCardInfo: {
    flex: 1,
  },
  serviceCardContent: {
    marginBottom: 16,
    gap: 4,
  },
  serviceCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quoteCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quoteCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  quoteBreakdown: {
    gap: 8,
    marginBottom: 16,
  },
  quoteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quoteActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
});