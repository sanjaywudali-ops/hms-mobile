import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, Dimensions,
} from 'react-native';
import {useQuery} from '@tanstack/react-query';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {COLORS, FONTS, SPACING, RADIUS, SHADOW} from '../../constants/theme';
import {api} from '../../constants/api';
import {instance} from '../../services/axios';
import {useAuth} from '../../services/AuthContext';
import {LoadingScreen, StatCard, Card, SectionHeader} from '../../components/common';

const {width} = Dimensions.get('window');

function useAllCounts() {
  return useQuery({
    queryKey: ['all-counts'],
    queryFn: async () => {
      const res = await instance.get(api.getAllCounts);
      return res.data.data;
    },
    staleTime: 60000,
  });
}

export default function DashboardScreen({navigation}: any) {
  const {user} = useAuth();
  const insets = useSafeAreaInsets();
  const {data: counts, isLoading, refetch, isRefetching} = useAllCounts();

  if (isLoading) return <LoadingScreen message="Loading dashboard..." />;

  const opd = counts?.appointments || {};
  const ipd = counts?.admissions || {};

  const quickActions = [
    {label: 'Book Appt.', icon: 'calendar-plus', screen: 'OutPatient', color: COLORS.primary, bg: COLORS.primaryLight},
    {label: 'Admit Patient', icon: 'bed-plus', screen: 'InPatient', color: COLORS.success, bg: COLORS.successLight},
    {label: 'Lab Orders', icon: 'flask-outline', screen: 'Laboratory', color: COLORS.purple, bg: '#f5f3ff'},
    {label: 'Pharmacy', icon: 'pill', screen: 'Pharmacy', color: COLORS.orange, bg: '#fff7ed'},
  ];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{paddingBottom: SPACING.xxl, paddingTop: insets.top}}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary} />}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Icon name="menu" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={{flex: 1, marginLeft: SPACING.md}}>
          <Text style={styles.greeting}>Good {getGreeting()},</Text>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
        </View>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user?.role || 'Staff'}</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <SectionHeader title="Quick Actions" />
        <View style={styles.quickRow}>
          {quickActions.map(action => (
            <TouchableOpacity
              key={action.label}
              style={[styles.quickCard, {backgroundColor: action.bg}]}
              onPress={() => navigation.navigate(action.screen)}>
              <View style={[styles.quickIcon, {backgroundColor: action.color + '22'}]}>
                <Icon name={action.icon} size={22} color={action.color} />
              </View>
              <Text style={[styles.quickLabel, {color: action.color}]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* OPD Overview */}
      <View style={styles.section}>
        <SectionHeader
          title="Outpatient Overview"
          action={{label: 'View All', onPress: () => navigation.navigate('OutPatient')}}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginHorizontal: -SPACING.base}}>
          <View style={styles.statsRow}>
            <StatCard label="Today's Appts" value={opd.total || 0} iconName="calendar-today" color={COLORS.primary} bgColor={COLORS.primaryLight} />
            <StatCard label="In Progress" value={opd.inProgress || 0} iconName="clock-outline" color={COLORS.warning} bgColor={COLORS.warningLight} />
            <StatCard label="Confirmed" value={opd.confirmed || 0} iconName="check-circle-outline" color={COLORS.success} bgColor={COLORS.successLight} />
            <StatCard label="Completed" value={opd.completed || 0} iconName="check-all" color={COLORS.secondary} bgColor={COLORS.borderLight} />
            <StatCard label="Cancelled" value={opd.cancelled || 0} iconName="close-circle-outline" color={COLORS.error} bgColor={COLORS.errorLight} />
          </View>
        </ScrollView>
      </View>

      {/* IPD Overview */}
      <View style={styles.section}>
        <SectionHeader
          title="Inpatient Overview"
          action={{label: 'View All', onPress: () => navigation.navigate('InPatient')}}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginHorizontal: -SPACING.base}}>
          <View style={styles.statsRow}>
            <StatCard label="Today's Admissions" value={ipd.total || 0} iconName="bed-outline" color={COLORS.primary} bgColor={COLORS.primaryLight} />
            <StatCard label="Admitted" value={ipd.admitted || 0} iconName="hospital-building" color={COLORS.warning} bgColor={COLORS.warningLight} />
            <StatCard label="Planned" value={ipd.planned || 0} iconName="calendar-clock" color={COLORS.success} bgColor={COLORS.successLight} />
            <StatCard label="Discharge Started" value={ipd.dischargeStarted || 0} iconName="exit-run" color={COLORS.orange} bgColor={'#fff7ed'} />
            <StatCard label="Discharged" value={ipd.discharged || 0} iconName="home-outline" color={COLORS.secondary} bgColor={COLORS.borderLight} />
          </View>
        </ScrollView>
      </View>

      {/* Navigation shortcuts */}
      <View style={styles.section}>
        <SectionHeader title="Modules" />
        <View style={styles.moduleGrid}>
          {[
            {label: 'Patient History', icon: 'history', screen: 'PatientHistoryNav', color: COLORS.primary},
            {label: 'Doctor Portal', icon: 'stethoscope', screen: 'DoctorDashboard', color: COLORS.success},
            {label: 'Staff Registry', icon: 'badge-account-outline', screen: 'Staff', color: COLORS.purple},
            {label: 'Room Management', icon: 'door-open', screen: 'Rooms', color: COLORS.orange},
          ].map(mod => (
            <TouchableOpacity
              key={mod.label}
              style={styles.moduleCard}
              onPress={() => navigation.navigate(mod.screen)}>
              <Icon name={mod.icon} size={28} color={mod.color} />
              <Text style={styles.moduleLabel}>{mod.label}</Text>
              <Icon name="chevron-right" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: COLORS.background},
  header: {
    flexDirection: 'row', alignItems: 'center',
    padding: SPACING.base, paddingTop: SPACING.md,
    backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  greeting: {fontSize: FONTS.sizes.sm, color: COLORS.textSecondary},
  userName: {fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: COLORS.text},
  roleBadge: {
    backgroundColor: COLORS.primaryLight, paddingHorizontal: SPACING.sm, paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  roleText: {fontSize: FONTS.sizes.xs, color: COLORS.primary, fontWeight: FONTS.weights.semibold},
  section: {padding: SPACING.base, paddingBottom: 0},
  statsRow: {flexDirection: 'row', paddingHorizontal: SPACING.base, gap: SPACING.xs},
  quickRow: {flexDirection: 'row', gap: SPACING.sm},
  quickCard: {
    flex: 1, alignItems: 'center', padding: SPACING.md,
    borderRadius: RADIUS.lg, ...SHADOW.sm,
  },
  quickIcon: {
    width: 44, height: 44, borderRadius: RADIUS.md,
    justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.xs,
  },
  quickLabel: {fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.semibold, textAlign: 'center'},
  moduleGrid: {gap: SPACING.sm},
  moduleCard: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    backgroundColor: COLORS.white, padding: SPACING.base,
    borderRadius: RADIUS.lg, ...SHADOW.sm,
  },
  moduleLabel: {flex: 1, fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.medium, color: COLORS.text},
});
