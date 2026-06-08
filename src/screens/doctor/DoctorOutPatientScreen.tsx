import React, {useState} from 'react';
import {View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl} from 'react-native';
import {useQuery} from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {format} from 'date-fns';
import {COLORS, FONTS, SPACING, RADIUS, SHADOW} from '../../constants/theme';
import {api} from '../../constants/api';
import {instance} from '../../services/axios';
import {SearchBar, Badge, EmptyState, LoadingScreen, ScreenHeader} from '../../components/common';

function statusVariant(status: string) {
  const map: Record<string, any> = {
    ADMITTED: 'admitted', PLANNED: 'planned', DISCHARGE_STARTED: 'inProgress',
    DISCHARGED: 'discharged', CANCELLED: 'cancelled',
    CONFIRMED: 'planned', IN_PROGRESS: 'inProgress', COMPLETED: 'completed',
  };
  return map[status] || 'default';
}

// ─── Doctor In-Patients ────────────────────────────────────────────────────
export function DoctorInPatientScreen({navigation}: any) {
  const [search, setSearch] = useState('');

  const {data, isLoading, isRefetching, refetch} = useQuery({
    queryKey: ['doctor-inpatients', search],
    queryFn: async () => {
      const params: any = {myPatients: true};
      if (search) params.search = search;
      const res = await instance.get(api.getAllAdmissions, {params});
      return res.data;
    },
  });

  const admissions = data?.data || [];

  if (isLoading) return <LoadingScreen message="Loading your patients..." />;

  return (
    <View style={styles.screen}>
      <ScreenHeader title="My In-Patients" navigation={navigation} />
      <View style={styles.searchWrap}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search patients..." />
      </View>
      <FlatList
        data={admissions}
        keyExtractor={i => i.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary} />}
        ListEmptyComponent={<EmptyState icon="bed-outline" title="No in-patients assigned" subtitle="You have no current in-patients" />}
        renderItem={({item}) => (
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('InPatient', {screen: 'InPatientDetail', params: {id: item.id}})} activeOpacity={0.78}>
            <View style={styles.cardRow}>
              <View style={styles.avatar}>
                <Icon name="account" size={20} color={COLORS.primary} />
              </View>
              <View style={{flex: 1}}>
                <Text style={styles.name}>{item.patient?.user?.fName} {item.patient?.user?.lName}</Text>
                <Text style={styles.sub}>
                  {item.reasonForAdmission || ''} · {item.admissionDateTime ? format(new Date(item.admissionDateTime), 'dd MMM') : ''}
                </Text>
              </View>
              <Badge label={item.status} variant={statusVariant(item.status)} />
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

// ─── Doctor Out-Patients ────────────────────────────────────────────────────
export default function DoctorOutPatientScreen({navigation}: any) {
  const [search, setSearch] = useState('');

  const {data, isLoading, isRefetching, refetch} = useQuery({
    queryKey: ['doctor-appointments', search],
    queryFn: async () => {
      const params: any = {myAppointments: true};
      if (search) params.search = search;
      const res = await instance.get(api.getAllAppointments, {params});
      return res.data;
    },
  });

  const appointments = data?.data || [];

  if (isLoading) return <LoadingScreen message="Loading appointments..." />;

  return (
    <View style={styles.screen}>
      <ScreenHeader title="My Out-Patients" navigation={navigation} />
      <View style={styles.searchWrap}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search appointments..." />
      </View>
      <FlatList
        data={appointments}
        keyExtractor={i => i.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary} />}
        ListEmptyComponent={<EmptyState icon="calendar-outline" title="No appointments" subtitle="No appointments assigned to you today" />}
        renderItem={({item}) => (
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('OutPatient', {screen: 'OutPatientDetail', params: {id: item.id}})} activeOpacity={0.78}>
            <View style={styles.cardRow}>
              <View style={[styles.avatar, {backgroundColor: COLORS.successLight}]}>
                <Icon name="account-outline" size={20} color={COLORS.success} />
              </View>
              <View style={{flex: 1}}>
                <Text style={styles.name}>{item.patient?.user?.fName} {item.patient?.user?.lName}</Text>
                <Text style={styles.sub}>
                  {item.date ? format(new Date(item.date), 'dd MMM') : ''} · {item.timeSlot?.startTime || ''} · Token #{item.tokenNumber}
                </Text>
              </View>
              <Badge label={item.appointmentStatus} variant={statusVariant(item.appointmentStatus)} />
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: COLORS.background},
  searchWrap: {padding: SPACING.base, backgroundColor: COLORS.white},
  list: {padding: SPACING.base, gap: SPACING.sm},
  card: {backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.base, ...SHADOW.sm},
  cardRow: {flexDirection: 'row', alignItems: 'center', gap: SPACING.sm},
  avatar: {width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center'},
  name: {fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.semibold, color: COLORS.text},
  sub: {fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginTop: 2},
});
