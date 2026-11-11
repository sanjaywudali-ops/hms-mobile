import React, {useState} from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, StatusBar, Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {COLORS, FONTS, SPACING, RADIUS, SHADOW} from '../../constants/theme';
import {AppointmentRecord, AppointmentStatus} from '../../constants/mockHospitalData';

// ─── Static doctor options (replace with API when backend ready) ──────────────
const DOCTOR_OPTIONS = [
  'Dr. Rajesh Kumar',
  'Dr. Vinod Sharma',
  'Dr. Meena Pillai',
  'Dr. Sanjay Gupta',
];

const STATUS_OPTIONS: AppointmentStatus[] = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];
const TYPE_OPTIONS: ('OPD' | 'IPD')[] = ['OPD', 'IPD'];

// ─── Reusable Field Components ────────────────────────────────────────────────

function FieldLabel({label, required}: {label: string; required?: boolean}) {
  return (
    <Text style={f.label}>
      {label} {required && <Text style={{color: COLORS.error}}>*</Text>}
    </Text>
  );
}

function InputField({label, value, onChange, placeholder, required, keyboardType, multiline}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; required?: boolean; keyboardType?: any; multiline?: boolean;
}) {
  return (
    <View style={f.group}>
      <FieldLabel label={label} required={required} />
      <View style={[f.inputWrap, multiline && {height: 90, alignItems: 'flex-start'}]}>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder || `Enter ${label.toLowerCase()}`}
          placeholderTextColor={COLORS.textMuted}
          style={[f.input, multiline && {textAlignVertical: 'top', paddingTop: SPACING.sm}]}
          keyboardType={keyboardType || 'default'}
          multiline={multiline}
          autoCapitalize="none"
        />
      </View>
    </View>
  );
}

function SelectField({label, value, options, onChange, required}: {
  label: string; value: string; options: string[];
  onChange: (v: string) => void; required?: boolean;
}) {
  return (
    <View style={f.group}>
      <FieldLabel label={label} required={required} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={f.optionRow}>
        {options.map(opt => {
          const active = value === opt;
          return (
            <TouchableOpacity
              key={opt}
              style={[f.optionBtn, active && f.optionBtnActive]}
              onPress={() => onChange(opt)}>
              <Text style={[f.optionText, active && f.optionTextActive]}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ─── Main Form Screen ─────────────────────────────────────────────────────────

export default function AdminAppointmentFormScreen({navigation, route}: any) {
  const insets = useSafeAreaInsets();
  const existingAppointment: AppointmentRecord | null = route?.params?.appointment || null;
  const isEdit = !!existingAppointment;

  // Form state — pre-fill if editing
  const [patientName,    setPatientName]    = useState(existingAppointment?.patientName    || '');
  const [patientAge,     setPatientAge]     = useState(existingAppointment?.patientAge?.toString() || '');
  const [doctorName,     setDoctorName]     = useState(existingAppointment?.doctorName     || DOCTOR_OPTIONS[0]);
  const [date,           setDate]           = useState(existingAppointment?.date           || '');
  const [time,           setTime]           = useState(existingAppointment?.time           || '');
  const [reason,         setReason]         = useState(existingAppointment?.reason         || '');
  const [status,         setStatus]         = useState<AppointmentStatus>(existingAppointment?.status || 'Pending');
  const [type,           setType]           = useState<'OPD' | 'IPD'>(existingAppointment?.type || 'OPD');
  const [specialization, setSpecialization] = useState(existingAppointment?.specialization || '');

  const validate = () => {
    if (!patientName.trim()) {Alert.alert('Validation', 'Patient name is required'); return false;}
    if (!date.trim())        {Alert.alert('Validation', 'Date is required');         return false;}
    if (!time.trim())        {Alert.alert('Validation', 'Time is required');         return false;}
    if (!reason.trim())      {Alert.alert('Validation', 'Reason is required');       return false;}
    return true;
  };

  const handleSave = () => {
    if (!validate()) return;

    const record: AppointmentRecord = {
      id:             existingAppointment?.id || `appt-${Date.now()}`,
      patientName:    patientName.trim(),
      patientPhone:   existingAppointment?.patientPhone || '+91 00000 00000',
      patientAge:     parseInt(patientAge) || 0,
      date,
      time,
      reason:         reason.trim(),
      status,
      doctorName,
      specialization: specialization.trim(),
      type,
    };

    // TODO: Replace with real API call when backend is ready:
    // if (isEdit) await instance.patch(api.updateAppointment, record);
    // else        await instance.post(api.createAppointment, record);

    Alert.alert(
      isEdit ? 'Appointment Updated' : 'Appointment Created',
      `${record.patientName}'s appointment has been ${isEdit ? 'updated' : 'created'} successfully.`,
      [{text: 'OK', onPress: () => navigation.goBack()}],
    );
  };

  const handleDiscard = () => {
    Alert.alert('Discard Changes', 'Are you sure you want to discard?', [
      {text: 'Keep Editing', style: 'cancel'},
      {text: 'Discard', style: 'destructive', onPress: () => navigation.goBack()},
    ]);
  };

  return (
    <View style={[s.safe, {paddingTop: insets.top, paddingBottom: insets.bottom}]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} translucent={false} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={handleDiscard} style={s.backBtn}>
          <Icon name="arrow-left" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <View style={{flex: 1}}>
          <Text style={s.headerTitle}>{isEdit ? 'Edit Appointment' : 'New Appointment'}</Text>
          <Text style={s.headerSub}>{isEdit ? `Editing ${existingAppointment?.patientName}` : 'Fill in the details below'}</Text>
        </View>
      </View>

      <ScrollView
        style={{backgroundColor: '#F5F7FA'}}
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        {/* Patient Info */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Patient Information</Text>
          <InputField label="Patient Name" value={patientName} onChange={setPatientName} required placeholder="Full name" />
          <InputField label="Age" value={patientAge} onChange={setPatientAge} placeholder="e.g. 35" keyboardType="numeric" />
        </View>

        {/* Appointment Type */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Appointment Type</Text>
          <SelectField label="Type" value={type} options={TYPE_OPTIONS} onChange={v => setType(v as 'OPD' | 'IPD')} required />
        </View>

        {/* Doctor */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Doctor</Text>
          <SelectField label="Assign Doctor" value={doctorName} options={DOCTOR_OPTIONS} onChange={setDoctorName} required />
          <InputField label="Specialization" value={specialization} onChange={setSpecialization} placeholder="e.g. Cardiologist" />
        </View>

        {/* Schedule */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Schedule</Text>
          <InputField label="Date" value={date} onChange={setDate} required placeholder="YYYY-MM-DD  e.g. 2025-06-20" />
          <InputField label="Time" value={time} onChange={setTime} required placeholder="e.g. 10:30 AM" />
        </View>

        {/* Reason */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Details</Text>
          <InputField label="Reason" value={reason} onChange={setReason} required placeholder="Reason for appointment" multiline />
        </View>

        {/* Status */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Status</Text>
          <SelectField label="Appointment Status" value={status} options={STATUS_OPTIONS} onChange={v => setStatus(v as AppointmentStatus)} required />
        </View>

        {/* Buttons */}
        <View style={s.btnRow}>
          <TouchableOpacity style={s.discardBtn} onPress={handleDiscard}>
            <Text style={s.discardText}>Discard</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.saveBtn} onPress={handleSave}>
            <Icon name={isEdit ? 'content-save-outline' : 'plus-circle-outline'} size={18} color={COLORS.white} />
            <Text style={s.saveText}>{isEdit ? 'Save Changes' : 'Create Appointment'}</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:         {flex: 1, backgroundColor: COLORS.primary},
  header:       {flexDirection: 'row', alignItems: 'center', padding: SPACING.lg, gap: SPACING.md},
  backBtn:      {padding: 4},
  headerTitle:  {fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, color: COLORS.white},
  headerSub:    {fontSize: FONTS.sizes.xs, color: 'rgba(255,255,255,0.75)', marginTop: 2},
  scrollContent:{padding: SPACING.base, gap: SPACING.md, paddingBottom: SPACING.xxxl},
  section:      {backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.base, ...SHADOW.sm},
  sectionTitle: {fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.bold, color: COLORS.textSecondary, marginBottom: SPACING.md, textTransform: 'uppercase', letterSpacing: 0.5},
  btnRow:       {flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm},
  discardBtn:   {flex: 1, padding: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', backgroundColor: COLORS.white},
  discardText:  {fontSize: FONTS.sizes.base, color: COLORS.textSecondary, fontWeight: FONTS.weights.medium},
  saveBtn:      {flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs, padding: SPACING.md, borderRadius: RADIUS.md, backgroundColor: COLORS.primary},
  saveText:     {fontSize: FONTS.sizes.base, color: COLORS.white, fontWeight: FONTS.weights.semibold},
});

const f = StyleSheet.create({
  group:           {marginBottom: SPACING.md},
  label:           {fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.semibold, color: COLORS.text, marginBottom: SPACING.xs},
  inputWrap:       {flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, backgroundColor: COLORS.white},
  input:           {flex: 1, fontSize: FONTS.sizes.base, color: COLORS.text, paddingVertical: SPACING.sm + 2},
  optionRow:       {gap: SPACING.xs, paddingVertical: 2},
  optionBtn:       {paddingHorizontal: SPACING.md, paddingVertical: 8, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white},
  optionBtnActive: {backgroundColor: COLORS.primary, borderColor: COLORS.primary},
  optionText:      {fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, fontWeight: FONTS.weights.medium},
  optionTextActive:{color: COLORS.white},
});