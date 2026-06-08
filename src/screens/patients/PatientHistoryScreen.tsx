import React, {useState} from 'react';
import {View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl} from 'react-native';
import {useQuery} from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {COLORS, FONTS, SPACING, RADIUS, SHADOW} from '../../constants/theme';
import {api} from '../../constants/api';
import {instance} from '../../services/axios';
import {SearchBar, EmptyState, LoadingScreen, ScreenHeader} from '../../components/common';

export default function PatientHistoryScreen({navigation}: any) {
  const [search, setSearch] = useState('');

  const {data, isLoading, isRefetching, refetch} = useQuery({
    queryKey: ['patients', search],
    queryFn: async () => {
      const params: any = {};
      if (search) params.search = search;
      const res = await instance.get(api.getPatients, {params});
      return res.data;
    },
  });

  const patients = data?.data || [];

  const renderItem = ({item}: any) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('PatientHistoryDetail', {id: item.id})}
      activeOpacity={0.78}>
      <View style={styles.cardRow}>
        <View style={styles.avatar}>
          <Icon name="account-outline" size={22} color={COLORS.primary} />
        </View>
        <View style={{flex: 1}}>
          <Text style={styles.name}>{item.user?.fName} {item.user?.lName}</Text>
          <Text style={styles.code}>{item.patientCode}</Text>
        </View>
        <View style={styles.meta}>
          {item.patientInfo?.bloodGroup && (
            <View style={styles.bloodGroup}>
              <Text style={styles.bloodGroupText}>{item.patientInfo.bloodGroup}</Text>
            </View>
          )}
          <Icon name="chevron-right" size={18} color={COLORS.textMuted} />
        </View>
      </View>
      <View style={styles.infoRow}>
        {item.patientInfo?.age && (
          <Text style={styles.infoText}><Icon name="human" size={10} /> Age {item.patientInfo.age}</Text>
        )}
        {item.patientInfo?.gender && (
          <Text style={styles.infoText}> · {item.patientInfo.gender}</Text>
        )}
        {item.user?.phone && (
          <Text style={styles.infoText}> · {item.user.phone}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (isLoading) return <LoadingScreen message="Loading patients..." />;

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Patient History" subtitle={`${patients.length} patients`} navigation={navigation} />
      <View style={styles.searchWrap}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search by name, code, phone..." />
      </View>
      <FlatList
        data={patients}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary} />}
        ListEmptyComponent={<EmptyState icon="account-search-outline" title="No patients found" subtitle="Try a different search term" />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: COLORS.background},
  searchWrap: {padding: SPACING.base, backgroundColor: COLORS.white},
  list: {padding: SPACING.base, gap: SPACING.sm},
  card: {backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.base, ...SHADOW.sm},
  cardRow: {flexDirection: 'row', alignItems: 'center', gap: SPACING.sm},
  avatar: {width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center'},
  name: {fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.semibold, color: COLORS.text},
  code: {fontSize: FONTS.sizes.xs, color: COLORS.textMuted},
  meta: {flexDirection: 'row', alignItems: 'center', gap: SPACING.xs},
  bloodGroup: {backgroundColor: COLORS.errorLight, paddingHorizontal: SPACING.xs + 2, paddingVertical: 2, borderRadius: RADIUS.sm},
  bloodGroupText: {fontSize: FONTS.sizes.xs, color: COLORS.error, fontWeight: FONTS.weights.bold},
  infoRow: {flexDirection: 'row', flexWrap: 'wrap', marginTop: SPACING.xs},
  infoText: {fontSize: FONTS.sizes.xs, color: COLORS.textSecondary},
});
