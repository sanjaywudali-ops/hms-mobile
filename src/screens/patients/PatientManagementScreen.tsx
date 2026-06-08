import React from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
import {useQuery} from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {COLORS, FONTS, SPACING, RADIUS, SHADOW} from '../../constants/theme';
import {api} from '../../constants/api';
import {instance} from '../../services/axios';
import {LoadingScreen, StatCard, SectionHeader} from '../../components/common';

export default function PatientManagementScreen({navigation}: any) {
  const insets = useSafeAreaInsets();
  const {data: counts, isLoading} = useQuery({
    queryKey: ['all-counts'],
    queryFn: async () => {
      const res = await instance.get(api.getAllCounts);
      return res.data.data;
    },
  });

  if (isLoading) return <LoadingScreen message="Loading..." />;

  const opd = counts?.appointments || {};
  const ipd = counts?.admissions || {};

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{paddingBottom: SPACING.xxl, paddingTop: insets.top}}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Icon name="menu" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={{marginLeft: SPACING.md}}>
          <Text style={styles.title}>Patient Management</Text>
          <Text style={styles.subtitle}>Overview of all patient activities</Text>
        </View>
      </View>

      {/* Nav Cards */}
      <View style={styles.section}>
        <View style={styles.navGrid}>
          <TouchableOpacity style={[styles.navCard, {borderLeftColor: COLORS.primary}]} onPress={() => navigation.navigate('InPatient')}>
            <View style={[styles.navIcon, {backgroundColor: COLORS.primaryLight}]}>
              <Icon name="bed-outline" size={28} color={COLORS.primary} />
            </View>
            <Text style={styles.navTitle}>In-Patients</Text>
            <Text style={styles.navSub}>Manage admissions & care</Text>
            <View style={styles.navCount}>
              <Text style={[styles.navCountText, {color: COLORS.primary}]}>{ipd.admitted || 0} admitted</Text>
            </View>
            <Icon name="chevron-right" size={18} color={COLORS.textMuted} style={styles.navArrow} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.navCard, {borderLeftColor: COLORS.success}]} onPress={() => navigation.navigate('OutPatient')}>
            <View style={[styles.navIcon, {backgroundColor: COLORS.successLight}]}>
              <Icon name="account-group-outline" size={28} color={COLORS.success} />
            </View>
            <Text style={styles.navTitle}>Out-Patients</Text>
            <Text style={styles.navSub}>Manage appointments & care</Text>
            <View style={styles.navCount}>
              <Text style={[styles.navCountText, {color: COLORS.success}]}>{opd.total || 0} today</Text>
            </View>
            <Icon name="chevron-right" size={18} color={COLORS.textMuted} style={styles.navArrow} />
          </TouchableOpacity>
        </View>
      </View>

      {/* OPD Stats */}
      <View style={styles.section}>
        <SectionHeader title="Outpatient Overview" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{flexDirection: 'row', gap: SPACING.xs}}>
            <StatCard label="Today's Appts" value={opd.total || 0} iconName="calendar-today" color={COLORS.primary} bgColor={COLORS.primaryLight} />
            <StatCard label="In Progress" value={opd.inProgress || 0} iconName="clock-outline" color={COLORS.warning} bgColor={COLORS.warningLight} />
            <StatCard label="Confirmed" value={opd.confirmed || 0} iconName="check-circle-outline" color={COLORS.success} bgColor={COLORS.successLight} />
            <StatCard label="Completed" value={opd.completed || 0} iconName="check-all" color={COLORS.secondary} bgColor={COLORS.borderLight} />
            <StatCard label="Cancelled" value={opd.cancelled || 0} iconName="close-circle-outline" color={COLORS.error} bgColor={COLORS.errorLight} />
          </View>
        </ScrollView>
      </View>

      {/* IPD Stats */}
      <View style={styles.section}>
        <SectionHeader title="Inpatient Overview" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{flexDirection: 'row', gap: SPACING.xs}}>
            <StatCard label="Admissions" value={ipd.total || 0} iconName="bed-outline" color={COLORS.primary} bgColor={COLORS.primaryLight} />
            <StatCard label="Admitted" value={ipd.admitted || 0} iconName="hospital-building" color={COLORS.warning} bgColor={COLORS.warningLight} />
            <StatCard label="Planned" value={ipd.planned || 0} iconName="calendar-clock" color={COLORS.success} bgColor={COLORS.successLight} />
            <StatCard label="Discharge Started" value={ipd.dischargeStarted || 0} iconName="exit-run" color={COLORS.orange} bgColor={'#fff7ed'} />
            <StatCard label="Discharged" value={ipd.discharged || 0} iconName="home-outline" color={COLORS.secondary} bgColor={COLORS.borderLight} />
            <StatCard label="Cancelled" value={ipd.cancelled || 0} iconName="close-circle-outline" color={COLORS.error} bgColor={COLORS.errorLight} />
          </View>
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: COLORS.background},
  header: {
    flexDirection: 'row', alignItems: 'center',
    padding: SPACING.base, backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  title: {fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: COLORS.text},
  subtitle: {fontSize: FONTS.sizes.sm, color: COLORS.textSecondary},
  section: {padding: SPACING.base, paddingBottom: SPACING.sm},
  navGrid: {gap: SPACING.md},
  navCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    padding: SPACING.base, borderLeftWidth: 4, ...SHADOW.md,
  },
  navIcon: {width: 52, height: 52, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.sm},
  navTitle: {fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: COLORS.text},
  navSub: {fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginTop: 2},
  navCount: {marginTop: SPACING.xs},
  navCountText: {fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.semibold},
  navArrow: {position: 'absolute', right: SPACING.base, top: '50%'},
});
