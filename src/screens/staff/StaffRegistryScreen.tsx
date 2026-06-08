import React, {useState, useCallback} from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, StatusBar, ActivityIndicator, Alert, Modal,
  ScrollView, RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {COLORS, FONTS, SPACING, RADIUS, SHADOW} from '../../constants/theme';
import {instance} from '../../services/axios';
import {api} from '../../constants/api';

// ─── Staff Card ───────────────────────────────────────────────────────────────
function StaffCard({item, onPress}: {item: any; onPress: () => void}) {
  const name     = `${item.fName || ''} ${item.lName || ''}`.trim() || 'Unknown';
  const initials = name.split(' ').map((n:string) => n[0]).join('').slice(0,2).toUpperCase();
  const dept     = item.employeeInfo?.department?.[0]?.name || '';
  const role     = item.isAdmin ? 'Admin' : item.isDoctor ? 'Doctor' : 'Staff';
  const roleColor= item.isAdmin ? '#6D28D9' : item.isDoctor ? COLORS.primary : COLORS.success;
  const roleBg   = item.isAdmin ? '#EDE9FE' : item.isDoctor ? COLORS.primaryLight : COLORS.successLight;

  return (
    <TouchableOpacity style={c.wrap} onPress={onPress} activeOpacity={0.85}>
      <View style={c.top}>
        <View style={c.avatar}>
          <Text style={c.avatarText}>{initials}</Text>
        </View>
        <View style={{flex:1}}>
          <Text style={c.name}>{name}</Text>
          <Text style={c.sub}>{item.email || item.phoneNumber || '—'}</Text>
          {dept ? <Text style={c.dept}>{dept}</Text> : null}
        </View>
        <View style={[c.badge, {backgroundColor: roleBg}]}>
          <Text style={[c.badgeText, {color: roleColor}]}>{role}</Text>
        </View>
      </View>
      {item.employeeInfo && (
        <>
          <View style={c.divider}/>
          <View style={c.bottom}>
            {item.employeeInfo.experience && (
              <View style={c.chip}>
                <Icon name="briefcase-outline" size={11} color={COLORS.textMuted}/>
                <Text style={c.chipText}>{item.employeeInfo.experience} yrs exp</Text>
              </View>
            )}
            {item.employeeInfo.consultationCharge && (
              <View style={c.chip}>
                <Icon name="currency-inr" size={11} color={COLORS.textMuted}/>
                <Text style={c.chipText}>₹{item.employeeInfo.consultationCharge}</Text>
              </View>
            )}
            {item.employeeInfo.qualification?.[0]?.name && (
              <View style={c.chip}>
                <Icon name="school-outline" size={11} color={COLORS.textMuted}/>
                <Text style={c.chipText}>{item.employeeInfo.qualification[0].name}</Text>
              </View>
            )}
          </View>
        </>
      )}
    </TouchableOpacity>
  );
}

// ─── Staff Detail Modal ───────────────────────────────────────────────────────
function StaffDetailModal({staff, visible, onClose}: {
  staff: any; visible: boolean; onClose: () => void;
}) {
  if (!staff) return null;
  const name = `${staff.fName||''} ${staff.lName||''}`.trim();
  const role = staff.isAdmin ? 'Admin' : staff.isDoctor ? 'Doctor' : 'Staff';

  const Row = ({label, value}: {label: string; value?: string|null}) => {
    if (!value) return null;
    return (
      <View style={md.row}>
        <Text style={md.label}>{label}</Text>
        <Text style={md.value}>{value}</Text>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={md.overlay}>
        <View style={md.sheet}>
          <View style={md.handle}/>
          <View style={md.header}>
            <Text style={md.title}>Staff Details</Text>
            <TouchableOpacity onPress={onClose} style={md.closeBtn}>
              <Icon name="close" size={20} color={COLORS.textSecondary}/>
            </TouchableOpacity>
          </View>

          {/* Avatar + name */}
          <View style={md.avatarWrap}>
            <View style={md.avatar}>
              <Text style={md.avatarText}>
                {name.split(' ').map((n:string)=>n[0]).join('').slice(0,2).toUpperCase()}
              </Text>
            </View>
            <Text style={md.staffName}>{name}</Text>
            <Text style={md.staffRole}>{role}</Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={md.section}>
              <Text style={md.sectionTitle}>Contact</Text>
              <Row label="Email"  value={staff.email}/>
              <Row label="Phone"  value={staff.phoneNumber}/>
            </View>

            {staff.employeeInfo && (
              <View style={md.section}>
                <Text style={md.sectionTitle}>Professional</Text>
                <Row label="Experience"   value={staff.employeeInfo.experience ? `${staff.employeeInfo.experience} years` : null}/>
                <Row label="Department"   value={staff.employeeInfo.department?.[0]?.name}/>
                <Row label="Qualification"value={staff.employeeInfo.qualification?.map((q:any)=>q.name).join(', ')}/>
                <Row label="Charge"       value={staff.employeeInfo.consultationCharge ? `₹${staff.employeeInfo.consultationCharge}` : null}/>
                <Row label="Speciality"   value={staff.employeeInfo.speciality?.name}/>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function StaffRegistryScreen({navigation}: any) {
  const insets      = useSafeAreaInsets();
  const [search,    setSearch]    = useState('');
  const [filter,    setFilter]    = useState<'ALL'|'DOCTOR'|'ADMIN'|'STAFF'>('ALL');
  const [page,      setPage]      = useState(1);
  const [selected,  setSelected]  = useState<any>(null);
  const [showDetail,setShowDetail]= useState(false);

  const {data, isLoading, isRefetching, refetch} = useQuery({
    queryKey: ['staff-list', filter, page, search],
    queryFn: async () => {
      const params: any = {page, limit: 20};
      if (search.trim()) params.search = search.trim();
      if (filter === 'DOCTOR') params.isDoctor = true;
      if (filter === 'ADMIN')  params.isAdmin  = true;
      const res = await instance.get(api.getAllEmployees, {params});
      return res.data;
    },
  });

  const staff = data?.data || [];
  const meta  = data?.metadata;

  const handleSearch = useCallback((text: string) => {
    setSearch(text); setPage(1);
  }, []);

  const FILTERS = [
    {label:'All',     value:'ALL'},
    {label:'Doctors', value:'DOCTOR'},
    {label:'Admins',  value:'ADMIN'},
    {label:'Staff',   value:'STAFF'},
  ];

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
          <Text style={s.headerTitle}>Staff Registry</Text>
          <Text style={s.headerSub}>{meta?.totalItems || staff.length} members</Text>
        </View>
        <TouchableOpacity style={s.refreshBtn} onPress={() => refetch()}>
          <Icon name="refresh" size={20} color={COLORS.white}/>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <Icon name="magnify" size={18} color={COLORS.textMuted} style={{marginLeft: SPACING.sm}}/>
        <TextInput
          style={s.searchInput}
          placeholder="Search by name or email..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={handleSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => {setSearch(''); setPage(1);}}>
            <Icon name="close-circle" size={18} color={COLORS.textMuted} style={{marginRight: SPACING.sm}}/>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabRow}>
        {FILTERS.map(tab => {
          const active = filter === tab.value;
          return (
            <TouchableOpacity key={tab.value} style={[s.tab, active && s.tabActive]}
              onPress={() => {setFilter(tab.value as any); setPage(1);}}>
              <Text style={[s.tabText, active && s.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* List */}
      <FlatList
        data={staff}
        keyExtractor={item => item.id}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        onRefresh={refetch}
        refreshing={isRefetching}
        ListEmptyComponent={
          <View style={s.empty}>
            <Icon name="badge-account-outline" size={48} color={COLORS.border}/>
            <Text style={s.emptyText}>No staff members found</Text>
          </View>
        }
        ListFooterComponent={
          meta?.hasNextPage ? (
            <TouchableOpacity style={s.loadMore} onPress={() => setPage(p=>p+1)}>
              <Text style={s.loadMoreText}>Load More</Text>
            </TouchableOpacity>
          ) : null
        }
        renderItem={({item}) => (
          <StaffCard
            item={item}
            onPress={() => {setSelected(item); setShowDetail(true);}}
          />
        )}
      />

      <StaffDetailModal
        staff={selected}
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
  tab:          {paddingHorizontal: SPACING.md, paddingVertical:6, borderRadius:20, backgroundColor:'rgba(255,255,255,0.15)', minWidth:70, alignItems:'center'},
  tabActive:    {backgroundColor: COLORS.white},
  tabText:      {fontSize: FONTS.sizes.xs, color:'rgba(255,255,255,0.85)', fontWeight: FONTS.weights.medium},
  tabTextActive:{color: COLORS.primary, fontWeight: FONTS.weights.bold},
  list:         {padding: SPACING.base, paddingTop: SPACING.sm, backgroundColor:'#F5F7FA', minHeight:'100%'},
  empty:        {alignItems:'center', paddingTop:60, gap: SPACING.md},
  emptyText:    {color: COLORS.textMuted, fontSize: FONTS.sizes.base},
  loadMore:     {margin: SPACING.base, padding: SPACING.md, backgroundColor: COLORS.white, borderRadius: RADIUS.md, alignItems:'center'},
  loadMoreText: {color: COLORS.primary, fontWeight: FONTS.weights.semibold},
});

const c = StyleSheet.create({
  wrap:       {backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, elevation:2, shadowColor:'#000', shadowOpacity:0.06, shadowRadius:4, shadowOffset:{width:0,height:2}},
  top:        {flexDirection:'row', alignItems:'center', gap: SPACING.sm},
  avatar:     {width:48, height:48, borderRadius:24, backgroundColor: COLORS.primaryLight, justifyContent:'center', alignItems:'center'},
  avatarText: {fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.bold, color: COLORS.primary},
  name:       {fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.semibold, color: COLORS.text},
  sub:        {fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop:2},
  dept:       {fontSize: FONTS.sizes.xs, color: COLORS.primary, marginTop:2},
  badge:      {paddingHorizontal:10, paddingVertical:4, borderRadius:20},
  badgeText:  {fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.bold},
  divider:    {height:1, backgroundColor: COLORS.border, marginVertical: SPACING.sm},
  bottom:     {flexDirection:'row', flexWrap:'wrap', gap: SPACING.xs},
  chip:       {flexDirection:'row', alignItems:'center', gap:3, backgroundColor: COLORS.background, paddingHorizontal:8, paddingVertical:3, borderRadius:20},
  chipText:   {fontSize:10, color: COLORS.textSecondary},
});

const md = StyleSheet.create({
  overlay:    {flex:1, backgroundColor:'rgba(0,0,0,0.4)', justifyContent:'flex-end'},
  sheet:      {backgroundColor: COLORS.white, borderTopLeftRadius:24, borderTopRightRadius:24, padding: SPACING.xl, paddingTop: SPACING.md, maxHeight:'80%'},
  handle:     {width:40, height:4, backgroundColor: COLORS.border, borderRadius:2, alignSelf:'center', marginBottom: SPACING.md},
  header:     {flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom: SPACING.md},
  title:      {fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, color: COLORS.text},
  closeBtn:   {padding:4},
  avatarWrap: {alignItems:'center', marginBottom: SPACING.lg},
  avatar:     {width:72, height:72, borderRadius:36, backgroundColor: COLORS.primaryLight, justifyContent:'center', alignItems:'center', marginBottom: SPACING.sm},
  avatarText: {fontSize:28, fontWeight: FONTS.weights.bold, color: COLORS.primary},
  staffName:  {fontSize: FONTS.sizes.xl, fontWeight: FONTS.weights.bold, color: COLORS.text},
  staffRole:  {fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginTop:2},
  section:    {marginBottom: SPACING.lg},
  sectionTitle:{fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.bold, color: COLORS.textSecondary, textTransform:'uppercase', letterSpacing:0.5, marginBottom: SPACING.sm},
  row:        {flexDirection:'row', justifyContent:'space-between', paddingVertical:6, borderBottomWidth:1, borderBottomColor: COLORS.borderLight},
  label:      {fontSize: FONTS.sizes.sm, color: COLORS.textMuted},
  value:      {fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.medium, color: COLORS.text, flex:1, textAlign:'right'},
});