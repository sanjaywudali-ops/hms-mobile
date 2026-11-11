import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useQuery} from '@tanstack/react-query';
import {COLORS, FONTS, SPACING, RADIUS, SHADOW} from '../../constants/theme';
import {useAuth} from '../../services/AuthContext';
import {LoadingScreen, StatCard, SectionHeader} from '../../components/common';
import {instance} from '../../services/axios';
import {api} from '../../constants/api';

// ─── Admin Dashboard ──────────────────────────────────────────────────────────
export default function AdminDashboardScreen({navigation}: any) {
  const {user} = useAuth();
  const insets = useSafeAreaInsets();

  const {data: counts, isLoading, refetch, isRefetching} = useQuery({
    queryKey: ['admin-counts'],
    queryFn: async () => {
      const res = await instance.get(api.getAllCounts);
      return res.data.data;
    },
    staleTime: 60000,
  });

  if (isLoading) return <LoadingScreen message="Loading admin dashboard..." />;

  const opd = counts?.appointments || {};
  const ipd = counts?.admissions   || {};

  const quickActions = [
    {label: 'New Appointment', icon: 'calendar-plus',         screen: 'AdminCreateAppointment', color: COLORS.primary,  bg: COLORS.primaryLight},
    {label: 'Admit Patient',   icon: 'bed-plus',              screen: 'InPatient',              color: COLORS.success,  bg: COLORS.successLight},
    {label: 'All Appointments',icon: 'calendar-clock-outline', screen: 'AdminAppointments',      color: COLORS.warning,  bg: COLORS.warningLight},
    {label: 'Doctor Portal',   icon: 'stethoscope',           screen: 'DoctorPortal',        color: '#6D28D9',       bg: '#EDE9FE'},
  ];

  const modules = [
    {label: 'Appointments',    icon: 'calendar-clock-outline', screen: 'AdminAppointments',  color: COLORS.warning},
    {label: 'Out-Patients',    icon: 'calendar-account-outline',screen: 'OutPatient',         color: COLORS.primary},
    {label: 'In-Patients',     icon: 'bed-outline',            screen: 'InPatient',          color: COLORS.success},
    {label: 'Doctor Portal',   icon: 'stethoscope',            screen: 'DoctorPortal',    color: '#6D28D9'},
    {label: 'Patient History', icon: 'history',                screen: 'PatientHistoryNav',  color: COLORS.secondary},
    {label: 'Staff Registry',  icon: 'badge-account-outline',  screen: 'Staff',              color: COLORS.orange},
    {label: 'Room Management', icon: 'door-open',              screen: 'Rooms',              color: '#0369A1'},
  ];

  return (
    <View style={s.screen}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} translucent={false} />
      <ScrollView
        contentContainerStyle={{paddingBottom: insets.bottom + SPACING.xxl}}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.white} />}
        showsVerticalScrollIndicator={false}>

        {/* ── Hero Header ── */}
        <View style={[s.hero, {paddingTop: insets.top + SPACING.md}]}>
          <View style={s.heroRow}>
            <TouchableOpacity onPress={() => navigation.openDrawer()} style={s.menuBtn}>
              <Icon name="menu" size={24} color={COLORS.white} />
            </TouchableOpacity>
            <View style={{flex: 1, marginLeft: SPACING.md}}>
              <Text style={s.heroGreeting}>Admin Portal</Text>
              <Text style={s.heroName}>{user?.name || 'Administrator'}</Text>
            </View>
            <View style={s.roleBadge}>
              <Icon name="shield-crown-outline" size={12} color={COLORS.white} />
              <Text style={s.roleText}>Admin</Text>
            </View>
          </View>

          {/* ── Top stat row ── */}
          <View style={s.heroStats}>
            <HeroStat label="Total OPD" value={opd.total || 0} icon="calendar-today" />
            <View style={s.heroStatDivider} />
            <HeroStat label="Total IPD" value={ipd.total || 0} icon="bed-outline" />
            <View style={s.heroStatDivider} />
            <HeroStat label="Completed" value={(opd.completed || 0) + (ipd.discharged || 0)} icon="check-all" />
          </View>
        </View>

        {/* ── Quick Actions ── */}
        <View style={s.section}>
          <SectionHeader title="Quick Actions" />
          <View style={s.quickGrid}>
            {quickActions.map(action => (
              <TouchableOpacity
                key={action.label}
                style={[s.quickCard, {backgroundColor: action.bg}]}
                onPress={() => navigation.navigate(action.screen)}>
                <View style={[s.quickIcon, {backgroundColor: action.color + '22'}]}>
                  <Icon name={action.icon} size={22} color={action.color} />
                </View>
                <Text style={[s.quickLabel, {color: action.color}]}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── OPD Overview ── */}
        <View style={s.section}>
          <SectionHeader
            title="Outpatient Overview"
            action={{label: 'View All', onPress: () => navigation.navigate('OutPatient')}}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginHorizontal: -SPACING.base}}>
            <View style={s.statsRow}>
              <StatCard label="Total"       value={opd.total     || 0} iconName="calendar-today"       color={COLORS.primary} bgColor={COLORS.primaryLight} />
              <StatCard label="In Progress" value={opd.inProgress|| 0} iconName="clock-outline"        color={COLORS.warning} bgColor={COLORS.warningLight} />
              <StatCard label="Confirmed"   value={opd.confirmed || 0} iconName="check-circle-outline" color={COLORS.success} bgColor={COLORS.successLight} />
              <StatCard label="Completed"   value={opd.completed || 0} iconName="check-all"            color={COLORS.secondary} bgColor={COLORS.borderLight} />
              <StatCard label="Cancelled"   value={opd.cancelled || 0} iconName="close-circle-outline" color={COLORS.error}   bgColor={COLORS.errorLight} />
            </View>
          </ScrollView>
        </View>

        {/* ── IPD Overview ── */}
        <View style={s.section}>
          <SectionHeader
            title="Inpatient Overview"
            action={{label: 'View All', onPress: () => navigation.navigate('InPatient')}}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginHorizontal: -SPACING.base}}>
            <View style={s.statsRow}>
              <StatCard label="Total"            value={ipd.total           || 0} iconName="bed-outline"     color={COLORS.primary}   bgColor={COLORS.primaryLight} />
              <StatCard label="Admitted"         value={ipd.admitted        || 0} iconName="hospital-building" color={COLORS.warning} bgColor={COLORS.warningLight} />
              <StatCard label="Planned"          value={ipd.planned         || 0} iconName="calendar-clock"  color={COLORS.success}   bgColor={COLORS.successLight} />
              <StatCard label="Discharge Started"value={ipd.dischargeStarted|| 0} iconName="exit-run"        color={COLORS.orange}    bgColor={'#fff7ed'} />
              <StatCard label="Discharged"       value={ipd.discharged      || 0} iconName="home-outline"    color={COLORS.secondary} bgColor={COLORS.borderLight} />
            </View>
          </ScrollView>
        </View>

        {/* ── Modules ── */}
        <View style={s.section}>
          <SectionHeader title="Modules" />
          <View style={s.moduleGrid}>
            {modules.map(mod => (
              <TouchableOpacity
                key={mod.label}
                style={s.moduleCard}
                onPress={() => navigation.navigate(mod.screen)}>
                <View style={[s.moduleIcon, {backgroundColor: mod.color + '18'}]}>
                  <Icon name={mod.icon} size={22} color={mod.color} />
                </View>
                <Text style={s.moduleLabel}>{mod.label}</Text>
                <Icon name="chevron-right" size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

// ─── Hero Stat Mini Card ──────────────────────────────────────────────────────
function HeroStat({label, value, icon}: {label: string; value: number; icon: string}) {
  return (
    <View style={s.heroStat}>
      <Icon name={icon} size={18} color="rgba(255,255,255,0.85)" />
      <Text style={s.heroStatValue}>{value}</Text>
      <Text style={s.heroStatLabel}>{label}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  screen:          {flex: 1, backgroundColor: COLORS.background},

  // Hero
  hero:            {backgroundColor: COLORS.primary, paddingHorizontal: SPACING.base, paddingBottom: SPACING.xl},
  heroRow:         {flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.lg},
  menuBtn:         {padding: 4},
  heroGreeting:    {fontSize: FONTS.sizes.xs, color: 'rgba(255,255,255,0.75)'},
  heroName:        {fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, color: COLORS.white},
  roleBadge:       {flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full},
  roleText:        {fontSize: FONTS.sizes.xs, color: COLORS.white, fontWeight: FONTS.weights.semibold},
  heroStats:       {flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: RADIUS.lg, padding: SPACING.md},
  heroStat:        {flex: 1, alignItems: 'center', gap: 3},
  heroStatDivider: {width: 1, backgroundColor: 'rgba(255,255,255,0.25)'},
  heroStatValue:   {fontSize: FONTS.sizes.xl, fontWeight: FONTS.weights.bold, color: COLORS.white},
  heroStatLabel:   {fontSize: FONTS.sizes.xs, color: 'rgba(255,255,255,0.75)', textAlign: 'center'},

  // Sections
  section:         {padding: SPACING.base, paddingBottom: 0},
  statsRow:        {flexDirection: 'row', paddingHorizontal: SPACING.base, gap: SPACING.xs},

  // Quick actions
  quickGrid:       {flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm},
  quickCard:       {width: '47%', alignItems: 'center', padding: SPACING.md, borderRadius: RADIUS.lg, ...SHADOW.sm},
  quickIcon:       {width: 48, height: 48, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.xs},
  quickLabel:      {fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.semibold, textAlign: 'center'},

  // Modules
  moduleGrid:      {gap: SPACING.sm},
  moduleCard:      {flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: COLORS.white, padding: SPACING.base, borderRadius: RADIUS.lg, ...SHADOW.sm},
  moduleIcon:      {width: 40, height: 40, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center'},
  moduleLabel:     {flex: 1, fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.medium, color: COLORS.text},
});