import React, {useState} from 'react';
import {View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl} from 'react-native';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import {format} from 'date-fns';
import {COLORS, FONTS, SPACING, RADIUS, SHADOW} from '../../constants/theme';
import {api} from '../../constants/api';
import {instance} from '../../services/axios';
import {SearchBar, Badge, Button, EmptyState, LoadingScreen, ScreenHeader} from '../../components/common';

type LabStatus = 'ALL' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
const STATUS_FILTERS: {label: string; value: LabStatus}[] = [
  {label: 'All', value: 'ALL'},
  {label: 'Pending', value: 'PENDING'},
  {label: 'In Progress', value: 'IN_PROGRESS'},
  {label: 'Completed', value: 'COMPLETED'},
  {label: 'Cancelled', value: 'CANCELLED'},
];
function statusVariant(status: string) {
  const map: Record<string, any> = {PENDING: 'planned', IN_PROGRESS: 'inProgress', COMPLETED: 'completed', CANCELLED: 'cancelled'};
  return map[status] || 'default';
}

export default function LaboratoryScreen({navigation}: any) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<LabStatus>('ALL');

  const {data, isLoading, isRefetching, refetch} = useQuery({
    queryKey: ['lab-orders', search, activeFilter],
    queryFn: async () => {
      const params: any = {};
      if (search) params.search = search;
      if (activeFilter !== 'ALL') params.status = activeFilter;
      const res = await instance.get(api.getLabOrders, {params});
      return res.data;
    },
  });

  const orders = data?.data || [];

  const statusMutation = useMutation({
    mutationFn: ({id, status}: {id: string; status: string}) =>
      instance.patch(api.updateLabOrder(id), {status}),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['lab-orders']});
      Toast.show({type: 'success', text1: 'Status Updated'});
    },
    onError: (err: any) => {
      Toast.show({type: 'error', text1: 'Error', text2: err?.response?.data?.message || 'Failed'});
    },
  });

  const renderItem = ({item}: any) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('LabOrderDetail', {id: item.id})}
      activeOpacity={0.78}>
      <View style={styles.cardTop}>
        <View style={styles.labIcon}>
          <Icon name="flask-outline" size={22} color={COLORS.purple} />
        </View>
        <View style={{flex: 1}}>
          <Text style={styles.orderTitle}>{item.testName || 'Lab Test'}</Text>
          <Text style={styles.orderSub}>
            {item.patient?.user?.fName} {item.patient?.user?.lName}
            {item.patient?.patientCode ? ` · ${item.patient.patientCode}` : ''}
          </Text>
        </View>
        <Badge label={item.status} variant={statusVariant(item.status)} />
      </View>

      <View style={styles.divider} />

      <View style={styles.cardMeta}>
        <View style={styles.metaItem}>
          <Icon name="stethoscope" size={12} color={COLORS.textMuted} />
          <Text style={styles.metaText}>{item.orderedBy?.user?.fName ? `Dr. ${item.orderedBy.user.fName}` : '—'}</Text>
        </View>
        <View style={styles.metaItem}>
          <Icon name="calendar-outline" size={12} color={COLORS.textMuted} />
          <Text style={styles.metaText}>{item.createdAt ? format(new Date(item.createdAt), 'dd MMM yyyy') : '—'}</Text>
        </View>
        {item.priority && (
          <View style={[styles.metaItem, {backgroundColor: item.priority === 'URGENT' ? COLORS.errorLight : COLORS.borderLight, paddingHorizontal: SPACING.xs, borderRadius: RADIUS.sm}]}>
            <Text style={[styles.metaText, {color: item.priority === 'URGENT' ? COLORS.error : COLORS.textSecondary}]}>{item.priority}</Text>
          </View>
        )}
      </View>

      {item.status === 'PENDING' && (
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => statusMutation.mutate({id: item.id, status: 'IN_PROGRESS'})}>
          <Text style={styles.actionBtnText}>Start Processing</Text>
        </TouchableOpacity>
      )}
      {item.status === 'IN_PROGRESS' && (
        <TouchableOpacity
          style={[styles.actionBtn, {borderColor: COLORS.success}]}
          onPress={() => navigation.navigate('LabOrderDetail', {id: item.id})}>
          <Text style={[styles.actionBtnText, {color: COLORS.success}]}>Enter Results</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  if (isLoading) return <LoadingScreen message="Loading lab orders..." />;

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Laboratory" subtitle={`${orders.length} orders`} navigation={navigation} />

      <View style={styles.searchWrap}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search by test, patient..." />
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
            onPress={() => setActiveFilter(item.value)}>
            <Text style={[styles.filterText, activeFilter === item.value && styles.filterTextActive]}>{item.label}</Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={orders}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary} />}
        ListEmptyComponent={<EmptyState icon="flask-outline" title="No lab orders found" subtitle="No orders match the current filter" />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: COLORS.background},
  searchWrap: {padding: SPACING.base, backgroundColor: COLORS.white},
  filterList: {paddingHorizontal: SPACING.base, paddingVertical: SPACING.sm, gap: SPACING.xs},
  filterChip: {paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs + 2, borderRadius: RADIUS.full, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border},
  filterChipActive: {backgroundColor: COLORS.purple, borderColor: COLORS.purple},
  filterText: {fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, fontWeight: FONTS.weights.medium},
  filterTextActive: {color: COLORS.white},
  list: {padding: SPACING.base, gap: SPACING.sm},
  card: {backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.base, ...SHADOW.sm},
  cardTop: {flexDirection: 'row', alignItems: 'center', gap: SPACING.sm},
  labIcon: {width: 44, height: 44, borderRadius: 22, backgroundColor: '#f5f3ff', justifyContent: 'center', alignItems: 'center'},
  orderTitle: {fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.semibold, color: COLORS.text},
  orderSub: {fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginTop: 2},
  divider: {height: 1, backgroundColor: COLORS.borderLight, marginVertical: SPACING.sm},
  cardMeta: {flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, alignItems: 'center'},
  metaItem: {flexDirection: 'row', alignItems: 'center', gap: 4},
  metaText: {fontSize: FONTS.sizes.xs, color: COLORS.textSecondary},
  actionBtn: {marginTop: SPACING.sm, borderWidth: 1, borderColor: COLORS.primary, borderRadius: RADIUS.sm, padding: SPACING.xs + 2, alignItems: 'center'},
  actionBtnText: {fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.semibold, color: COLORS.primary},
});
