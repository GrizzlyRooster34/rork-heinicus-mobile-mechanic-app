import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuthStore } from '@/stores/auth-store';
import { Colors } from '@/constants/colors';
import * as Icons from 'lucide-react-native';

export default function MechanicSelfSwitch() {
  const { user, setUser } = useAuthStore();

  if (!user || !['admin', 'mechanic'].includes(user.role)) {
    return null;
  }

  const canSwitchRoles = user.id === 'admin-cody' || user.id === 'mechanic-cody' || 
                        user.id === 'admin-dev-id' || user.id === 'mechanic-dev-id';

  if (!canSwitchRoles) {
    return null;
  }

  const currentRole = user.role;
  const nextRole = currentRole === 'admin' ? 'mechanic' : 'admin';

  const handleRoleSwitch = () => {
    const switchedUser = {
      ...user,
      role: nextRole as 'admin' | 'mechanic',
      id: nextRole === 'admin' ? 
          (user.id.includes('dev') ? 'admin-dev-id' : 'admin-cody') : 
          (user.id.includes('dev') ? 'mechanic-dev-id' : 'mechanic-cody'),
    };

    console.log('Role switch:', {
      from: currentRole,
      to: nextRole,
      userId: switchedUser.id,
      timestamp: new Date().toISOString(),
    });

    setUser(switchedUser);
  };

  const getRoleIcon = (role: string) => {
    return role === 'admin' ? 'Shield' : 'Wrench';
  };

  const getRoleColor = (role: string) => {
    return role === 'admin' ? Colors.primary : Colors.mechanic;
  };

  const CurrentRoleIcon = Icons[getRoleIcon(currentRole) as keyof typeof Icons] as any;
  const NextRoleIcon = Icons[getRoleIcon(nextRole) as keyof typeof Icons] as any;

  return (
    <View style={styles.container}>
      <View style={styles.currentRole}>
        <CurrentRoleIcon size={16} color={getRoleColor(currentRole)} />
        <Text style={[styles.roleText, { color: getRoleColor(currentRole) }]}>
          {currentRole.charAt(0).toUpperCase() + currentRole.slice(1)} Mode
        </Text>
      </View>

      <TouchableOpacity style={styles.switchButton} onPress={handleRoleSwitch}>
        <Icons.RefreshCw size={16} color={Colors.textSecondary} />
        <Text style={styles.switchText}>Switch to {nextRole}</Text>
        <NextRoleIcon size={16} color={getRoleColor(nextRole)} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 12,
    margin: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  currentRole: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 8,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.background,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  switchText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});