import React, {useState} from 'react';
import {View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl} from 'react-native';
import {useQuery} from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {format} from 'date-fns';
import {COLORS, FONTS, SPACING, RADIUS, SHADOW} from '../../constants/theme';
import {api} from '../../constants/api';
import {instance} from '../../services/axios';
import {SearchBar, Badge, Button, EmptyState, LoadingScreen, ScreenHeader} from '../../components/common';

export default function PharmacyScreen({navigation}: any) {
  const [search, setSearch] = useState('');

  const {data, isLoading, isRefetching, refetch} = useQuery({
    queryKey: ['pharmacy-bills', search],
    queryFn: async () => {
      const params: any = {};
      if (search) params.search = search;
      const res = await instance.get(api.getPharmacyBills, {params});
      return res.data;
    },
  });

  const bills = data?.data || [];

  const renderItem = ({item}: any) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('PharmacyBillDetail', {id: item.id})}
      activeOpacity={0.78}>
      <View style={styles.cardTop}>
        <View style={styles.pillIcon}>
          <Icon name="pill" size={22} color={COLORS.orange} />
        </View>
        <View style={{flex: 1}}>
          <Text style={styles.billId}>Bill #{item.billNumber || item.id?.slice(-6)}</Text>
          <Text style={styles.billSub}>
            {item.patient?.user?.fName} {item.patient?.user?.lName}
          </Text>
        </View>
        <Text style={styles.amount}>₹{(item.totalAmount || 0).toLocaleString()}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.cardMeta}>
        <View style={styles.metaItem}>
          <Icon name="calendar-outline" size={12} color={COLORS.textMuted} />
          <Text style={styles.metaText}>{item.createdAt ? format(new Date(item.createdAt), 'dd MMM yyyy') : '—'}</Text>
        </View>
        <View style={styles.metaItem}>
          <Icon name="package-variant" size={12} color={COLORS.textMuted} />
          <Text style={styles.metaText}>{item.items?.length || 0} items</Text>
        </View>
        <Badge
          label={item.paymentStatus || 'PENDING'}
          variant={item.paymentStatus === 'PAID' ? 'completed' : 'inProgress'}
        />
      </View>
    </TouchableOpacity>
  );

  if (isLoading) return <LoadingScreen message="Loading pharmacy bills..." />;

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Pharmacy"
        subtitle={`${bills.length} bills`}
        navigation={navigation}
        rightAction={{icon: 'plus', onPress: () => navigation.navigate('GenerateBill')}}
      />

      <View style={styles.searchWrap}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search bills, patients..." />
      </View>

      <FlatList
        data={bills}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary} />}
        ListEmptyComponent={<EmptyState icon="pill" title="No bills found" subtitle="No pharmacy bills match the search" />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: COLORS.background},
  searchWrap: {padding: SPACING.base, backgroundColor: COLORS.white},
  list: {padding: SPACING.base, gap: SPACING.sm},
  card: {backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.base, ...SHADOW.sm},
  cardTop: {flexDirection: 'row', alignItems: 'center', gap: SPACING.sm},
  pillIcon: {width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff7ed', justifyContent: 'center', alignItems: 'center'},
  billId: {fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.semibold, color: COLORS.text},
  billSub: {fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginTop: 2},
  amount: {fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: COLORS.orange},
  divider: {height: 1, backgroundColor: COLORS.borderLight, marginVertical: SPACING.sm},
  cardMeta: {flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, alignItems: 'center'},
  metaItem: {flexDirection: 'row', alignItems: 'center', gap: 4},
  metaText: {fontSize: FONTS.sizes.xs, color: COLORS.textSecondary},
});
