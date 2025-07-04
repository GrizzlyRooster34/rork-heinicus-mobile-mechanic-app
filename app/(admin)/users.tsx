import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { Colors } from '@/constants/colors';
import { useAuthStore } from '@/stores/auth-store';
import { User } from '@/types/auth';
import * as Icons from 'lucide-react-native';

export default function AdminUsersScreen() {
  const { user, getAllUsers, updateUserRole } = useAuthStore();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);

  const allUsers = getAllUsers();

  const handleRoleChange = async (userId: string, newRole: 'customer' | 'mechanic' | 'admin') => {
    const success = await updateUserRole(userId, newRole);
    if (success) {
      Alert.alert('Success', 'User role updated successfully');
      setShowRoleModal(false);
      setSelectedUser(null);
    } else {
      Alert.alert('Error', 'Failed to update user role');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return Colors.error;
      case 'mechanic': return Colors.mechanic;
      case 'customer': return Colors.primary;
      default: return Colors.textMuted;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Icons.Shield size={16} color={getRoleColor(role)} />;
      case 'mechanic': return <Icons.Wrench size={16} color={getRoleColor(role)} />;
      case 'customer': return <Icons.User size={16} color={getRoleColor(role)} />;
      default: return <Icons.User size={16} color={getRoleColor(role)} />;
    }
  };

  if (user?.role !== 'admin') {
    return (
      <View style={styles.unauthorizedContainer}>
        <Icons.Shield size={64} color={Colors.error} />
        <Text style={styles.unauthorizedTitle}>Access Denied</Text>
        <Text style={styles.unauthorizedText}>
          You do not have permission to manage users.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>User Management</Text>
        <Text style={styles.headerSubtitle}>
          Manage user roles and permissions
        </Text>
      </View>

      <ScrollView style={styles.usersList} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {allUsers.map((userData) => (
            <View key={userData.id} style={styles.userCard}>
              <View style={styles.userInfo}>
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarText}>
                    {userData.firstName?.[0]}{userData.lastName?.[0]}
                  </Text>
                </View>
                
                <View style={styles.userDetails}>
                  <Text style={styles.userName}>
                    {userData.firstName} {userData.lastName}
                  </Text>
                  <Text style={styles.userEmail}>{userData.email}</Text>
                  <Text style={styles.userDate}>
                    Joined {userData.createdAt.toLocaleDateString()}
                  </Text>
                </View>
              </View>

              <View style={styles.userActions}>
                <View style={[
                  styles.roleBadge,
                  { backgroundColor: getRoleColor(userData.role) + '20' }
                ]}>
                  {getRoleIcon(userData.role)}
                  <Text style={[
                    styles.roleText,
                    { color: getRoleColor(userData.role) }
                  ]}>
                    {userData.role}
                  </Text>
                </View>

                {userData.id !== user.id && (
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => {
                      setSelectedUser(userData);
                      setShowRoleModal(true);
                    }}
                  >
                    <Icons.Edit2 size={16} color={Colors.primary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Role Change Modal */}
      <Modal
        visible={showRoleModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowRoleModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Change User Role</Text>
            <TouchableOpacity onPress={() => setShowRoleModal(false)}>
              <Icons.X size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {selectedUser && (
            <View style={styles.modalContent}>
              <View style={styles.selectedUserInfo}>
                <Text style={styles.selectedUserName}>
                  {selectedUser.firstName} {selectedUser.lastName}
                </Text>
                <Text style={styles.selectedUserEmail}>{selectedUser.email}</Text>
                <Text style={styles.currentRole}>
                  Current role: {selectedUser.role}
                </Text>
              </View>

              <Text style={styles.roleSelectionTitle}>Select new role:</Text>
              
              <View style={styles.roleOptions}>
                {['customer', 'mechanic', 'admin'].map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={[
                      styles.roleOption,
                      selectedUser.role === role && styles.currentRoleOption
                    ]}
                    onPress={() => {
                      if (role !== selectedUser.role) {
                        Alert.alert(
                          'Confirm Role Change',
                          `Change ${selectedUser.firstName} ${selectedUser.lastName} from ${selectedUser.role} to ${role}?`,
                          [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Confirm',
                              onPress: () => handleRoleChange(selectedUser.id, role as any)
                            }
                          ]
                        );
                      }
                    }}
                    disabled={selectedUser.role === role}
                  >
                    <View style={styles.roleOptionContent}>
                      {getRoleIcon(role)}
                      <Text style={[
                        styles.roleOptionText,
                        { color: getRoleColor(role) }
                      ]}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </Text>
                    </View>
                    {selectedUser.role === role && (
                      <Icons.Check size={20} color={Colors.success} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
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
  usersList: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  userCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  userDate: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  userActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  editButton: {
    padding: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  modalContent: {
    padding: 20,
  },
  selectedUserInfo: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedUserName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  selectedUserEmail: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  currentRole: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  roleSelectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  roleOptions: {
    gap: 12,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  currentRoleOption: {
    opacity: 0.5,
  },
  roleOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  roleOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
});