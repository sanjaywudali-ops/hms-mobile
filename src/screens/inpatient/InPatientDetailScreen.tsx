import React, {useState, useEffect} from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, StatusBar, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {format} from 'date-fns';
import {COLORS, FONTS, SPACING, RADIUS, SHADOW} from '../../constants/theme';
import {instance} from '../../services/axios';
import {api} from '../../constants/api';

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const ALL_TABS = [
  {key: 'details',   label: 'Details',    icon: 'account-outline'},
  {key: 'vitals',    label: 'Vitals',     icon: 'heart-pulse'},
  {key: 'visits',    label: 'Visits',     icon: 'stethoscope'},
  {key: 'medication',label: 'Meds',       icon: 'pill'},
  {key: 'lab',       label: 'Lab',        icon: 'flask-outline'},
  {key: 'diet',      label: 'Diet',       icon: 'food-apple-outline'},
  {key: 'discharge', label: 'Discharge',  icon: 'logout'},
];

// ─── Shared Components ────────────────────────────────────────────────────────

function InfoCard({title, color = COLORS.primary, children}: any) {
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

function EmptyState({icon, title, subtitle}: {icon: string; title: string; subtitle?: string}) {
  return (
    <View style={h.empty}>
      <Icon name={icon} size={40} color={COLORS.border}/>
      <Text style={h.emptyTitle}>{title}</Text>
      {subtitle && <Text style={h.emptySub}>{subtitle}</Text>}
    </View>
  );
}

function FormField({label, value, onChange, placeholder, keyboardType, multiline}: any) {
  return (
    <View style={h.fieldGroup}>
      <Text style={h.fieldLabel}>{label}</Text>
      <TextInput
        style={[h.fieldInput, multiline && {height: 80, textAlignVertical: 'top'}]}
        value={value} onChangeText={onChange} placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted} keyboardType={keyboardType || 'default'}
        multiline={multiline} autoCapitalize="sentences"/>
    </View>
  );
}

function PrimaryBtn({label, onPress, loading}: {label: string; onPress: () => void; loading?: boolean}) {
  return (
    <TouchableOpacity style={[h.btn, {opacity: loading ? 0.7 : 1}]} onPress={onPress} disabled={loading}>
      {loading ? <ActivityIndicator color={COLORS.white}/> : <Text style={h.btnText}>{label}</Text>}
    </TouchableOpacity>
  );
}

// ─── Tab: Patient Details ─────────────────────────────────────────────────────

function TabDetails({data}: {data: any}) {
  const patientInfo = data?.patientInfo;
  const user        = data?.user;
  const admission   = data?.admissions?.[0];
  const doctor      = admission?.admittingDoctor;
  const room        = data?.roomBookingsfor?.[0]?.room;
  const referrals   = data?.referrals || [];

  const bloodGroupMap: Record<string, string> = {
    A_PLUS:'A+', B_PLUS:'B+', O_PLUS:'O+', AB_PLUS:'AB+',
    A_MINUS:'A-', B_MINUS:'B-', O_MINUS:'O-', AB_MINUS:'AB-',
  };

  return (
    <ScrollView contentContainerStyle={h.tabScroll} showsVerticalScrollIndicator={false}>
      <InfoCard title="Patient Information" color="#3B82F6">
        <InfoRow label="Name"         value={`${user?.fName || ''} ${user?.lName || ''}`.trim()}/>
        <InfoRow label="Patient ID"   value={patientInfo?.id?.split('_')[0]}/>
        <InfoRow label="Age"          value={patientInfo?.age ? `${patientInfo.age} years` : null}/>
        <InfoRow label="Gender"       value={patientInfo?.gender}/>
        <InfoRow label="Phone"        value={user?.phoneNumber}/>
        <InfoRow label="Blood Group"  value={user?.bloodGroup ? bloodGroupMap[user.bloodGroup] || user.bloodGroup : null}/>
      </InfoCard>

      <InfoCard title="Admission Information" color="#F59E0B">
        <InfoRow label="Admission Date" value={admission?.admissionDateTime ? format(new Date(admission.admissionDateTime), 'dd MMM yyyy, h:mm a') : null}/>
        <InfoRow label="Status"         value={admission?.status}/>
        <InfoRow label="Reason"         value={admission?.reason}/>
        <InfoRow label="Doctor"         value={doctor?.user ? `Dr. ${doctor.user.fName} ${doctor.user.lName}` : null}/>
        <InfoRow label="Room"           value={room?.roomNumber ? `Room ${room.roomNumber}` : null}/>
        <InfoRow label="Room Type"      value={room?.roomType?.name}/>
      </InfoCard>

      {referrals.length > 0 && (
        <InfoCard title="Referral Information" color="#EF4444">
          {referrals.map((ref: any, i: number) => (
            <View key={i} style={{marginBottom: i < referrals.length-1 ? SPACING.md : 0}}>
              <InfoRow label="Referral Name" value={ref.referralName}/>
              <InfoRow label="Contact"       value={ref.referralContact}/>
              <InfoRow label="Type"          value={ref.referralType}/>
              <InfoRow label="Concession"    value={ref.concessionPercentage ? `${ref.concessionPercentage}%` : null}/>
            </View>
          ))}
        </InfoCard>
      )}
    </ScrollView>
  );
}

// ─── Tab: Vitals ──────────────────────────────────────────────────────────────

function TabVitals({admissionId, data, refetch}: any) {
  const queryClient = useQueryClient();
  const vitals   = data?.patientVitals || [];
  const admission = data?.admissions?.[0];
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    temperature:'', pulse:'', bloodPressureSystolic:'', bloodPressureDiastolic:'',
    oxygenSaturation:'', weight:'', height:'', respiratoryRate:'',
  });

  const mutation = useMutation({
    mutationFn: async (payload: any) => (await instance.post(api.addVitals, payload)).data,
    onSuccess: () => {
      Alert.alert('Success', 'Vitals recorded');
      setShowForm(false);
      setForm({temperature:'', pulse:'', bloodPressureSystolic:'', bloodPressureDiastolic:'', oxygenSaturation:'', weight:'', height:'', respiratoryRate:''});
      queryClient.invalidateQueries({queryKey: ['inpatient-detail', admissionId]});
      refetch();
    },
    onError: (err: any) => Alert.alert('Error', err?.response?.data?.message || 'Failed'),
  });

  const submit = () => {
    mutation.mutate({
      admissionId,
      patientId: admission?.patientId,
      time: new Date().toISOString(),
      temperature:            form.temperature            ? parseFloat(form.temperature)            : undefined,
      pulse:                  form.pulse                  ? parseInt(form.pulse)                    : undefined,
      bloodPressureSystolic:  form.bloodPressureSystolic  ? parseInt(form.bloodPressureSystolic)    : undefined,
      bloodPressureDiastolic: form.bloodPressureDiastolic ? parseInt(form.bloodPressureDiastolic)   : undefined,
      oxygenSaturation:       form.oxygenSaturation       ? parseFloat(form.oxygenSaturation)       : undefined,
      weight:                 form.weight                 ? parseFloat(form.weight)                 : undefined,
      height:                 form.height                 ? parseFloat(form.height)                 : undefined,
      respiratoryRate:        form.respiratoryRate        ? parseInt(form.respiratoryRate)          : undefined,
    });
  };

  return (
    <ScrollView contentContainerStyle={h.tabScroll} showsVerticalScrollIndicator={false}>
      <View style={h.rowBetween}>
        <Text style={h.sectionTitle}>Vitals</Text>
        <TouchableOpacity style={h.btnSm} onPress={() => setShowForm(v=>!v)}>
          <Icon name={showForm ? 'close' : 'plus'} size={14} color={COLORS.white}/>
          <Text style={h.btnSmText}>{showForm ? 'Cancel' : 'Add'}</Text>
        </TouchableOpacity>
      </View>

      {showForm && (
        <View style={h.card}>
          <Text style={h.cardTitle}>Record Vitals</Text>
          <View style={h.grid2}>
            <FormField label="Temp (°F)"   value={form.temperature}            onChange={(v:string)=>setForm(p=>({...p,temperature:v}))}            keyboardType="decimal-pad" placeholder="98.6"/>
            <FormField label="Pulse"       value={form.pulse}                  onChange={(v:string)=>setForm(p=>({...p,pulse:v}))}                  keyboardType="numeric"     placeholder="72"/>
            <FormField label="BP Systolic" value={form.bloodPressureSystolic}  onChange={(v:string)=>setForm(p=>({...p,bloodPressureSystolic:v}))}  keyboardType="numeric"     placeholder="120"/>
            <FormField label="BP Diastolic"value={form.bloodPressureDiastolic} onChange={(v:string)=>setForm(p=>({...p,bloodPressureDiastolic:v}))} keyboardType="numeric"     placeholder="80"/>
            <FormField label="SpO2 (%)"    value={form.oxygenSaturation}       onChange={(v:string)=>setForm(p=>({...p,oxygenSaturation:v}))}       keyboardType="decimal-pad" placeholder="98"/>
            <FormField label="Weight (kg)" value={form.weight}                 onChange={(v:string)=>setForm(p=>({...p,weight:v}))}                 keyboardType="decimal-pad" placeholder="70"/>
            <FormField label="Height (cm)" value={form.height}                 onChange={(v:string)=>setForm(p=>({...p,height:v}))}                 keyboardType="decimal-pad" placeholder="170"/>
            <FormField label="Resp. Rate"  value={form.respiratoryRate}        onChange={(v:string)=>setForm(p=>({...p,respiratoryRate:v}))}        keyboardType="numeric"     placeholder="16"/>
          </View>
          <PrimaryBtn label="Save Vitals" onPress={submit} loading={mutation.isPending}/>
        </View>
      )}

      {vitals.length === 0
        ? <EmptyState icon="heart-pulse" title="No vitals recorded" subtitle="Tap Add to record vitals"/>
        : vitals.map((v: any, i: number) => (
          <View key={v.id||i} style={h.card}>
            <View style={h.cardRow}>
              <Icon name="clock-outline" size={13} color={COLORS.textMuted}/>
              <Text style={h.metaText}>{v.time ? format(new Date(v.time), 'dd MMM yyyy, h:mm a') : '—'}</Text>
            </View>
            <View style={h.vitalsGrid}>
              {v.temperature            && <VitalCell label="Temp"   value={`${v.temperature}°F`}/>}
              {v.pulse                  && <VitalCell label="Pulse"  value={`${v.pulse} bpm`}/>}
              {(v.bloodPressureSystolic||v.bloodPressureDiastolic) && <VitalCell label="BP" value={`${v.bloodPressureSystolic||'—'}/${v.bloodPressureDiastolic||'—'}`}/>}
              {v.oxygenSaturation       && <VitalCell label="SpO2"  value={`${v.oxygenSaturation}%`}/>}
              {v.weight                 && <VitalCell label="Weight" value={`${v.weight}kg`}/>}
              {v.height                 && <VitalCell label="Height" value={`${v.height}cm`}/>}
              {v.respiratoryRate        && <VitalCell label="Resp."  value={`${v.respiratoryRate}/min`}/>}
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

// ─── Tab: Doctor Visits ───────────────────────────────────────────────────────

function TabVisits({admissionId, data, refetch}: any) {
  const queryClient = useQueryClient();
  const visits    = data?.visits || [];
  const admission = data?.admissions?.[0];
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    chiefComplaint:'', examination:'', diagnosis:'',
    testReportsToCarry:'', nextReviewDate:'',
  });

  const mutation = useMutation({
    mutationFn: async (payload: any) => (await instance.post(api.addVisit, payload)).data,
    onSuccess: () => {
      Alert.alert('Success', 'Visit notes added');
      setShowForm(false);
      setForm({chiefComplaint:'', examination:'', diagnosis:'', testReportsToCarry:'', nextReviewDate:''});
      queryClient.invalidateQueries({queryKey: ['inpatient-detail', admissionId]});
      refetch();
    },
    onError: (err: any) => Alert.alert('Error', err?.response?.data?.message || 'Failed'),
  });

  const submit = () => {
    if (!form.chiefComplaint.trim()) {Alert.alert('Required', 'Chief complaint is required'); return;}
    if (!form.diagnosis.trim())      {Alert.alert('Required', 'Diagnosis is required'); return;}
    mutation.mutate({
      ...form,
      admissionId,
      doctorId:  admission?.admittingDoctorId,
      patientId: admission?.patientId,
      visitDate: new Date().toISOString(),
      visitType: 'IPD',
    });
  };

  return (
    <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={h.tabScroll} showsVerticalScrollIndicator={false}>
        <View style={h.rowBetween}>
          <Text style={h.sectionTitle}>Doctor Visits</Text>
          <TouchableOpacity style={h.btnSm} onPress={() => setShowForm(v=>!v)}>
            <Icon name={showForm ? 'close' : 'plus'} size={14} color={COLORS.white}/>
            <Text style={h.btnSmText}>{showForm ? 'Cancel' : 'Add'}</Text>
          </TouchableOpacity>
        </View>

        {showForm && (
          <View style={h.card}>
            <Text style={h.cardTitle}>Add Visit Notes</Text>
            <FormField label="Chief Complaint *"   value={form.chiefComplaint}     onChange={(v:string)=>setForm(p=>({...p,chiefComplaint:v}))}     multiline placeholder="Enter chief complaint..."/>
            <FormField label="Examination"          value={form.examination}        onChange={(v:string)=>setForm(p=>({...p,examination:v}))}        multiline placeholder="Examination findings..."/>
            <FormField label="Diagnosis *"          value={form.diagnosis}          onChange={(v:string)=>setForm(p=>({...p,diagnosis:v}))}          multiline placeholder="Enter diagnosis..."/>
            <FormField label="Test Reports to Carry"value={form.testReportsToCarry} onChange={(v:string)=>setForm(p=>({...p,testReportsToCarry:v}))} multiline placeholder="Test reports..."/>
            <FormField label="Next Visit (Days)"    value={form.nextReviewDate}     onChange={(v:string)=>setForm(p=>({...p,nextReviewDate:v}))}     keyboardType="numeric" placeholder="e.g. 1"/>
            <PrimaryBtn label="Save Visit Notes" onPress={submit} loading={mutation.isPending}/>
          </View>
        )}

        {visits.length === 0
          ? <EmptyState icon="stethoscope" title="No visit notes" subtitle="Tap Add to record a doctor visit"/>
          : visits.map((visit: any) => (
            <View key={visit.id} style={h.card}>
              <View style={h.cardRow}>
                <Icon name="calendar-outline" size={13} color={COLORS.textMuted}/>
                <Text style={h.metaText}>{visit.visitDate ? format(new Date(visit.visitDate), 'dd MMM yyyy, h:mm a') : '—'}</Text>
              </View>
              <InfoRow label="Chief Complaint"    value={visit.chiefComplaint}/>
              <InfoRow label="Examination"         value={visit.examination}/>
              <InfoRow label="Diagnosis"           value={visit.diagnosis}/>
              <InfoRow label="Test Reports"        value={visit.testReportsToCarry}/>
              <InfoRow label="Next Review"         value={visit.nextReviewDate ? `In ${visit.nextReviewDate} days` : null}/>
            </View>
          ))
        }
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Tab: Medication ─────────────────────────────────────────────────────────

function TabMedication({admissionId, data, refetch}: any) {
  const queryClient = useQueryClient();
  const prescriptions = data?.prescribedTo || [];
  const admission     = data?.admissions?.[0];
  const [showForm, setShowForm]   = useState(false);
  const [search,   setSearch]     = useState('');
  const [results,  setResults]    = useState<any[]>([]);
  const [selected, setSelected]   = useState<any[]>([]);
  const [notes,    setNotes]      = useState('');
  const [searching, setSearching] = useState(false);

  const searchMeds = async (q: string) => {
    if (!q.trim()) {setResults([]); return;}
    setSearching(true);
    try {
      const res = await instance.get(api.searchMedicines, {params:{search:q, limit:10}});
      setResults(res.data?.data || []);
    } catch {setResults([]);} finally {setSearching(false);}
  };

  useEffect(() => {
    const t = setTimeout(() => searchMeds(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const updateItem = (idx: number, field: string, val: string) =>
    setSelected(prev => prev.map((s,i) => i===idx ? {...s, [field]:val} : s));

  const mutation = useMutation({
    mutationFn: async (payload: any) => (await instance.post(api.addPrescription, payload)).data,
    onSuccess: () => {
      Alert.alert('Success', 'Prescription added');
      setShowForm(false); setSelected([]); setNotes('');
      queryClient.invalidateQueries({queryKey: ['inpatient-detail', admissionId]});
      refetch();
    },
    onError: (err: any) => Alert.alert('Error', err?.response?.data?.message || 'Failed'),
  });

  const submit = () => {
    if (selected.length === 0) {Alert.alert('Required', 'Add at least one medicine'); return;}
    mutation.mutate({
      patientId:     admission?.patientId,
      admissionId,
      doctorId:      admission?.admittingDoctorId,
      notes,
      prescriptionItems: selected.map(s => ({
        itemId: s.itemId, dosage: s.strength, frequency: s.frequency,
        duration: s.duration, timing: s.timing || 'AFTER_MEAL',
      })),
    });
  };

  return (
    <ScrollView contentContainerStyle={h.tabScroll} showsVerticalScrollIndicator={false}>
      <View style={h.rowBetween}>
        <Text style={h.sectionTitle}>Prescriptions</Text>
        <TouchableOpacity style={h.btnSm} onPress={() => setShowForm(v=>!v)}>
          <Icon name={showForm ? 'close' : 'plus'} size={14} color={COLORS.white}/>
          <Text style={h.btnSmText}>{showForm ? 'Cancel' : 'Add'}</Text>
        </TouchableOpacity>
      </View>

      {showForm && (
        <View style={h.card}>
          <Text style={h.cardTitle}>New Prescription</Text>
          <TextInput style={h.searchInput} placeholder="Search medicine..." placeholderTextColor={COLORS.textMuted} value={search} onChangeText={setSearch}/>
          {searching && <ActivityIndicator color={COLORS.primary} style={{marginVertical:8}}/>}
          {results.length > 0 && (
            <View style={h.dropdown}>
              {results.map((med: any) => (
                <TouchableOpacity key={med.id} style={h.dropdownItem}
                  onPress={() => {
                    if (!selected.find(s=>s.itemId===med.id))
                      setSelected(prev=>[...prev, {itemId:med.id, name:med.name, strength:'', frequency:'', duration:'', timing:'AFTER_MEAL'}]);
                    setSearch(''); setResults([]);
                  }}>
                  <Text style={h.dropdownText}>{med.name} {med.strength ? `(${med.strength})`:''}</Text>
                  <Text style={h.dropdownSub}>Stock: {med.availableStock||0}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {selected.map((item, idx) => (
            <View key={idx} style={h.medItem}>
              <View style={h.rowBetween}>
                <Text style={h.medName}>{item.name}</Text>
                <TouchableOpacity onPress={()=>setSelected(prev=>prev.filter((_,i)=>i!==idx))}>
                  <Icon name="close-circle" size={18} color={COLORS.error}/>
                </TouchableOpacity>
              </View>
              <View style={h.grid2}>
                <FormField label="Dosage"     value={item.strength}  onChange={(v:string)=>updateItem(idx,'strength',v)}  placeholder="e.g. 500mg"/>
                <FormField label="Frequency"  value={item.frequency} onChange={(v:string)=>updateItem(idx,'frequency',v)} placeholder="Twice daily"/>
                <FormField label="Duration"   value={item.duration}  onChange={(v:string)=>updateItem(idx,'duration',v)}  placeholder="5 days"/>
              </View>
            </View>
          ))}
          {selected.length > 0 && (
            <>
              <FormField label="Notes" value={notes} onChange={setNotes} multiline placeholder="Additional notes..."/>
              <PrimaryBtn label="Save Prescription" onPress={submit} loading={mutation.isPending}/>
            </>
          )}
        </View>
      )}

      {prescriptions.length === 0
        ? <EmptyState icon="pill" title="No prescriptions" subtitle="No prescriptions added yet"/>
        : prescriptions.map((presc: any) => (
          <View key={presc.id} style={h.card}>
            <View style={h.cardRow}>
              <Icon name="calendar-outline" size={13} color={COLORS.textMuted}/>
              <Text style={h.metaText}>{presc.createdAt ? format(new Date(presc.createdAt),'dd MMM yyyy') : '—'}</Text>
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

function TabLab({admissionId, data, refetch}: any) {
  const queryClient = useQueryClient();
  const labOrders = data?.labOrders || [];
  const admission = data?.admissions?.[0];
  const [showForm, setShowForm]   = useState(false);
  const [search,   setSearch]     = useState('');
  const [results,  setResults]    = useState<any[]>([]);
  const [selected, setSelected]   = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const searchTests = async (q: string) => {
    if (!q.trim()) {setResults([]); return;}
    setSearching(true);
    try {
      const res = await instance.get(api.searchLabTests, {params:{search:q, limit:10}});
      setResults(res.data?.data || []);
    } catch {setResults([]);} finally {setSearching(false);}
  };

  useEffect(() => {
    const t = setTimeout(() => searchTests(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const mutation = useMutation({
    mutationFn: async (payload: any) => (await instance.post(api.createLabOrder, payload)).data,
    onSuccess: () => {
      Alert.alert('Success', 'Lab order created');
      setShowForm(false); setSelected([]);
      queryClient.invalidateQueries({queryKey: ['inpatient-detail', admissionId]});
      refetch();
    },
    onError: (err: any) => Alert.alert('Error', err?.response?.data?.message || 'Failed'),
  });

  const STATUS_COLOR: Record<string,string> = {
    PENDING:'#B45309', CONFIRMED:'#1D4ED8', COLLECTED:'#0369A1',
    PROCESSING:'#D97706', COMPLETED:'#065F46', CANCELLED:'#991B1B',
  };

  return (
    <ScrollView contentContainerStyle={h.tabScroll} showsVerticalScrollIndicator={false}>
      <View style={h.rowBetween}>
        <Text style={h.sectionTitle}>Lab Orders</Text>
        <TouchableOpacity style={h.btnSm} onPress={() => setShowForm(v=>!v)}>
          <Icon name={showForm ? 'close' : 'plus'} size={14} color={COLORS.white}/>
          <Text style={h.btnSmText}>{showForm ? 'Cancel' : 'Order'}</Text>
        </TouchableOpacity>
      </View>

      {showForm && (
        <View style={h.card}>
          <Text style={h.cardTitle}>Order Lab Tests</Text>
          <TextInput style={h.searchInput} placeholder="Search lab tests..." placeholderTextColor={COLORS.textMuted} value={search} onChangeText={setSearch}/>
          {searching && <ActivityIndicator color={COLORS.primary} style={{marginVertical:8}}/>}
          {results.length > 0 && (
            <View style={h.dropdown}>
              {results.map((test: any) => (
                <TouchableOpacity key={test.id} style={h.dropdownItem}
                  onPress={() => {
                    if (!selected.find(s=>s.id===test.id))
                      setSelected(prev=>[...prev, test]);
                    setSearch(''); setResults([]);
                  }}>
                  <Text style={h.dropdownText}>{test.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {selected.length > 0 && (
            <>
              {selected.map((t,i) => (
                <View key={i} style={h.selectedItem}>
                  <Icon name="flask-outline" size={13} color={COLORS.primary}/>
                  <Text style={{flex:1, fontSize:FONTS.sizes.sm, color:COLORS.text}}>{t.name}</Text>
                  <TouchableOpacity onPress={()=>setSelected(prev=>prev.filter((_,idx)=>idx!==i))}>
                    <Icon name="close-circle" size={16} color={COLORS.error}/>
                  </TouchableOpacity>
                </View>
              ))}
              <PrimaryBtn label="Create Lab Order" onPress={() => mutation.mutate({
                patientId:   admission?.patientId,
                doctorId:    admission?.admittingDoctorId,
                admissionId,
                testIds:     selected.map(s=>s.id),
                orderDate:   new Date().toISOString(),
                status:      'PENDING',
              })} loading={mutation.isPending}/>
            </>
          )}
        </View>
      )}

      {labOrders.length === 0
        ? <EmptyState icon="flask-outline" title="No lab orders" subtitle="No lab tests ordered yet"/>
        : labOrders.map((order: any) => {
          const color = STATUS_COLOR[order.status] || '#6B7280';
          const tests = order.labConfigurations || order.testIds || [];
          return (
            <View key={order.id} style={h.card}>
              <View style={h.rowBetween}>
                <Text style={h.metaText}>{order.orderDate ? format(new Date(order.orderDate),'dd MMM yyyy') : '—'}</Text>
                <View style={[h.statusBadge, {backgroundColor: color+'20'}]}>
                  <Text style={[h.statusText, {color}]}>{order.status}</Text>
                </View>
              </View>
              {tests.map((t: any, i: number) => (
                <View key={i} style={h.selectedItem}>
                  <Icon name="flask-outline" size={13} color={COLORS.primary}/>
                  <Text style={{fontSize:FONTS.sizes.sm, color:COLORS.text}}>{t.name||'Lab Test'}</Text>
                </View>
              ))}
            </View>
          );
        })
      }
    </ScrollView>
  );
}

// ─── Tab: Diet ────────────────────────────────────────────────────────────────

function TabDiet({admissionId, data, refetch}: any) {
  const queryClient = useQueryClient();
  const diets     = data?.patientDiets || [];
  const admission = data?.admissions?.[0];
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    dietType:'', instructions:'', calories:'', protein:'', carbs:'', fat:'',
  });

  const mutation = useMutation({
    mutationFn: async (payload: any) => (await instance.post(api.addDiet, payload)).data,
    onSuccess: () => {
      Alert.alert('Success', 'Diet plan added');
      setShowForm(false);
      setForm({dietType:'', instructions:'', calories:'', protein:'', carbs:'', fat:''});
      queryClient.invalidateQueries({queryKey: ['inpatient-detail', admissionId]});
      refetch();
    },
    onError: (err: any) => Alert.alert('Error', err?.response?.data?.message || 'Failed'),
  });

  const submit = () => {
    if (!form.dietType.trim()) {Alert.alert('Required', 'Diet type is required'); return;}
    mutation.mutate({
      patientId:    admission?.patientId,
      admissionId,
      doctorId:     admission?.admittingDoctorId,
      dietType:     form.dietType,
      instructions: form.instructions,
      calories:     form.calories ? parseFloat(form.calories) : undefined,
      protein:      form.protein  ? parseFloat(form.protein)  : undefined,
      carbs:        form.carbs    ? parseFloat(form.carbs)    : undefined,
      fat:          form.fat      ? parseFloat(form.fat)      : undefined,
    });
  };

  return (
    <ScrollView contentContainerStyle={h.tabScroll} showsVerticalScrollIndicator={false}>
      <View style={h.rowBetween}>
        <Text style={h.sectionTitle}>Diet Plans</Text>
        <TouchableOpacity style={h.btnSm} onPress={() => setShowForm(v=>!v)}>
          <Icon name={showForm ? 'close' : 'plus'} size={14} color={COLORS.white}/>
          <Text style={h.btnSmText}>{showForm ? 'Cancel' : 'Add'}</Text>
        </TouchableOpacity>
      </View>

      {showForm && (
        <View style={h.card}>
          <Text style={h.cardTitle}>Add Diet Plan</Text>
          <FormField label="Diet Type *"    value={form.dietType}     onChange={(v:string)=>setForm(p=>({...p,dietType:v}))}     placeholder="e.g. Low sodium, Diabetic"/>
          <FormField label="Instructions"   value={form.instructions} onChange={(v:string)=>setForm(p=>({...p,instructions:v}))} multiline placeholder="Diet instructions..."/>
          <View style={h.grid2}>
            <FormField label="Calories"  value={form.calories} onChange={(v:string)=>setForm(p=>({...p,calories:v}))} keyboardType="decimal-pad" placeholder="kcal"/>
            <FormField label="Protein(g)"value={form.protein}  onChange={(v:string)=>setForm(p=>({...p,protein:v}))}  keyboardType="decimal-pad" placeholder="g"/>
            <FormField label="Carbs(g)"  value={form.carbs}    onChange={(v:string)=>setForm(p=>({...p,carbs:v}))}    keyboardType="decimal-pad" placeholder="g"/>
            <FormField label="Fat(g)"    value={form.fat}      onChange={(v:string)=>setForm(p=>({...p,fat:v}))}      keyboardType="decimal-pad" placeholder="g"/>
          </View>
          <PrimaryBtn label="Save Diet Plan" onPress={submit} loading={mutation.isPending}/>
        </View>
      )}

      {diets.length === 0
        ? <EmptyState icon="food-apple-outline" title="No diet plans" subtitle="No diet plans added yet"/>
        : diets.map((diet: any) => (
          <View key={diet.id} style={h.card}>
            <Text style={h.cardTitle}>{diet.dietType || 'Diet Plan'}</Text>
            {diet.instructions && <Text style={h.notesText}>{diet.instructions}</Text>}
            <View style={h.vitalsGrid}>
              {diet.calories && <VitalCell label="Calories" value={`${diet.calories} kcal`}/>}
              {diet.protein  && <VitalCell label="Protein"  value={`${diet.protein}g`}/>}
              {diet.carbs    && <VitalCell label="Carbs"    value={`${diet.carbs}g`}/>}
              {diet.fat      && <VitalCell label="Fat"      value={`${diet.fat}g`}/>}
            </View>
          </View>
        ))
      }
    </ScrollView>
  );
}

// ─── Tab: Discharge ───────────────────────────────────────────────────────────

function TabDischarge({admissionId, data, refetch}: any) {
  const queryClient = useQueryClient();
  const admission   = data?.admissions?.[0];
  const discharge   = data?.dischargeSummaries?.[0];
  const isPlanned   = admission?.status === 'PLANNED';
  const isAdmitted  = admission?.status === 'ADMITTED';
  const [form, setForm] = useState({
    dischargeSummary:'', followUpDate:'', followUpNotes:'', conditionAtDischarge:'',
  });

  const mutation = useMutation({
    mutationFn: async (payload: any) => (await instance.post(api.patientDischargeSummary, payload)).data,
    onSuccess: () => {
      Alert.alert('Success', 'Discharge summary submitted');
      queryClient.invalidateQueries({queryKey: ['inpatient-detail', admissionId]});
      refetch();
    },
    onError: (err: any) => Alert.alert('Error', err?.response?.data?.message || 'Failed'),
  });

  const submit = () => {
    if (!form.dischargeSummary.trim()) {Alert.alert('Required', 'Discharge summary is required'); return;}
    mutation.mutate({
      admissionId,
      patientId:            admission?.patientId,
      doctorId:             admission?.admittingDoctorId,
      dischargeSummary:     form.dischargeSummary,
      followUpDate:         form.followUpDate || undefined,
      followUpNotes:        form.followUpNotes || undefined,
      conditionAtDischarge: form.conditionAtDischarge || undefined,
    });
  };

  if (isPlanned) {
    return (
      <View style={h.tabScroll}>
        <EmptyState icon="logout" title="Patient not yet admitted" subtitle="Discharge is available once patient is admitted"/>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={h.tabScroll} showsVerticalScrollIndicator={false}>
        {discharge ? (
          <InfoCard title="Discharge Summary" color="#065F46">
            <InfoRow label="Summary"    value={discharge.dischargeSummary}/>
            <InfoRow label="Condition"  value={discharge.conditionAtDischarge}/>
            <InfoRow label="Follow Up"  value={discharge.followUpDate ? format(new Date(discharge.followUpDate),'dd MMM yyyy') : null}/>
            <InfoRow label="Notes"      value={discharge.followUpNotes}/>
            <InfoRow label="Status"     value={admission?.status}/>
          </InfoCard>
        ) : isAdmitted ? (
          <View style={h.card}>
            <Text style={h.cardTitle}>Initiate Discharge</Text>
            <FormField label="Discharge Summary *"      value={form.dischargeSummary}     onChange={(v:string)=>setForm(p=>({...p,dischargeSummary:v}))}     multiline placeholder="Summary of treatment and outcome..."/>
            <FormField label="Condition at Discharge"   value={form.conditionAtDischarge} onChange={(v:string)=>setForm(p=>({...p,conditionAtDischarge:v}))} placeholder="e.g. Stable, Improved"/>
            <FormField label="Follow-up Date (YYYY-MM-DD)" value={form.followUpDate}      onChange={(v:string)=>setForm(p=>({...p,followUpDate:v}))}         placeholder="e.g. 2026-08-15"/>
            <FormField label="Follow-up Notes"          value={form.followUpNotes}        onChange={(v:string)=>setForm(p=>({...p,followUpNotes:v}))}         multiline placeholder="Follow-up instructions..."/>
            <PrimaryBtn label="Submit Discharge Summary" onPress={submit} loading={mutation.isPending}/>
          </View>
        ) : (
          <EmptyState icon="logout" title="Discharge complete" subtitle={`Status: ${admission?.status}`}/>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function InPatientDetailScreen({route, navigation}: any) {
  const {id} = route.params;
  const insets     = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('details');

  const {data, isLoading, refetch} = useQuery({
    queryKey: ['inpatient-detail', id],
    queryFn: async () => {
      const res = await instance.get(api.getInPatientHistory(id), {
        params: {
          patientInfo: true, user: true, roomBookings: true,
          admissions: true, dischargeSummaries: true,
          patientVitals: true, visits: true, labOrders: true,
          prescribedTo: true, patientDiets: true, referrals: true,
        },
      });
      return res.data?.data;
    },
    enabled: !!id,
  });

  const admission  = data?.admissions?.[0];
  const isPlanned  = admission?.status === 'PLANNED';
  const user       = data?.user;
  const patientName = user ? `${user.fName||''} ${user.lName||''}`.trim() || 'Patient' : 'Patient';

  // Hide certain tabs when status is PLANNED
  const tabs = ALL_TABS.filter(t => isPlanned ? ['details','discharge'].includes(t.key) : true);

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
          <Text style={s.headerSub}>
            In-Patient · {admission?.status || '—'}
            {data?.roomBookingsfor?.[0]?.room?.roomNumber ? ` · Room ${data.roomBookingsfor[0].room.roomNumber}` : ''}
          </Text>
        </View>
        <TouchableOpacity style={s.refreshBtn} onPress={() => refetch()}>
          <Icon name="refresh" size={18} color={COLORS.white}/>
        </TouchableOpacity>
      </View>

      {/* Planned warning */}
      {isPlanned && (
        <View style={s.plannedBanner}>
          <Icon name="information-outline" size={14} color="#B45309"/>
          <Text style={s.plannedText}>Admission planned. More tabs available after admission is confirmed.</Text>
        </View>
      )}

      {/* Tab bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabBar} style={s.tabBarWrap}>
        {tabs.map(tab => {
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
        {activeTab === 'details'    && <TabDetails    data={data}/>}
        {activeTab === 'vitals'     && <TabVitals     admissionId={id} data={data} refetch={refetch}/>}
        {activeTab === 'visits'     && <TabVisits     admissionId={id} data={data} refetch={refetch}/>}
        {activeTab === 'medication' && <TabMedication admissionId={id} data={data} refetch={refetch}/>}
        {activeTab === 'lab'        && <TabLab        admissionId={id} data={data} refetch={refetch}/>}
        {activeTab === 'diet'       && <TabDiet       admissionId={id} data={data} refetch={refetch}/>}
        {activeTab === 'discharge'  && <TabDischarge  admissionId={id} data={data} refetch={refetch}/>}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:          {flex:1, backgroundColor: COLORS.primary},
  header:        {flexDirection:'row', alignItems:'center', padding: SPACING.lg, gap: SPACING.md},
  backBtn:       {padding:4},
  headerTitle:   {fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, color: COLORS.white},
  headerSub:     {fontSize: FONTS.sizes.xs, color:'rgba(255,255,255,0.75)', marginTop:2},
  refreshBtn:    {backgroundColor:'rgba(255,255,255,0.2)', borderRadius:20, padding:8},
  plannedBanner: {flexDirection:'row', alignItems:'center', gap:6, backgroundColor:'#FEF3C7', padding: SPACING.sm, paddingHorizontal: SPACING.lg},
  plannedText:   {fontSize: FONTS.sizes.xs, color:'#B45309', flex:1},
  tabBarWrap:    {backgroundColor: COLORS.primary, maxHeight:56},
  tabBar:        {paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm, gap: SPACING.xs},
  tab:           {flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal: SPACING.md, paddingVertical:7, borderRadius:20, backgroundColor:'rgba(255,255,255,0.15)'},
  tabActive:     {backgroundColor: COLORS.white},
  tabText:       {fontSize: FONTS.sizes.xs, color:'rgba(255,255,255,0.8)', fontWeight: FONTS.weights.medium},
  tabTextActive: {color: COLORS.primary, fontWeight: FONTS.weights.bold},
});

const h = StyleSheet.create({
  tabScroll:    {padding: SPACING.base, gap: SPACING.md, paddingBottom: SPACING.xxxl},
  card:         {backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.base, borderLeftWidth:3, borderLeftColor: COLORS.primary, ...SHADOW.sm, marginBottom: SPACING.sm},
  cardTitle:    {fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.bold, color: COLORS.text, marginBottom: SPACING.sm},
  cardRow:      {flexDirection:'row', alignItems:'center', gap:6, marginBottom: SPACING.sm},
  infoRow:      {flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', paddingVertical:5, borderBottomWidth:1, borderBottomColor: COLORS.borderLight},
  infoLabel:    {fontSize: FONTS.sizes.sm, color: COLORS.textMuted, flex:1},
  infoValue:    {fontSize: FONTS.sizes.sm, color: COLORS.text, fontWeight: FONTS.weights.medium, flex:2, textAlign:'right'},
  sectionTitle: {fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.bold, color: COLORS.text},
  rowBetween:   {flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom: SPACING.sm},
  empty:        {alignItems:'center', paddingVertical:40, gap: SPACING.sm},
  emptyTitle:   {fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.semibold, color: COLORS.textSecondary},
  emptySub:     {fontSize: FONTS.sizes.sm, color: COLORS.textMuted, textAlign:'center'},
  btn:          {backgroundColor: COLORS.primary, borderRadius: RADIUS.md, padding: SPACING.md, alignItems:'center', marginTop: SPACING.md},
  btnText:      {color: COLORS.white, fontWeight: FONTS.weights.bold, fontSize: FONTS.sizes.base},
  btnSm:        {flexDirection:'row', alignItems:'center', gap:4, backgroundColor: COLORS.primary, paddingHorizontal: SPACING.sm, paddingVertical:6, borderRadius: RADIUS.sm},
  btnSmText:    {color: COLORS.white, fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.semibold},
  fieldGroup:   {marginBottom: SPACING.sm},
  fieldLabel:   {fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.medium, color: COLORS.text, marginBottom:4},
  fieldInput:   {borderWidth:1, borderColor: COLORS.border, borderRadius: RADIUS.sm, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs+2, fontSize: FONTS.sizes.base, color: COLORS.text, backgroundColor: COLORS.white},
  grid2:        {flexDirection:'row', flexWrap:'wrap', gap: SPACING.xs},
  vitalsGrid:   {flexDirection:'row', flexWrap:'wrap', gap: SPACING.xs, marginTop: SPACING.xs},
  vitalCell:    {backgroundColor: COLORS.background, borderRadius: RADIUS.sm, padding: SPACING.sm, minWidth:'30%', flex:1},
  vitalLabel:   {fontSize: FONTS.sizes.xs, color: COLORS.textMuted},
  vitalValue:   {fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.bold, color: COLORS.text},
  metaText:     {fontSize: FONTS.sizes.xs, color: COLORS.textMuted},
  searchInput:  {borderWidth:1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, fontSize: FONTS.sizes.base, color: COLORS.text, marginBottom: SPACING.xs},
  dropdown:     {borderWidth:1, borderColor: COLORS.border, borderRadius: RADIUS.md, backgroundColor: COLORS.white, marginBottom: SPACING.sm, maxHeight:200, overflow:'hidden'},
  dropdownItem: {padding: SPACING.sm, borderBottomWidth:1, borderBottomColor: COLORS.borderLight},
  dropdownText: {fontSize: FONTS.sizes.sm, color: COLORS.text, fontWeight: FONTS.weights.medium},
  dropdownSub:  {fontSize: FONTS.sizes.xs, color: COLORS.textMuted},
  medItem:      {backgroundColor: COLORS.background, borderRadius: RADIUS.sm, padding: SPACING.sm, marginBottom: SPACING.sm},
  medName:      {fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.bold, color: COLORS.text},
  prescItem:    {paddingVertical: SPACING.xs, borderBottomWidth:1, borderBottomColor: COLORS.borderLight},
  prescName:    {fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.semibold, color: COLORS.text},
  prescMeta:    {flexDirection:'row', flexWrap:'wrap', gap: SPACING.xs, marginTop:3},
  prescMetaText:{fontSize: FONTS.sizes.xs, color: COLORS.textMuted, backgroundColor: COLORS.background, paddingHorizontal:6, paddingVertical:2, borderRadius: RADIUS.sm},
  notesText:    {fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: SPACING.xs, fontStyle:'italic'},
  selectedItem: {flexDirection:'row', alignItems:'center', gap: SPACING.xs, paddingVertical:4},
  statusBadge:  {paddingHorizontal:8, paddingVertical:3, borderRadius:20},
  statusText:   {fontSize:10, fontWeight: FONTS.weights.bold},
});