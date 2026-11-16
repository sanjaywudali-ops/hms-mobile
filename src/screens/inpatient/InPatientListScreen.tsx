import React, {useState, useCallback} from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, StatusBar, ActivityIndicator, ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useQuery} from '@tanstack/react-query';
import {format} from 'date-fns';
import {COLORS, FONTS, SPACING, RADIUS} from '../../constants/theme';
import {instance} from '../../services/axios';
import {api} from '../../constants/api';

const STATUS: Record<string, {color: string; bg: string}> = {
  ADMITTED:          {color: '#B45309', bg: '#FEF3C7'},
  PLANNED:           {color: '#1D4ED8', bg: '#DBEAFE'},
  DISCHARGE_STARTED: {color: '#D97706', bg: '#FFEDD5'},
  DISCHARGED:        {color: '#065F46', bg: '#D1FAE5'},
  CANCELLED:         {color: '#991B1B', bg: '#FEE2E2'},
};

const FILTERS = [
  {label: 'All',         value: 'ALL'},
  {label: 'Admitted',    value: 'ADMITTED'},
  {label: 'Planned',     value: 'PLANNED'},
  {label: 'Discharging', value: 'DISCHARGE_STARTED'},
  {label: 'Discharged',  value: 'DISCHARGED'},
  {label: 'Cancelled',   value: 'CANCELLED'},
];

function Card({item, onPress}: {item: any; onPress: () => void}) {
  const cfg    = STATUS[item.status] || STATUS.ADMITTED;
  const u      = item.patient?.user;
  const p      = item.patient;
  const name   = u ? `${u.fName || ''} ${u.lName || ''}`.trim() : 'Unknown';
  const init   = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const room   = item.staySession?.currentRoomBooking?.room?.roomNumber;
  const doctor = item.admittingDoctor?.user
    ? `Dr. ${item.admittingDoctor.user.fName || ''} ${item.admittingDoctor.user.lName || ''}`.trim() : '';

  return (
    <TouchableOpacity style={c.wrap} onPress={onPress} activeOpacity={0.85}>
      <View style={c.top}>
        <View style={c.avatar}><Text style={c.avatarText}>{init}</Text></View>
        <View style={{flex: 1}}>
          <Text style={c.name}>{name}</Text>
          <Text style={c.sub}>
            {[p?.age ? `${p.age} yrs` : null, p?.gender, u?.phoneNumber].filter(Boolean).join(' · ') || '—'}
          </Text>
        </View>
        <View style={[c.badge, {backgroundColor: cfg.bg}]}>
          <Text style={[c.badgeText, {color: cfg.color}]}>{item.status?.replace('_', ' ')}</Text>
        </View>
      </View>
      <View style={c.divider} />
      <View style={c.bottom}>
        {doctor ? (
          <View style={c.meta}>
            <Icon name="stethoscope" size={13} color={COLORS.textMuted} />
            <Text style={c.metaText}>{doctor}</Text>
          </View>
        ) : null}
        <View style={c.meta}>
          <Icon name="calendar-outline" size={13} color={COLORS.textMuted} />
          <Text style={c.metaText}>
            {item.admissionDateTime ? format(new Date(item.admissionDateTime), 'dd MMM yyyy') : '—'}
          </Text>
        </View>
        {room ? (
          <View style={c.meta}>
            <Icon name="bed-outline" size={13} color={COLORS.textMuted} />
            <Text style={c.metaText}>Room {room}</Text>
          </View>
        ) : null}
      </View>
      {item.reason ? <Text style={c.reason} numberOfLines={1}>{item.reason}</Text> : null}
    </TouchableOpacity>
  );
}

export default function InPatientListScreen({navigation}: any) {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [page,   setPage]   = useState(1);

  const {data, isLoading, isRefetching, refetch} = useQuery({
    queryKey: ['ipd-list', filter, search, page],
    queryFn: async () => {
      const params: any = {page, limit: 15};
      // Backend only takes one search at a time: by patient name OR by status
      if (search.trim())         {params.search = search.trim(); params.filterType = 'patientName';}
      else if (filter !== 'ALL') {params.search = filter;        params.filterType = 'status';}
      return (await instance.get(api.getAllAdmissions, {params})).data;
    },
  });

  const meta  = data?.metadata;
  let   items = data?.data || [];
  // When searching by name, apply the status chip on the phone instead
  if (search.trim() && filter !== 'ALL') items = items.filter((i: any) => i.status === filter);

  const onSearch = useCallback((t: string) => {setSearch(t); setPage(1);}, []);

  if (isLoading) return (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );

  return (
    <View style={[s.safe, {paddingTop: insets.top, paddingBottom: insets.bottom}]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} translucent={false} />

      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.openDrawer()} style={{padding: 4}}>
          <Icon name="menu" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={{flex: 1}}>
          <Text style={s.title}>In-Patients</Text>
          <Text style={s.sub}>{meta?.totalItems ?? items.length} admissions</Text>
        </View>
        <TouchableOpacity style={s.iconBtn} onPress={() => navigation.navigate('AdmitPatient')}>
          <Icon name="plus" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <View style={s.searchWrap}>
        <Icon name="magnify" size={18} color={COLORS.textMuted} style={{marginLeft: SPACING.sm}} />
        <TextInput
          style={s.searchInput} placeholder="Search by patient name..."
          placeholderTextColor={COLORS.textMuted} value={search} onChangeText={onSearch} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabRow} style={{flexGrow: 0}}>
        {FILTERS.map(f => {
          const active = filter === f.value;
          return (
            <TouchableOpacity key={f.value} style={[s.tab, active && s.tabActive]}
              onPress={() => {setFilter(f.value); setPage(1);}}>
              <Text style={[s.tabText, active && s.tabTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <FlatList
        data={items}
        keyExtractor={i => i.id}
        contentContainerStyle={s.list}
        onRefresh={refetch}
        refreshing={isRefetching}
        ListEmptyComponent={
          <View style={s.empty}>
            <Icon name="bed-outline" size={48} color={COLORS.border} />
            <Text style={s.emptyText}>No admissions found</Text>
          </View>
        }
        ListFooterComponent={meta?.hasNextPage ? (
          <TouchableOpacity style={s.loadMore} onPress={() => setPage(p => p + 1)}>
            <Text style={s.loadMoreText}>Load More</Text>
          </TouchableOpacity>
        ) : null}
        renderItem={({item}) => (
          <Card item={item} onPress={() => navigation.navigate('InPatientDetail', {id: item.id})} />
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  safe:         {flex: 1, backgroundColor: COLORS.primary},
  header:       {flexDirection: 'row', alignItems: 'center', padding: SPACING.lg, gap: SPACING.md},
  title:        {fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, color: COLORS.white},
  sub:          {fontSize: FONTS.sizes.xs, color: 'rgba(255,255,255,0.75)', marginTop: 2},
  iconBtn:      {backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: 8},
  searchWrap:   {flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, marginHorizontal: SPACING.lg, borderRadius: RADIUS.md, marginBottom: SPACING.sm},
  searchInput:  {flex: 1, fontSize: FONTS.sizes.base, color: COLORS.text, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.xs},
  tabRow:       {paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm, gap: SPACING.xs, paddingRight: SPACING.xl},
  tab:          {paddingHorizontal: SPACING.md, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', minWidth: 80, alignItems: 'center'},
  tabActive:    {backgroundColor: COLORS.white},
  tabText:      {fontSize: FONTS.sizes.xs, color: 'rgba(255,255,255,0.85)', fontWeight: FONTS.weights.medium},
  tabTextActive:{color: COLORS.primary, fontWeight: FONTS.weights.bold},
  list:         {padding: SPACING.base, paddingTop: SPACING.sm, backgroundColor: '#F5F7FA', minHeight: '100%'},
  empty:        {alignItems: 'center', paddingTop: 60, gap: SPACING.md},
  emptyText:    {color: COLORS.textMuted, fontSize: FONTS.sizes.base},
  loadMore:     {margin: SPACING.base, padding: SPACING.md, backgroundColor: COLORS.white, borderRadius: RADIUS.md, alignItems: 'center'},
  loadMoreText: {color: COLORS.primary, fontWeight: FONTS.weights.semibold},
});

const c = StyleSheet.create({
  wrap:      {backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, elevation: 2},
  top:       {flexDirection: 'row', alignItems: 'center', gap: SPACING.sm},
  avatar:    {width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center'},
  avatarText:{fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.bold, color: COLORS.primary},
  name:      {fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.semibold, color: COLORS.text},
  sub:       {fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: 2},
  badge:     {paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20},
  badgeText: {fontSize: 9, fontWeight: FONTS.weights.bold},
  divider:   {height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.sm},
  bottom:    {flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md},
  meta:      {flexDirection: 'row', alignItems: 'center', gap: 4},
  metaText:  {fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, maxWidth: 140},
  reason:    {fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: SPACING.xs, fontStyle: 'italic'},
});