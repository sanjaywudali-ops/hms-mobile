import React, {useState, useCallback} from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, StatusBar, ActivityIndicator, Modal, ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useQuery} from '@tanstack/react-query';
import {COLORS, FONTS, SPACING, RADIUS, SHADOW} from '../../constants/theme';
import {instance} from '../../services/axios';
import {api} from '../../constants/api';

// ─── Types ────────────────────────────────────────────────────────────────────
type RoomStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'RESERVED';

const STATUS_CONFIG: Record<RoomStatus, {color: string; bg: string; icon: string}> = {
  AVAILABLE:   {color:'#065F46', bg:'#D1FAE5', icon:'check-circle-outline'},
  OCCUPIED:    {color:'#991B1B', bg:'#FEE2E2', icon:'account-outline'},
  MAINTENANCE: {color:'#B45309', bg:'#FEF3C7', icon:'wrench-outline'},
  RESERVED:    {color:'#1D4ED8', bg:'#DBEAFE', icon:'clock-outline'},
};

const FILTER_TABS = [
  {label:'All',         value:'ALL'},
  {label:'Available',   value:'AVAILABLE'},
  {label:'Occupied',    value:'OCCUPIED'},
  {label:'Maintenance', value:'MAINTENANCE'},
  {label:'Reserved',    value:'RESERVED'},
];

// ─── Room Detail Modal ────────────────────────────────────────────────────────
function RoomDetailModal({room, visible, onClose}: {
  room: any; visible: boolean; onClose: () => void;
}) {
  if (!room) return null;
  const cfg = STATUS_CONFIG[room.status as RoomStatus] || STATUS_CONFIG['AVAILABLE'];

  const Row = ({label, value}: {label: string; value?: string|null}) => {
    if (!value) return null;
    return (
      <View style={md.row}>
        <Text style={md.label}>{label}</Text>
        <Text style={md.value}>{value}</Text>
      </View>
    );
  };

  const amenities = room.amenities || [];
  const currentBooking = room.currentBooking || room.roomBookings?.[0];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={md.overlay}>
        <View style={md.sheet}>
          <View style={md.handle}/>
          <View style={md.header}>
            <Text style={md.title}>Room {room.roomNumber}</Text>
            <TouchableOpacity onPress={onClose} style={md.closeBtn}>
              <Icon name="close" size={20} color={COLORS.textSecondary}/>
            </TouchableOpacity>
          </View>

          {/* Status badge */}
          <View style={[md.statusBadge, {backgroundColor: cfg.bg}]}>
            <Icon name={cfg.icon} size={14} color={cfg.color}/>
            <Text style={[md.statusText, {color: cfg.color}]}>{room.status}</Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={md.section}>
              <Text style={md.sectionTitle}>Room Info</Text>
              <Row label="Room Number"  value={room.roomNumber}/>
              <Row label="Type"         value={room.roomType?.name}/>
              <Row label="Floor"        value={room.floor?.name}/>
              <Row label="Building"     value={room.floor?.building?.name}/>
              <Row label="Capacity"     value={room.capacity ? `${room.capacity} beds` : null}/>
              <Row label="Daily Rate"   value={room.dailyRate ? `₹${room.dailyRate}/day` : null}/>
              <Row label="Description"  value={room.description}/>
            </View>

            {amenities.length > 0 && (
              <View style={md.section}>
                <Text style={md.sectionTitle}>Amenities</Text>
                <View style={md.amenitiesWrap}>
                  {amenities.map((a: any, i: number) => (
                    <View key={i} style={md.amenityChip}>
                      <Icon name="check" size={11} color={COLORS.primary}/>
                      <Text style={md.amenityText}>{a.name}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {currentBooking && (
              <View style={md.section}>
                <Text style={md.sectionTitle}>Current Patient</Text>
                <Row label="Patient"  value={currentBooking.patient?.user
                  ? `${currentBooking.patient.user.fName||''} ${currentBooking.patient.user.lName||''}`.trim()
                  : null}/>
                <Row label="Doctor"   value={currentBooking.doctor?.user
                  ? `Dr. ${currentBooking.doctor.user.fName||''} ${currentBooking.doctor.user.lName||''}`.trim()
                  : null}/>
                <Row label="Check In" value={currentBooking.startTime
                  ? new Date(currentBooking.startTime).toLocaleDateString('en-IN', {day:'numeric', month:'short', year:'numeric'})
                  : null}/>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Room Card ────────────────────────────────────────────────────────────────
function RoomCard({item, onPress}: {item: any; onPress: () => void}) {
  const cfg      = STATUS_CONFIG[item.status as RoomStatus] || STATUS_CONFIG['AVAILABLE'];
  const amenities = item.amenities || [];

  return (
    <TouchableOpacity style={c.wrap} onPress={onPress} activeOpacity={0.85}>
      <View style={c.top}>
        <View style={[c.roomIcon, {backgroundColor: cfg.bg}]}>
          <Icon name="door-open" size={22} color={cfg.color}/>
        </View>
        <View style={{flex:1}}>
          <Text style={c.roomNumber}>Room {item.roomNumber}</Text>
          <Text style={c.roomType}>{item.roomType?.name || '—'}</Text>
          {item.floor?.name && (
            <Text style={c.roomFloor}>{item.floor.name}{item.floor.building?.name ? ` · ${item.floor.building.name}` : ''}</Text>
          )}
        </View>
        <View style={[c.badge, {backgroundColor: cfg.bg}]}>
          <Icon name={cfg.icon} size={11} color={cfg.color}/>
          <Text style={[c.badgeText, {color: cfg.color}]}>{item.status}</Text>
        </View>
      </View>

      <View style={c.divider}/>

      <View style={c.bottom}>
        {item.capacity && (
          <View style={c.infoItem}>
            <Icon name="bed-outline" size={13} color={COLORS.textMuted}/>
            <Text style={c.infoText}>{item.capacity} bed(s)</Text>
          </View>
        )}
        {item.dailyRate && (
          <View style={c.infoItem}>
            <Icon name="currency-inr" size={13} color={COLORS.textMuted}/>
            <Text style={c.infoText}>₹{item.dailyRate}/day</Text>
          </View>
        )}
        {amenities.length > 0 && (
          <View style={c.infoItem}>
            <Icon name="star-outline" size={13} color={COLORS.textMuted}/>
            <Text style={c.infoText}>{amenities.length} amenity(s)</Text>
          </View>
        )}
      </View>

      {item.status === 'OCCUPIED' && item.currentBooking?.patient?.user && (
        <View style={c.occupiedBanner}>
          <Icon name="account" size={13} color='#991B1B'/>
          <Text style={c.occupiedText}>
            {`${item.currentBooking.patient.user.fName||''} ${item.currentBooking.patient.user.lName||''}`.trim()}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Stats Banner ─────────────────────────────────────────────────────────────
function StatsBanner({rooms}: {rooms: any[]}) {
  const total       = rooms.length;
  const available   = rooms.filter(r => r.status === 'AVAILABLE').length;
  const occupied    = rooms.filter(r => r.status === 'OCCUPIED').length;
  const maintenance = rooms.filter(r => r.status === 'MAINTENANCE').length;

  return (
    <View style={sb.wrap}>
      <StatItem label="Total"       value={total}       color={COLORS.white}/>
      <View style={sb.divider}/>
      <StatItem label="Available"   value={available}   color='#6EE7B7'/>
      <View style={sb.divider}/>
      <StatItem label="Occupied"    value={occupied}    color='#FCA5A5'/>
      <View style={sb.divider}/>
      <StatItem label="Maintenance" value={maintenance} color='#FCD34D'/>
    </View>
  );
}

function StatItem({label, value, color}: {label: string; value: number; color: string}) {
  return (
    <View style={sb.item}>
      <Text style={[sb.value, {color}]}>{value}</Text>
      <Text style={sb.label}>{label}</Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function RoomManagementScreen({navigation}: any) {
  const insets    = useSafeAreaInsets();
  const [filter,  setFilter]   = useState('ALL');
  const [search,  setSearch]   = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);

  const {data: rooms, isLoading, isRefetching, refetch} = useQuery({
    queryKey: ['rooms-list'],
    queryFn: async () => {
      const res = await instance.get(api.getAllRooms, {params: {limit: 100}});
      return res.data?.data || [];
    },
    staleTime: 30000,
  });

  const allRooms = rooms || [];

  const filtered = allRooms.filter((r: any) => {
    const matchStatus = filter === 'ALL' || r.status === filter;
    const matchSearch = !search.trim() || r.roomNumber?.toLowerCase().includes(search.toLowerCase()) ||
      r.roomType?.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.floor?.name?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  if (isLoading) {
    return (
      <View style={{flex:1, justifyContent:'center', alignItems:'center', backgroundColor: COLORS.background}}>
        <ActivityIndicator size="large" color={COLORS.primary}/>
      </View>
    );
  }

  return (
    <View style={[s.safe, {paddingTop: insets.top, paddingBottom: insets.bottom}]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} translucent={false}/>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.openDrawer()} style={s.menuBtn}>
          <Icon name="menu" size={24} color={COLORS.white}/>
        </TouchableOpacity>
        <View style={{flex:1}}>
          <Text style={s.headerTitle}>Room Management</Text>
          <Text style={s.headerSub}>{filtered.length} of {allRooms.length} rooms</Text>
        </View>
        <TouchableOpacity style={s.refreshBtn} onPress={() => refetch()}>
          <Icon name="refresh" size={20} color={COLORS.white}/>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <StatsBanner rooms={allRooms}/>

      {/* Search */}
      <View style={s.searchWrap}>
        <Icon name="magnify" size={18} color={COLORS.textMuted} style={{marginLeft: SPACING.sm}}/>
        <TextInput
          style={s.searchInput}
          placeholder="Search by room number, type, floor..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Icon name="close-circle" size={18} color={COLORS.textMuted} style={{marginRight: SPACING.sm}}/>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabRow}>
        {FILTER_TABS.map(tab => {
          const active = filter === tab.value;
          return (
            <TouchableOpacity key={tab.value} style={[s.tab, active && s.tabActive]}
              onPress={() => setFilter(tab.value)}>
              <Text style={[s.tabText, active && s.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        onRefresh={refetch}
        refreshing={isRefetching}
        numColumns={1}
        ListEmptyComponent={
          <View style={s.empty}>
            <Icon name="door-open" size={48} color={COLORS.border}/>
            <Text style={s.emptyText}>No rooms found</Text>
          </View>
        }
        renderItem={({item}) => (
          <RoomCard
            item={item}
            onPress={() => {setSelected(item); setShowDetail(true);}}
          />
        )}
      />

      <RoomDetailModal
        room={selected}
        visible={showDetail}
        onClose={() => {setShowDetail(false); setSelected(null);}}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:         {flex:1, backgroundColor: COLORS.primary},
  header:       {flexDirection:'row', alignItems:'center', padding: SPACING.lg, gap: SPACING.md},
  menuBtn:      {padding:4},
  headerTitle:  {fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, color: COLORS.white},
  headerSub:    {fontSize: FONTS.sizes.xs, color:'rgba(255,255,255,0.75)', marginTop:2},
  refreshBtn:   {backgroundColor:'rgba(255,255,255,0.2)', borderRadius:20, padding:8},
  searchWrap:   {flexDirection:'row', alignItems:'center', backgroundColor: COLORS.white, marginHorizontal: SPACING.lg, borderRadius: RADIUS.md, marginBottom: SPACING.sm, borderWidth:1, borderColor: COLORS.border},
  searchInput:  {flex:1, fontSize: FONTS.sizes.base, color: COLORS.text, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.xs},
  tabRow:       {paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm, gap: SPACING.xs},
  tab:          {paddingHorizontal: SPACING.md, paddingVertical:6, borderRadius:20, backgroundColor:'rgba(255,255,255,0.15)', minWidth:80, alignItems:'center'},
  tabActive:    {backgroundColor: COLORS.white},
  tabText:      {fontSize: FONTS.sizes.xs, color:'rgba(255,255,255,0.85)', fontWeight: FONTS.weights.medium},
  tabTextActive:{color: COLORS.primary, fontWeight: FONTS.weights.bold},
  list:         {padding: SPACING.base, paddingTop: SPACING.sm, backgroundColor:'#F5F7FA', minHeight:'100%'},
  empty:        {alignItems:'center', paddingTop:60, gap: SPACING.md},
  emptyText:    {color: COLORS.textMuted, fontSize: FONTS.sizes.base},
});

const c = StyleSheet.create({
  wrap:          {backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, elevation:2, shadowColor:'#000', shadowOpacity:0.06, shadowRadius:4, shadowOffset:{width:0,height:2}},
  top:           {flexDirection:'row', alignItems:'center', gap: SPACING.sm},
  roomIcon:      {width:48, height:48, borderRadius: RADIUS.md, justifyContent:'center', alignItems:'center'},
  roomNumber:    {fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.bold, color: COLORS.text},
  roomType:      {fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginTop:2},
  roomFloor:     {fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop:1},
  badge:         {flexDirection:'row', alignItems:'center', gap:3, paddingHorizontal:8, paddingVertical:4, borderRadius:20},
  badgeText:     {fontSize:9, fontWeight: FONTS.weights.bold},
  divider:       {height:1, backgroundColor: COLORS.border, marginVertical: SPACING.sm},
  bottom:        {flexDirection:'row', flexWrap:'wrap', gap: SPACING.md},
  infoItem:      {flexDirection:'row', alignItems:'center', gap:4},
  infoText:      {fontSize: FONTS.sizes.xs, color: COLORS.textSecondary},
  occupiedBanner:{flexDirection:'row', alignItems:'center', gap:4, marginTop: SPACING.sm, backgroundColor:'#FEE2E2', padding: SPACING.xs, borderRadius: RADIUS.sm},
  occupiedText:  {fontSize: FONTS.sizes.xs, color:'#991B1B', fontWeight: FONTS.weights.medium},
});

const sb = StyleSheet.create({
  wrap:    {flexDirection:'row', backgroundColor:'rgba(255,255,255,0.15)', marginHorizontal: SPACING.lg, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm},
  item:    {flex:1, alignItems:'center'},
  value:   {fontSize: FONTS.sizes.xl, fontWeight: FONTS.weights.bold},
  label:   {fontSize: FONTS.sizes.xs, color:'rgba(255,255,255,0.75)', marginTop:2},
  divider: {width:1, backgroundColor:'rgba(255,255,255,0.2)'},
});

const md = StyleSheet.create({
  overlay:      {flex:1, backgroundColor:'rgba(0,0,0,0.4)', justifyContent:'flex-end'},
  sheet:        {backgroundColor: COLORS.white, borderTopLeftRadius:24, borderTopRightRadius:24, padding: SPACING.xl, paddingTop: SPACING.md, maxHeight:'80%'},
  handle:       {width:40, height:4, backgroundColor: COLORS.border, borderRadius:2, alignSelf:'center', marginBottom: SPACING.md},
  header:       {flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom: SPACING.sm},
  title:        {fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, color: COLORS.text},
  closeBtn:     {padding:4},
  statusBadge:  {flexDirection:'row', alignItems:'center', gap:6, alignSelf:'flex-start', paddingHorizontal: SPACING.md, paddingVertical:5, borderRadius:20, marginBottom: SPACING.md},
  statusText:   {fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.semibold},
  section:      {marginBottom: SPACING.lg},
  sectionTitle: {fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.bold, color: COLORS.textSecondary, textTransform:'uppercase', letterSpacing:0.5, marginBottom: SPACING.sm},
  row:          {flexDirection:'row', justifyContent:'space-between', paddingVertical:6, borderBottomWidth:1, borderBottomColor: COLORS.borderLight},
  label:        {fontSize: FONTS.sizes.sm, color: COLORS.textMuted},
  value:        {fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.medium, color: COLORS.text, flex:1, textAlign:'right'},
  amenitiesWrap:{flexDirection:'row', flexWrap:'wrap', gap: SPACING.xs},
  amenityChip:  {flexDirection:'row', alignItems:'center', gap:4, backgroundColor: COLORS.primaryLight, paddingHorizontal:8, paddingVertical:4, borderRadius:20},
  amenityText:  {fontSize: FONTS.sizes.xs, color: COLORS.primary, fontWeight: FONTS.weights.medium},
});