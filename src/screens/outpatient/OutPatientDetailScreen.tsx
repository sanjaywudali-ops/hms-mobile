import React from 'react';
import {View, Text, StyleSheet, ScrollView, Alert} from 'react-native';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import {format} from 'date-fns';
import {COLORS, FONTS, SPACING} from '../../constants/theme';
import {api} from '../../constants/api';
import {instance} from '../../services/axios';
import {ScreenHeader, Badge, Button, Card, InfoRow, LoadingScreen} from '../../components/common';

function statusVariant(status: string) {
  const map: Record<string, any> = {
    CONFIRMED: 'planned', IN_PROGRESS: 'inProgress',
    COMPLETED: 'completed', CANCELLED: 'cancelled',
  };
  return map[status] || 'default';
}

export default function OutPatientDetailScreen({route, navigation}: any) {
  const {id} = route.params;
  const queryClient = useQueryClient();

  const {data, isLoading} = useQuery({
    queryKey: ['appointment', id],
    queryFn: async () => {
      const res = await instance.get(`/api/v1/patient/getAppointment/${id}`);
      return res.data.data;
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) =>
      instance.patch(api.updateAppointmentStatus, {appointmentId: id, status}),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['appointment', id]});
      queryClient.invalidateQueries({queryKey: ['appointments']});
      Toast.show({type: 'success', text1: 'Status Updated'});
    },
    onError: (err: any) => {
      Toast.show({type: 'error', text1: 'Error', text2: err?.response?.data?.message || 'Update failed'});
    },
  });

  const convertToInPatient = useMutation({
    mutationFn: () => instance.patch(api.getUpdateAppointmentStatus(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['appointments']});
      Toast.show({type: 'success', text1: 'Converted to In-Patient'});
      navigation.goBack();
    },
    onError: (err: any) => {
      Toast.show({type: 'error', text1: 'Error', text2: err?.response?.data?.message || 'Conversion failed'});
    },
  });

  if (isLoading || !data) return <LoadingScreen message="Loading appointment..." />;

  const patient = data.patient?.user;
  const info = data.patient?.patientInfo;
  const doctor = data.doctor?.user;

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Appointment Details" navigation={navigation} />
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.tokenBadge}>
            <Text style={styles.tokenText}>#{data.tokenNumber || '—'}</Text>
          </View>
          <View style={{flex: 1}}>
            <Text style={styles.heroName}>{patient?.fName} {patient?.lName}</Text>
            <Text style={styles.heroSub}>
              {info?.age ? `Age ${info.age}` : ''}{info?.gender ? ` · ${info.gender}` : ''}
            </Text>
          </View>
          <Badge label={data.appointmentStatus} variant={statusVariant(data.appointmentStatus)} />
        </View>

        {/* Appointment Info */}
        <Card style={{margin: SPACING.base}}>
          <Text style={styles.sectionTitle}>Appointment Details</Text>
          <InfoRow label="Date" value={data.date ? format(new Date(data.date), 'dd MMM yyyy') : '—'} icon="calendar" />
          <InfoRow label="Time" value={data.timeSlot?.startTime || '—'} icon="clock-outline" />
          <InfoRow label="Appointment Type" value={data.appointmentType || '—'} icon="tag-outline" />
          <InfoRow label="Reason" value={data.reasonForAppointment || '—'} icon="medical-bag" />
          {data.notes && <InfoRow label="Notes" value={data.notes} icon="note-outline" />}
        </Card>

        {/* Patient Info */}
        <Card style={{marginHorizontal: SPACING.base}}>
          <Text style={styles.sectionTitle}>Patient Information</Text>
          <InfoRow label="Patient Code" value={data.patient?.patientCode || '—'} icon="identifier" />
          <InfoRow label="Phone" value={patient?.phone || '—'} icon="phone-outline" />
          <InfoRow label="Email" value={patient?.email || '—'} icon="email-outline" />
          <InfoRow label="Blood Group" value={info?.bloodGroup || '—'} icon="water-outline" />
        </Card>

        {/* Doctor Info */}
        <Card style={{marginHorizontal: SPACING.base}}>
          <Text style={styles.sectionTitle}>Doctor Information</Text>
          <InfoRow label="Doctor" value={doctor ? `Dr. ${doctor.fName} ${doctor.lName}` : '—'} icon="stethoscope" />
          <InfoRow label="Specialization" value={data.doctor?.specialization || '—'} icon="brain" />
          <InfoRow label="Department" value={data.doctor?.department?.name || '—'} icon="hospital-building" />
        </Card>

        {/* Actions */}
        <View style={styles.actions}>
          {data.appointmentStatus === 'CONFIRMED' && (
            <>
              <Button label="Mark In Progress" onPress={() => statusMutation.mutate('IN_PROGRESS')} loading={statusMutation.isPending} icon="play-circle-outline" fullWidth />
              <Button label="Cancel Appointment" onPress={() => statusMutation.mutate('CANCELLED')} variant="destructive" icon="close-circle-outline" fullWidth />
            </>
          )}
          {data.appointmentStatus === 'IN_PROGRESS' && (
            <>
              <Button label="Mark Completed" onPress={() => statusMutation.mutate('COMPLETED')} icon="check-circle-outline" fullWidth />
              <Button
                label="Convert to In-Patient"
                onPress={() => Alert.alert('Convert to In-Patient?', 'This will admit the patient for inpatient care.', [
                  {text: 'Cancel', style: 'cancel'},
                  {text: 'Convert', onPress: () => convertToInPatient.mutate()},
                ])}
                variant="outline"
                icon="bed-outline"
                fullWidth
              />
            </>
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
  tokenBadge: {
    width: 52, height: 52, borderRadius: SPACING.sm,
    backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center',
  },
  tokenText: {fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.bold, color: COLORS.primary},
  heroName: {fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: COLORS.text},
  heroSub: {fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginTop: 2},
  sectionTitle: {fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.bold, color: COLORS.text, marginBottom: SPACING.sm},
  actions: {margin: SPACING.base, gap: SPACING.sm},
});
