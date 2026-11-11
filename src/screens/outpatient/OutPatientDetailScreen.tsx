import React, {useState, useEffect} from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, StatusBar, ActivityIndicator, Alert, FlatList,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {format} from 'date-fns';
import {COLORS, FONTS, SPACING, RADIUS, SHADOW} from '../../constants/theme';
import {instance} from '../../services/axios';
import {api} from '../../constants/api';

// ─── Types ────────────────────────────────────────────────────────────────────

const TABS = [
  {key: 'details',      label: 'Details',      icon: 'account-outline'},
  {key: 'consultation', label: 'Notes',        icon: 'stethoscope'},
  {key: 'vitals',       label: 'Vitals',       icon: 'heart-pulse'},
  {key: 'medication',   label: 'Medication',   icon: 'pill'},
  {key: 'lab',          label: 'Lab',          icon: 'flask-outline'},
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function InfoCard({title, color = COLORS.primary, children}: {title: string; color?: string; children: React.ReactNode}) {
  return (
    <View style={[h.card, {borderLeftColor: color}]}>
      <Text style={h.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function InfoRow({label, value}: {label: string; value?: string | null}) {
  if (!value) return null;
  return (
    <View style={h.infoRow}>
      <Text style={h.infoLabel}>{label}</Text>
      <Text style={h.infoValue}>{value}</Text>
    </View>
  );
}

function SectionHeader({title, action}: {title: string; action?: React.ReactNode}) {
  return (
    <View style={h.sectionHeader}>
      <Text style={h.sectionTitle}>{title}</Text>
      {action}
    </View>
  );
}

function EmptyState({icon, title, subtitle}: {icon: string; title: string; subtitle?: string}) {
  return (
    <View style={h.empty}>
      <Icon name={icon} size={40} color={COLORS.border}/>
      <Text style={h.emptyTitle}>{title}</Text>
      {subtitle && <Text style={h.emptySub}>{subtitle}</Text>}
    </View>
  );
}

// ─── Tab: Patient Details ─────────────────────────────────────────────────────

function TabDetails({data}: {data: any}) {
  const patientInfo = data?.patientInfo;
  const user        = data?.user;
  const appt        = data?.patientAppointments?.[0];
  const referrals   = data?.referrals || [];

  const bloodGroupMap: Record<string, string> = {
    A_PLUS: 'A+', B_PLUS: 'B+', O_PLUS: 'O+', AB_PLUS: 'AB+',
    A_MINUS: 'A-', B_MINUS: 'B-', O_MINUS: 'O-', AB_MINUS: 'AB-',
  };

  return (
    <ScrollView contentContainerStyle={h.tabScroll} showsVerticalScrollIndicator={false}>
      <InfoCard title="Personal Information" color="#3B82F6">
        <InfoRow label="Full Name"    value={user?.name || `${user?.fName || ''} ${user?.lName || ''}`.trim()} />
        <InfoRow label="Patient ID"   value={patientInfo?.id?.split('_')[0]} />
        <InfoRow label="Age"          value={patientInfo?.age ? `${patientInfo.age} years` : null} />
        <InfoRow label="Gender"       value={patientInfo?.gender} />
        <InfoRow label="Phone"        value={user?.phoneNumber} />
        <InfoRow label="Email"        value={user?.email} />
        <InfoRow label="Blood Group"  value={user?.bloodGroup ? bloodGroupMap[user.bloodGroup] || user.bloodGroup : null} />
      </InfoCard>

      {appt && (
        <InfoCard title="Appointment Information" color="#F59E0B">
          <InfoRow label="Date"       value={appt.appointmentDate ? format(new Date(appt.appointmentDate), 'dd MMM yyyy') : null} />
          <InfoRow label="Doctor"     value={appt.doctor?.user ? `Dr. ${appt.doctor.user.fName} ${appt.doctor.user.lName}` : null} />
          <InfoRow label="Department" value={appt.doctor?.department?.[0]?.name} />
          <InfoRow label="Reason"     value={appt.reason} />
          <InfoRow label="Status"     value={appt.status} />
          <InfoRow label="Token"      value={appt.tokenNumber ? `#${appt.tokenNumber}` : null} />
        </InfoCard>
      )}

      {referrals.length > 0 && (
        <InfoCard title="Referral Information" color="#EF4444">
          {referrals.map((ref: any, i: number) => (
            <View key={i} style={{marginBottom: i < referrals.length - 1 ? SPACING.md : 0}}>
              <InfoRow label="Referral Name"    value={ref.referralName || ref.referralUser?.referralName} />
              <InfoRow label="Contact"          value={ref.referralContact || ref.referralUser?.referralContact} />
              <InfoRow label="Type"             value={ref.referralType} />
              <InfoRow label="Concession"       value={ref.concessionPercentage ? `${ref.concessionPercentage}%` : null} />
            </View>
          ))}
        </InfoCard>
      )}
    </ScrollView>
  );
}

// ─── Tab: Clinical Notes / Consultation ──────────────────────────────────────

function TabConsultation({appointmentId, data, refetch}: {appointmentId: string; data: any; refetch: () => void}) {
  const queryClient = useQueryClient();
  const visits   = data?.visits || [];
  const appt     = data?.patientAppointments?.[0];
  const isCompleted = appt?.status === 'COMPLETED';
  const hasVisitForAppt = visits.some((v: any) => v.appointmentId === appointmentId);
  const showForm = !hasVisitForAppt && !isCompleted;

  const [form, setForm] = useState({
    chiefComplaint: '', examination: '', diagnosis: '',
    testReportsToCarry: '', nextReviewDate: '',
  });

  const mutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await instance.post(api.addVisit, payload);
      return res.data;
    },
    onSuccess: () => {
      Alert.alert('Success', 'Clinical notes added successfully');
      setForm({chiefComplaint:'', examination:'', diagnosis:'', testReportsToCarry:'', nextReviewDate:''});
      queryClient.invalidateQueries({queryKey: ['outpatient-detail', appointmentId]});
      refetch();
    },
    onError: (err: any) => {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to add clinical notes');
    },
  });

  const handleSubmit = () => {
    if (!form.chiefComplaint.trim()) {Alert.alert('Required', 'Chief complaint is required'); return;}
    if (!form.diagnosis.trim()) {Alert.alert('Required', 'Diagnosis is required'); return;}
    mutation.mutate({
      ...form,
      doctorId:      appt?.doctorId,
      appointmentId: appt?.id,
      patientId:     appt?.patientId,
      visitDate:     new Date().toISOString(),
      visitType:     'OPD',
    });
  };

  return (
    <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={h.tabScroll} showsVerticalScrollIndicator={false}>
        {showForm && (
          <View style={h.card}>
            <Text style={h.cardTitle}>Add Clinical Notes</Text>
            <FormField label="Chief Complaint *" value={form.chiefComplaint} onChange={v => setForm(p => ({...p, chiefComplaint: v}))} multiline placeholder="Enter chief complaint..." />
            <FormField label="Examination" value={form.examination} onChange={v => setForm(p => ({...p, examination: v}))} multiline placeholder="Enter examination findings..." />
            <FormField label="Diagnosis *" value={form.diagnosis} onChange={v => setForm(p => ({...p, diagnosis: v}))} multiline placeholder="Enter diagnosis..." />
            <FormField label="Test Reports to Carry" value={form.testReportsToCarry} onChange={v => setForm(p => ({...p, testReportsToCarry: v}))} multiline placeholder="Enter test reports..." />
            <FormField label="Next Visit (Days)" value={form.nextReviewDate} onChange={v => setForm(p => ({...p, nextReviewDate: v}))} keyboardType="numeric" placeholder="e.g. 7" />
            <TouchableOpacity style={[h.btn, {opacity: mutation.isPending ? 0.7 : 1}]} onPress={handleSubmit} disabled={mutation.isPending}>
              {mutation.isPending ? <ActivityIndicator color={COLORS.white}/> : <Text style={h.btnText}>Add Clinical Notes</Text>}
            </TouchableOpacity>
          </View>
        )}

        {visits.length === 0
          ? <EmptyState icon="stethoscope" title="No clinical notes found" subtitle="No notes have been recorded yet"/>
          : visits.map((visit: any) => (
            <View key={visit.id} style={h.card}>
              <View style={h.cardRow}>
                <Icon name="calendar-outline" size={14} color={COLORS.textMuted}/>
                <Text style={h.metaText}>{visit.visitDate ? format(new Date(visit.visitDate), 'dd MMM yyyy, h:mm a') : '—'}</Text>
              </View>
              {visit.chiefComplaint && <InfoRow label="Chief Complaint"    value={visit.chiefComplaint}/>}
              {visit.examination    && <InfoRow label="Examination"         value={visit.examination}/>}
              {visit.diagnosis      && <InfoRow label="Diagnosis"           value={visit.diagnosis}/>}
              {visit.testReportsToCarry && <InfoRow label="Test Reports"    value={visit.testReportsToCarry}/>}
              {visit.nextReviewDate && <InfoRow label="Next Review"         value={`In ${visit.nextReviewDate} days`}/>}
              {visit?.cost?.price   && <InfoRow label="Cost"               value={`₹${visit.cost.price}`}/>}
            </View>
          ))
        }
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Tab: Vitals ──────────────────────────────────────────────────────────────

function TabVitals({appointmentId, data, refetch}: {appointmentId: string; data: any; refetch: () => void}) {
  const queryClient = useQueryClient();
  const vitals = data?.patientVitals || [];
  const appt   = data?.patientAppointments?.[0];
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    temperature:'', pulse:'', bloodPressureSystolic:'', bloodPressureDiastolic:'',
    oxygenSaturation:'', weight:'', height:'', respiratoryRate:'',
  });

  const mutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await instance.post(api.addVitals, payload);
      return res.data;
    },
    onSuccess: () => {
      Alert.alert('Success', 'Vitals recorded successfully');
      setShowForm(false);
      setForm({temperature:'', pulse:'', bloodPressureSystolic:'', bloodPressureDiastolic:'', oxygenSaturation:'', weight:'', height:'', respiratoryRate:''});
      queryClient.invalidateQueries({queryKey: ['outpatient-detail', appointmentId]});
      refetch();
    },
    onError: (err: any) => Alert.alert('Error', err?.response?.data?.message || 'Failed to record vitals'),
  });

  const handleSubmit = () => {
    mutation.mutate({
      appointmentId,
      patientId: appt?.patientId,
      time: new Date().toISOString(),
      temperature:            form.temperature ? parseFloat(form.temperature) : undefined,
      pulse:                  form.pulse ? parseInt(form.pulse) : undefined,
      bloodPressureSystolic:  form.bloodPressureSystolic ? parseInt(form.bloodPressureSystolic) : undefined,
      bloodPressureDiastolic: form.bloodPressureDiastolic ? parseInt(form.bloodPressureDiastolic) : undefined,
      oxygenSaturation:       form.oxygenSaturation ? parseFloat(form.oxygenSaturation) : undefined,
      weight:                 form.weight ? parseFloat(form.weight) : undefined,
      height:                 form.height ? parseFloat(form.height) : undefined,
      respiratoryRate:        form.respiratoryRate ? parseInt(form.respiratoryRate) : undefined,
    });
  };

  return (
    <ScrollView contentContainerStyle={h.tabScroll} showsVerticalScrollIndicator={false}>
      <View style={h.rowBetween}>
        <Text style={h.sectionTitle}>Patient Vitals</Text>
        <TouchableOpacity style={h.btnSm} onPress={() => setShowForm(v => !v)}>
          <Icon name={showForm ? 'close' : 'plus'} size={14} color={COLORS.white}/>
          <Text style={h.btnSmText}>{showForm ? 'Cancel' : 'Add Vitals'}</Text>
        </TouchableOpacity>
      </View>

      {showForm && (
        <View style={h.card}>
          <Text style={h.cardTitle}>Record Vitals</Text>
          <View style={h.grid2}>
            <FormField label="Temperature (°F)" value={form.temperature} onChange={v=>setForm(p=>({...p,temperature:v}))} keyboardType="decimal-pad" placeholder="e.g. 98.6"/>
            <FormField label="Pulse (bpm)"       value={form.pulse}       onChange={v=>setForm(p=>({...p,pulse:v}))}       keyboardType="numeric"      placeholder="e.g. 72"/>
            <FormField label="BP Systolic"       value={form.bloodPressureSystolic}  onChange={v=>setForm(p=>({...p,bloodPressureSystolic:v}))}  keyboardType="numeric" placeholder="e.g. 120"/>
            <FormField label="BP Diastolic"      value={form.bloodPressureDiastolic} onChange={v=>setForm(p=>({...p,bloodPressureDiastolic:v}))} keyboardType="numeric" placeholder="e.g. 80"/>
            <FormField label="SpO2 (%)"          value={form.oxygenSaturation} onChange={v=>setForm(p=>({...p,oxygenSaturation:v}))} keyboardType="decimal-pad" placeholder="e.g. 98"/>
            <FormField label="Weight (kg)"       value={form.weight}  onChange={v=>setForm(p=>({...p,weight:v}))}  keyboardType="decimal-pad" placeholder="e.g. 70"/>
            <FormField label="Height (cm)"       value={form.height}  onChange={v=>setForm(p=>({...p,height:v}))}  keyboardType="decimal-pad" placeholder="e.g. 170"/>
            <FormField label="Resp. Rate"        value={form.respiratoryRate} onChange={v=>setForm(p=>({...p,respiratoryRate:v}))} keyboardType="numeric" placeholder="e.g. 16"/>
          </View>
          <TouchableOpacity style={[h.btn, {opacity: mutation.isPending ? 0.7 : 1}]} onPress={handleSubmit} disabled={mutation.isPending}>
            {mutation.isPending ? <ActivityIndicator color={COLORS.white}/> : <Text style={h.btnText}>Save Vitals</Text>}
          </TouchableOpacity>
        </View>
      )}

      {vitals.length === 0
        ? <EmptyState icon="heart-pulse" title="No vitals recorded" subtitle="Tap 'Add Vitals' to record patient vitals"/>
        : vitals.map((v: any, i: number) => (
          <View key={v.id || i} style={h.card}>
            <View style={h.cardRow}>
              <Icon name="clock-outline" size={13} color={COLORS.textMuted}/>
              <Text style={h.metaText}>{v.time ? format(new Date(v.time), 'dd MMM yyyy, h:mm a') : '—'}</Text>
            </View>
            <View style={h.vitalsGrid}>
              {v.temperature     && <VitalCell label="Temp"   value={`${v.temperature}°F`}/>}
              {v.pulse           && <VitalCell label="Pulse"  value={`${v.pulse} bpm`}/>}
              {(v.bloodPressureSystolic || v.bloodPressureDiastolic) && <VitalCell label="BP" value={`${v.bloodPressureSystolic||'—'}/${v.bloodPressureDiastolic||'—'}`}/>}
              {v.oxygenSaturation && <VitalCell label="SpO2"  value={`${v.oxygenSaturation}%`}/>}
              {v.weight          && <VitalCell label="Weight" value={`${v.weight} kg`}/>}
              {v.height          && <VitalCell label="Height" value={`${v.height} cm`}/>}
              {v.respiratoryRate && <VitalCell label="Resp."  value={`${v.respiratoryRate}/min`}/>}
            </View>
          </View>
        ))
      }
    </ScrollView>
  );
}

function VitalCell({label, value}: {label: string; value: string}) {
  return (
    <View style={h.vitalCell}>
      <Text style={h.vitalLabel}>{label}</Text>
      <Text style={h.vitalValue}>{value}</Text>
    </View>
  );
}

// ─── Tab: Medication ─────────────────────────────────────────────────────────

function TabMedication({appointmentId, data, refetch}: {appointmentId: string; data: any; refetch: () => void}) {
  const queryClient = useQueryClient();
  const prescriptions = data?.prescribedTo || [];
  const appt          = data?.patientAppointments?.[0];
  const [showForm, setShowForm]       = useState(false);
  const [search,   setSearch]         = useState('');
  const [results,  setResults]        = useState<any[]>([]);
  const [selected, setSelected]       = useState<any[]>([]);
  const [notes,    setNotes]          = useState('');
  const [discount, setDiscount]       = useState('');
  const [searching, setSearching]     = useState(false);

  const searchMeds = async (q: string) => {
    if (!q.trim()) {setResults([]); return;}
    setSearching(true);
    try {
      const res = await instance.get(api.searchMedicines, {params: {search: q, limit: 10}});
      setResults(res.data?.data || []);
    } catch {setResults([]);} finally {setSearching(false);}
  };

  useEffect(() => {
    const t = setTimeout(() => searchMeds(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const addMedicine = (med: any) => {
    if (selected.find(s => s.itemId === med.id)) return;
    setSelected(prev => [...prev, {itemId: med.id, name: med.name, strength: '', frequency: '', duration: '', timing: 'AFTER_MEAL'}]);
    setSearch(''); setResults([]);
  };

  const updateItem = (idx: number, field: string, val: string) => {
    setSelected(prev => prev.map((s, i) => i === idx ? {...s, [field]: val} : s));
  };

  const mutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await instance.post(api.addPrescription, payload);
      return res.data;
    },
    onSuccess: () => {
      Alert.alert('Success', 'Prescription added');
      setShowForm(false); setSelected([]); setNotes(''); setDiscount('');
      queryClient.invalidateQueries({queryKey: ['outpatient-detail', appointmentId]});
      refetch();
    },
    onError: (err: any) => Alert.alert('Error', err?.response?.data?.message || 'Failed to add prescription'),
  });

  const handleSubmit = () => {
    if (selected.length === 0) {Alert.alert('Required', 'Add at least one medicine'); return;}
    mutation.mutate({
      patientId:     appt?.patientId,
      appointmentId: appt?.id,
      doctorId:      appt?.doctorId,
      notes,
      discount: discount ? parseFloat(discount) : undefined,
      prescriptionItems: selected.map(s => ({
        itemId: s.itemId, dosage: s.strength, frequency: s.frequency,
        duration: s.duration, timing: s.timing,
      })),
    });
  };

  return (
    <ScrollView contentContainerStyle={h.tabScroll} showsVerticalScrollIndicator={false}>
      <View style={h.rowBetween}>
        <Text style={h.sectionTitle}>Prescriptions</Text>
        <TouchableOpacity style={h.btnSm} onPress={() => setShowForm(v => !v)}>
          <Icon name={showForm ? 'close' : 'plus'} size={14} color={COLORS.white}/>
          <Text style={h.btnSmText}>{showForm ? 'Cancel' : 'Add'}</Text>
        </TouchableOpacity>
      </View>

      {showForm && (
        <View style={h.card}>
          <Text style={h.cardTitle}>New Prescription</Text>
          <TextInput
            style={h.searchInput} placeholder="Search medicine..."
            placeholderTextColor={COLORS.textMuted} value={search}
            onChangeText={setSearch}/>
          {searching && <ActivityIndicator color={COLORS.primary} style={{marginVertical: 8}}/>}
          {results.length > 0 && (
            <View style={h.dropdown}>
              {results.map((med: any) => (
                <TouchableOpacity key={med.id} style={h.dropdownItem} onPress={() => addMedicine(med)}>
                  <Text style={h.dropdownText}>{med.name} {med.strength ? `(${med.strength})` : ''}</Text>
                  <Text style={h.dropdownSub}>Stock: {med.availableStock || 0}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {selected.map((item, idx) => (
            <View key={idx} style={h.medItem}>
              <View style={h.rowBetween}>
                <Text style={h.medName}>{item.name}</Text>
                <TouchableOpacity onPress={() => setSelected(prev => prev.filter((_,i)=>i!==idx))}>
                  <Icon name="close-circle" size={18} color={COLORS.error}/>
                </TouchableOpacity>
              </View>
              <View style={h.grid2}>
                <FormField label="Dosage/Strength" value={item.strength} onChange={v=>updateItem(idx,'strength',v)} placeholder="e.g. 500mg"/>
                <FormField label="Frequency"        value={item.frequency} onChange={v=>updateItem(idx,'frequency',v)} placeholder="e.g. Twice daily"/>
                <FormField label="Duration"         value={item.duration}  onChange={v=>updateItem(idx,'duration',v)}  placeholder="e.g. 5 days"/>
              </View>
            </View>
          ))}

          {selected.length > 0 && (
            <>
              <FormField label="Notes" value={notes} onChange={setNotes} multiline placeholder="Additional notes..."/>
              <FormField label="Discount (%)" value={discount} onChange={setDiscount} keyboardType="decimal-pad" placeholder="0-100"/>
              <TouchableOpacity style={[h.btn, {opacity: mutation.isPending ? 0.7 : 1}]} onPress={handleSubmit} disabled={mutation.isPending}>
                {mutation.isPending ? <ActivityIndicator color={COLORS.white}/> : <Text style={h.btnText}>Save Prescription</Text>}
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {prescriptions.length === 0
        ? <EmptyState icon="pill" title="No prescriptions" subtitle="No prescriptions have been added"/>
        : prescriptions.map((presc: any) => (
          <View key={presc.id} style={h.card}>
            <View style={h.cardRow}>
              <Icon name="calendar-outline" size={13} color={COLORS.textMuted}/>
              <Text style={h.metaText}>{presc.createdAt ? format(new Date(presc.createdAt), 'dd MMM yyyy') : '—'}</Text>
            </View>
            {presc.prescriptionItems?.map((item: any, i: number) => (
              <View key={i} style={h.prescItem}>
                <Text style={h.prescName}>{item.item?.name || item.customMedicineName || 'Medicine'}</Text>
                <View style={h.prescMeta}>
                  {item.dosage    && <Text style={h.prescMetaText}>Dosage: {item.dosage}</Text>}
                  {item.frequency && <Text style={h.prescMetaText}>Freq: {item.frequency}</Text>}
                  {item.duration  && <Text style={h.prescMetaText}>Duration: {item.duration}</Text>}
                  {item.timing    && <Text style={h.prescMetaText}>Timing: {item.timing.replace('_',' ')}</Text>}
                </View>
              </View>
            ))}
            {presc.notes && <Text style={h.notesText}>Notes: {presc.notes}</Text>}
          </View>
        ))
      }
    </ScrollView>
  );
}

// ─── Tab: Lab Tests ───────────────────────────────────────────────────────────

function TabLab({appointmentId, data, refetch}: {appointmentId: string; data: any; refetch: () => void}) {
  const queryClient = useQueryClient();
  const labOrders  = data?.labOrders || [];
  const appt       = data?.patientAppointments?.[0];
  const [showForm, setShowForm]   = useState(false);
  const [search,   setSearch]     = useState('');
  const [results,  setResults]    = useState<any[]>([]);
  const [selected, setSelected]   = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const searchTests = async (q: string) => {
    if (!q.trim()) {setResults([]); return;}
    setSearching(true);
    try {
      const res = await instance.get(api.searchLabTests, {params: {search: q, limit: 10}});
      setResults(res.data?.data || []);
    } catch {setResults([]);} finally {setSearching(false);}
  };

  useEffect(() => {
    const t = setTimeout(() => searchTests(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const mutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await instance.post(api.createLabOrder, payload);
      return res.data;
    },
    onSuccess: () => {
      Alert.alert('Success', 'Lab order created');
      setShowForm(false); setSelected([]);
      queryClient.invalidateQueries({queryKey: ['outpatient-detail', appointmentId]});
      refetch();
    },
    onError: (err: any) => Alert.alert('Error', err?.response?.data?.message || 'Failed to create lab order'),
  });

  const LAB_STATUS_COLOR: Record<string, string> = {
    PENDING: '#B45309', CONFIRMED: '#1D4ED8', COLLECTED: '#0369A1',
    PROCESSING: '#D97706', COMPLETED: '#065F46', CANCELLED: '#991B1B',
  };

  return (
    <ScrollView contentContainerStyle={h.tabScroll} showsVerticalScrollIndicator={false}>
      <View style={h.rowBetween}>
        <Text style={h.sectionTitle}>Lab Orders</Text>
        <TouchableOpacity style={h.btnSm} onPress={() => setShowForm(v => !v)}>
          <Icon name={showForm ? 'close' : 'plus'} size={14} color={COLORS.white}/>
          <Text style={h.btnSmText}>{showForm ? 'Cancel' : 'Order Test'}</Text>
        </TouchableOpacity>
      </View>

      {showForm && (
        <View style={h.card}>
          <Text style={h.cardTitle}>Order Lab Tests</Text>
          <TextInput
            style={h.searchInput} placeholder="Search lab tests..."
            placeholderTextColor={COLORS.textMuted} value={search}
            onChangeText={setSearch}/>
          {searching && <ActivityIndicator color={COLORS.primary} style={{marginVertical: 8}}/>}
          {results.length > 0 && (
            <View style={h.dropdown}>
              {results.map((test: any) => (
                <TouchableOpacity key={test.id} style={h.dropdownItem}
                  onPress={() => {
                    if (!selected.find(s => s.id === test.id))
                      setSelected(prev => [...prev, test]);
                    setSearch(''); setResults([]);
                  }}>
                  <Text style={h.dropdownText}>{test.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {selected.length > 0 && (
            <>
              <Text style={h.cardTitle}>Selected Tests:</Text>
              {selected.map((test, idx) => (
                <View key={idx} style={h.selectedItem}>
                  <Icon name="flask-outline" size={14} color={COLORS.primary}/>
                  <Text style={{flex:1, fontSize: FONTS.sizes.sm, color: COLORS.text}}>{test.name}</Text>
                  <TouchableOpacity onPress={() => setSelected(prev => prev.filter((_,i) => i !== idx))}>
                    <Icon name="close-circle" size={16} color={COLORS.error}/>
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={[h.btn, {opacity: mutation.isPending ? 0.7:1}]}
                onPress={() => mutation.mutate({
                  patientId:     appt?.patientId,
                  doctorId:      appt?.doctorId,
                  appointmentId: appt?.id,
                  testIds:       selected.map(s => s.id),
                  orderDate:     new Date().toISOString(),
                  status:        'PENDING',
                })} disabled={mutation.isPending}>
                {mutation.isPending ? <ActivityIndicator color={COLORS.white}/> : <Text style={h.btnText}>Create Lab Order</Text>}
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {labOrders.length === 0
        ? <EmptyState icon="flask-outline" title="No lab orders" subtitle="No lab orders have been placed"/>
        : labOrders.map((order: any) => {
          const statusColor = LAB_STATUS_COLOR[order.status] || '#6B7280';
          const tests = order.testIds || order.labConfigurations || [];
          return (
            <View key={order.id} style={h.card}>
              <View style={h.rowBetween}>
                <Text style={h.metaText}>{order.orderDate ? format(new Date(order.orderDate), 'dd MMM yyyy') : '—'}</Text>
                <View style={[h.statusBadge, {backgroundColor: statusColor + '20'}]}>
                  <Text style={[h.statusText, {color: statusColor}]}>{order.status}</Text>
                </View>
              </View>
              {tests.length > 0 && (
                <View style={{marginTop: SPACING.sm}}>
                  {tests.map((t: any, i: number) => (
                    <View key={i} style={h.selectedItem}>
                      <Icon name="flask-outline" size={13} color={COLORS.primary}/>
                      <Text style={{fontSize: FONTS.sizes.sm, color: COLORS.text}}>{t.name || t.testName || 'Lab Test'}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })
      }
    </ScrollView>
  );
}

// ─── Shared Form Field ────────────────────────────────────────────────────────

function FormField({label, value, onChange, placeholder, keyboardType, multiline}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; keyboardType?: any; multiline?: boolean;
}) {
  return (
    <View style={h.fieldGroup}>
      <Text style={h.fieldLabel}>{label}</Text>
      <TextInput
        style={[h.fieldInput, multiline && {height: 80, textAlignVertical: 'top'}]}
        value={value} onChangeText={onChange} placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted} keyboardType={keyboardType || 'default'}
        multiline={multiline} autoCapitalize="sentences"
      />
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function OutPatientDetailScreen({route, navigation}: any) {
  const {id} = route.params;
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('details');

  const {data, isLoading, refetch} = useQuery({
    queryKey: ['outpatient-detail', id],
    queryFn: async () => {
      const res = await instance.get(api.getPatientHistory(id), {
        params: {
          patientAppointments: true, patientVitals: true, visitsBy: true,
          labOrders: true, referrals: true, prescribedTo: true,
        },
      });
      return res.data?.data;
    },
    enabled: !!id,
  });

  const patientName = data?.user
    ? `${data.user.fName || ''} ${data.user.lName || ''}`.trim() || 'Patient'
    : 'Patient';
  const apptStatus  = data?.patientAppointments?.[0]?.status || '';

  if (isLoading) {
    return (
      <View style={{flex:1, justifyContent:'center', alignItems:'center', backgroundColor: COLORS.background}}>
        <ActivityIndicator size="large" color={COLORS.primary}/>
        <Text style={{marginTop: SPACING.md, color: COLORS.textSecondary}}>Loading patient data...</Text>
      </View>
    );
  }

  return (
    <View style={[s.safe, {paddingTop: insets.top, paddingBottom: insets.bottom}]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} translucent={false}/>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Icon name="arrow-left" size={22} color={COLORS.white}/>
        </TouchableOpacity>
        <View style={{flex:1}}>
          <Text style={s.headerTitle} numberOfLines={1}>{patientName}</Text>
          <Text style={s.headerSub}>Out-Patient · {apptStatus}</Text>
        </View>
        <TouchableOpacity style={s.refreshBtn} onPress={() => refetch()}>
          <Icon name="refresh" size={18} color={COLORS.white}/>
        </TouchableOpacity>
      </View>

      {/* Tab bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabBar} style={s.tabBarWrap}>
        {TABS.map(tab => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity key={tab.key} style={[s.tab, active && s.tabActive]} onPress={() => setActiveTab(tab.key)}>
              <Icon name={tab.icon} size={14} color={active ? COLORS.primary : 'rgba(255,255,255,0.7)'}/>
              <Text style={[s.tabText, active && s.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Content */}
      <View style={{flex:1, backgroundColor: COLORS.background}}>
        {activeTab === 'details'      && <TabDetails      data={data}/>}
        {activeTab === 'consultation' && <TabConsultation appointmentId={id} data={data} refetch={refetch}/>}
        {activeTab === 'vitals'       && <TabVitals       appointmentId={id} data={data} refetch={refetch}/>}
        {activeTab === 'medication'   && <TabMedication   appointmentId={id} data={data} refetch={refetch}/>}
        {activeTab === 'lab'          && <TabLab          appointmentId={id} data={data} refetch={refetch}/>}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:        {flex:1, backgroundColor: COLORS.primary},
  header:      {flexDirection:'row', alignItems:'center', padding: SPACING.lg, gap: SPACING.md},
  backBtn:     {padding: 4},
  headerTitle: {fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, color: COLORS.white},
  headerSub:   {fontSize: FONTS.sizes.xs, color:'rgba(255,255,255,0.75)', marginTop:2},
  refreshBtn:  {backgroundColor:'rgba(255,255,255,0.2)', borderRadius:20, padding:8},
  tabBarWrap:  {backgroundColor: COLORS.primary, maxHeight: 56},
  tabBar:      {paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm, gap: SPACING.xs},
  tab:         {flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal: SPACING.md, paddingVertical:7, borderRadius:20, backgroundColor:'rgba(255,255,255,0.15)'},
  tabActive:   {backgroundColor: COLORS.white},
  tabText:     {fontSize: FONTS.sizes.xs, color:'rgba(255,255,255,0.8)', fontWeight: FONTS.weights.medium},
  tabTextActive:{color: COLORS.primary, fontWeight: FONTS.weights.bold},
});

const h = StyleSheet.create({
  tabScroll:     {padding: SPACING.base, gap: SPACING.md, paddingBottom: SPACING.xxxl},
  card:          {backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.base, borderLeftWidth:3, borderLeftColor: COLORS.primary, ...SHADOW.sm, marginBottom: SPACING.sm},
  cardTitle:     {fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.bold, color: COLORS.text, marginBottom: SPACING.sm},
  cardRow:       {flexDirection:'row', alignItems:'center', gap:6, marginBottom: SPACING.sm},
  infoRow:       {flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', paddingVertical:5, borderBottomWidth:1, borderBottomColor: COLORS.borderLight},
  infoLabel:     {fontSize: FONTS.sizes.sm, color: COLORS.textMuted, flex:1},
  infoValue:     {fontSize: FONTS.sizes.sm, color: COLORS.text, fontWeight: FONTS.weights.medium, flex:2, textAlign:'right'},
  sectionHeader: {flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom: SPACING.sm},
  sectionTitle:  {fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.bold, color: COLORS.text},
  rowBetween:    {flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom: SPACING.sm},
  empty:         {alignItems:'center', paddingVertical: 40, gap: SPACING.sm},
  emptyTitle:    {fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.semibold, color: COLORS.textSecondary},
  emptySub:      {fontSize: FONTS.sizes.sm, color: COLORS.textMuted, textAlign:'center'},
  btn:           {backgroundColor: COLORS.primary, borderRadius: RADIUS.md, padding: SPACING.md, alignItems:'center', marginTop: SPACING.md},
  btnText:       {color: COLORS.white, fontWeight: FONTS.weights.bold, fontSize: FONTS.sizes.base},
  btnSm:         {flexDirection:'row', alignItems:'center', gap:4, backgroundColor: COLORS.primary, paddingHorizontal: SPACING.sm, paddingVertical:6, borderRadius: RADIUS.sm},
  btnSmText:     {color: COLORS.white, fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.semibold},
  fieldGroup:    {marginBottom: SPACING.sm},
  fieldLabel:    {fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.medium, color: COLORS.text, marginBottom:4},
  fieldInput:    {borderWidth:1, borderColor: COLORS.border, borderRadius: RADIUS.sm, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs+2, fontSize: FONTS.sizes.base, color: COLORS.text, backgroundColor: COLORS.white},
  grid2:         {flexDirection:'row', flexWrap:'wrap', gap: SPACING.xs},
  vitalsGrid:    {flexDirection:'row', flexWrap:'wrap', gap: SPACING.xs, marginTop: SPACING.xs},
  vitalCell:     {backgroundColor: COLORS.background, borderRadius: RADIUS.sm, padding: SPACING.sm, minWidth:'30%', flex:1},
  vitalLabel:    {fontSize: FONTS.sizes.xs, color: COLORS.textMuted},
  vitalValue:    {fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.bold, color: COLORS.text},
  metaText:      {fontSize: FONTS.sizes.xs, color: COLORS.textMuted},
  searchInput:   {borderWidth:1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, fontSize: FONTS.sizes.base, color: COLORS.text, marginBottom: SPACING.xs},
  dropdown:      {borderWidth:1, borderColor: COLORS.border, borderRadius: RADIUS.md, backgroundColor: COLORS.white, marginBottom: SPACING.sm, maxHeight:200, overflow:'hidden'},
  dropdownItem:  {padding: SPACING.sm, borderBottomWidth:1, borderBottomColor: COLORS.borderLight},
  dropdownText:  {fontSize: FONTS.sizes.sm, color: COLORS.text, fontWeight: FONTS.weights.medium},
  dropdownSub:   {fontSize: FONTS.sizes.xs, color: COLORS.textMuted},
  medItem:       {backgroundColor: COLORS.background, borderRadius: RADIUS.sm, padding: SPACING.sm, marginBottom: SPACING.sm},
  medName:       {fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.bold, color: COLORS.text},
  prescItem:     {paddingVertical: SPACING.xs, borderBottomWidth:1, borderBottomColor: COLORS.borderLight},
  prescName:     {fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.semibold, color: COLORS.text},
  prescMeta:     {flexDirection:'row', flexWrap:'wrap', gap: SPACING.xs, marginTop:3},
  prescMetaText: {fontSize: FONTS.sizes.xs, color: COLORS.textMuted, backgroundColor: COLORS.background, paddingHorizontal:6, paddingVertical:2, borderRadius: RADIUS.sm},
  notesText:     {fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: SPACING.xs, fontStyle:'italic'},
  selectedItem:  {flexDirection:'row', alignItems:'center', gap: SPACING.xs, paddingVertical:4},
  statusBadge:   {paddingHorizontal:8, paddingVertical:3, borderRadius:20},
  statusText:    {fontSize:10, fontWeight: FONTS.weights.bold},
});