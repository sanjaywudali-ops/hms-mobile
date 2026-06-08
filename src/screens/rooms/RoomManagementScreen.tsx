import React, {useState} from 'react';
import {View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl} from 'react-native';
import {useQuery} from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {COLORS, FONTS, SPACING, RADIUS, SHADOW} from '../../constants/theme';
import {api} from '../../constants/api';
import {instance} from '../../services/axios';
import {SearchBar, Badge, EmptyState, LoadingScreen, ScreenHeader} from '../../components/common';

type RoomStatus = 'ALL' | 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'RESERVED';
const STATUS_FILTERS: {label: string; value: RoomStatus; color: string}[] = [
  {label: 'All', value: 'ALL', color: COLORS.primary},
  {label: 'Available', value: 'AVAILABLE', color: COLORS.success},
  {label: 'Occupied', value: 'OCCUPIED', color: COLORS.warning},
  {label: 'Maintenance', value: 'MAINTENANCE', color: COLORS.error},
  {label: 'Reserved', value: 'RESERVED', color: COLORS.purple},
];

function statusVariant(status: string) {
  const map: Record<string, any> = {AVAILABLE: 'planned', OCCUPIED: 'admitted', MAINTENANCE: 'cancelled', RESERVED: 'inProgress'};
  return map[status] || 'default';
}

export default function RoomManagementScreen({navigation}: any) {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<RoomStatus>('ALL');

  const {data, isLoading, isRefetching, refetch} = useQuery({
    queryKey: ['rooms', search, activeFilter],
    queryFn: async () => {
      const params: any = {};
      if (search) params.search = search;
      if (activeFilter !== 'ALL') params.status = activeFilter;
      const res = await instance.get(api.getRooms, {params});
      return res.data;
    },
  });

  const rooms = data?.data || [];

  const renderItem = ({item}: any) => (
    <View style={[styles.card, item.status === 'AVAILABLE' && styles.cardAvailable]}>
      <View style={styles.cardRow}>
        <View style={[styles.roomIcon, {backgroundColor: item.status === 'AVAILABLE' ? COLORS.successLight : COLORS.borderLight}]}>
          <Icon name="bed-outline" size={22} color={item.status === 'AVAILABLE' ? COLORS.success : COLORS.textSecondary} />
        </View>
        <View style={{flex: 1}}>
          <Text style={styles.roomNumber}>Room {item.roomNumber}</Text>
          <Text style={styles.roomType}>{item.roomType?.name || 'Standard'} · Floor {item.floor}</Text>
        </View>
        <Badge label={item.status} variant={statusVariant(item.status)} />
      </View>

      <View style={styles.infoRow}>
        {item.capacity && (
          <View style={styles.metaItem}>
            <Icon name="account-multiple-outline" size={12} color={COLORS.textMuted} />
            <Text style={styles.metaText}>Cap: {item.capacity}</Text>
          </View>
        )}
        {item.ward && (
          <View style={styles.metaItem}>
            <Icon name="map-marker-outline" size={12} color={COLORS.textMuted} />
            <Text style={styles.metaText}>{item.ward}</Text>
          </View>
        )}
        {item.dailyRate && (
          <View style={styles.metaItem}>
            <Icon name="currency-inr" size={12} color={COLORS.textMuted} />
            <Text style={styles.metaText}>₹{item.dailyRate}/day</Text>
          </View>
        )}
      </View>

      {item.amenities?.length > 0 && (
        <View style={styles.amenitiesRow}>
          {item.amenities.slice(0, 4).map((amenity: any, idx: number) => (
            <View key={idx} style={styles.amenityChip}>
              <Text style={styles.amenityText}>{amenity.name || amenity}</Text>
            </View>
          ))}
          {item.amenities.length > 4 && (
            <View style={styles.amenityChip}>
              <Text style={styles.amenityText}>+{item.amenities.length - 4} more</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );

  if (isLoading) return <LoadingScreen message="Loading rooms..." />;

  const available = rooms.filter((r: any) => r.status === 'AVAILABLE').length;
  const occupied = rooms.filter((r: any) => r.status === 'OCCUPIED').length;

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Room Management" subtitle={`${available} available · ${occupied} occupied`} navigation={navigation} />

      {/* Summary chips */}
      <View style={styles.summaryRow}>
        {STATUS_FILTERS.slice(1).map(f => {
          const count = rooms.filter((r: any) => r.status === f.value).length;
          return (
            <View key={f.value} style={[styles.summaryChip, {borderColor: f.color}]}>
              <Text style={[styles.summaryCount, {color: f.color}]}>{count}</Text>
              <Text style={styles.summaryLabel}>{f.label}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.searchWrap}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search by room number, type..." />
      </View>

      <FlatList
        data={STATUS_FILTERS}
        horizontal
        keyExtractor={i => i.value}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterList}
        renderItem={({item}) => (
          <TouchableOpacity
            style={[styles.filterChip, activeFilter === item.value && {backgroundColor: item.color, borderColor: item.color}]}
            onPress={() => setActiveFilter(item.value)}>
            <Text style={[styles.filterText, activeFilter === item.value && styles.filterTextActive]}>{item.label}</Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={rooms}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary} />}
        ListEmptyComponent={<EmptyState icon="door-open" title="No rooms found" subtitle="No rooms match the filter" />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: COLORS.background},
  summaryRow: {flexDirection: 'row', padding: SPACING.base, gap: SPACING.sm, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border},
  summaryChip: {flex: 1, alignItems: 'center', padding: SPACING.xs, borderRadius: RADIUS.sm, borderWidth: 1},
  summaryCount: {fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold},
  summaryLabel: {fontSize: 9, color: COLORS.textSecondary},
  searchWrap: {padding: SPACING.base, paddingBottom: SPACING.xs, backgroundColor: COLORS.white},
  filterList: {paddingHorizontal: SPACING.base, paddingBottom: SPACING.sm, gap: SPACING.xs},
  filterChip: {paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs + 2, borderRadius: RADIUS.full, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border},
  filterText: {fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, fontWeight: FONTS.weights.medium},
  filterTextActive: {color: COLORS.white},
  list: {padding: SPACING.base, gap: SPACING.sm},
  card: {backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.base, ...SHADOW.sm},
  cardAvailable: {borderLeftWidth: 3, borderLeftColor: COLORS.success},
  cardRow: {flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm},
  roomIcon: {width: 44, height: 44, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center'},
  roomNumber: {fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.bold, color: COLORS.text},
  roomType: {fontSize: FONTS.sizes.xs, color: COLORS.textSecondary},
  infoRow: {flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.xs},
  metaItem: {flexDirection: 'row', alignItems: 'center', gap: 4},
  metaText: {fontSize: FONTS.sizes.xs, color: COLORS.textSecondary},
  amenitiesRow: {flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs},
  amenityChip: {backgroundColor: COLORS.borderLight, paddingHorizontal: SPACING.xs + 2, paddingVertical: 2, borderRadius: RADIUS.sm},
  amenityText: {fontSize: 10, color: COLORS.textSecondary},
});
