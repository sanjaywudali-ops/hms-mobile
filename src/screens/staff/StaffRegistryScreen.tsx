import React, {useState} from 'react';
import {View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl} from 'react-native';
import {useQuery} from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {COLORS, FONTS, SPACING, RADIUS, SHADOW} from '../../constants/theme';
import {api} from '../../constants/api';
import {instance} from '../../services/axios';
import {SearchBar, Badge, EmptyState, LoadingScreen, ScreenHeader} from '../../components/common';

const ROLE_COLORS: Record<string, {bg: string; text: string}> = {
  DOCTOR: {bg: COLORS.primaryLight, text: COLORS.primary},
  NURSE: {bg: COLORS.successLight, text: COLORS.success},
  ADMIN: {bg: '#f5f3ff', text: '#7c3aed'},
  PHARMACIST: {bg: '#fff7ed', text: COLORS.orange},
  LAB_TECHNICIAN: {bg: COLORS.warningLight, text: COLORS.warning},
};

export default function StaffRegistryScreen({navigation}: any) {
  const [search, setSearch] = useState('');

  const {data, isLoading, isRefetching, refetch} = useQuery({
    queryKey: ['staff', search],
    queryFn: async () => {
      const params: any = {};
      if (search) params.search = search;
      const res = await instance.get(api.getAllStaff, {params});
      return res.data;
    },
  });

  const staff = data?.data || [];

  const renderItem = ({item}: any) => {
    const roleColor = ROLE_COLORS[item.role?.name] || {bg: COLORS.borderLight, text: COLORS.textSecondary};
    return (
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <View style={[styles.avatar, {backgroundColor: roleColor.bg}]}>
            <Icon name="account-tie-outline" size={22} color={roleColor.text} />
          </View>
          <View style={{flex: 1}}>
            <Text style={styles.name}>{item.user?.fName} {item.user?.lName}</Text>
            <Text style={styles.employeeId}>{item.employeeCode || item.id?.slice(-8)}</Text>
          </View>
          <View style={[styles.roleBadge, {backgroundColor: roleColor.bg}]}>
            <Text style={[styles.roleText, {color: roleColor.text}]}>{item.role?.name || 'Staff'}</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          {item.department?.name && (
            <View style={styles.metaItem}>
              <Icon name="hospital-building" size={12} color={COLORS.textMuted} />
              <Text style={styles.metaText}>{item.department.name}</Text>
            </View>
          )}
          {item.user?.phone && (
            <View style={styles.metaItem}>
              <Icon name="phone-outline" size={12} color={COLORS.textMuted} />
              <Text style={styles.metaText}>{item.user.phone}</Text>
            </View>
          )}
          {item.user?.email && (
            <View style={styles.metaItem}>
              <Icon name="email-outline" size={12} color={COLORS.textMuted} />
              <Text style={styles.metaText}>{item.user.email}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (isLoading) return <LoadingScreen message="Loading staff..." />;

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Staff Registry" subtitle={`${staff.length} members`} navigation={navigation} />
      <View style={styles.searchWrap}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search by name, role, department..." />
      </View>
      <FlatList
        data={staff}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary} />}
        ListEmptyComponent={<EmptyState icon="badge-account-outline" title="No staff found" subtitle="No staff match the search criteria" />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: COLORS.background},
  searchWrap: {padding: SPACING.base, backgroundColor: COLORS.white},
  list: {padding: SPACING.base, gap: SPACING.sm},
  card: {backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.base, ...SHADOW.sm},
  cardRow: {flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm},
  avatar: {width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center'},
  name: {fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.semibold, color: COLORS.text},
  employeeId: {fontSize: FONTS.sizes.xs, color: COLORS.textMuted},
  roleBadge: {paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full},
  roleText: {fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.semibold},
  infoRow: {flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm},
  metaItem: {flexDirection: 'row', alignItems: 'center', gap: 4},
  metaText: {fontSize: FONTS.sizes.xs, color: COLORS.textSecondary},
});
