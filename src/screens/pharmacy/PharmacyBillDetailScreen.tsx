import React from 'react';
import {View, Text, StyleSheet, ScrollView, FlatList} from 'react-native';
import {useQuery} from '@tanstack/react-query';
import {format} from 'date-fns';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {COLORS, FONTS, SPACING, RADIUS} from '../../constants/theme';
import {api} from '../../constants/api';
import {instance} from '../../services/axios';
import {ScreenHeader, Badge, Card, InfoRow, LoadingScreen} from '../../components/common';

export default function PharmacyBillDetailScreen({route, navigation}: any) {
  const {id} = route.params;

  const {data, isLoading} = useQuery({
    queryKey: ['pharmacy-bill', id],
    queryFn: async () => (await instance.get(api.getPharmacyBillById(id))).data.data,
  });

  if (isLoading || !data) return <LoadingScreen message="Loading bill..." />;

  const items = data.items || [];

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Bill Details" navigation={navigation} />
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.hero}>
          <View>
            <Text style={styles.billNo}>Bill #{data.billNumber || data.id?.slice(-6)}</Text>
            <Text style={styles.billDate}>{data.createdAt ? format(new Date(data.createdAt), 'dd MMM yyyy, hh:mm a') : '—'}</Text>
          </View>
          <Badge label={data.paymentStatus || 'PENDING'} variant={data.paymentStatus === 'PAID' ? 'completed' : 'inProgress'} />
        </View>

        {/* Patient */}
        <Card style={{margin: SPACING.base}}>
          <Text style={styles.sectionTitle}>Patient Information</Text>
          <InfoRow label="Name" value={data.patient?.user ? `${data.patient.user.fName} ${data.patient.user.lName}` : '—'} icon="account-outline" />
          <InfoRow label="Patient Code" value={data.patient?.patientCode || '—'} icon="identifier" />
          <InfoRow label="Phone" value={data.patient?.user?.phone || '—'} icon="phone-outline" />
        </Card>

        {/* Items */}
        <Card style={{marginHorizontal: SPACING.base}}>
          <Text style={styles.sectionTitle}>Medicines / Items</Text>
          {items.map((item: any, idx: number) => (
            <View key={idx} style={[styles.lineItem, idx < items.length - 1 && styles.lineItemBorder]}>
              <View style={{flex: 1}}>
                <Text style={styles.itemName}>{item.medicineName || item.itemName || 'Item'}</Text>
                <Text style={styles.itemMeta}>Qty: {item.quantity} × ₹{item.unitPrice || 0}</Text>
              </View>
              <Text style={styles.itemTotal}>₹{((item.quantity || 0) * (item.unitPrice || 0)).toLocaleString()}</Text>
            </View>
          ))}
        </Card>

        {/* Totals */}
        <Card style={{marginHorizontal: SPACING.base}}>
          <InfoRow label="Subtotal" value={`₹${(data.subtotal || 0).toLocaleString()}`} icon="calculator-variant-outline" />
          {data.discount > 0 && <InfoRow label="Discount" value={`-₹${(data.discount || 0).toLocaleString()}`} icon="tag-outline" />}
          {data.tax > 0 && <InfoRow label="Tax" value={`₹${(data.tax || 0).toLocaleString()}`} icon="percent-outline" />}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>₹{(data.totalAmount || 0).toLocaleString()}</Text>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: COLORS.background},
  scroll: {paddingBottom: SPACING.xxxl},
  hero: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.base, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border},
  billNo: {fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: COLORS.text},
  billDate: {fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginTop: 2},
  sectionTitle: {fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.bold, color: COLORS.text, marginBottom: SPACING.sm},
  lineItem: {flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.sm},
  lineItemBorder: {borderBottomWidth: 1, borderBottomColor: COLORS.borderLight},
  itemName: {fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.medium, color: COLORS.text},
  itemMeta: {fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginTop: 2},
  itemTotal: {fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.bold, color: COLORS.text},
  divider: {height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.sm},
  totalRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  totalLabel: {fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.bold, color: COLORS.text},
  totalValue: {fontSize: FONTS.sizes.xl, fontWeight: FONTS.weights.bold, color: COLORS.orange},
});
