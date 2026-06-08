import React, {useState} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
import {useQuery} from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {format} from 'date-fns';
import {COLORS, FONTS, SPACING, RADIUS, SHADOW} from '../../constants/theme';
import {api} from '../../constants/api';
import {instance} from '../../services/axios';
import {ScreenHeader, Badge, Card, InfoRow, LoadingScreen} from '../../components/common';

type Tab = 'overview' | 'admissions' | 'appointments' | 'prescriptions';

export default function PatientHistoryDetailScreen({route, navigation}: any) {
  const {id} = route.params;
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const {data: patient, isLoading: pLoading} = useQuery({
    queryKey: ['patient', id],
    queryFn: async () => (await instance.get(api.getPatientsById(id))).data.data,
  });

  const {data: history, isLoading: hLoading} = useQuery({
    queryKey: ['patient-history', id],
    queryFn: async () => (await instance.get(api.getPatientHistory(id))).data.data,
  });

  const {data: prescriptions} = useQuery({
    queryKey: ['prescriptions', id],
    queryFn: async () => (await instance.get(api.getPrescriptions(id))).data.data,
  });

  if (pLoading || !patient) return <LoadingScreen message="Loading patient..." />;

  const tabs: {key: Tab; label: string; icon: string}[] = [
    {key: 'overview', label: 'Overview', icon: 'account-outline'},
    {key: 'admissions', label: 'Admissions', icon: 'bed-outline'},
    {key: 'appointments', label: 'Appointments', icon: 'calendar-outline'},
    {key: 'prescriptions', label: 'Prescriptions', icon: 'pill'},
  ];

  const info = patient.patientInfo;
  const admissions = history?.admissions || [];
  const appointments = history?.appointments || [];
  const prescrList = prescriptions || [];

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Patient Details" navigation={navigation} />

      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.avatar}>
          <Icon name="account" size={32} color={COLORS.primary} />
        </View>
        <View style={{flex: 1}}>
          <Text style={styles.heroName}>{patient.user?.fName} {patient.user?.lName}</Text>
          <Text style={styles.heroCode}>{patient.patientCode}</Text>
        </View>
        {info?.bloodGroup && (
          <View style={styles.bloodBadge}>
            <Text style={styles.bloodText}>{info.bloodGroup}</Text>
          </View>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}>
            <Icon name={tab.icon} size={16} color={activeTab === tab.key ? COLORS.primary : COLORS.textMuted} />
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {activeTab === 'overview' && (
          <Card style={{margin: SPACING.base}}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <InfoRow label="Full Name" value={`${patient.user?.fName} ${patient.user?.lName}`} icon="account-outline" />
            <InfoRow label="Patient Code" value={patient.patientCode} icon="identifier" />
            <InfoRow label="Age" value={info?.age ? `${info.age} years` : '—'} icon="human-male" />
            <InfoRow label="Gender" value={info?.gender || '—'} icon="gender-male-female" />
            <InfoRow label="Blood Group" value={info?.bloodGroup || '—'} icon="water-outline" />
            <InfoRow label="Phone" value={patient.user?.phone || '—'} icon="phone-outline" />
            <InfoRow label="Email" value={patient.user?.email || '—'} icon="email-outline" />
            <InfoRow label="Address" value={info?.address || '—'} icon="map-marker-outline" />
            <InfoRow label="Allergies" value={info?.allergies || 'None'} icon="alert-circle-outline" />
            <InfoRow label="Emergency Contact" value={info?.emergencyContactName || '—'} icon="phone-alert-outline" />
          </Card>
        )}

        {activeTab === 'admissions' && (
          <View style={{padding: SPACING.base, gap: SPACING.sm}}>
            {hLoading ? <LoadingScreen /> :
              admissions.length === 0 ? (
                <View style={styles.empty}><Icon name="bed-outline" size={36} color={COLORS.textMuted} />
                  <Text style={styles.emptyText}>No admission history</Text></View>
              ) : admissions.map((adm: any) => (
                <Card key={adm.id}>
                  <View style={styles.historyRow}>
                    <View style={{flex: 1}}>
                      <Text style={styles.historyTitle}>{adm.reasonForAdmission || 'Admission'}</Text>
                      <Text style={styles.historyDate}>{adm.admissionDateTime ? format(new Date(adm.admissionDateTime), 'dd MMM yyyy') : '—'}</Text>
                    </View>
                    <Badge label={adm.status} variant={adm.status === 'DISCHARGED' ? 'discharged' : 'admitted'} />
                  </View>
                  <Text style={styles.historyMeta}>Dr. {adm.admittingDoctor?.user?.fName} {adm.admittingDoctor?.user?.lName}</Text>
                  {adm.roomBooking?.room && (
                    <Text style={styles.historyMeta}>Room {adm.roomBooking.room.roomNumber}</Text>
                  )}
                </Card>
              ))
            }
          </View>
        )}

        {activeTab === 'appointments' && (
          <View style={{padding: SPACING.base, gap: SPACING.sm}}>
            {hLoading ? <LoadingScreen /> :
              appointments.length === 0 ? (
                <View style={styles.empty}><Icon name="calendar-outline" size={36} color={COLORS.textMuted} />
                  <Text style={styles.emptyText}>No appointment history</Text></View>
              ) : appointments.map((appt: any) => (
                <Card key={appt.id}>
                  <View style={styles.historyRow}>
                    <View style={{flex: 1}}>
                      <Text style={styles.historyTitle}>{appt.reasonForAppointment || 'Appointment'}</Text>
                      <Text style={styles.historyDate}>{appt.date ? format(new Date(appt.date), 'dd MMM yyyy') : '—'} · {appt.timeSlot?.startTime}</Text>
                    </View>
                    <Badge label={appt.appointmentStatus} variant={'completed'} />
                  </View>
                  <Text style={styles.historyMeta}>Dr. {appt.doctor?.user?.fName} {appt.doctor?.user?.lName} — {appt.doctor?.specialization}</Text>
                </Card>
              ))
            }
          </View>
        )}

        {activeTab === 'prescriptions' && (
          <View style={{padding: SPACING.base, gap: SPACING.sm}}>
            {prescrList.length === 0 ? (
              <View style={styles.empty}><Icon name="pill" size={36} color={COLORS.textMuted} />
                <Text style={styles.emptyText}>No prescriptions found</Text></View>
            ) : prescrList.map((rx: any) => (
              <Card key={rx.id}>
                <View style={styles.historyRow}>
                  <Text style={styles.historyTitle}>{rx.medicineName || 'Prescription'}</Text>
                  <Text style={styles.historyDate}>{rx.createdAt ? format(new Date(rx.createdAt), 'dd MMM yyyy') : '—'}</Text>
                </View>
                {rx.dosage && <Text style={styles.historyMeta}>Dosage: {rx.dosage}</Text>}
                {rx.duration && <Text style={styles.historyMeta}>Duration: {rx.duration}</Text>}
                {rx.instructions && <Text style={styles.historyMeta}>Instructions: {rx.instructions}</Text>}
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: COLORS.background},
  hero: {flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: COLORS.white, padding: SPACING.base, borderBottomWidth: 1, borderBottomColor: COLORS.border},
  avatar: {width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center'},
  heroName: {fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: COLORS.text},
  heroCode: {fontSize: FONTS.sizes.xs, color: COLORS.textMuted},
  bloodBadge: {backgroundColor: COLORS.errorLight, paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.sm},
  bloodText: {fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.bold, color: COLORS.error},
  tabBar: {flexDirection: 'row', backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border},
  tab: {flex: 1, alignItems: 'center', paddingVertical: SPACING.sm, gap: 2},
  tabActive: {borderBottomWidth: 2, borderBottomColor: COLORS.primary},
  tabText: {fontSize: 10, color: COLORS.textMuted},
  tabTextActive: {color: COLORS.primary, fontWeight: FONTS.weights.semibold},
  scroll: {paddingBottom: SPACING.xxxl},
  sectionTitle: {fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.bold, color: COLORS.text, marginBottom: SPACING.sm},
  historyRow: {flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between'},
  historyTitle: {fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.semibold, color: COLORS.text},
  historyDate: {fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: 2},
  historyMeta: {fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginTop: 4},
  empty: {alignItems: 'center', padding: SPACING.xxl, gap: SPACING.sm},
  emptyText: {fontSize: FONTS.sizes.base, color: COLORS.textSecondary},
});
