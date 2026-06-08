import React, {useState, useCallback} from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import {format} from 'date-fns';
import {COLORS, FONTS, SPACING, RADIUS, SHADOW} from '../../constants/theme';
import {api} from '../../constants/api';
import {instance} from '../../services/axios';
import {SearchBar, Badge, Button, EmptyState, LoadingScreen, ScreenHeader} from '../../components/common';

type FilterStatus = 'ALL' | 'ADMITTED' | 'PLANNED' | 'DISCHARGE_STARTED' | 'DISCHARGED' | 'CANCELLED';

const STATUS_FILTERS: {label: string; value: FilterStatus}[] = [
  {label: 'All', value: 'ALL'},
  {label: 'Admitted', value: 'ADMITTED'},
  {label: 'Planned', value: 'PLANNED'},
  {label: 'Discharge Started', value: 'DISCHARGE_STARTED'},
  {label: 'Discharged', value: 'DISCHARGED'},
  {label: 'Cancelled', value: 'CANCELLED'},
];

function statusVariant(status: string) {
  const map: Record<string, any> = {
    ADMITTED: 'admitted', PLANNED: 'planned',
    DISCHARGE_STARTED: 'inProgress', DISCHARGED: 'discharged', CANCELLED: 'cancelled',
  };
  return map[status] || 'default';
}

export default function InPatientListScreen({navigation}: any) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('ALL');
  const [page, setPage] = useState(1);

  const {data, isLoading, isRefetching, refetch} = useQuery({
    queryKey: ['inpatients', search, activeFilter, page],
    queryFn: async () => {
      const params: any = {page, limit: 15};
      if (search) params.search = search;
      if (activeFilter !== 'ALL') params.status = activeFilter;
      const res = await instance.get(api.getAllAdmissions, {params});
      return res.data;
    },
    staleTime: 30000,
  });

  const admissions = data?.data || [];
  const meta = data?.metadata;

  const handleSearch = useCallback((text: string) => {
    setSearch(text);
    setPage(1);
  }, []);

  const renderItem = ({item}: any) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('InPatientDetail', {id: item.id})}
      activeOpacity={0.78}>
      <View style={styles.cardTop}>
        <View style={styles.avatarWrap}>
          <Icon name="account" size={22} color={COLORS.primary} />
        </View>
        <View style={{flex: 1}}>
          <Text style={styles.patientName}>
            {item.patient?.user?.fName} {item.patient?.user?.lName}
          </Text>
          <Text style={styles.patientMeta}>
            {item.patient?.patientInfo?.age ? `Age ${item.patient.patientInfo.age}` : ''}
            {item.patient?.patientInfo?.gender ? ` · ${item.patient.patientInfo.gender}` : ''}
          </Text>
        </View>
        <Badge label={item.status} variant={statusVariant(item.status)} />
      </View>

      <View style={styles.divider} />

      <View style={styles.cardInfo}>
        <InfoChip icon="stethoscope" label={`Dr. ${item.admittingDoctor?.user?.fName || ''} ${item.admittingDoctor?.user?.lName || ''}`} />
        <InfoChip icon="calendar-outline" label={item.admissionDateTime ? format(new Date(item.admissionDateTime), 'dd MMM yyyy') : '—'} />
        {item.roomBooking?.room?.roomNumber && (
          <InfoChip icon="bed-outline" label={`Room ${item.roomBooking.room.roomNumber}`} />
        )}
      </View>
    </TouchableOpacity>
  );

  if (isLoading) return <LoadingScreen message="Loading patients..." />;

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="In-Patients"
        subtitle={meta ? `${meta.totalItems} total` : undefined}
        navigation={navigation}
        rightAction={{icon: 'plus', onPress: () => navigation.navigate('AdmitPatient')}}
      />

      {/* Search */}
      <View style={styles.searchWrap}>
        <SearchBar value={search} onChangeText={handleSearch} placeholder="Search by name, ID..." />
      </View>

      {/* Filters */}
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

      {/* List */}
      <FlatList
        data={admissions}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary} />}
        ListEmptyComponent={
          <EmptyState
            icon="bed-outline"
            title="No patients found"
            subtitle={search ? 'Try a different search term' : 'No admissions match the selected filter'}
          />
        }
        ListFooterComponent={
          meta && meta.hasNextPage ? (
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
    backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center',
  },
  patientName: {fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.semibold, color: COLORS.text},
  patientMeta: {fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginTop: 2},
  divider: {height: 1, backgroundColor: COLORS.borderLight, marginVertical: SPACING.sm},
  cardInfo: {flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs},
  chip: {flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.borderLight, paddingHorizontal: SPACING.xs + 2, paddingVertical: 3, borderRadius: RADIUS.sm},
  chipText: {fontSize: FONTS.sizes.xs, color: COLORS.textSecondary},
});
