import React, {useState, useRef} from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, StatusBar, Animated, Dimensions, KeyboardAvoidingView,
  Platform, ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useQuery} from '@tanstack/react-query';
import {COLORS, FONTS, SPACING, RADIUS, SHADOW} from '../../constants/theme';
import {instance} from '../../services/axios';
import {api} from '../../constants/api';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const GENDER_OPTIONS  = ['Male', 'Female', 'Other'] as const;
const STATUS_OPTIONS  = ['CONFIRMED', 'PENDING'] as const;
const MONTH_NAMES     = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES       = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function formatUTCToLocal(utcString: string): string {
  const d = new Date(utcString);
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

// ─── Field Components ─────────────────────────────────────────────────────────

function InputField({label, value, onChange, placeholder, required, keyboardType, multiline}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; required?: boolean; keyboardType?: any; multiline?: boolean;
}) {
  return (
    <View style={f.group}>
      <Text style={f.label}>{label}{required && <Text style={{color: COLORS.error}}> *</Text>}</Text>
      <View style={[f.inputWrap, multiline && {height: 90, alignItems: 'flex-start'}]}>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder || `Enter ${label.toLowerCase()}`}
          placeholderTextColor={COLORS.textMuted}
          style={[f.input, multiline && {textAlignVertical: 'top', paddingTop: SPACING.sm}]}
          keyboardType={keyboardType || 'default'}
          multiline={multiline}
          autoCapitalize="words"
        />
      </View>
    </View>
  );
}

function ChipSelect({label, value, options, onChange, required}: {
  label: string; value: string; options: readonly string[];
  onChange: (v: string) => void; required?: boolean;
}) {
  return (
    <View style={f.group}>
      <Text style={f.label}>{label}{required && <Text style={{color: COLORS.error}}> *</Text>}</Text>
      <View style={f.chipRow}>
        {options.map(opt => {
          const active = value === opt;
          return (
            <TouchableOpacity key={opt} style={[f.chip, active && f.chipActive]} onPress={() => onChange(opt)}>
              <Text style={[f.chipText, active && f.chipTextActive]}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function ReviewRow({icon, label, value}: {icon: string; label: string; value: string}) {
  return (
    <View style={rv.row}>
      <View style={rv.iconWrap}>
        <Icon name={icon} size={16} color={COLORS.primary} />
      </View>
      <View style={{flex: 1}}>
        <Text style={rv.rowLabel}>{label}</Text>
        <Text style={rv.rowValue}>{value || '—'}</Text>
      </View>
    </View>
  );
}

// ─── Custom Calendar ──────────────────────────────────────────────────────────

function CalendarPicker({label, value, onChange, required, availableDates}: {
  label: string; value: string; onChange: (v: string) => void;
  required?: boolean; availableDates: string[];
}) {
  const today     = new Date();
  today.setHours(0,0,0,0);
  const [show, setShow]       = useState(false);
  const [viewYear, setViewYear]   = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const selected = value ? new Date(value + 'T00:00:00') : null;
  const availableSet = new Set(availableDates);

  const displayDate = selected
    ? selected.toLocaleDateString('en-IN', {day: 'numeric', month: 'long', year: 'numeric'})
    : 'Select a date';

  const prevMonth = () => {
    if (viewMonth === 0) {setViewMonth(11); setViewYear(y => y-1);}
    else setViewMonth(m => m-1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) {setViewMonth(0); setViewYear(y => y+1);}
    else setViewMonth(m => m+1);
  };

  const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth+1, 0).getDate();
  const cells: (number|null)[] = [...Array(firstDay).fill(null), ...Array.from({length: daysInMonth}, (_,i)=>i+1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const toStr = (day: number) => {
    const y = viewYear;
    const m = String(viewMonth+1).padStart(2,'0');
    const d = String(day).padStart(2,'0');
    return `${y}-${m}-${d}`;
  };

  const isAvailable = (day: number) => availableSet.size > 0 ? availableSet.has(toStr(day)) : new Date(viewYear, viewMonth, day) >= today;
  const isSelected  = (day: number) => selected?.getDate() === day && selected?.getMonth() === viewMonth && selected?.getFullYear() === viewYear;
  const isToday     = (day: number) => today.getDate() === day && today.getMonth() === viewMonth && today.getFullYear() === viewYear;

  return (
    <View style={f.group}>
      <Text style={f.label}>{label}{required && <Text style={{color: COLORS.error}}> *</Text>}</Text>
      <TouchableOpacity style={f.dateBtn} onPress={() => setShow(v => !v)}>
        <Icon name="calendar-outline" size={18} color={value ? COLORS.primary : COLORS.textMuted} />
        <Text style={[f.dateBtnText, !value && {color: COLORS.textMuted}]}>{displayDate}</Text>
        <Icon name={show ? 'chevron-up' : 'chevron-down'} size={16} color={COLORS.textMuted} />
      </TouchableOpacity>
      {show && (
        <View style={cal.wrap}>
          <View style={cal.nav}>
            <TouchableOpacity onPress={prevMonth} style={cal.navBtn}>
              <Icon name="chevron-left" size={20} color={COLORS.primary} />
            </TouchableOpacity>
            <Text style={cal.navTitle}>{MONTH_NAMES[viewMonth]} {viewYear}</Text>
            <TouchableOpacity onPress={nextMonth} style={cal.navBtn}>
              <Icon name="chevron-right" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          <View style={cal.dayRow}>
            {DAY_NAMES.map(d => <Text key={d} style={cal.dayName}>{d}</Text>)}
          </View>
          <View style={cal.grid}>
            {cells.map((day, idx) => {
              if (!day) return <View key={`e-${idx}`} style={cal.cell} />;
              const avail = isAvailable(day);
              const sel   = isSelected(day);
              const tod   = isToday(day);
              return (
                <TouchableOpacity
                  key={`d-${day}`}
                  style={[cal.cell, sel && cal.cellSelected, tod && !sel && cal.cellToday, !avail && cal.cellDisabled]}
                  onPress={() => avail && (onChange(toStr(day)), setShow(false))}
                  activeOpacity={avail ? 0.7 : 1}>
                  <Text style={[cal.cellText, !avail && cal.cellTextDisabled, sel && cal.cellTextSelected, tod && !sel && cal.cellTextToday]}>{day}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {availableDates.length > 0 && (
            <View style={cal.legend}>
              <View style={[cal.legendDot, {backgroundColor: COLORS.primary}]} />
              <Text style={cal.legendText}>Available dates from doctor's schedule</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Slide 1: Patient Info ────────────────────────────────────────────────────

function SlidePatientInfo({data, onChange}: {data: any; onChange: (k: string, v: string) => void}) {
  return (
    <ScrollView contentContainerStyle={slide.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <Text style={slide.slideTitle}>Patient Information</Text>
      <Text style={slide.slideSubtitle}>Tell us about the patient</Text>
      <InputField label="Full Name"     value={data.patientName}  onChange={v => onChange('patientName', v)}  required placeholder="e.g. Arjun Mehta" />
      <InputField label="Age"           value={data.patientAge}   onChange={v => onChange('patientAge', v)}   keyboardType="numeric" placeholder="e.g. 34" />
      <InputField label="Phone Number"  value={data.patientPhone} onChange={v => onChange('patientPhone', v)} keyboardType="phone-pad" placeholder="+91 98765 43210" required />
      <ChipSelect label="Gender"        value={data.gender}       options={GENDER_OPTIONS}                    onChange={v => onChange('gender', v)} required />
    </ScrollView>
  );
}

// ─── Slide 2: Doctor, Date & Time ─────────────────────────────────────────────

function SlideAppointmentDetails({data, onChange}: {data: any; onChange: (k: string, v: string) => void}) {

  // Fetch all doctors
  const {data: doctorsRes, isLoading: loadingDoctors} = useQuery({
    queryKey: ['doctors-list'],
    queryFn: async () => {
      const res = await instance.get(api.getAllDoctors, {params: {limit: 50}});
      return res.data.data as any[];
    },
  });

  const doctors = doctorsRes || [];

  // Fetch available dates when doctor selected
  const {data: datesRes, isLoading: loadingDates} = useQuery({
    queryKey: ['doctor-dates', data.doctorUserId || data.doctorId],
    queryFn: async () => {
      const res = await instance.get(api.getDoctorAvailableDates, {params: {doctorId: data.doctorUserId || data.doctorId}});
      return (res.data.data as {date: string}[]).map(d => d.date);
    },
    enabled: !!(data.doctorUserId || data.doctorId),
  });

  const availableDates = datesRes || [];

  // Fetch slots when doctor + date selected
  const {data: slotsRes, isLoading: loadingSlots} = useQuery({
    queryKey: ['doctor-slots', data.doctorUserId || data.doctorId, data.date],
    queryFn: async () => {
      const res = await instance.get(api.getDoctorSlots, {
        params: {doctorId: data.doctorUserId || data.doctorId, selectedDate: data.date},
      });
      return (res.data.data.slots as any[]).filter(s => s.isAvailable);
    },
    enabled: !!(data.doctorUserId || data.doctorId) && !!data.date,
  });

  const slots = slotsRes || [];

  const selectDoctor = (doc: any) => {
    // Backend bookAppointment requires employeeInfo.id, not user.id
    // getDoctorSlots and getDoctorAvailableDates also use employeeInfo.id
    onChange('doctorId',       doc.employeeInfo?.id || doc.id);
    onChange('doctorUserId',   doc.id);
    onChange('doctorName',     `Dr. ${doc.fName} ${doc.lName}`);
    onChange('specialization', doc.employeeInfo?.department?.[0]?.name || '');
    onChange('date', '');
    onChange('timeSlotId', '');
    onChange('time', '');
  };

  return (
    <ScrollView contentContainerStyle={slide.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <Text style={slide.slideTitle}>Appointment Details</Text>
      <Text style={slide.slideSubtitle}>Choose your doctor, date and time</Text>

      {/* Doctor selection */}
      <View style={f.group}>
        <Text style={f.label}>Select Doctor <Text style={{color: COLORS.error}}>*</Text></Text>
        {loadingDoctors ? (
          <ActivityIndicator color={COLORS.primary} />
        ) : (
          <View style={{gap: SPACING.xs}}>
            {doctors.map((doc: any) => {
              const active = data.doctorId === doc.id;
              const dept   = doc.employeeInfo?.department?.[0]?.name || '';
              const charge = doc.employeeInfo?.consultationCharge;
              return (
                <TouchableOpacity
                  key={doc.id}
                  style={[f.doctorCard, active && f.doctorCardActive]}
                  onPress={() => selectDoctor(doc)}>
                  <View style={[f.doctorAvatar, active && {backgroundColor: COLORS.primary}]}>
                    <Text style={[f.doctorAvatarText, active && {color: COLORS.white}]}>
                      {doc.fName[0]}{doc.lName[0]}
                    </Text>
                  </View>
                  <View style={{flex: 1}}>
                    <Text style={[f.doctorName, active && {color: COLORS.primary}]}>Dr. {doc.fName} {doc.lName}</Text>
                    <Text style={f.doctorDept}>{dept}</Text>
                  </View>
                  {charge && <Text style={[f.doctorCharge, active && {color: COLORS.primary}]}>₹{charge}</Text>}
                  {active && <Icon name="check-circle" size={18} color={COLORS.primary} />}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* Date picker — shown after doctor selected */}
      {data.doctorId ? (
        <>
          {loadingDates ? (
            <View style={{alignItems: 'center', padding: SPACING.md}}>
              <ActivityIndicator color={COLORS.primary} />
              <Text style={{color: COLORS.textMuted, marginTop: 8}}>Loading available dates...</Text>
            </View>
          ) : (
            <CalendarPicker
              label="Select Date"
              value={data.date}
              onChange={v => {onChange('date', v); onChange('timeSlotId', ''); onChange('time', '');}}
              required
              availableDates={availableDates}
            />
          )}
        </>
      ) : (
        <View style={f.hintBox}>
          <Icon name="information-outline" size={14} color={COLORS.primary} />
          <Text style={f.hintText}>Select a doctor to see available dates</Text>
        </View>
      )}

      {/* Time slots — shown after date selected */}
      {data.doctorId && data.date && (
        <View style={f.group}>
          <Text style={f.label}>Select Time Slot <Text style={{color: COLORS.error}}>*</Text></Text>
          {loadingSlots ? (
            <View style={{alignItems: 'center', padding: SPACING.md}}>
              <ActivityIndicator color={COLORS.primary} />
              <Text style={{color: COLORS.textMuted, marginTop: 8}}>Loading time slots...</Text>
            </View>
          ) : slots.length === 0 ? (
            <View style={f.hintBox}>
              <Icon name="calendar-remove-outline" size={14} color={COLORS.error} />
              <Text style={[f.hintText, {color: COLORS.error}]}>No available slots for this date</Text>
            </View>
          ) : (
            <View style={f.slotGrid}>
              {slots.map((slot: any) => {
                const timeStr = formatUTCToLocal(slot.startTime);
                const active  = data.timeSlotId === slot.id;
                return (
                  <TouchableOpacity
                    key={slot.id}
                    style={[f.slotBtn, active && f.slotBtnActive]}
                    onPress={() => {onChange('timeSlotId', slot.id); onChange('time', timeStr); onChange('slotStartTime', slot.startTime); onChange('slotEndTime', slot.endTime);}}>
                    <Icon name="clock-outline" size={12} color={active ? COLORS.white : COLORS.primary} />
                    <Text style={[f.slotText, active && f.slotTextActive]}>{timeStr}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      )}

      {/* Reason */}
      <InputField label="Reason for Visit" value={data.reason} onChange={v => onChange('reason', v)} required placeholder="Describe the reason" multiline />
    </ScrollView>
  );
}

// ─── Slide 3: Review & Confirm ────────────────────────────────────────────────

function SlideReview({data, onChange}: {data: any; onChange: (k: string, v: string) => void}) {
  return (
    <ScrollView contentContainerStyle={slide.scroll} showsVerticalScrollIndicator={false}>
      <Text style={slide.slideTitle}>Review & Confirm</Text>
      <Text style={slide.slideSubtitle}>Check all details before submitting</Text>

      <ChipSelect label="Appointment Status" value={data.status} options={STATUS_OPTIONS} onChange={v => onChange('status', v)} required />

      <View style={rv.card}>
        <Text style={rv.cardTitle}>Patient</Text>
        <ReviewRow icon="account"            label="Name"   value={data.patientName} />
        <ReviewRow icon="cake"               label="Age"    value={data.patientAge ? `${data.patientAge} years` : ''} />
        <ReviewRow icon="phone"              label="Phone"  value={data.patientPhone} />
        <ReviewRow icon="gender-male-female" label="Gender" value={data.gender} />
      </View>

      <View style={rv.card}>
        <Text style={rv.cardTitle}>Appointment</Text>
        <ReviewRow icon="stethoscope"        label="Doctor"         value={data.doctorName} />
        <ReviewRow icon="hospital"           label="Specialization" value={data.specialization} />
        <ReviewRow icon="calendar-outline"   label="Date"           value={data.date} />
        <ReviewRow icon="clock-outline"      label="Time"           value={data.time} />
        <ReviewRow icon="note-text-outline"  label="Reason"         value={data.reason} />
      </View>
    </ScrollView>
  );
}

// ─── Success Screen ───────────────────────────────────────────────────────────

function SuccessScreen({patientName, onGoToDashboard}: {patientName: string; onGoToDashboard: () => void}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[success.wrap, {paddingTop: insets.top, paddingBottom: insets.bottom}]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} translucent={false} />
      <View style={success.iconWrap}>
        <Icon name="check-circle" size={80} color={COLORS.white} />
      </View>
      <Text style={success.title}>Appointment Booked!</Text>
      <Text style={success.subtitle}>{patientName}'s appointment has been successfully created.</Text>
      <View style={success.infoBox}>
        <Icon name="information-outline" size={16} color={COLORS.primary} />
        <Text style={success.infoText}>Visible in Admin Appointments and Doctor Dashboard.</Text>
      </View>
      <TouchableOpacity style={success.btn} onPress={onGoToDashboard}>
        <Icon name="view-dashboard-outline" size={18} color={COLORS.primary} />
        <Text style={success.btnText}>Go to Admin Dashboard</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

const STEPS = ['Patient Info', 'Appointment', 'Review'];

export default function BookAppointmentScreen({navigation}: any) {
  const insets    = useSafeAreaInsets();
  const [step, setStep]           = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const [form, setForm] = useState({
    patientName: '', patientAge: '', patientPhone: '', gender: 'Male',
    doctorId: '', doctorUserId: '', doctorName: '', specialization: '',
    date: '', timeSlotId: '', time: '', slotStartTime: '', slotEndTime: '', reason: '',
    status: 'CONFIRMED',
  });

  const onChange = (key: string, val: string) => setForm(prev => ({...prev, [key]: val}));

  const validateStep = (): boolean => {
    if (step === 0) {
      if (!form.patientName.trim()) {alert('Patient name is required'); return false;}
      if (!form.patientPhone.trim()) {alert('Phone number is required'); return false;}
      return true;
    }
    if (step === 1) {
      if (!form.doctorId) {alert('Please select a doctor'); return false;}
      if (!form.date) {alert('Please select a date'); return false;}
      if (!form.timeSlotId) {alert('Please select a time slot'); return false;}
      if (!form.reason.trim()) {alert('Please enter the reason for visit'); return false;}
      return true;
    }
    return true;
  };

  const animateSlide = (direction: 'forward' | 'back', callback: () => void) => {
    const toValue = direction === 'forward' ? -SCREEN_WIDTH : SCREEN_WIDTH;
    Animated.timing(slideAnim, {toValue, duration: 250, useNativeDriver: true}).start(() => {
      slideAnim.setValue(direction === 'forward' ? SCREEN_WIDTH : -SCREEN_WIDTH);
      callback();
      Animated.timing(slideAnim, {toValue: 0, duration: 250, useNativeDriver: true}).start();
    });
  };

  const handleNext = () => {
    if (!validateStep()) return;
    if (step < 2) animateSlide('forward', () => setStep(s => s+1));
  };

  const handleBack = () => {
    if (step > 0) animateSlide('back', () => setStep(s => s-1));
    else navigation.navigate('AdminDashboard');
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setSubmitting(true);
    try {
      const nameParts = form.patientName.trim().split(' ');
      const fName = nameParts[0] || '';
      const lName = nameParts.slice(1).join(' ') || '';

      await instance.post(api.bookAppointment, {
        patientInfo: {
          fName,
          lName,
          phoneNumber: form.patientPhone.trim(),
          age:         form.patientAge || '',
          gender:      form.gender.toUpperCase() as 'MALE' | 'FEMALE' | 'OTHER',
        },
        doctorId:       form.doctorId,
        appointmentDate: form.date,
        startTime:      form.slotStartTime || undefined,
        endTime:        form.slotEndTime   || undefined,
        reason:         form.reason.trim(),
      });
      setSubmitted(true);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to book appointment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <SuccessScreen
        patientName={form.patientName}
        onGoToDashboard={() => navigation.navigate('AdminDashboard')}
      />
    );
  }

  return (
    <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[s.safe, {paddingTop: insets.top}]}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} translucent={false} />

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={handleBack} style={s.backBtn}>
            <Icon name="arrow-left" size={22} color={COLORS.white} />
          </TouchableOpacity>
          <View style={{flex: 1}}>
            <Text style={s.headerTitle}>Book Appointment</Text>
            <Text style={s.headerSub}>Step {step+1} of {STEPS.length} — {STEPS[step]}</Text>
          </View>
        </View>

        {/* Progress */}
        <View style={s.progressWrap}>
          {STEPS.map((label, i) => (
            <React.Fragment key={label}>
              <View style={s.stepWrap}>
                <View style={[s.stepCircle, i <= step && s.stepCircleActive]}>
                  {i < step
                    ? <Icon name="check" size={12} color={COLORS.white} />
                    : <Text style={[s.stepNum, i === step && s.stepNumActive]}>{i+1}</Text>
                  }
                </View>
                <Text style={[s.stepLabel, i === step && s.stepLabelActive]}>{label}</Text>
              </View>
              {i < STEPS.length-1 && <View style={[s.progressLine, i < step && s.progressLineActive]} />}
            </React.Fragment>
          ))}
        </View>

        {/* Slides */}
        <Animated.View style={[s.slideWrap, {transform: [{translateX: slideAnim}]}]}>
          {step === 0 && <SlidePatientInfo data={form} onChange={onChange} />}
          {step === 1 && <SlideAppointmentDetails data={form} onChange={onChange} />}
          {step === 2 && <SlideReview data={form} onChange={onChange} />}
        </Animated.View>

        {/* Footer */}
        <View style={[s.footer, {paddingBottom: insets.bottom + SPACING.md}]}>
          <TouchableOpacity style={s.backFooterBtn} onPress={handleBack}>
            <Icon name="arrow-left" size={16} color={COLORS.textSecondary} />
            <Text style={s.backFooterText}>{step === 0 ? 'Cancel' : 'Back'}</Text>
          </TouchableOpacity>
          {step < 2
            ? (
              <TouchableOpacity style={s.nextBtn} onPress={handleNext}>
                <Text style={s.nextBtnText}>Next</Text>
                <Icon name="arrow-right" size={16} color={COLORS.white} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[s.nextBtn, {backgroundColor: COLORS.success, opacity: submitting ? 0.7 : 1}]}
                onPress={handleSubmit} disabled={submitting}>
                {submitting
                  ? <ActivityIndicator size="small" color={COLORS.white} />
                  : <>
                      <Icon name="check-circle-outline" size={16} color={COLORS.white} />
                      <Text style={s.nextBtnText}>Submit</Text>
                    </>
                }
              </TouchableOpacity>
            )
          }
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:              {flex: 1, backgroundColor: COLORS.primary},
  header:            {flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md, gap: SPACING.md},
  backBtn:           {padding: 4},
  headerTitle:       {fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, color: COLORS.white},
  headerSub:         {fontSize: FONTS.sizes.xs, color: 'rgba(255,255,255,0.75)', marginTop: 2},
  progressWrap:      {flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingBottom: SPACING.lg},
  stepWrap:          {alignItems: 'center', gap: 4},
  stepCircle:        {width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center'},
  stepCircleActive:  {backgroundColor: COLORS.white},
  stepNum:           {fontSize: FONTS.sizes.xs, color: 'rgba(255,255,255,0.8)', fontWeight: FONTS.weights.bold},
  stepNumActive:     {color: COLORS.primary},
  stepLabel:         {fontSize: 9, color: 'rgba(255,255,255,0.6)', fontWeight: FONTS.weights.medium},
  stepLabelActive:   {color: COLORS.white},
  progressLine:      {flex: 1, height: 2, backgroundColor: 'rgba(255,255,255,0.25)', marginBottom: 16, marginHorizontal: 4},
  progressLineActive:{backgroundColor: COLORS.white},
  slideWrap:         {flex: 1, backgroundColor: '#F5F7FA'},
  footer:            {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.lg, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.border},
  backFooterBtn:     {flexDirection: 'row', alignItems: 'center', gap: 6, padding: SPACING.sm},
  backFooterText:    {fontSize: FONTS.sizes.base, color: COLORS.textSecondary, fontWeight: FONTS.weights.medium},
  nextBtn:           {flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.primary, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.sm+2, borderRadius: RADIUS.full},
  nextBtnText:       {fontSize: FONTS.sizes.base, color: COLORS.white, fontWeight: FONTS.weights.semibold},
});

const slide = StyleSheet.create({
  scroll:       {padding: SPACING.lg, paddingBottom: SPACING.xxxl},
  slideTitle:   {fontSize: FONTS.sizes.xl, fontWeight: FONTS.weights.bold, color: COLORS.text, marginBottom: 4},
  slideSubtitle:{fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginBottom: SPACING.lg},
});

const f = StyleSheet.create({
  group:           {marginBottom: SPACING.md},
  label:           {fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.semibold, color: COLORS.text, marginBottom: SPACING.xs},
  inputWrap:       {flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, backgroundColor: COLORS.white},
  input:           {flex: 1, fontSize: FONTS.sizes.base, color: COLORS.text, paddingVertical: SPACING.sm+2},
  chipRow:         {flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs},
  chip:            {paddingHorizontal: SPACING.md, paddingVertical: 8, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white},
  chipActive:      {backgroundColor: COLORS.primary, borderColor: COLORS.primary},
  chipText:        {fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, fontWeight: FONTS.weights.medium},
  chipTextActive:  {color: COLORS.white},
  dateBtn:         {flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm+4, backgroundColor: COLORS.white},
  dateBtnText:     {flex: 1, fontSize: FONTS.sizes.base, color: COLORS.text, fontWeight: FONTS.weights.medium},
  doctorCard:      {flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, padding: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white, ...SHADOW.sm},
  doctorCardActive:{borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight},
  doctorAvatar:    {width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center'},
  doctorAvatarText:{fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.bold, color: COLORS.primary},
  doctorName:      {fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.semibold, color: COLORS.text},
  doctorDept:      {fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: 2},
  doctorCharge:    {fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.bold, color: COLORS.textSecondary},
  slotGrid:        {flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs},
  slotBtn:         {flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: SPACING.sm, paddingVertical: 7, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.primary, backgroundColor: COLORS.white},
  slotBtnActive:   {backgroundColor: COLORS.primary},
  slotText:        {fontSize: FONTS.sizes.xs, color: COLORS.primary, fontWeight: FONTS.weights.medium},
  slotTextActive:  {color: COLORS.white},
  hintBox:         {flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, padding: SPACING.md, backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.md},
  hintText:        {fontSize: FONTS.sizes.xs, color: COLORS.primary},
});

const rv = StyleSheet.create({
  card:      {backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.base, marginBottom: SPACING.md, ...SHADOW.sm},
  cardTitle: {fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.bold, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: SPACING.sm},
  row:       {flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, paddingVertical: SPACING.xs},
  iconWrap:  {width: 28, height: 28, borderRadius: RADIUS.sm, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center'},
  rowLabel:  {fontSize: FONTS.sizes.xs, color: COLORS.textMuted},
  rowValue:  {fontSize: FONTS.sizes.sm, color: COLORS.text, fontWeight: FONTS.weights.medium},
});

const cal = StyleSheet.create({
  wrap:             {backgroundColor: COLORS.white, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, marginTop: SPACING.xs, overflow: 'hidden'},
  nav:              {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.md, backgroundColor: COLORS.primaryLight},
  navBtn:           {padding: 4},
  navTitle:         {fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.bold, color: COLORS.primary},
  dayRow:           {flexDirection: 'row', paddingHorizontal: SPACING.xs, paddingVertical: SPACING.xs, borderBottomWidth: 1, borderBottomColor: COLORS.border},
  dayName:          {flex: 1, textAlign: 'center', fontSize: FONTS.sizes.xs, color: COLORS.textMuted, fontWeight: FONTS.weights.semibold},
  grid:             {flexDirection: 'row', flexWrap: 'wrap', padding: SPACING.xs},
  cell:             {width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center'},
  cellSelected:     {backgroundColor: COLORS.primary, borderRadius: 100},
  cellToday:        {borderWidth: 1, borderColor: COLORS.primary, borderRadius: 100},
  cellDisabled:     {opacity: 0.3},
  cellText:         {fontSize: FONTS.sizes.sm, color: COLORS.text},
  cellTextDisabled: {color: COLORS.textMuted},
  cellTextSelected: {color: COLORS.white, fontWeight: FONTS.weights.bold},
  cellTextToday:    {color: COLORS.primary, fontWeight: FONTS.weights.bold},
  legend:           {flexDirection: 'row', alignItems: 'center', gap: 6, padding: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.border},
  legendDot:        {width: 8, height: 8, borderRadius: 4},
  legendText:       {fontSize: FONTS.sizes.xs, color: COLORS.textMuted},
});

const success = StyleSheet.create({
  wrap:     {flex: 1, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl},
  iconWrap: {width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.xl},
  title:    {fontSize: FONTS.sizes.xxxl, fontWeight: FONTS.weights.bold, color: COLORS.white, marginBottom: SPACING.md},
  subtitle: {fontSize: FONTS.sizes.base, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 24, marginBottom: SPACING.xl},
  infoBox:  {flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, backgroundColor: COLORS.white, padding: SPACING.md, borderRadius: RADIUS.md, marginBottom: SPACING.xl},
  infoText: {flex: 1, fontSize: FONTS.sizes.sm, color: COLORS.primary, lineHeight: 20},
  btn:      {flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.white, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, borderRadius: RADIUS.full},
  btnText:  {fontSize: FONTS.sizes.base, color: COLORS.primary, fontWeight: FONTS.weights.bold},
});