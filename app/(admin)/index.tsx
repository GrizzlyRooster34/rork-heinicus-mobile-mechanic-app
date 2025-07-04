import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/colors';
import { useAuthStore } from '@/stores/auth-store';
import { useAppStore } from '@/stores/app-store';
import * as Icons from 'lucide-react-native';

export default function AdminDashboardScreen() {
  const { user, getAllUsers } = useAuthStore();
  const { serviceRequests, quotes } = useAppStore();

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

  if (user?.role !== 'admin') {
    return (
      <View style={styles.unauthorizedContainer}>
        <Icons.Shield size={64} color={Colors.error} />
        <Text style={styles.unauthorizedTitle}>Access Denied</Text>
        <Text style={styles.unauthorizedText}>
          You do not have permission to access the admin dashboard.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <Text style={styles.headerSubtitle}>
            Welcome back, {user.firstName}
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Icons.Users size={24} color={Colors.primary} />
            <Text style={styles.statNumber}>{totalCustomers}</Text>
            <Text style={styles.statLabel}>Customers</Text>
          </View>
          
          <View style={styles.statCard}>
            <Icons.Wrench size={24} color={Colors.mechanic} />
            <Text style={styles.statNumber}>{totalMechanics}</Text>
            <Text style={styles.statLabel}>Mechanics</Text>
          </View>
          
          <View style={styles.statCard}>
            <Icons.FileText size={24} color={Colors.secondary} />
            <Text style={styles.statNumber}>{totalQuotes}</Text>
            <Text style={styles.statLabel}>Quotes</Text>
          </View>
          
          <View style={styles.statCard}>
            <Icons.Briefcase size={24} color={Colors.warning} />
            <Text style={styles.statNumber}>{totalJobs}</Text>
            <Text style={styles.statLabel}>Total Jobs</Text>
          </View>
          
          <View style={styles.statCard}>
            <Icons.CheckCircle size={24} color={Colors.success} />
            <Text style={styles.statNumber}>{completedJobs}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          
          <View style={styles.statCard}>
            <Icons.DollarSign size={24} color={Colors.primary} />
            <Text style={styles.statNumber}>${totalRevenue}</Text>
            <Text style={styles.statLabel}>Revenue</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickActionCard}>
              <Icons.UserPlus size={24} color={Colors.primary} />
              <Text style={styles.quickActionText}>Add User</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickActionCard}>
              <Icons.FileText size={24} color={Colors.secondary} />
              <Text style={styles.quickActionText}>Create Quote</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickActionCard}>
              <Icons.Settings size={24} color={Colors.textSecondary} />
              <Text style={styles.quickActionText}>System Settings</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.activitySection}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityList}>
            {recentActivity.map((activity) => (
              <View key={activity.id} style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  {activity.type === 'job' ? (
                    <Icons.Briefcase size={16} color={Colors.primary} />
                  ) : (
                    <Icons.FileText size={16} color={Colors.secondary} />
                  )}
                </View>
                
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.activityTime}>
                    {activity.time.toLocaleDateString()} at {activity.time.toLocaleTimeString()}
                  </Text>
                </View>
                
                <View style={[
                  styles.activityStatus,
                  { backgroundColor: getStatusColor(activity.status) + '20' }
                ]}>
                  <Text style={[
                    styles.activityStatusText,
                    { color: getStatusColor(activity.status) }
                  ]}>
                    {activity.status}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'pending': return Colors.warning;
    case 'quoted': return Colors.primary;
    case 'accepted': return Colors.success;
    case 'in_progress': return Colors.mechanic;
    case 'completed': return Colors.success;
    case 'paid': return Colors.success;
    case 'cancelled': return Colors.error;
    default: return Colors.textMuted;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
  },
  unauthorizedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: Colors.background,
  },
  unauthorizedTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  unauthorizedText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
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
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  quickActionsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickActionText: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  activitySection: {
    marginBottom: 20,
  },
  activityList: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
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
    color: Colors.text,
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: Colors.textMuted,
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
});