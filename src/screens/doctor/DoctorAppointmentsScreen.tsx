import React, {useState} from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, FlatList, StatusBar, Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {format} from 'date-fns';
import {COLORS, FONTS, SPACING, RADIUS} from '../../constants/theme';
import {instance} from '../../services/axios';
import {api} from '../../constants/api';
import {useAuth} from '../../services/AuthContext';
import {LoadingScreen, EmptyState} from '../../components/common';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, {color: string; bg: string; icon: string}> = {
  CONFIRMED:   {color: '#1D4ED8', bg: '#DBEAFE', icon: 'check-circle-outline'},
  IN_PROGRESS: {color: '#B45309', bg: '#FEF3C7', icon: 'clock-outline'},
  COMPLETED:   {color: '#065F46', bg: '#D1FAE5', icon: 'check-all'},
  CANCELLED:   {color: '#991B1B', bg: '#FEE2E2', icon: 'close-circle-outline'},
};

const FILTER_TABS: {label: string; value: string}[] = [
  {label: 'All',         value: 'ALL'},
  {label: 'Confirmed',   value: 'CONFIRMED'},
  {label: 'In Progress', value: 'IN_PROGRESS'},
  {label: 'Completed',   value: 'COMPLETED'},
  {label: 'Cancelled',   value: 'CANCELLED'},
];

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function DetailModal({appointment, visible, onClose, onAction}: {
  appointment: any; visible: boolean; onClose: () => void;
  onAction: (id: string, status: string) => void;
}) {
  const insets = useSafeAreaInsets();
  if (!appointment) return null;
  const cfg = STATUS_CONFIG[appointment.appointmentStatus] || STATUS_CONFIG['CONFIRMED'];
  const patientName = `${appointment.patient?.user?.fName || ''} ${appointment.patient?.user?.lName || ''}`.trim();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modal.overlay}>
        <View style={[modal.sheet, {paddingBottom: insets.bottom + SPACING.md}]}>
          <View style={modal.handle} />
          <View style={modal.header}>
            <Text style={modal.title}>Appointment Details</Text>
            <TouchableOpacity onPress={onClose} style={modal.closeBtn}>
              <Icon name="close" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          <View style={[modal.badge, {backgroundColor: cfg.bg}]}>
            <Icon name={cfg.icon} size={14} color={cfg.color} />
            <Text style={[modal.badgeText, {color: cfg.color}]}>{appointment.appointmentStatus}</Text>
          </View>
          <View style={modal.section}>
            <InfoRow icon="account"           label="Patient"    value={patientName} />
            <InfoRow icon="identifier"        label="Patient ID" value={appointment.patient?.patientCode || '—'} />
            <InfoRow icon="calendar"          label="Date"       value={appointment.date ? format(new Date(appointment.date), 'dd MMM yyyy') : '—'} />
            <InfoRow icon="clock-outline"     label="Time"       value={appointment.timeSlot?.startTime || '—'} />
            <InfoRow icon="ticket-outline"    label="Token"      value={appointment.tokenNumber ? `#${appointment.tokenNumber}` : '—'} />
            <InfoRow icon="note-text-outline" label="Type"       value={appointment.appointmentType || 'OPD'} />
          </View>
          {appointment.appointmentStatus !== 'COMPLETED' && appointment.appointmentStatus !== 'CANCELLED' && (
            <View style={modal.actions}>
              {appointment.appointmentStatus === 'CONFIRMED' && (
                <TouchableOpacity
                  style={[modal.actionBtn, {backgroundColor: '#FEF3C7'}]}
                  onPress={() => {onAction(appointment.id, 'IN_PROGRESS'); onClose();}}>
                  <Icon name="clock-outline" size={16} color="#B45309" />
                  <Text style={[modal.actionText, {color: '#B45309'}]}>Start</Text>
                </TouchableOpacity>
              )}
              {appointment.appointmentStatus === 'IN_PROGRESS' && (
                <TouchableOpacity
                  style={[modal.actionBtn, {backgroundColor: '#D1FAE5'}]}
                  onPress={() => {onAction(appointment.id, 'COMPLETED'); onClose();}}>
                  <Icon name="check-all" size={16} color="#065F46" />
                  <Text style={[modal.actionText, {color: '#065F46'}]}>Mark Complete</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[modal.actionBtn, {backgroundColor: '#FEE2E2'}]}
                onPress={() => {onAction(appointment.id, 'CANCELLED'); onClose();}}>
                <Icon name="close-circle-outline" size={16} color="#991B1B" />
                <Text style={[modal.actionText, {color: '#991B1B'}]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

function InfoRow({icon, label, value}: {icon: string; label: string; value: string}) {
  return (
    <View style={modal.row}>
      <Icon name={icon} size={15} color={COLORS.primary} style={{marginTop: 1}} />
      <Text style={modal.rowLabel}>{label}</Text>
      <Text style={modal.rowValue}>{value}</Text>
    </View>
  );
}

// ─── Appointment Card ─────────────────────────────────────────────────────────

function AppointmentCard({item, onPress, onAction}: {
  item: any; onPress: () => void;
  onAction: (id: string, status: string) => void;
}) {
  const cfg = STATUS_CONFIG[item.appointmentStatus] || STATUS_CONFIG['CONFIRMED'];
  const patientName = `${item.patient?.user?.fName || ''} ${item.patient?.user?.lName || ''}`.trim();
  const initials    = patientName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <TouchableOpacity style={card.wrap} onPress={onPress} activeOpacity={0.85}>
      <View style={card.top}>
        <View style={card.avatarWrap}>
          <Text style={card.avatarText}>{initials}</Text>
        </View>
        <View style={{flex: 1}}>
          <Text style={card.name}>{patientName}</Text>
          <Text style={card.sub}>{item.patient?.patientCode || ''} · Token #{item.tokenNumber || '—'}</Text>
        </View>
        <View style={[card.badge, {backgroundColor: cfg.bg}]}>
          <Icon name={cfg.icon} size={11} color={cfg.color} />
          <Text style={[card.badgeText, {color: cfg.color}]}>{item.appointmentStatus}</Text>
        </View>
      </View>
      <View style={card.divider} />
      <View style={card.bottom}>
        <View style={card.meta}>
          <Icon name="calendar-outline" size={13} color={COLORS.textMuted} />
          <Text style={card.metaText}>{item.date ? format(new Date(item.date), 'dd MMM yyyy') : '—'}</Text>
        </View>
        <View style={card.meta}>
          <Icon name="clock-outline" size={13} color={COLORS.textMuted} />
          <Text style={card.metaText}>{item.timeSlot?.startTime || '—'}</Text>
        </View>
      </View>
      {item.appointmentStatus !== 'COMPLETED' && item.appointmentStatus !== 'CANCELLED' && (
        <View style={card.quickActions}>
          {item.appointmentStatus === 'CONFIRMED' && (
            <TouchableOpacity
              style={[card.qBtn, {backgroundColor: '#FEF3C7'}]}
              onPress={() => onAction(item.id, 'IN_PROGRESS')}>
              <Icon name="clock-outline" size={13} color="#B45309" />
              <Text style={[card.qText, {color: '#B45309'}]}>Start</Text>
            </TouchableOpacity>
          )}
          {item.appointmentStatus === 'IN_PROGRESS' && (
            <TouchableOpacity
              style={[card.qBtn, {backgroundColor: '#D1FAE5'}]}
              onPress={() => onAction(item.id, 'COMPLETED')}>
              <Icon name="check-all" size={13} color="#065F46" />
              <Text style={[card.qText, {color: '#065F46'}]}>Complete</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[card.qBtn, {backgroundColor: '#FEE2E2'}]}
            onPress={() => onAction(item.id, 'CANCELLED')}>
            <Icon name="close-circle-outline" size={13} color="#991B1B" />
            <Text style={[card.qText, {color: '#991B1B'}]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function DoctorAppointmentsScreen({navigation}: any) {
  const insets      = useSafeAreaInsets();
  const {user}      = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter]           = useState('ALL');
  const [selected, setSelected]       = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [page, setPage]               = useState(1);

  const {data, isLoading, isRefetching, refetch} = useQuery({
    queryKey: ['doctor-appointments', filter, page],
    queryFn: async () => {
      const params: any = {page, limit: 20};
      if (filter !== 'ALL') params.status = filter;
      const res = await instance.get(api.doctorGetAllAppointments, {params});
      return res.data;
    },
  });

  const appointments = data?.data || [];
  const meta         = data?.metadata;

  const statusMutation = useMutation({
    mutationFn: ({id, status}: {id: string; status: string}) =>
      instance.patch(api.updateAppointmentStatus, {appointmentId: id, status}),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['doctor-appointments']});
      queryClient.invalidateQueries({queryKey: ['doctor-stats']});
    },
    onError: (err: any) => {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to update status');
    },
  });

  const counts = {
    ALL:         meta?.totalItems || 0,
    CONFIRMED:   appointments.filter((a: any) => a.appointmentStatus === 'CONFIRMED').length,
    IN_PROGRESS: appointments.filter((a: any) => a.appointmentStatus === 'IN_PROGRESS').length,
    COMPLETED:   appointments.filter((a: any) => a.appointmentStatus === 'COMPLETED').length,
    CANCELLED:   appointments.filter((a: any) => a.appointmentStatus === 'CANCELLED').length,
  };

  if (isLoading) return <LoadingScreen message="Loading appointments..." />;

  return (
    <View style={[s.safe, {paddingTop: insets.top, paddingBottom: insets.bottom}]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} translucent={false} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Icon name="arrow-left" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <View style={{flex: 1}}>
          <Text style={s.headerTitle}>My Appointments</Text>
          <Text style={s.headerSub}>{user?.name || 'Doctor'} · {meta?.totalItems || 0} total</Text>
        </View>
      </View>

      {/* Summary cards */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.summaryRow}>
        {Object.entries(STATUS_CONFIG).map(([st, cfg]) => (
          <TouchableOpacity
            key={st}
            style={[s.summaryCard, {backgroundColor: cfg.bg}]}
            onPress={() => {setFilter(st); setPage(1);}}>
            <Icon name={cfg.icon} size={20} color={cfg.color} />
            <Text style={[s.summaryCount, {color: cfg.color}]}>
              {appointments.filter((a: any) => a.appointmentStatus === st).length}
            </Text>
            <Text style={[s.summaryLabel, {color: cfg.color}]}>{st.replace('_', ' ')}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Filter tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabRow}>
        {FILTER_TABS.map(tab => {
          const active = filter === tab.value;
          return (
            <TouchableOpacity
              key={tab.value}
              style={[s.tab, active && s.tabActive]}
              onPress={() => {setFilter(tab.value); setPage(1);}}>
              <Text style={[s.tabText, active && s.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* List */}
      <FlatList
        data={appointments}
        keyExtractor={item => item.id}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        onRefresh={refetch}
        refreshing={isRefetching}
        ListEmptyComponent={
          <EmptyState
            icon="calendar-remove-outline"
            title="No appointments found"
            subtitle="No appointments match the selected filter"
          />
        }
        ListFooterComponent={
          meta?.hasNextPage ? (
            <TouchableOpacity style={s.loadMore} onPress={() => setPage(p => p + 1)}>
              <Text style={s.loadMoreText}>Load More</Text>
            </TouchableOpacity>
          ) : null
        }
        renderItem={({item}) => (
          <AppointmentCard
            item={item}
            onPress={() => {setSelected(item); setModalVisible(true);}}
            onAction={(id, status) => statusMutation.mutate({id, status})}
          />
        )}
      />

      <DetailModal
        appointment={selected}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAction={(id, status) => statusMutation.mutate({id, status})}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:         {flex: 1, backgroundColor: COLORS.primary},
  header:       {flexDirection: 'row', alignItems: 'center', padding: SPACING.lg, gap: SPACING.md},
  backBtn:      {padding: 4},
  headerTitle:  {fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, color: COLORS.white},
  headerSub:    {fontSize: FONTS.sizes.xs, color: 'rgba(255,255,255,0.75)', marginTop: 2},
  summaryRow:   {paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md, gap: SPACING.sm, paddingRight: SPACING.xl},
  summaryCard:  {alignItems: 'center', borderRadius: RADIUS.md, padding: SPACING.md, minWidth: 90, gap: 2},
  summaryCount: {fontSize: FONTS.sizes.xl, fontWeight: FONTS.weights.bold},
  summaryLabel: {fontSize: 9, fontWeight: FONTS.weights.medium, textAlign: 'center'},
  tabRow:       {paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm, gap: SPACING.xs, paddingRight: SPACING.xl},
  tab:          {paddingHorizontal: SPACING.md, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', minWidth: 80, alignItems: 'center'},
  tabActive:    {backgroundColor: COLORS.white},
  tabText:      {fontSize: FONTS.sizes.xs, color: 'rgba(255,255,255,0.8)', fontWeight: FONTS.weights.medium},
  tabTextActive:{color: COLORS.primary, fontWeight: FONTS.weights.bold},
  list:         {padding: SPACING.lg, paddingTop: SPACING.sm, backgroundColor: '#F5F7FA', minHeight: '100%'},
  empty:        {alignItems: 'center', paddingTop: 60, gap: SPACING.md},
  emptyText:    {color: COLORS.textMuted, fontSize: FONTS.sizes.base},
  loadMore:     {margin: SPACING.base, padding: SPACING.md, backgroundColor: COLORS.white, borderRadius: RADIUS.md, alignItems: 'center'},
  loadMoreText: {color: COLORS.primary, fontWeight: FONTS.weights.semibold},
});

const card = StyleSheet.create({
  wrap:         {backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: {width: 0, height: 2}},
  top:          {flexDirection: 'row', alignItems: 'center', gap: SPACING.sm},
  avatarWrap:   {width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center'},
  avatarText:   {fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.bold, color: COLORS.primary},
  name:         {fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.semibold, color: COLORS.text},
  sub:          {fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: 2},
  badge:        {flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20},
  badgeText:    {fontSize: 9, fontWeight: FONTS.weights.semibold},
  divider:      {height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.sm},
  bottom:       {flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md},
  meta:         {flexDirection: 'row', alignItems: 'center', gap: 4},
  metaText:     {fontSize: FONTS.sizes.xs, color: COLORS.textSecondary},
  quickActions: {flexDirection: 'row', gap: SPACING.xs, marginTop: SPACING.sm, flexWrap: 'wrap'},
  qBtn:         {flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: SPACING.sm, paddingVertical: 5, borderRadius: RADIUS.sm},
  qText:        {fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.semibold},
});

const modal = StyleSheet.create({
  overlay:    {flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end'},
  sheet:      {backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.xl, paddingTop: SPACING.md},
  handle:     {width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center', marginBottom: SPACING.md},
  header:     {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.md},
  title:      {fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, color: COLORS.text},
  closeBtn:   {padding: 4},
  badge:      {flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: SPACING.md, paddingVertical: 5, borderRadius: 20, marginBottom: SPACING.md},
  badgeText:  {fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.semibold},
  section:    {gap: SPACING.sm, marginBottom: SPACING.lg},
  row:        {flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm},
  rowLabel:   {fontSize: FONTS.sizes.sm, color: COLORS.textMuted, width: 90},
  rowValue:   {fontSize: FONTS.sizes.sm, color: COLORS.text, fontWeight: FONTS.weights.medium, flex: 1},
  actions:    {flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap'},
  actionBtn:  {flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: SPACING.sm, borderRadius: RADIUS.md},
  actionText: {fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.semibold},
});