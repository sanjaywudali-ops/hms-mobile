import React, {useState} from 'react';
import {View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity} from 'react-native';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {useForm, Controller} from 'react-hook-form';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {format} from 'date-fns';
import {COLORS, FONTS, SPACING, RADIUS, SHADOW} from '../../constants/theme';
import {api} from '../../constants/api';
import {instance} from '../../services/axios';
import {ScreenHeader, FormInput, Button, Card, LoadingScreen} from '../../components/common';

export default function InPatientVitalsScreen({route, navigation}: any) {
  const {patientId, admissionId} = route.params;
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const {data, isLoading, refetch} = useQuery({
    queryKey: ['vitals', patientId],
    queryFn: async () => {
      const res = await instance.get(api.getVitals(patientId));
      return res.data.data;
    },
  });

  const {control, handleSubmit, reset, formState: {errors}} = useForm({
    defaultValues: {
      temperature: '', bloodPressureSystolic: '', bloodPressureDiastolic: '',
      heartRate: '', respiratoryRate: '', oxygenSaturation: '', weight: '', height: '', notes: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (formData: any) =>
      instance.post(api.addVitals, {
        ...formData,
        patientId,
        admissionId,
        temperature: formData.temperature ? parseFloat(formData.temperature) : undefined,
        bloodPressureSystolic: formData.bloodPressureSystolic ? parseInt(formData.bloodPressureSystolic) : undefined,
        bloodPressureDiastolic: formData.bloodPressureDiastolic ? parseInt(formData.bloodPressureDiastolic) : undefined,
        heartRate: formData.heartRate ? parseInt(formData.heartRate) : undefined,
        respiratoryRate: formData.respiratoryRate ? parseInt(formData.respiratoryRate) : undefined,
        oxygenSaturation: formData.oxygenSaturation ? parseFloat(formData.oxygenSaturation) : undefined,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        height: formData.height ? parseFloat(formData.height) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['vitals', patientId]});
      Toast.show({type: 'success', text1: 'Vitals Added', text2: 'Patient vitals recorded.'});
      reset();
      setShowForm(false);
      refetch();
    },
    onError: (err: any) => {
      Toast.show({type: 'error', text1: 'Error', text2: err?.response?.data?.message || 'Failed to add vitals'});
    },
  });

  const vitals = data || [];

  const VitalChip = ({icon, label, value, unit, color}: any) => (
    <View style={[vStyles.vitalChip, {borderLeftColor: color}]}>
      <Icon name={icon} size={16} color={color} />
      <View style={{flex: 1}}>
        <Text style={vStyles.vitalLabel}>{label}</Text>
        <Text style={[vStyles.vitalValue, {color}]}>{value || '—'} <Text style={vStyles.vitalUnit}>{value ? unit : ''}</Text></Text>
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Patient Vitals"
        navigation={navigation}
        rightAction={{icon: showForm ? 'close' : 'plus', onPress: () => setShowForm(p => !p)}}
      />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Add Form */}
        {showForm && (
          <Card style={{margin: SPACING.base}}>
            <Text style={styles.formTitle}>Record New Vitals</Text>

            <View style={styles.row}>
              <View style={{flex: 1}}>
                <Controller control={control} name="temperature"
                  render={({field: {onChange, value}}) => (
                    <FormInput label="Temperature (°C)" value={value} onChangeText={onChange} keyboardType="numeric" placeholder="36.5" />
                  )} />
              </View>
              <View style={{flex: 1}}>
                <Controller control={control} name="heartRate"
                  render={({field: {onChange, value}}) => (
                    <FormInput label="Heart Rate (bpm)" value={value} onChangeText={onChange} keyboardType="numeric" placeholder="72" />
                  )} />
              </View>
            </View>

            <View style={styles.row}>
              <View style={{flex: 1}}>
                <Controller control={control} name="bloodPressureSystolic"
                  render={({field: {onChange, value}}) => (
                    <FormInput label="BP Systolic (mmHg)" value={value} onChangeText={onChange} keyboardType="numeric" placeholder="120" />
                  )} />
              </View>
              <View style={{flex: 1}}>
                <Controller control={control} name="bloodPressureDiastolic"
                  render={({field: {onChange, value}}) => (
                    <FormInput label="BP Diastolic (mmHg)" value={value} onChangeText={onChange} keyboardType="numeric" placeholder="80" />
                  )} />
              </View>
            </View>

            <View style={styles.row}>
              <View style={{flex: 1}}>
                <Controller control={control} name="respiratoryRate"
                  render={({field: {onChange, value}}) => (
                    <FormInput label="Resp. Rate (/min)" value={value} onChangeText={onChange} keyboardType="numeric" placeholder="16" />
                  )} />
              </View>
              <View style={{flex: 1}}>
                <Controller control={control} name="oxygenSaturation"
                  render={({field: {onChange, value}}) => (
                    <FormInput label="O2 Saturation (%)" value={value} onChangeText={onChange} keyboardType="numeric" placeholder="98" />
                  )} />
              </View>
            </View>

            <View style={styles.row}>
              <View style={{flex: 1}}>
                <Controller control={control} name="weight"
                  render={({field: {onChange, value}}) => (
                    <FormInput label="Weight (kg)" value={value} onChangeText={onChange} keyboardType="numeric" placeholder="70" />
                  )} />
              </View>
              <View style={{flex: 1}}>
                <Controller control={control} name="height"
                  render={({field: {onChange, value}}) => (
                    <FormInput label="Height (cm)" value={value} onChangeText={onChange} keyboardType="numeric" placeholder="170" />
                  )} />
              </View>
            </View>

            <Controller control={control} name="notes"
              render={({field: {onChange, value}}) => (
                <FormInput label="Notes" value={value} onChangeText={onChange} placeholder="Any observations..." multiline numberOfLines={2} />
              )} />

            <Button label="Save Vitals" onPress={handleSubmit(d => mutation.mutate(d))} loading={mutation.isPending} fullWidth icon="content-save-outline" />
          </Card>
        )}

        {/* History */}
        <View style={{padding: SPACING.base}}>
          <Text style={styles.sectionTitle}>Vitals History ({vitals.length})</Text>
          {isLoading ? <LoadingScreen /> :
            vitals.length === 0 ? (
              <View style={styles.empty}>
                <Icon name="heart-pulse" size={40} color={COLORS.textMuted} />
                <Text style={styles.emptyText}>No vitals recorded yet</Text>
              </View>
            ) : (
              vitals.map((v: any, idx: number) => (
                <Card key={v.id || idx} style={{marginBottom: SPACING.sm}}>
                  <Text style={styles.vitalDate}>
                    {v.recordedAt ? format(new Date(v.recordedAt), 'dd MMM yyyy, hh:mm a') : '—'}
                  </Text>
                  <View style={vStyles.chipGrid}>
                    <VitalChip icon="thermometer" label="Temp" value={v.temperature} unit="°C" color={COLORS.error} />
                    <VitalChip icon="heart-pulse" label="Heart Rate" value={v.heartRate} unit="bpm" color={COLORS.primary} />
                    <VitalChip icon="gauge" label="BP" value={v.bloodPressureSystolic ? `${v.bloodPressureSystolic}/${v.bloodPressureDiastolic}` : null} unit="mmHg" color={COLORS.warning} />
                    <VitalChip icon="lungs" label="Resp. Rate" value={v.respiratoryRate} unit="/min" color={COLORS.success} />
                    <VitalChip icon="water-percent" label="O2 Sat." value={v.oxygenSaturation} unit="%" color={COLORS.purple} />
                    <VitalChip icon="weight-kilogram" label="Weight" value={v.weight} unit="kg" color={COLORS.secondary} />
                  </View>
                  {v.notes ? <Text style={styles.vitalNotes}>{v.notes}</Text> : null}
                </Card>
              ))
            )
          }
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: COLORS.background},
  scroll: {paddingBottom: SPACING.xxxl},
  formTitle: {fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.bold, color: COLORS.text, marginBottom: SPACING.md},
  row: {flexDirection: 'row', gap: SPACING.sm},
  sectionTitle: {fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: COLORS.text, marginBottom: SPACING.sm},
  empty: {alignItems: 'center', padding: SPACING.xxl, gap: SPACING.sm},
  emptyText: {fontSize: FONTS.sizes.base, color: COLORS.textSecondary},
  vitalDate: {fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginBottom: SPACING.sm},
  vitalNotes: {fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginTop: SPACING.xs, fontStyle: 'italic'},
});
const vStyles = StyleSheet.create({
  chipGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs},
  vitalChip: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    borderLeftWidth: 2, paddingLeft: SPACING.xs, width: '47%',
    marginBottom: SPACING.xs,
  },
  vitalLabel: {fontSize: 10, color: COLORS.textMuted},
  vitalValue: {fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.bold},
  vitalUnit: {fontSize: 10, fontWeight: '400', color: COLORS.textSecondary},
});
