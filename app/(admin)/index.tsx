import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/auth-store';
import { useAppStore } from '@/stores/app-store';
import { useThemeStore } from '@/stores/theme-store';
import * as Icons from 'lucide-react-native';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { user, getAllUsers } = useAuthStore();
  const { serviceRequests, quotes } = useAppStore();
  const { colors } = useThemeStore();

  const allUsers = getAllUsers();
  const totalCustomers = allUsers.filter(u => u.role === 'customer').length;
  const totalMechanics = allUsers.filter(u => u.role === 'mechanic').length;
  const totalQuotes = quotes.length;
  const totalJobs = serviceRequests.length;
  const completedJobs = serviceRequests.filter(r => r.status === 'completed').length;
  const totalRevenue = quotes
    .filter(q => q.status === 'paid' && q.paidAt)
    .reduce((sum, q) => sum + q.totalCost, 0);

  const recentActivity = [
    ...serviceRequests.slice(-5).map(r => ({
      id: r.id,
      type: 'job',
      title: `New service request: ${r.type}`,
      time: r.createdAt,
      status: r.status
    })),
    ...quotes.slice(-5).map(q => ({
      id: q.id,
      type: 'quote',
      title: `Quote ${q.status}: $${q.totalCost}`,
      time: q.createdAt,
      status: q.status
    }))
  ].sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 10);

  const handleAddUser = () => {
    router.push('/(admin)/users');
  };

  const handleCreateQuote = () => {
    router.push('/(admin)/quotes');
  };

  const handleSystemSettings = () => {
    router.push('/(admin)/settings');
  };

  if (user?.role !== 'admin') {
    return (
      <View style={[styles.unauthorizedContainer, { backgroundColor: colors.background }]}>
        <Icons.Shield size={64} color={colors.error} />
        <Text style={[styles.unauthorizedTitle, { color: colors.text }]}>Access Denied</Text>
        <Text style={[styles.unauthorizedText, { color: colors.textSecondary }]}>
          You do not have permission to access the admin dashboard.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Admin Dashboard</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Welcome back, {user.firstName}
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Icons.Users size={24} color={colors.primary} />
            <Text style={[styles.statNumber, { color: colors.text }]}>{totalCustomers}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Customers</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Icons.Wrench size={24} color={colors.mechanic} />
            <Text style={[styles.statNumber, { color: colors.text }]}>{totalMechanics}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Mechanics</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Icons.FileText size={24} color={colors.secondary} />
            <Text style={[styles.statNumber, { color: colors.text }]}>{totalQuotes}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Quotes</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Icons.Briefcase size={24} color={colors.warning} />
            <Text style={[styles.statNumber, { color: colors.text }]}>{totalJobs}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Jobs</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Icons.CheckCircle size={24} color={colors.success} />
            <Text style={[styles.statNumber, { color: colors.text }]}>{completedJobs}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completed</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Icons.DollarSign size={24} color={colors.primary} />
            <Text style={[styles.statNumber, { color: colors.text }]}>${totalRevenue}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Revenue</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={[styles.quickActionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={handleAddUser}
              activeOpacity={0.7}
            >
              <Icons.UserPlus size={24} color={colors.primary} />
              <Text style={[styles.quickActionText, { color: colors.text }]}>Manage Users</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.quickActionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={handleCreateQuote}
              activeOpacity={0.7}
            >
              <Icons.FileText size={24} color={colors.secondary} />
              <Text style={[styles.quickActionText, { color: colors.text }]}>Manage Quotes</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.quickActionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={handleSystemSettings}
              activeOpacity={0.7}
            >
              <Icons.Settings size={24} color={colors.textSecondary} />
              <Text style={[styles.quickActionText, { color: colors.text }]}>System Settings</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.activitySection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activity</Text>
          <View style={[styles.activityList, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {recentActivity.map((activity, index) => (
              <View key={activity.id} style={[
                styles.activityItem,
                { borderBottomColor: colors.border },
                index === recentActivity.length - 1 && { borderBottomWidth: 0 }
              ]}>
                <View style={[styles.activityIcon, { backgroundColor: colors.surface }]}>
                  {activity.type === 'job' ? (
                    <Icons.Briefcase size={16} color={colors.primary} />
                  ) : (
                    <Icons.FileText size={16} color={colors.secondary} />
                  )}
                </View>
                
                <View style={styles.activityContent}>
                  <Text style={[styles.activityTitle, { color: colors.text }]}>{activity.title}</Text>
                  <Text style={[styles.activityTime, { color: colors.textMuted }]}>
                    {activity.time.toLocaleDateString()} at {activity.time.toLocaleTimeString()}
                  </Text>
                </View>
                
                <View style={[
                  styles.activityStatus,
                  { backgroundColor: getStatusColor(activity.status, colors) + '20' }
                ]}>
                  <Text style={[
                    styles.activityStatusText,
                    { color: getStatusColor(activity.status, colors) }
                  ]}>
                    {activity.status}
                  </Text>
                </View>
              </View>
            ))}
            {recentActivity.length === 0 && (
              <View style={styles.emptyActivity}>
                <Text style={[styles.emptyActivityText, { color: colors.textMuted }]}>
                  No recent activity
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function getStatusColor(status: string, colors: any) {
  switch (status) {
    case 'pending': return colors.warning;
    case 'quoted': return colors.primary;
    case 'accepted': return colors.success;
    case 'in_progress': return colors.mechanic;
    case 'completed': return colors.success;
    case 'paid': return colors.success;
    case 'cancelled': return colors.error;
    default: return colors.textMuted;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  unauthorizedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  unauthorizedTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  unauthorizedText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    minWidth: '30%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  quickActionsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  activitySection: {
    marginBottom: 20,
  },
  activityList: {
    borderRadius: 12,
    borderWidth: 1,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
  },
  activityStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activityStatusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  emptyActivity: {
    padding: 32,
    alignItems: 'center',
  },
  emptyActivityText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
});