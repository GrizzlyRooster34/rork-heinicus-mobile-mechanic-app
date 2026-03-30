import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, Alert, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/colors';
import { Button } from '@/components/Button';
import { useAuthStore } from '@/stores/auth-store';
import { trpc } from '@/lib/trpc';
import { VehicleType } from '@/types/service';
import * as Icons from 'lucide-react-native';

export default function CustomerProfileScreen() {
  const { user, logout, setUser } = useAuthStore();
  const utils = trpc.useUtils();
  const { data: profileData, isLoading } = trpc.customer.getProfile.useQuery(undefined, {
    enabled: !!user,
  });
  const updateProfileMutation = trpc.customer.updateProfile.useMutation();
  const addVehicleMutation = trpc.customer.addVehicle.useMutation();
  const removeVehicleMutation = trpc.customer.removeVehicle.useMutation();

  const profile = profileData?.profile;
  const vehicles = profile?.vehicles ?? [];

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [address, setAddress] = useState('');

  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleYear, setVehicleYear] = useState('');
  const [vehicleMileage, setVehicleMileage] = useState('');
  const [vehicleLicensePlate, setVehicleLicensePlate] = useState('');
  const [vehicleVin, setVehicleVin] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('car');

  const mapVehicleType = (value: string): VehicleType => {
    switch (value) {
      case 'MOTORCYCLE':
        return 'motorcycle';
      case 'SCOOTER':
        return 'scooter';
      case 'CAR':
      default:
        return 'car';
    }
  };

  const vehicleTypeLabel = (type: VehicleType) => {
    switch (type) {
      case 'motorcycle':
        return 'Motorcycle';
      case 'scooter':
        return 'Scooter';
      case 'car':
      default:
        return 'Car/Truck';
    }
  };

  useEffect(() => {
    if (!profile) {
      return;
    }

    setFirstName(profile.firstName || '');
    setLastName(profile.lastName || '');
    setPhone(profile.phone || '');
    setEmail(profile.email || '');
    setAddress(profile.address || '');
  }, [profile]);

  const handleSaveContact = async () => {
    if (!firstName.trim() || !lastName.trim() || !phone.trim() || !email.trim()) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    try {
      const result = await updateProfileMutation.mutateAsync({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim() || undefined,
      });

      if (user) {
        setUser({
          ...user,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          email: result.user.email,
          phone: result.user.phone ?? undefined,
          role: result.user.role.toLowerCase() as 'customer' | 'mechanic' | 'admin',
        });
      }

      await utils.customer.getProfile.invalidate();
      Alert.alert('Success', 'Contact information saved.');
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to save contact information.');
    }
  };

  const handleAddVehicle = async () => {
    if (!vehicleMake.trim() || !vehicleModel.trim() || !vehicleYear.trim()) {
      Alert.alert('Error', 'Please fill in make, model, and year.');
      return;
    }

    const year = parseInt(vehicleYear, 10);
    if (Number.isNaN(year) || year < 1900 || year > new Date().getFullYear() + 1) {
      Alert.alert('Error', 'Please enter a valid year.');
      return;
    }

    const parsedMileage = vehicleMileage.trim() ? parseInt(vehicleMileage.trim(), 10) : 0;
    if (Number.isNaN(parsedMileage) || parsedMileage < 0) {
      Alert.alert('Error', 'Please enter a valid mileage.');
      return;
    }

    try {
      await addVehicleMutation.mutateAsync({
        make: vehicleMake.trim(),
        model: vehicleModel.trim(),
        year,
        vehicleType,
        mileage: parsedMileage,
        licensePlate: vehicleLicensePlate.trim() || undefined,
        vin: vehicleVin.trim() || undefined,
      });

      await utils.customer.getProfile.invalidate();

      setVehicleMake('');
      setVehicleModel('');
      setVehicleYear('');
      setVehicleMileage('');
      setVehicleLicensePlate('');
      setVehicleVin('');
      setVehicleType('car');
      setShowVehicleForm(false);

      Alert.alert('Success', 'Vehicle added to your profile.');
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to add vehicle.');
    }
  };

  const handleRemoveVehicle = (vehicleId: string) => {
    Alert.alert(
      'Remove Vehicle',
      'Are you sure you want to remove this vehicle?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeVehicleMutation.mutateAsync({ vehicleId });
              await utils.customer.getProfile.invalidate();
            } catch (error: any) {
              Alert.alert('Error', error?.message || 'Failed to remove vehicle.');
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  if (isLoading && !profile) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <View style={styles.userHeader}>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{firstName} {lastName}</Text>
            <Text style={styles.userEmail}>{email}</Text>
            <View style={styles.roleBadge}>
              <Icons.User size={12} color={Colors.primary} />
              <Text style={styles.roleText}>Customer</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Icons.LogOut size={20} color={Colors.error} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>

          <View style={styles.inputRow}>
            <View style={styles.inputHalf}>
              <Text style={styles.inputLabel}>First Name *</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="John"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
            <View style={styles.inputHalf}>
              <Text style={styles.inputLabel}>Last Name *</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Doe"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="(555) 123-4567"
              placeholderTextColor={Colors.textMuted}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address *</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="john@example.com"
              placeholderTextColor={Colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Address</Text>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="123 Main St, City, State"
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          <Button
            title={updateProfileMutation.isPending ? 'Saving...' : 'Save Contact Info'}
            onPress={handleSaveContact}
            style={styles.saveButton}
            disabled={updateProfileMutation.isPending}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Vehicles</Text>
            <Button
              title="Add Vehicle"
              variant="outline"
              size="small"
              onPress={() => setShowVehicleForm(true)}
            />
          </View>

          {vehicles.length === 0 ? (
            <View style={styles.emptyVehicles}>
              <Icons.Car size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No vehicles added yet</Text>
              <Text style={styles.emptySubtext}>
                Add your vehicle information to help us provide better service
              </Text>
            </View>
          ) : (
            <View style={styles.vehiclesList}>
              {vehicles.map((vehicle) => (
                <View key={vehicle.id} style={styles.vehicleCard}>
                  <View style={styles.vehicleInfo}>
                    <Text style={styles.vehicleTitle}>
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </Text>
                    <Text style={styles.vehicleDetail}>
                      Type: {vehicleTypeLabel(mapVehicleType(vehicle.vehicleType))}
                    </Text>
                    {vehicle.vin && (
                      <Text style={styles.vehicleDetail}>VIN: {vehicle.vin}</Text>
                    )}
                    {vehicle.licensePlate && (
                      <Text style={styles.vehicleDetail}>Plate: {vehicle.licensePlate}</Text>
                    )}
                    {typeof vehicle.mileage === 'number' && (
                      <Text style={styles.vehicleDetail}>Mileage: {vehicle.mileage.toLocaleString()}</Text>
                    )}
                  </View>
                  <Button
                    title="Remove"
                    variant="outline"
                    size="small"
                    onPress={() => handleRemoveVehicle(vehicle.id)}
                    textStyle={{ color: Colors.error }}
                    style={{ borderColor: Colors.error }}
                    disabled={removeVehicleMutation.isPending}
                  />
                </View>
              ))}
            </View>
          )}

          {showVehicleForm && (
            <View style={styles.vehicleForm}>
              <Text style={styles.formTitle}>Add New Vehicle</Text>

              <View style={styles.inputRow}>
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>Make *</Text>
                  <TextInput
                    style={styles.input}
                    value={vehicleMake}
                    onChangeText={setVehicleMake}
                    placeholder="Toyota"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>Model *</Text>
                  <TextInput
                    style={styles.input}
                    value={vehicleModel}
                    onChangeText={setVehicleModel}
                    placeholder="Camry"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
              </View>

              <View style={styles.inputRow}>
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>Year *</Text>
                  <TextInput
                    style={styles.input}
                    value={vehicleYear}
                    onChangeText={setVehicleYear}
                    placeholder="2020"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>Mileage</Text>
                  <TextInput
                    style={styles.input}
                    value={vehicleMileage}
                    onChangeText={setVehicleMileage}
                    placeholder="50000"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Vehicle Type</Text>
                <View style={styles.vehicleTypeButtons}>
                  {(['car', 'motorcycle', 'scooter'] as VehicleType[]).map((type) => (
                    <Button
                      key={type}
                      title={vehicleTypeLabel(type)}
                      size="small"
                      variant={vehicleType === type ? 'primary' : 'outline'}
                      onPress={() => setVehicleType(type)}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>License Plate</Text>
                <TextInput
                  style={styles.input}
                  value={vehicleLicensePlate}
                  onChangeText={setVehicleLicensePlate}
                  placeholder="ABC1234"
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>VIN</Text>
                <TextInput
                  style={styles.input}
                  value={vehicleVin}
                  onChangeText={setVehicleVin}
                  placeholder="17-character VIN"
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.formActions}>
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={() => setShowVehicleForm(false)}
                  style={styles.formButton}
                  disabled={addVehicleMutation.isPending}
                />
                <Button
                  title={addVehicleMutation.isPending ? 'Adding...' : 'Add Vehicle'}
                  onPress={handleAddVehicle}
                  style={styles.formButton}
                  disabled={addVehicleMutation.isPending}
                />
              </View>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '20',
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    gap: 4,
  },
  roleText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  logoutButton: {
    padding: 8,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  inputHalf: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    color: Colors.text,
    fontSize: 16,
  },
  saveButton: {
    marginTop: 8,
  },
  emptyVehicles: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  vehiclesList: {
    gap: 12,
  },
  vehicleCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  vehicleDetail: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  vehicleForm: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  formButton: {
    flex: 1,
  },
  vehicleTypeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
});
