import React, {useState, useCallback} from 'react';
import {View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl} from 'react-native';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import {format} from 'date-fns';
import {COLORS, FONTS, SPACING, RADIUS, SHADOW} from '../../constants/theme';
import {api} from '../../constants/api';
import {instance} from '../../services/axios';
import {SearchBar, Badge, Button, EmptyState, LoadingScreen, ScreenHeader} from '../../components/common';

type FilterStatus = 'ALL' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';

const STATUS_FILTERS: {label: string; value: FilterStatus}[] = [
  {label: 'All', value: 'ALL'},
  {label: 'Confirmed', value: 'CONFIRMED'},
  {label: 'In Progress', value: 'IN_PROGRESS'},
  {label: 'Completed', value: 'COMPLETED'},
  {label: 'Cancelled', value: 'CANCELLED'},
];

function statusVariant(status: string) {
  const map: Record<string, any> = {
    CONFIRMED: 'planned', IN_PROGRESS: 'inProgress',
    COMPLETED: 'completed', CANCELLED: 'cancelled',
  };
  return map[status] || 'default';
}

export default function OutPatientListScreen({navigation}: any) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('ALL');
  const [page, setPage] = useState(1);

  const {data, isLoading, isRefetching, refetch} = useQuery({
    queryKey: ['appointments', search, activeFilter, page],
    queryFn: async () => {
      const params: any = {page, limit: 15};
      if (search) params.search = search;
      if (activeFilter !== 'ALL') params.status = activeFilter;
      const res = await instance.get(api.getAllAppointments, {params});
      return res.data;
    },
  });

  const appointments = data?.data || [];
  const meta = data?.metadata;

  const statusMutation = useMutation({
    mutationFn: ({id, status}: {id: string; status: string}) =>
      instance.patch(api.updateAppointmentStatus, {appointmentId: id, status}),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['appointments']});
      Toast.show({type: 'success', text1: 'Status Updated'});
    },
    onError: (err: any) => {
      Toast.show({type: 'error', text1: 'Error', text2: err?.response?.data?.message || 'Failed to update'});
    },
  });

  const handleSearch = useCallback((text: string) => {
    setSearch(text);
    setPage(1);
  }, []);

  const renderItem = ({item}: any) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('OutPatientDetail', {id: item.id})}
      activeOpacity={0.78}>
      <View style={styles.cardTop}>
        <View style={styles.avatarWrap}>
          <Icon name="account-outline" size={22} color={COLORS.success} />
        </View>
        <View style={{flex: 1}}>
          <Text style={styles.patientName}>
            {item.patient?.user?.fName} {item.patient?.user?.lName}
          </Text>
          <Text style={styles.patientMeta}>
            {item.patient?.patientCode || ''} · {item.tokenNumber ? `Token #${item.tokenNumber}` : ''}
          </Text>
        </View>
        <Badge label={item.appointmentStatus} variant={statusVariant(item.appointmentStatus)} />
      </View>

      <View style={styles.divider} />

      <View style={styles.cardInfo}>
        <InfoChip icon="stethoscope" label={`Dr. ${item.doctor?.user?.fName || ''} ${item.doctor?.user?.lName || ''}`} />
        <InfoChip icon="calendar-outline" label={item.date ? format(new Date(item.date), 'dd MMM yyyy') : '—'} />
        {item.timeSlot?.startTime && (
          <InfoChip icon="clock-outline" label={item.timeSlot.startTime} />
        )}
      </View>

      {/* Quick actions */}
      {item.appointmentStatus === 'CONFIRMED' && (
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.quickBtn, {borderColor: COLORS.warning}]}
            onPress={() => statusMutation.mutate({id: item.id, status: 'IN_PROGRESS'})}>
            <Text style={[styles.quickBtnText, {color: COLORS.warning}]}>Start</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickBtn, {borderColor: COLORS.error}]}
            onPress={() => statusMutation.mutate({id: item.id, status: 'CANCELLED'})}>
            <Text style={[styles.quickBtnText, {color: COLORS.error}]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
      {item.appointmentStatus === 'IN_PROGRESS' && (
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.quickBtn, {borderColor: COLORS.success, flex: 1}]}
            onPress={() => statusMutation.mutate({id: item.id, status: 'COMPLETED'})}>
            <Text style={[styles.quickBtnText, {color: COLORS.success}]}>Mark Completed</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  if (isLoading) return <LoadingScreen message="Loading appointments..." />;

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Out-Patients"
        subtitle={meta ? `${meta.totalItems} total` : undefined}
        navigation={navigation}
        rightAction={{icon: 'plus', onPress: () => navigation.navigate('BookAppointment')}}
      />

      <View style={styles.searchWrap}>
        <SearchBar value={search} onChangeText={handleSearch} placeholder="Search by name, token..." />
      </View>

      <FlatList
        data={STATUS_FILTERS}
        horizontal
        keyExtractor={i => i.value}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterList}
        renderItem={({item}) => (
          <TouchableOpacity
            style={[styles.filterChip, activeFilter === item.value && styles.filterChipActive]}
            onPress={() => {setActiveFilter(item.value); setPage(1);}}>
            <Text style={[styles.filterText, activeFilter === item.value && styles.filterTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={appointments}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary} />}
        ListEmptyComponent={
          <EmptyState icon="calendar-outline" title="No appointments found" subtitle="No appointments match the current filter" />
        }
        ListFooterComponent={
          meta?.hasNextPage ? (
            <Button label="Load More" onPress={() => setPage(p => p + 1)} variant="outline" style={{margin: SPACING.base}} />
          ) : null
        }
      />
    </View>
  );
}

const InfoChip = ({icon, label}: {icon: string; label: string}) => (
  <View style={styles.chip}>
    <Icon name={icon} size={12} color={COLORS.textSecondary} />
    <Text style={styles.chipText}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: COLORS.background},
  searchWrap: {padding: SPACING.base, backgroundColor: COLORS.white},
  filterList: {paddingHorizontal: SPACING.base, paddingVertical: SPACING.sm, gap: SPACING.xs},
  filterChip: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full, backgroundColor: COLORS.white,
    borderWidth: 1, borderColor: COLORS.border,
  },
  filterChipActive: {backgroundColor: COLORS.primary, borderColor: COLORS.primary},
  filterText: {fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, fontWeight: FONTS.weights.medium},
  filterTextActive: {color: COLORS.white},
  list: {padding: SPACING.base, paddingTop: SPACING.sm, gap: SPACING.sm},
  card: {backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.base, ...SHADOW.sm},
  cardTop: {flexDirection: 'row', alignItems: 'center', gap: SPACING.sm},
  avatarWrap: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.successLight, justifyContent: 'center', alignItems: 'center',
  },
  patientName: {fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.semibold, color: COLORS.text},
  patientMeta: {fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginTop: 2},
  divider: {height: 1, backgroundColor: COLORS.borderLight, marginVertical: SPACING.sm},
  cardInfo: {flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs},
  chip: {flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.borderLight, paddingHorizontal: SPACING.xs + 2, paddingVertical: 3, borderRadius: RADIUS.sm},
  chipText: {fontSize: FONTS.sizes.xs, color: COLORS.textSecondary},
  quickActions: {flexDirection: 'row', gap: SPACING.xs, marginTop: SPACING.sm},
  quickBtn: {paddingHorizontal: SPACING.md, paddingVertical: 5, borderRadius: RADIUS.sm, borderWidth: 1},
  quickBtnText: {fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.semibold},
});
