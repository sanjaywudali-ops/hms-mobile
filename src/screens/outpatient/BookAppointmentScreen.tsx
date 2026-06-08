import React, {useState} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList} from 'react-native';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {useForm, Controller} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import RNPickerSelect from 'react-native-picker-select';
import Toast from 'react-native-toast-message';
import {format, addDays} from 'date-fns';
import {COLORS, FONTS, SPACING, RADIUS, SHADOW} from '../../constants/theme';
import {api} from '../../constants/api';
import {instance} from '../../services/axios';
import {ScreenHeader, FormInput, Button, Card, LoadingScreen} from '../../components/common';

const schema = z.object({
  patientId: z.string().min(1, 'Patient required'),
  doctorId: z.string().min(1, 'Doctor required'),
  date: z.string().min(1, 'Date required'),
  timeSlotId: z.string().min(1, 'Time slot required'),
  appointmentType: z.string().min(1, 'Type required'),
  reasonForAppointment: z.string().min(3, 'Reason required'),
});
type BookForm = z.infer<typeof schema>;

const APPT_TYPES = ['GENERAL', 'FOLLOW_UP', 'SPECIALIST', 'EMERGENCY', 'CHECKUP'];

export default function BookAppointmentScreen({navigation}: any) {
  const queryClient = useQueryClient();
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  const {control, handleSubmit, watch, setValue, formState: {errors}} = useForm<BookForm>({
    resolver: zodResolver(schema),
    defaultValues: {appointmentType: 'GENERAL'},
  });

  const watchedDoctorId = watch('doctorId');
  const watchedDate = watch('date');

  const {data: patients} = useQuery({
    queryKey: ['common-patients'],
    queryFn: async () => (await instance.get(api.getAllCommonPatients)).data.data,
  });

  const {data: doctors} = useQuery({
    queryKey: ['doctors'],
    queryFn: async () => (await instance.get(api.getDoctors)).data.data,
  });

  const {data: availableDates} = useQuery({
    queryKey: ['doctor-dates', watchedDoctorId],
    queryFn: async () => (await instance.get(api.getDoctorDates(watchedDoctorId))).data.data,
    enabled: !!watchedDoctorId,
  });

  const {data: timeSlots} = useQuery({
    queryKey: ['time-slots', watchedDoctorId, watchedDate],
    queryFn: async () => (await instance.get(api.getTimeSlots(watchedDoctorId, watchedDate))).data.data,
    enabled: !!watchedDoctorId && !!watchedDate,
  });

  const mutation = useMutation({
    mutationFn: (data: BookForm) => instance.post(api.createAppointment, data),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['appointments']});
      Toast.show({type: 'success', text1: 'Appointment Booked', text2: 'Appointment created successfully.'});
      navigation.goBack();
    },
    onError: (err: any) => {
      Toast.show({type: 'error', text1: 'Error', text2: err?.response?.data?.message || 'Failed to book'});
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

  const pickerStyle = {
    inputIOS: styles.pickerInput,
    inputAndroid: styles.pickerInput,
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Book Appointment" navigation={navigation} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.form}>

          {/* Patient */}
          <View style={styles.group}>
            <Text style={styles.label}>Patient <Text style={{color: COLORS.error}}>*</Text></Text>
            <Controller control={control} name="patientId"
              render={({field: {onChange, value}}) => (
                <View style={[styles.pickerWrap, errors.patientId && styles.pickerError]}>
                  <RNPickerSelect onValueChange={onChange} value={value} items={patientItems}
                    placeholder={{label: 'Select patient...', value: ''}} style={pickerStyle} />
                </View>
              )} />
            {errors.patientId && <Text style={styles.error}>{errors.patientId.message}</Text>}
          </View>

          {/* Doctor */}
          <View style={styles.group}>
            <Text style={styles.label}>Doctor <Text style={{color: COLORS.error}}>*</Text></Text>
            <Controller control={control} name="doctorId"
              render={({field: {onChange, value}}) => (
                <View style={[styles.pickerWrap, errors.doctorId && styles.pickerError]}>
                  <RNPickerSelect onValueChange={(v) => {onChange(v); setSelectedDoctorId(v); setValue('date', ''); setValue('timeSlotId', '');}}
                    value={value} items={doctorItems}
                    placeholder={{label: 'Select doctor...', value: ''}} style={pickerStyle} />
                </View>
              )} />
            {errors.doctorId && <Text style={styles.error}>{errors.doctorId.message}</Text>}
          </View>

          {/* Available Dates */}
          {watchedDoctorId && availableDates && (
            <View style={styles.group}>
              <Text style={styles.label}>Select Date <Text style={{color: COLORS.error}}>*</Text></Text>
              <Controller control={control} name="date"
                render={({field: {onChange, value}}) => (
                  <FlatList
                    data={availableDates}
                    horizontal
                    keyExtractor={(d) => d}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{gap: SPACING.xs}}
                    renderItem={({item}) => {
                      const isSelected = value === item;
                      return (
                        <TouchableOpacity
                          style={[styles.dateChip, isSelected && styles.dateChipActive]}
                          onPress={() => {onChange(item); setValue('timeSlotId', '');}}>
                          <Text style={[styles.dateChipText, isSelected && styles.dateChipTextActive]}>
                            {format(new Date(item), 'dd MMM')}
                          </Text>
                        </TouchableOpacity>
                      );
                    }}
                  />
                )} />
              {errors.date && <Text style={styles.error}>{errors.date.message}</Text>}
            </View>
          )}

          {/* Time Slots */}
          {watchedDate && timeSlots && (
            <View style={styles.group}>
              <Text style={styles.label}>Select Time Slot <Text style={{color: COLORS.error}}>*</Text></Text>
              <Controller control={control} name="timeSlotId"
                render={({field: {onChange, value}}) => (
                  <View style={styles.slotGrid}>
                    {timeSlots.map((slot: any) => (
                      <TouchableOpacity
                        key={slot.id}
                        disabled={slot.isBooked || slot.isBlocked}
                        style={[
                          styles.slotChip,
                          value === slot.id && styles.slotChipActive,
                          (slot.isBooked || slot.isBlocked) && styles.slotChipDisabled,
                        ]}
                        onPress={() => onChange(slot.id)}>
                        <Text style={[
                          styles.slotText,
                          value === slot.id && styles.slotTextActive,
                          (slot.isBooked || slot.isBlocked) && styles.slotTextDisabled,
                        ]}>
                          {slot.startTime}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )} />
              {errors.timeSlotId && <Text style={styles.error}>{errors.timeSlotId.message}</Text>}
            </View>
          )}

          {/* Appointment Type */}
          <View style={styles.group}>
            <Text style={styles.label}>Appointment Type <Text style={{color: COLORS.error}}>*</Text></Text>
            <Controller control={control} name="appointmentType"
              render={({field: {onChange, value}}) => (
                <View style={styles.chipRow}>
                  {APPT_TYPES.map(type => (
                    <TouchableOpacity key={type}
                      style={[styles.typeChip, value === type && styles.typeChipActive]}
                      onPress={() => onChange(type)}>
                      <Text style={[styles.typeChipText, value === type && styles.typeChipTextActive]}>{type}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )} />
          </View>

          {/* Reason */}
          <Controller control={control} name="reasonForAppointment"
            render={({field: {onChange, value}}) => (
              <FormInput label="Reason for Appointment" value={value} onChangeText={onChange}
                placeholder="Describe the reason..." multiline numberOfLines={3}
                error={errors.reasonForAppointment?.message} required />
            )} />

          <Button label="Book Appointment" onPress={handleSubmit(d => mutation.mutate(d))}
            loading={mutation.isPending} fullWidth style={{marginTop: SPACING.md}} icon="calendar-check" />
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
  pickerWrap: {borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, backgroundColor: COLORS.white, paddingHorizontal: SPACING.sm},
  pickerError: {borderColor: COLORS.error},
  pickerInput: {fontSize: FONTS.sizes.base, color: COLORS.text, paddingVertical: SPACING.sm + 2},
  error: {fontSize: FONTS.sizes.xs, color: COLORS.error, marginTop: 3},
  dateChip: {paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs + 2, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white, alignItems: 'center'},
  dateChipActive: {backgroundColor: COLORS.primary, borderColor: COLORS.primary},
  dateChipText: {fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, fontWeight: FONTS.weights.medium},
  dateChipTextActive: {color: COLORS.white},
  slotGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs},
  slotChip: {paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs + 2, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white},
  slotChipActive: {backgroundColor: COLORS.primary, borderColor: COLORS.primary},
  slotChipDisabled: {backgroundColor: COLORS.borderLight, borderColor: COLORS.borderLight},
  slotText: {fontSize: FONTS.sizes.xs, color: COLORS.textSecondary},
  slotTextActive: {color: COLORS.white, fontWeight: FONTS.weights.semibold},
  slotTextDisabled: {color: COLORS.textMuted},
  chipRow: {flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs},
  typeChip: {paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs + 2, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white},
  typeChipActive: {backgroundColor: COLORS.primary, borderColor: COLORS.primary},
  typeChipText: {fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, fontWeight: FONTS.weights.medium},
  typeChipTextActive: {color: COLORS.white},
});
