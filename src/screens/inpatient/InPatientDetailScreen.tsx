import React, {useState} from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import {format} from 'date-fns';
import {COLORS, FONTS, SPACING, RADIUS, SHADOW} from '../../constants/theme';
import {api} from '../../constants/api';
import {instance} from '../../services/axios';
import {ScreenHeader, Badge, Button, Card, InfoRow, LoadingScreen} from '../../components/common';

function statusVariant(status: string) {
  const map: Record<string, any> = {
    ADMITTED: 'admitted', PLANNED: 'planned',
    DISCHARGE_STARTED: 'inProgress', DISCHARGED: 'discharged', CANCELLED: 'cancelled',
  };
  return map[status] || 'default';
}

export default function InPatientDetailScreen({route, navigation}: any) {
  const {id} = route.params;
  const queryClient = useQueryClient();

  const {data, isLoading} = useQuery({
    queryKey: ['admission', id],
    queryFn: async () => {
      const res = await instance.get(api.getAdmissionById(id));
      return res.data.data;
    },
  });

  const dischargeMutation = useMutation({
    mutationFn: () => instance.patch(api.dischargePatient(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['admission', id]});
      queryClient.invalidateQueries({queryKey: ['inpatients']});
      Toast.show({type: 'success', text1: 'Patient Discharged', text2: 'Discharge process initiated.'});
    },
    onError: (err: any) => {
      Toast.show({type: 'error', text1: 'Error', text2: err?.response?.data?.message || 'Failed to discharge'});
    },
  });

  const handleDischarge = () => {
    Alert.alert('Confirm Discharge', 'Are you sure you want to initiate discharge for this patient?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Discharge', style: 'destructive', onPress: () => dischargeMutation.mutate()},
    ]);
  };

  if (isLoading || !data) return <LoadingScreen message="Loading patient details..." />;

  const patient = data.patient?.user;
  const info = data.patient?.patientInfo;
  const doctor = data.admittingDoctor?.user;
  const room = data.roomBooking?.room;

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Patient Details" navigation={navigation} />
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Patient Hero */}
        <View style={styles.hero}>
          <View style={styles.avatar}>
            <Icon name="account" size={36} color={COLORS.primary} />
          </View>
          <View style={{flex: 1}}>
            <Text style={styles.heroName}>{patient?.fName} {patient?.lName}</Text>
            <Text style={styles.heroSub}>
              {info?.age ? `Age ${info.age}` : ''}{info?.gender ? ` · ${info.gender}` : ''}
            </Text>
          </View>
          <Badge label={data.status} variant={statusVariant(data.status)} />
        </View>

        {/* Admission Info */}
        <Card style={{margin: SPACING.base}}>
          <Text style={styles.sectionTitle}>Admission Details</Text>
          <InfoRow label="Admission Date" value={data.admissionDateTime ? format(new Date(data.admissionDateTime), 'dd MMM yyyy, hh:mm a') : '—'} icon="calendar" />
          <InfoRow label="Expected Discharge" value={data.expectedDischargeDate ? format(new Date(data.expectedDischargeDate), 'dd MMM yyyy') : '—'} icon="calendar-check" />
          <InfoRow label="Reason" value={data.reasonForAdmission || '—'} icon="medical-bag" />
          <InfoRow label="Type" value={data.admissionType || '—'} icon="tag-outline" />
          <InfoRow label="Priority" value={data.priority || '—'} icon="alert-circle-outline" />
        </Card>

        {/* Doctor Info */}
        <Card style={{marginHorizontal: SPACING.base}}>
          <Text style={styles.sectionTitle}>Attending Doctor</Text>
          <InfoRow label="Doctor" value={doctor ? `Dr. ${doctor.fName} ${doctor.lName}` : '—'} icon="stethoscope" />
          <InfoRow label="Specialization" value={data.admittingDoctor?.specialization || '—'} icon="brain" />
          <InfoRow label="Department" value={data.admittingDoctor?.department?.name || '—'} icon="hospital-building" />
        </Card>

        {/* Room Info */}
        {room && (
          <Card style={{marginHorizontal: SPACING.base}}>
            <Text style={styles.sectionTitle}>Room Details</Text>
            <InfoRow label="Room Number" value={room.roomNumber || '—'} icon="bed-outline" />
            <InfoRow label="Room Type" value={room.roomType?.name || '—'} icon="door-open" />
            <InfoRow label="Floor" value={room.floor?.toString() || '—'} icon="layers-outline" />
            <InfoRow label="Ward" value={room.ward || '—'} icon="map-marker-outline" />
          </Card>
        )}

        {/* Vitals shortcut */}
        <Card style={{marginHorizontal: SPACING.base}}>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => navigation.navigate('InPatientVitals', {patientId: data.patient?.id, admissionId: id})}>
            <Icon name="heart-pulse" size={22} color={COLORS.error} />
            <Text style={styles.actionLabel}>View Vitals</Text>
            <Icon name="chevron-right" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        </Card>

        {/* Actions */}
        <View style={styles.actions}>
          {(data.status === 'ADMITTED' || data.status === 'PLANNED') && (
            <Button
              label="Initiate Discharge"
              onPress={handleDischarge}
              variant="destructive"
              loading={dischargeMutation.isPending}
              icon="exit-run"
              fullWidth
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: COLORS.background},
  scroll: {paddingBottom: SPACING.xxxl},
  hero: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    backgroundColor: COLORS.white, padding: SPACING.base,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  avatar: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center',
  },
  heroName: {fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: COLORS.text},
  heroSub: {fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginTop: 2},
  sectionTitle: {fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.bold, color: COLORS.text, marginBottom: SPACING.sm},
  actionRow: {flexDirection: 'row', alignItems: 'center', gap: SPACING.sm},
  actionLabel: {flex: 1, fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.medium, color: COLORS.text},
  actions: {margin: SPACING.base, gap: SPACING.sm},
});
