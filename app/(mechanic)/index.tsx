import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import * as Icons from 'lucide-react-native';
import { trpc } from '@/lib/trpc';
import { useThemeStore } from '@/stores/theme-store';
import { useAppStore } from '@/stores/app-store';
import { useAuthStore } from '@/stores/auth-store';
import { SERVICE_CATEGORIES } from '@/constants/services';
import { MaintenanceReminders } from '@/components/MaintenanceReminders';

const formatBackendStatus = (status: string) => status.toLowerCase().replace(/_/g, ' ');

function getStatusColor(status: string, colors: any) {
  switch (status) {
    case 'PENDING': return colors.warning;
    case 'ACCEPTED': return colors.success;
    case 'IN_PROGRESS': return colors.mechanic;
    case 'COMPLETED': return colors.success;
    case 'CANCELLED': return colors.error;
    default: return colors.textMuted;
  }
}

export default function MechanicDashboardScreen() {
  const { colors } = useThemeStore();
  const { logEvent } = useAppStore();
  const { user, logout } = useAuthStore();
  const { data: jobsData, isLoading } = trpc.job.getAll.useQuery();
  const jobs = jobsData?.jobs ?? [];
  const mechanicId = user?.id ?? '';

  const mechanicJobs = useMemo(
    () => jobs.filter((job) => !job.mechanicId || job.mechanicId === mechanicId),
    [jobs, mechanicId]
  );

  const pendingJobs = mechanicJobs.filter((job) => job.status === 'PENDING').length;
  const activeJobs = mechanicJobs.filter((job) => ['ACCEPTED', 'IN_PROGRESS'].includes(job.status)).length;
  const completedToday = mechanicJobs.filter(
    (job) => job.status === 'COMPLETED' && new Date(job.updatedAt).toDateString() === new Date().toDateString()
  ).length;

  const paidQuotes = mechanicJobs
    .flatMap((job) => job.quotes)
    .filter((quote) => quote.status === 'PAID');

  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  const todayRevenue = paidQuotes
    .filter((quote) => quote.updatedAt >= startOfDay && quote.updatedAt < endOfDay)
    .reduce((sum, quote) => sum + quote.totalCost, 0);

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weeklyRevenue = paidQuotes
    .filter((quote) => quote.updatedAt >= weekAgo)
    .reduce((sum, quote) => sum + quote.totalCost, 0);
  const weeklyJobs = mechanicJobs.filter((job) => job.status === 'COMPLETED' && new Date(job.updatedAt) >= weekAgo).length;

  const getServiceTitle = (type: string) => {
    return SERVICE_CATEGORIES.find((service) => service.id === type)?.title || type;
  };

  const recentJobs = [...mechanicJobs]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const handleQuickAction = (action: 'jobs' | 'map' | 'customers' | 'profile') => {
    logEvent('dashboard_action', { action, mechanicId });

    switch (action) {
      case 'jobs':
        router.push('/(mechanic)/jobs');
        break;
      case 'map':
        router.push('/(mechanic)/map');
        break;
      case 'customers':
        router.push('/(mechanic)/customers');
        break;
      case 'profile':
        router.push('/(mechanic)/profile');
        break;
    }
  };

  const handleLogout = () => {
    logEvent('mechanic_logout', { mechanicId });
    logout();
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.welcomeText, { color: colors.text }]}>
              Welcome back, {user?.firstName || 'Mechanic'}!
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Mobile Mechanic Dashboard
            </Text>
            <View style={[styles.productionBadge, { backgroundColor: colors.success }]}>
              <Text style={[styles.productionBadgeText, { color: colors.white }]}>LIVE MODE</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Icons.LogOut size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.statsSection}>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.statNumber, { color: colors.text }]}>{pendingJobs}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pending Jobs</Text>
              <Icons.Clock size={16} color={colors.warning} />
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.statNumber, { color: colors.text }]}>{activeJobs}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Active Jobs</Text>
              <Icons.Wrench size={16} color={colors.mechanic} />
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.statNumber, { color: colors.text }]}>{completedToday}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completed Today</Text>
              <Icons.CheckCircle size={16} color={colors.success} />
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.statNumber, { color: colors.text }]}>${todayRevenue.toFixed(2)}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Today's Revenue</Text>
              <Icons.DollarSign size={16} color={colors.primary} />
            </View>
          </View>
        </View>

        <View style={styles.performanceSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Weekly Performance</Text>
          <View style={styles.performanceGrid}>
            <View style={[styles.performanceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.performanceHeader}>
                <Icons.TrendingUp size={20} color={colors.success} />
                <Text style={[styles.performanceTitle, { color: colors.text }]}>Revenue</Text>
              </View>
              <Text style={[styles.performanceValue, { color: colors.text }]}>${weeklyRevenue.toFixed(2)}</Text>
              <Text style={[styles.performanceSubtext, { color: colors.textMuted }]}>Last 7 days</Text>
            </View>

            <View style={[styles.performanceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.performanceHeader}>
                <Icons.CheckSquare size={20} color={colors.primary} />
                <Text style={[styles.performanceTitle, { color: colors.text }]}>Jobs Completed</Text>
              </View>
              <Text style={[styles.performanceValue, { color: colors.text }]}>{weeklyJobs}</Text>
              <Text style={[styles.performanceSubtext, { color: colors.textMuted }]}>Last 7 days</Text>
            </View>
          </View>
        </View>

        <MaintenanceReminders />

        <View style={styles.quickActionsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={[styles.quickActionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => handleQuickAction('jobs')}
            >
              <Icons.Briefcase size={24} color={colors.mechanic} />
              <Text style={[styles.quickActionText, { color: colors.text }]}>Manage Jobs</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => handleQuickAction('map')}
            >
              <Icons.Map size={24} color={colors.mechanic} />
              <Text style={[styles.quickActionText, { color: colors.text }]}>View Map</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => handleQuickAction('customers')}
            >
              <Icons.Users size={24} color={colors.mechanic} />
              <Text style={[styles.quickActionText, { color: colors.text }]}>Customers</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => handleQuickAction('profile')}
            >
              <Icons.Settings size={24} color={colors.mechanic} />
              <Text style={[styles.quickActionText, { color: colors.text }]}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.recentJobsSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Jobs</Text>
            <TouchableOpacity onPress={() => handleQuickAction('jobs')}>
              <Text style={[styles.viewAllText, { color: colors.mechanic }]}>View All</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={[styles.emptyJobs, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Loading jobs...</Text>
            </View>
          ) : recentJobs.length === 0 ? (
            <View style={[styles.emptyJobs, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Icons.Briefcase size={48} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No recent jobs</Text>
              <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
                Jobs will appear here when customers request services
              </Text>
            </View>
          ) : (
            <View style={styles.jobsList}>
              {recentJobs.map((job) => (
                <TouchableOpacity
                  key={job.id}
                  style={[styles.jobCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => handleQuickAction('jobs')}
                >
                  <View style={styles.jobHeader}>
                    <Text style={[styles.jobTitle, { color: colors.text }]}>
                      {getServiceTitle(job.serviceType)}
                    </Text>
                    <View style={[styles.jobStatus, { backgroundColor: getStatusColor(job.status, colors) + '20' }]}>
                      <Text style={[styles.jobStatusText, { color: getStatusColor(job.status, colors) }]}>
                        {formatBackendStatus(job.status)}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.jobDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                    {job.description}
                  </Text>

                  <View style={styles.jobMeta}>
                    <Text style={[styles.jobDate, { color: colors.textMuted }]}>
                      {new Date(job.createdAt).toLocaleDateString()}
                    </Text>
                    {job.serviceType.toLowerCase().includes('emergency') && (
                      <View style={[styles.urgencyBadge, { backgroundColor: colors.error + '20' }]}>
                        <Icons.AlertTriangle size={12} color={colors.error} />
                        <Text style={[styles.urgencyText, { color: colors.error }]}>Emergency</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={[styles.productionInfo, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.productionInfoTitle, { color: colors.text }]}>Environment</Text>
          <Text style={[styles.productionInfoText, { color: colors.textMuted }]}>
            Mechanic: {user ? `${user.firstName} ${user.lastName}` : 'Unknown'}
          </Text>
          <Text style={[styles.productionInfoText, { color: colors.textMuted }]}>
            Total Jobs: {mechanicJobs.length}
          </Text>
          <Text style={[styles.productionInfoText, { color: colors.textMuted }]}>System Status: Live</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  productionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  productionBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  logoutButton: {
    padding: 8,
  },
  statsSection: {
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
  performanceSection: {
    marginBottom: 24,
  },
  performanceGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  performanceCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  performanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  performanceTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  performanceValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  performanceSubtext: {
    fontSize: 12,
  },
  quickActionsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '48%',
    minHeight: 80,
    justifyContent: 'center',
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  recentJobsSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyJobs: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 12,
    borderWidth: 1,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 12,
    textAlign: 'center',
  },
  jobsList: {
    gap: 12,
  },
  jobCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  jobStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  jobStatusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  jobDescription: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  jobMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobDate: {
    fontSize: 12,
  },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  urgencyText: {
    fontSize: 10,
    fontWeight: '600',
  },
  productionInfo: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 20,
  },
  productionInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  productionInfoText: {
    fontSize: 12,
    marginBottom: 4,
  },
});
