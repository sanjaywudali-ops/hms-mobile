import React from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, FlatList} from 'react-native';
import {useQuery} from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {format} from 'date-fns';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {COLORS, FONTS, SPACING, RADIUS, SHADOW} from '../../constants/theme';
import {api} from '../../constants/api';
import {instance} from '../../services/axios';
import {useAuth} from '../../services/AuthContext';
import {LoadingScreen, StatCard, Card, Badge, ScreenHeader} from '../../components/common';

// ─── Doctor Dashboard ────────────────────────────────────────────────────────
export default function DoctorDashboardScreen({navigation}: any) {
  const {user} = useAuth();
  const insets = useSafeAreaInsets();

  const {data: stats, isLoading, refetch, isRefetching} = useQuery({
    queryKey: ['doctor-stats'],
    queryFn: async () => (await instance.get(api.getDoctorStats)).data.data,
  });

  if (isLoading) return <LoadingScreen message="Loading your dashboard..." />;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{paddingBottom: SPACING.xxl, paddingTop: insets.top}}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary} />}>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Icon name="menu" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={{marginLeft: SPACING.md}}>
          <Text style={styles.greeting}>Doctor Portal</Text>
          <Text style={styles.userName}>Dr. {user?.name || ''}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Summary</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{flexDirection: 'row', gap: SPACING.xs}}>
            <StatCard label="Total Appointments" value={stats?.total || 0} iconName="calendar-today" color={COLORS.primary} bgColor={COLORS.primaryLight} />
            <StatCard label="In Progress" value={stats?.inProgress || 0} iconName="clock-outline" color={COLORS.warning} bgColor={COLORS.warningLight} />
            <StatCard label="Completed" value={stats?.completed || 0} iconName="check-circle-outline" color={COLORS.success} bgColor={COLORS.successLight} />
            <StatCard label="Cancelled" value={stats?.cancelled || 0} iconName="close-circle-outline" color={COLORS.error} bgColor={COLORS.errorLight} />
          </View>
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Access</Text>
        <View style={styles.quickGrid}>
          {[
            {label: 'My In-Patients', icon: 'bed-outline', screen: 'DoctorInPatient', color: COLORS.primary},
            {label: 'My Out-Patients', icon: 'calendar-account-outline', screen: 'DoctorOutPatient', color: COLORS.success},
          ].map(item => (
            <TouchableOpacity
              key={item.label}
              style={[styles.quickCard, {borderLeftColor: item.color}]}
              onPress={() => navigation.navigate(item.screen)}>
              <Icon name={item.icon} size={28} color={item.color} />
              <Text style={[styles.quickLabel, {color: item.color}]}>{item.label}</Text>
              <Icon name="chevron-right" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: COLORS.background},
  header: {flexDirection: 'row', alignItems: 'center', padding: SPACING.base, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border},
  greeting: {fontSize: FONTS.sizes.xs, color: COLORS.textSecondary},
  userName: {fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: COLORS.text},
  section: {padding: SPACING.base, paddingBottom: SPACING.sm},
  sectionTitle: {fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: COLORS.text, marginBottom: SPACING.md},
  quickGrid: {gap: SPACING.sm},
  quickCard: {flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: COLORS.white, padding: SPACING.base, borderRadius: RADIUS.lg, borderLeftWidth: 4, ...SHADOW.sm},
  quickLabel: {flex: 1, fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.semibold},
});
