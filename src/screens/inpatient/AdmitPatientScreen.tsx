import React, {useState} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
import {useForm, Controller} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import RNPickerSelect from 'react-native-picker-select';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {COLORS, FONTS, SPACING, RADIUS} from '../../constants/theme';
import {api} from '../../constants/api';
import {instance} from '../../services/axios';
import {ScreenHeader, FormInput, Button} from '../../components/common';

const admitSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  doctorId: z.string().min(1, 'Doctor is required'),
  roomId: z.string().min(1, 'Room is required'),
  reasonForAdmission: z.string().min(3, 'Reason is required'),
  admissionType: z.string().min(1, 'Admission type is required'),
  priority: z.string().min(1, 'Priority is required'),
  expectedDischargeDate: z.string().optional(),
  notes: z.string().optional(),
});
type AdmitForm = z.infer<typeof admitSchema>;

const ADMISSION_TYPES = ['EMERGENCY', 'ELECTIVE', 'TRANSFER', 'MATERNITY', 'SURGICAL', 'MEDICAL', 'OBSERVATION'];
const PRIORITIES = ['ROUTINE', 'URGENT', 'EMERGENCY'];

export default function AdmitPatientScreen({navigation}: any) {
  const queryClient = useQueryClient();

  const {data: patients} = useQuery({
    queryKey: ['common-patients'],
    queryFn: async () => {
      const res = await instance.get(api.getAllCommonPatients);
      return res.data.data;
    },
  });

  const {data: doctors} = useQuery({
    queryKey: ['doctors'],
    queryFn: async () => {
      const res = await instance.get(api.getDoctors);
      return res.data.data;
    },
  });

  const {data: rooms} = useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      const res = await instance.get(api.getAllRooms);
      return res.data.data;
    },
  });

  const {control, handleSubmit, formState: {errors}} = useForm<AdmitForm>({
    resolver: zodResolver(admitSchema),
    defaultValues: {admissionType: 'MEDICAL', priority: 'ROUTINE'},
  });

  const mutation = useMutation({
    mutationFn: (data: AdmitForm) => instance.post(api.admitPatient, data),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['inpatients']});
      Toast.show({type: 'success', text1: 'Patient Admitted', text2: 'Admission created successfully.'});
      navigation.goBack();
    },
    onError: (err: any) => {
      Toast.show({type: 'error', text1: 'Error', text2: err?.response?.data?.message || 'Failed to admit patient'});
    },
  });

  const patientItems = (patients || []).map((p: any) => ({
    label: `${p.user?.fName} ${p.user?.lName} (${p.patientCode})`,
    value: p.id,
  }));

  const doctorItems = (doctors || []).map((d: any) => ({
    label: `Dr. ${d.user?.fName} ${d.user?.lName} - ${d.specialization || ''}`,
    value: d.id,
  }));

  const roomItems = (rooms || [])
    .filter((r: any) => r.status === 'AVAILABLE')
    .map((r: any) => ({
      label: `Room ${r.roomNumber} - ${r.roomType?.name || ''} (Floor ${r.floor})`,
      value: r.id,
    }));

  const pickerStyle = {
    inputIOS: styles.pickerInput,
    inputAndroid: styles.pickerInput,
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Admit Patient" navigation={navigation} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <View style={styles.form}>
          {/* Patient */}
          <View style={styles.group}>
            <Text style={styles.label}>Patient <Text style={{color: COLORS.error}}>*</Text></Text>
            <Controller
              control={control}
              name="patientId"
              render={({field: {onChange, value}}) => (
                <View style={[styles.pickerWrap, errors.patientId && styles.pickerError]}>
                  <RNPickerSelect
                    onValueChange={onChange}
                    value={value}
                    items={patientItems}
                    placeholder={{label: 'Select patient...', value: ''}}
                    style={pickerStyle}
                  />
                </View>
              )}
            />
            {errors.patientId && <Text style={styles.error}>{errors.patientId.message}</Text>}
          </View>

          {/* Doctor */}
          <View style={styles.group}>
            <Text style={styles.label}>Admitting Doctor <Text style={{color: COLORS.error}}>*</Text></Text>
            <Controller
              control={control}
              name="doctorId"
              render={({field: {onChange, value}}) => (
                <View style={[styles.pickerWrap, errors.doctorId && styles.pickerError]}>
                  <RNPickerSelect
                    onValueChange={onChange}
                    value={value}
                    items={doctorItems}
                    placeholder={{label: 'Select doctor...', value: ''}}
                    style={pickerStyle}
                  />
                </View>
              )}
            />
            {errors.doctorId && <Text style={styles.error}>{errors.doctorId.message}</Text>}
          </View>

          {/* Room */}
          <View style={styles.group}>
            <Text style={styles.label}>Room <Text style={{color: COLORS.error}}>*</Text></Text>
            <Controller
              control={control}
              name="roomId"
              render={({field: {onChange, value}}) => (
                <View style={[styles.pickerWrap, errors.roomId && styles.pickerError]}>
                  <RNPickerSelect
                    onValueChange={onChange}
                    value={value}
                    items={roomItems}
                    placeholder={{label: 'Select available room...', value: ''}}
                    style={pickerStyle}
                  />
                </View>
              )}
            />
            {errors.roomId && <Text style={styles.error}>{errors.roomId.message}</Text>}
          </View>

          {/* Reason */}
          <Controller
            control={control}
            name="reasonForAdmission"
            render={({field: {onChange, value}}) => (
              <FormInput
                label="Reason for Admission"
                value={value}
                onChangeText={onChange}
                placeholder="Enter reason..."
                multiline
                numberOfLines={3}
                error={errors.reasonForAdmission?.message}
                required
              />
            )}
          />

          {/* Admission Type */}
          <View style={styles.group}>
            <Text style={styles.label}>Admission Type <Text style={{color: COLORS.error}}>*</Text></Text>
            <Controller
              control={control}
              name="admissionType"
              render={({field: {onChange, value}}) => (
                <View style={styles.chipRow}>
                  {ADMISSION_TYPES.map(type => (
                    <TouchableOpacity
                      key={type}
                      style={[styles.typeChip, value === type && styles.typeChipActive]}
                      onPress={() => onChange(type)}>
                      <Text style={[styles.typeChipText, value === type && styles.typeChipTextActive]}>{type}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            />
          </View>

          {/* Priority */}
          <View style={styles.group}>
            <Text style={styles.label}>Priority <Text style={{color: COLORS.error}}>*</Text></Text>
            <Controller
              control={control}
              name="priority"
              render={({field: {onChange, value}}) => (
                <View style={styles.chipRow}>
                  {PRIORITIES.map(p => (
                    <TouchableOpacity
                      key={p}
                      style={[styles.typeChip, value === p && styles.typeChipActive,
                        p === 'EMERGENCY' && value === p && {backgroundColor: COLORS.error}]}
                      onPress={() => onChange(p)}>
                      <Text style={[styles.typeChipText, value === p && styles.typeChipTextActive]}>{p}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            />
          </View>

          {/* Expected Discharge */}
          <Controller
            control={control}
            name="expectedDischargeDate"
            render={({field: {onChange, value}}) => (
              <FormInput
                label="Expected Discharge Date"
                value={value || ''}
                onChangeText={onChange}
                placeholder="YYYY-MM-DD"
                icon="calendar-outline"
              />
            )}
          />

          {/* Notes */}
          <Controller
            control={control}
            name="notes"
            render={({field: {onChange, value}}) => (
              <FormInput
                label="Additional Notes"
                value={value || ''}
                onChangeText={onChange}
                placeholder="Any additional notes..."
                multiline
                numberOfLines={3}
              />
            )}
          />

          <Button
            label="Admit Patient"
            onPress={handleSubmit(d => mutation.mutate(d))}
            loading={mutation.isPending}
            fullWidth
            style={{marginTop: SPACING.lg}}
            icon="bed-plus"
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: COLORS.background},
  scroll: {paddingBottom: SPACING.xxxl},
  form: {padding: SPACING.base},
  group: {marginBottom: SPACING.md},
  label: {fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.semibold, color: COLORS.text, marginBottom: SPACING.xs},
  pickerWrap: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md,
    backgroundColor: COLORS.white, paddingHorizontal: SPACING.sm,
  },
  pickerError: {borderColor: COLORS.error},
  pickerInput: {fontSize: FONTS.sizes.base, color: COLORS.text, paddingVertical: SPACING.sm + 2},
  error: {fontSize: FONTS.sizes.xs, color: COLORS.error, marginTop: 3},
  chipRow: {flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs},
  typeChip: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  typeChipActive: {backgroundColor: COLORS.primary, borderColor: COLORS.primary},
  typeChipText: {fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, fontWeight: FONTS.weights.medium},
  typeChipTextActive: {color: COLORS.white},
});
