import React, {useState, useCallback} from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, StatusBar, ActivityIndicator, Alert, Modal,
  ScrollView, RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {format} from 'date-fns';
import {COLORS, FONTS, SPACING, RADIUS, SHADOW} from '../../constants/theme';
import {instance} from '../../services/axios';

// ─── API ──────────────────────────────────────────────────────────────────────
const PHARMACY_API = {
  getAllBills:   '/api/v1/pharmacy/getAllBills',
  getBillById:  (id: string) => `/api/v1/pharmacy/getBillById/${id}`,
  processPayment:'/api/v1/patient/processPayment',
};

// ─── Types ────────────────────────────────────────────────────────────────────
type BillStatus = 'DRAFT' | 'ACTIVE' | 'PARTIAL' | 'PAID' | 'CANCELLED';

const STATUS_CONFIG: Record<BillStatus, {color: string; bg: string; icon: string; label: string}> = {
  DRAFT:     {color:'#6B7280', bg:'#F3F4F6', icon:'file-outline',         label:'Draft'},
  ACTIVE:    {color:'#D97706', bg:'#FEF3C7', icon:'alert-circle-outline', label:'Unpaid'},
  PARTIAL:   {color:'#B45309', bg:'#FEF9C3', icon:'clock-outline',        label:'Partial'},
  PAID:      {color:'#065F46', bg:'#D1FAE5', icon:'check-circle-outline', label:'Paid'},
  CANCELLED: {color:'#991B1B', bg:'#FEE2E2', icon:'close-circle-outline', label:'Cancelled'},
};

const FILTER_TABS: {label: string; value: BillStatus | 'ALL'}[] = [
  {label:'All',       value:'ALL'},
  {label:'Unpaid',    value:'ACTIVE'},
  {label:'Partial',   value:'PARTIAL'},
  {label:'Paid',      value:'PAID'},
  {label:'Draft',     value:'DRAFT'},
  {label:'Cancelled', value:'CANCELLED'},
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function computeTotal(items: any[]): number {
  return (items || [])
    .filter(i => i.status === 'ACTIVE')
    .reduce((sum, i) => {
      const line = (i.unitPrice || 0) * (i.quantity || 1);
      return sum + line + (((i.taxPercent || 0) / 100) * line);
    }, 0);
}

// ─── Bill Detail Modal ────────────────────────────────────────────────────────
function BillDetailModal({billId, visible, onClose, onPaymentSuccess}: {
  billId: string | null; visible: boolean;
  onClose: () => void; onPaymentSuccess: () => void;
}) {
  const queryClient  = useQueryClient();
  const [payAmount,  setPayAmount]  = useState('');
  const [payType,    setPayType]    = useState('CASH');
  const [showPayForm, setShowPayForm] = useState(false);

  const {data, isLoading} = useQuery({
    queryKey: ['bill-detail', billId],
    queryFn:  async () => {
      const res = await instance.get(PHARMACY_API.getBillById(billId!));
      return res.data?.data;
    },
    enabled: !!billId && visible,
  });

  const payMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await instance.post(PHARMACY_API.processPayment, payload);
      return res.data;
    },
    onSuccess: () => {
      Alert.alert('Success', 'Payment processed successfully');
      setShowPayForm(false); setPayAmount('');
      queryClient.invalidateQueries({queryKey: ['bill-detail', billId]});
      onPaymentSuccess();
    },
    onError: (err: any) => Alert.alert('Error', err?.response?.data?.message || 'Payment failed'),
  });

  const handlePayment = () => {
    if (!payAmount || isNaN(parseFloat(payAmount))) {
      Alert.alert('Required', 'Enter a valid amount'); return;
    }
    payMutation.mutate({
      billId,
      amount:      parseFloat(payAmount),
      paymentType: payType,
      patientId:   data?.patientId,
    });
  };

  const bill      = data;
  const total     = bill ? computeTotal(bill.items || []) : 0;
  const totalPaid = (bill?.payments || []).reduce((s: number, p: any) => s + (p.amount || 0), 0);
  const balance   = total - totalPaid;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={m.overlay}>
        <View style={m.sheet}>
          <View style={m.handle}/>
          <View style={m.header}>
            <Text style={m.title}>Bill Details</Text>
            <TouchableOpacity onPress={onClose} style={m.closeBtn}>
              <Icon name="close" size={20} color={COLORS.textSecondary}/>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <ActivityIndicator color={COLORS.primary} style={{padding: SPACING.xl}}/>
          ) : !bill ? (
            <Text style={{textAlign:'center', color: COLORS.textMuted, padding: SPACING.xl}}>Bill not found</Text>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Patient info */}
              <View style={m.section}>
                <Text style={m.sectionTitle}>Patient</Text>
                <Text style={m.patientName}>
                  {bill.patient
                    ? `${bill.patient.user?.fName||''} ${bill.patient.user?.lName||''}`.trim()
                    : bill.externalName || 'Walk-in Patient'}
                </Text>
                {bill.externalPhone && <Text style={m.metaText}>{bill.externalPhone}</Text>}
                <Text style={m.metaText}>Bill #{bill.id?.slice(-8)?.toUpperCase()}</Text>
                <Text style={m.metaText}>{bill.createdAt ? format(new Date(bill.createdAt), 'dd MMM yyyy, h:mm a') : '—'}</Text>
              </View>

              {/* Bill items */}
              <View style={m.section}>
                <Text style={m.sectionTitle}>Items</Text>
                {(bill.items || []).filter((i: any) => i.status === 'ACTIVE').map((item: any, idx: number) => {
                  const lineTotal = (item.unitPrice||0) * (item.quantity||1);
                  const tax = ((item.taxPercent||0)/100) * lineTotal;
                  return (
                    <View key={item.id||idx} style={m.itemRow}>
                      <View style={{flex:1}}>
                        <Text style={m.itemName}>{item.name || item.description || 'Item'}</Text>
                        <Text style={m.itemMeta}>
                          Qty: {item.quantity} × ₹{item.unitPrice}
                          {item.taxPercent ? ` + ${item.taxPercent}% tax` : ''}
                        </Text>
                      </View>
                      <Text style={m.itemTotal}>₹{(lineTotal + tax).toFixed(2)}</Text>
                    </View>
                  );
                })}
              </View>

              {/* Totals */}
              <View style={m.section}>
                <View style={m.totalRow}>
                  <Text style={m.totalLabel}>Total Amount</Text>
                  <Text style={m.totalValue}>₹{total.toFixed(2)}</Text>
                </View>
                <View style={m.totalRow}>
                  <Text style={m.totalLabel}>Paid</Text>
                  <Text style={[m.totalValue, {color: COLORS.success}]}>₹{totalPaid.toFixed(2)}</Text>
                </View>
                <View style={[m.totalRow, {borderTopWidth:1, borderTopColor: COLORS.border, paddingTop: SPACING.sm}]}>
                  <Text style={[m.totalLabel, {fontWeight: FONTS.weights.bold}]}>Balance</Text>
                  <Text style={[m.totalValue, {color: balance > 0 ? COLORS.error : COLORS.success, fontWeight: FONTS.weights.bold}]}>
                    ₹{balance.toFixed(2)}
                  </Text>
                </View>
              </View>

              {/* Payment history */}
              {(bill.payments || []).length > 0 && (
                <View style={m.section}>
                  <Text style={m.sectionTitle}>Payment History</Text>
                  {(bill.payments || []).map((pay: any, i: number) => (
                    <View key={i} style={m.payRow}>
                      <Text style={m.payType}>{pay.type || 'PAYMENT'}</Text>
                      <Text style={m.payAmount}>₹{pay.amount}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Process payment */}
              {bill.status !== 'PAID' && bill.status !== 'CANCELLED' && balance > 0 && (
                <View style={m.section}>
                  {!showPayForm ? (
                    <TouchableOpacity style={m.payBtn} onPress={() => setShowPayForm(true)}>
                      <Icon name="cash" size={18} color={COLORS.white}/>
                      <Text style={m.payBtnText}>Process Payment</Text>
                    </TouchableOpacity>
                  ) : (
                    <View>
                      <Text style={m.sectionTitle}>Process Payment</Text>
                      <Text style={m.fieldLabel}>Amount (Balance: ₹{balance.toFixed(2)})</Text>
                      <TextInput
                        style={m.input}
                        placeholder={`Enter amount (max ₹${balance.toFixed(2)})`}
                        placeholderTextColor={COLORS.textMuted}
                        value={payAmount}
                        onChangeText={setPayAmount}
                        keyboardType="decimal-pad"
                      />
                      <Text style={m.fieldLabel}>Payment Type</Text>
                      <View style={m.payTypeRow}>
                        {['CASH','CARD','UPI','INSURANCE'].map(type => (
                          <TouchableOpacity
                            key={type}
                            style={[m.payTypeBtn, payType===type && m.payTypeBtnActive]}
                            onPress={() => setPayType(type)}>
                            <Text style={[m.payTypeBtnText, payType===type && m.payTypeBtnTextActive]}>{type}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      <View style={{flexDirection:'row', gap: SPACING.sm, marginTop: SPACING.md}}>
                        <TouchableOpacity style={m.cancelBtn} onPress={() => setShowPayForm(false)}>
                          <Text style={m.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[m.payBtn, {flex:1, opacity: payMutation.isPending ? 0.7 : 1}]}
                          onPress={handlePayment}
                          disabled={payMutation.isPending}>
                          {payMutation.isPending
                            ? <ActivityIndicator color={COLORS.white}/>
                            : <Text style={m.payBtnText}>Confirm Payment</Text>
                          }
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ─── Bill Card ────────────────────────────────────────────────────────────────
function BillCard({item, onPress}: {item: any; onPress: () => void}) {
  const cfg         = STATUS_CONFIG[item.status as BillStatus] || STATUS_CONFIG['DRAFT'];
  const patientName = item.patient
    ? `${item.patient.user?.fName||''} ${item.patient.user?.lName||''}`.trim()
    : item.externalName || 'Walk-in Patient';
  const total       = computeTotal(item.items || []);
  const totalPaid   = (item.payments||[]).reduce((s: number, p: any) => s + (p.amount||0), 0);
  const balance     = total - totalPaid;
  const initials    = patientName.split(' ').map((n:string)=>n[0]).join('').slice(0,2).toUpperCase();

  return (
    <TouchableOpacity style={c.wrap} onPress={onPress} activeOpacity={0.85}>
      <View style={c.top}>
        <View style={c.avatar}>
          <Text style={c.avatarText}>{initials}</Text>
        </View>
        <View style={{flex:1}}>
          <Text style={c.name}>{patientName}</Text>
          <Text style={c.metaText}>Bill #{item.id?.slice(-8)?.toUpperCase()}</Text>
        </View>
        <View style={[c.badge, {backgroundColor: cfg.bg}]}>
          <Icon name={cfg.icon} size={11} color={cfg.color}/>
          <Text style={[c.badgeText, {color:cfg.color}]}>{cfg.label}</Text>
        </View>
      </View>

      <View style={c.divider}/>

      <View style={c.bottom}>
        <View style={c.infoItem}>
          <Icon name="calendar-outline" size={13} color={COLORS.textMuted}/>
          <Text style={c.infoText}>{item.createdAt ? format(new Date(item.createdAt), 'dd MMM yyyy') : '—'}</Text>
        </View>
        <View style={c.infoItem}>
          <Icon name="pill" size={13} color={COLORS.textMuted}/>
          <Text style={c.infoText}>{(item.items||[]).filter((i:any)=>i.status==='ACTIVE').length} item(s)</Text>
        </View>
      </View>

      <View style={c.amountRow}>
        <View>
          <Text style={c.amountLabel}>Total</Text>
          <Text style={c.amountValue}>₹{total.toFixed(2)}</Text>
        </View>
        <View style={{alignItems:'center'}}>
          <Text style={c.amountLabel}>Paid</Text>
          <Text style={[c.amountValue, {color: COLORS.success}]}>₹{totalPaid.toFixed(2)}</Text>
        </View>
        <View style={{alignItems:'flex-end'}}>
          <Text style={c.amountLabel}>Balance</Text>
          <Text style={[c.amountValue, {color: balance > 0 ? COLORS.error : COLORS.success}]}>₹{balance.toFixed(2)}</Text>
        </View>
      </View>

      {item.status !== 'PAID' && item.status !== 'CANCELLED' && (
        <TouchableOpacity style={c.viewBtn} onPress={onPress}>
          <Icon name="cash" size={14} color={COLORS.primary}/>
          <Text style={c.viewBtnText}>View & Pay</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

// ─── Stats Banner ─────────────────────────────────────────────────────────────
function StatsBanner({stats}: {stats: any}) {
  if (!stats) return null;
  return (
    <View style={sb.wrap}>
      <View style={sb.item}>
        <Text style={sb.label}>Revenue</Text>
        <Text style={sb.value}>₹{(stats.totalRevenue||0).toFixed(0)}</Text>
      </View>
      <View style={sb.divider}/>
      <View style={sb.item}>
        <Text style={sb.label}>Collected</Text>
        <Text style={[sb.value, {color:'#065F46'}]}>₹{(stats.totalCollected||0).toFixed(0)}</Text>
      </View>
      <View style={sb.divider}/>
      <View style={sb.item}>
        <Text style={sb.label}>Outstanding</Text>
        <Text style={[sb.value, {color: COLORS.error}]}>₹{(stats.totalOutstanding||0).toFixed(0)}</Text>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function PharmacyScreen({navigation}: any) {
  const insets      = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [filter,    setFilter]    = useState<BillStatus | 'ALL'>('ALL');
  const [search,    setSearch]    = useState('');
  const [page,      setPage]      = useState(1);
  const [selectedBillId, setSelectedBillId] = useState<string|null>(null);
  const [showDetail,     setShowDetail]     = useState(false);

  const {data, isLoading, isRefetching, refetch} = useQuery({
    queryKey: ['pharmacy-bills', filter, page, search],
    queryFn: async () => {
      const params: any = {page, limit: 15};
      if (filter !== 'ALL')   params.status      = filter;
      if (search.trim())      params.searchQuery  = search.trim();
      const res = await instance.get(PHARMACY_API.getAllBills, {params});
      return res.data;
    },
  });

  const bills    = data?.data     || [];
  const meta     = data?.metadata;
  const stats    = meta?.stats;

  const handleSearch = useCallback((text: string) => {
    setSearch(text); setPage(1);
  }, []);

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
          <Text style={s.headerTitle}>Pharmacy & Billing</Text>
          <Text style={s.headerSub}>{meta?.total || 0} total bills</Text>
        </View>
        <TouchableOpacity style={s.refreshBtn} onPress={() => refetch()}>
          <Icon name="refresh" size={20} color={COLORS.white}/>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <StatsBanner stats={stats}/>

      {/* Search */}
      <View style={s.searchWrap}>
        <Icon name="magnify" size={18} color={COLORS.textMuted} style={{marginLeft: SPACING.sm}}/>
        <TextInput
          style={s.searchInput}
          placeholder="Search by patient name..."
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
        {FILTER_TABS.map(tab => {
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
        data={bills}
        keyExtractor={item => item.id}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        onRefresh={refetch}
        refreshing={isRefetching}
        ListEmptyComponent={
          <View style={s.empty}>
            <Icon name="receipt" size={48} color={COLORS.border}/>
            <Text style={s.emptyText}>No bills found</Text>
          </View>
        }
        ListFooterComponent={
          meta?.totalPages > page ? (
            <TouchableOpacity style={s.loadMore} onPress={() => setPage(p=>p+1)}>
              <Text style={s.loadMoreText}>Load More</Text>
            </TouchableOpacity>
          ) : null
        }
        renderItem={({item}) => (
          <BillCard
            item={item}
            onPress={() => {setSelectedBillId(item.id); setShowDetail(true);}}
          />
        )}
      />

      {/* Bill Detail Modal */}
      <BillDetailModal
        billId={selectedBillId}
        visible={showDetail}
        onClose={() => {setShowDetail(false); setSelectedBillId(null);}}
        onPaymentSuccess={() => {
          queryClient.invalidateQueries({queryKey: ['pharmacy-bills']});
          setShowDetail(false);
        }}
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
  wrap:        {backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, elevation:2, shadowColor:'#000', shadowOpacity:0.06, shadowRadius:4, shadowOffset:{width:0,height:2}},
  top:         {flexDirection:'row', alignItems:'center', gap: SPACING.sm},
  avatar:      {width:42, height:42, borderRadius:21, backgroundColor: COLORS.primaryLight, justifyContent:'center', alignItems:'center'},
  avatarText:  {fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.bold, color: COLORS.primary},
  name:        {fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.semibold, color: COLORS.text},
  metaText:    {fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop:2},
  badge:       {flexDirection:'row', alignItems:'center', gap:3, paddingHorizontal:8, paddingVertical:4, borderRadius:20},
  badgeText:   {fontSize:9, fontWeight: FONTS.weights.bold},
  divider:     {height:1, backgroundColor: COLORS.border, marginVertical: SPACING.sm},
  bottom:      {flexDirection:'row', gap: SPACING.md},
  infoItem:    {flexDirection:'row', alignItems:'center', gap:4},
  infoText:    {fontSize: FONTS.sizes.xs, color: COLORS.textSecondary},
  amountRow:   {flexDirection:'row', justifyContent:'space-between', marginTop: SPACING.sm, backgroundColor: COLORS.background, borderRadius: RADIUS.sm, padding: SPACING.sm},
  amountLabel: {fontSize: FONTS.sizes.xs, color: COLORS.textMuted},
  amountValue: {fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.bold, color: COLORS.text},
  viewBtn:     {flexDirection:'row', alignItems:'center', justifyContent:'center', gap:6, marginTop: SPACING.sm, borderWidth:1, borderColor: COLORS.primary, borderRadius: RADIUS.sm, paddingVertical:7},
  viewBtnText: {fontSize: FONTS.sizes.sm, color: COLORS.primary, fontWeight: FONTS.weights.semibold},
});

const sb = StyleSheet.create({
  wrap:    {flexDirection:'row', backgroundColor:'rgba(255,255,255,0.15)', marginHorizontal: SPACING.lg, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm},
  item:    {flex:1, alignItems:'center'},
  label:   {fontSize: FONTS.sizes.xs, color:'rgba(255,255,255,0.75)'},
  value:   {fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.bold, color: COLORS.white, marginTop:2},
  divider: {width:1, backgroundColor:'rgba(255,255,255,0.2)'},
});

const m = StyleSheet.create({
  overlay:        {flex:1, backgroundColor:'rgba(0,0,0,0.4)', justifyContent:'flex-end'},
  sheet:          {backgroundColor: COLORS.white, borderTopLeftRadius:24, borderTopRightRadius:24, padding: SPACING.xl, paddingTop: SPACING.md, maxHeight:'90%'},
  handle:         {width:40, height:4, backgroundColor: COLORS.border, borderRadius:2, alignSelf:'center', marginBottom: SPACING.md},
  header:         {flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom: SPACING.md},
  title:          {fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, color: COLORS.text},
  closeBtn:       {padding:4},
  section:        {marginBottom: SPACING.lg},
  sectionTitle:   {fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.bold, color: COLORS.textSecondary, textTransform:'uppercase', letterSpacing:0.5, marginBottom: SPACING.sm},
  patientName:    {fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, color: COLORS.text},
  metaText:       {fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop:2},
  itemRow:        {flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', paddingVertical: SPACING.xs, borderBottomWidth:1, borderBottomColor: COLORS.borderLight},
  itemName:       {fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.medium, color: COLORS.text},
  itemMeta:       {fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop:2},
  itemTotal:      {fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.bold, color: COLORS.text},
  totalRow:       {flexDirection:'row', justifyContent:'space-between', paddingVertical:4},
  totalLabel:     {fontSize: FONTS.sizes.base, color: COLORS.textSecondary},
  totalValue:     {fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.semibold, color: COLORS.text},
  payRow:         {flexDirection:'row', justifyContent:'space-between', paddingVertical:4},
  payType:        {fontSize: FONTS.sizes.sm, color: COLORS.textSecondary},
  payAmount:      {fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.semibold, color: COLORS.success},
  fieldLabel:     {fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.medium, color: COLORS.text, marginBottom:4, marginTop: SPACING.sm},
  input:          {borderWidth:1, borderColor: COLORS.border, borderRadius: RADIUS.sm, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, fontSize: FONTS.sizes.base, color: COLORS.text},
  payTypeRow:     {flexDirection:'row', flexWrap:'wrap', gap: SPACING.xs, marginTop: SPACING.xs},
  payTypeBtn:     {paddingHorizontal: SPACING.md, paddingVertical:7, borderRadius: RADIUS.full, borderWidth:1, borderColor: COLORS.border, backgroundColor: COLORS.white},
  payTypeBtnActive:{backgroundColor: COLORS.primary, borderColor: COLORS.primary},
  payTypeBtnText: {fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, fontWeight: FONTS.weights.medium},
  payTypeBtnTextActive:{color: COLORS.white},
  payBtn:         {flexDirection:'row', alignItems:'center', justifyContent:'center', gap:6, backgroundColor: COLORS.primary, borderRadius: RADIUS.md, padding: SPACING.md},
  payBtnText:     {color: COLORS.white, fontWeight: FONTS.weights.bold, fontSize: FONTS.sizes.base},
  cancelBtn:      {paddingHorizontal: SPACING.xl, borderWidth:1, borderColor: COLORS.border, borderRadius: RADIUS.md, alignItems:'center', justifyContent:'center'},
  cancelBtnText:  {fontSize: FONTS.sizes.base, color: COLORS.textSecondary, fontWeight: FONTS.weights.medium},
});