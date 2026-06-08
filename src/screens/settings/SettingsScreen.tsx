import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {COLORS, FONTS, SPACING, RADIUS, SHADOW} from '../../constants/theme';
import {useAuth} from '../../services/AuthContext';

interface SettingRow {
  icon: string;
  label: string;
  sublabel?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  color?: string;
}

const SettingItem: React.FC<SettingRow> = ({icon, label, sublabel, onPress, rightElement, color}) => (
  <TouchableOpacity
    style={styles.settingRow}
    onPress={onPress}
    disabled={!onPress}
    activeOpacity={onPress ? 0.7 : 1}>
    <View style={[styles.settingIcon, {backgroundColor: (color || COLORS.primary) + '18'}]}>
      <Icon name={icon} size={20} color={color || COLORS.primary} />
    </View>
    <View style={{flex: 1}}>
      <Text style={styles.settingLabel}>{label}</Text>
      {sublabel ? <Text style={styles.settingSub}>{sublabel}</Text> : null}
    </View>
    {rightElement || (onPress ? <Icon name="chevron-right" size={18} color={COLORS.textMuted} /> : null)}
  </TouchableOpacity>
);

const SectionHeader: React.FC<{title: string}> = ({title}) => (
  <Text style={styles.sectionHeader}>{title}</Text>
);

export default function SettingsScreen({navigation}: any) {
  const {user, logout} = useAuth();
  const insets = useSafeAreaInsets();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Sign Out', style: 'destructive', onPress: logout},
    ]);
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{paddingBottom: SPACING.xxxl + insets.bottom}}>

      {/* Profile Hero */}
      <View style={styles.profileHero}>
        <View style={styles.profileAvatar}>
          <Text style={styles.profileInitial}>
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </Text>
        </View>
        <View>
          <Text style={styles.profileName}>{user?.name || 'User'}</Text>
          <Text style={styles.profileRole}>{user?.role || 'Staff'}</Text>
          {user?.adminCode && <Text style={styles.profileCode}>{user.adminCode}</Text>}
          {user?.doctorCode && <Text style={styles.profileCode}>{user.doctorCode}</Text>}
        </View>
      </View>

      {/* Account */}
      <SectionHeader title="Account" />
      <View style={styles.section}>
        <SettingItem
          icon="account-outline"
          label="My Profile"
          sublabel="View and edit profile information"
          onPress={() => {}}
        />
        <View style={styles.divider} />
        <SettingItem
          icon="lock-reset"
          label="Change Password"
          sublabel="Update your account password"
          onPress={() => {}}
        />
        <View style={styles.divider} />
        <SettingItem
          icon="shield-account-outline"
          label="Role & Permissions"
          sublabel={user?.role || '—'}
        />
      </View>

      {/* Navigation */}
      <SectionHeader title="Navigation" />
      <View style={styles.section}>
        <SettingItem icon="view-dashboard-outline" label="Dashboard" onPress={() => navigation.navigate('Home')} />
        <View style={styles.divider} />
        <SettingItem icon="bed-outline" label="In-Patients" onPress={() => navigation.navigate('InPatient')} />
        <View style={styles.divider} />
        <SettingItem icon="calendar-check-outline" label="Out-Patients" onPress={() => navigation.navigate('OutPatient')} />
        <View style={styles.divider} />
        <SettingItem icon="stethoscope" label="Doctor Portal" onPress={() => navigation.navigate('DoctorDashboard')} />
        <View style={styles.divider} />
        <SettingItem icon="flask-outline" label="Laboratory" onPress={() => navigation.navigate('Home', {screen: 'Laboratory'})} />
        <View style={styles.divider} />
        <SettingItem icon="pill" label="Pharmacy" onPress={() => navigation.navigate('Home', {screen: 'Pharmacy'})} />
        <View style={styles.divider} />
        <SettingItem icon="history" label="Patient History" onPress={() => navigation.navigate('PatientHistoryNav')} />
        <View style={styles.divider} />
        <SettingItem icon="badge-account-outline" label="Staff Registry" onPress={() => navigation.navigate('Staff')} />
        <View style={styles.divider} />
        <SettingItem icon="door-open" label="Room Management" onPress={() => navigation.navigate('Rooms')} />
      </View>

      {/* App Info */}
      <SectionHeader title="App Information" />
      <View style={styles.section}>
        <SettingItem icon="information-outline" label="Version" sublabel="1.0.0" />
        <View style={styles.divider} />
        <SettingItem icon="hospital-box-outline" label="HMS Mobile" sublabel="Hospital Management System" />
      </View>

      {/* Sign Out */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Icon name="logout" size={20} color={COLORS.error} />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: COLORS.background},
  profileHero: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.base,
    backgroundColor: COLORS.primary, padding: SPACING.xl, paddingTop: SPACING.xxl,
  },
  profileAvatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center', alignItems: 'center',
  },
  profileInitial: {fontSize: 28, color: COLORS.white, fontWeight: FONTS.weights.bold},
  profileName: {fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, color: COLORS.white},
  profileRole: {fontSize: FONTS.sizes.sm, color: 'rgba(255,255,255,0.8)', marginTop: 2},
  profileCode: {fontSize: FONTS.sizes.xs, color: 'rgba(255,255,255,0.6)', marginTop: 1},
  sectionHeader: {
    fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.bold,
    color: COLORS.textMuted, textTransform: 'uppercase',
    letterSpacing: 0.8, paddingHorizontal: SPACING.base,
    paddingTop: SPACING.lg, paddingBottom: SPACING.xs,
  },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    marginHorizontal: SPACING.base,
    ...SHADOW.sm,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    paddingHorizontal: SPACING.base, paddingVertical: SPACING.md,
  },
  settingIcon: {
    width: 36, height: 36, borderRadius: RADIUS.sm,
    justifyContent: 'center', alignItems: 'center',
  },
  settingLabel: {fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.medium, color: COLORS.text},
  settingSub: {fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginTop: 2},
  divider: {height: 1, backgroundColor: COLORS.borderLight, marginLeft: SPACING.base + 36 + SPACING.md},
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, margin: SPACING.base, marginTop: SPACING.lg,
    backgroundColor: COLORS.errorLight, padding: SPACING.md,
    borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.error + '30',
  },
  logoutText: {fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.semibold, color: COLORS.error},
});
