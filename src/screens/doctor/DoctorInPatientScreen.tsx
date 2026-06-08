import React, {useState, useEffect} from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {format} from 'date-fns';
import {COLORS, FONTS, SPACING, RADIUS, SHADOW} from '../../constants/theme';
import {instance} from '../../services/axios';
import {api} from '../../constants/api';

const TABS = [
  {key:'details',  label:'Details',  icon:'account-outline'},
  {key:'vitals',   label:'Vitals',   icon:'heart-pulse'},
  {key:'visits',   label:'Visits',   icon:'stethoscope'},
  {key:'medication',label:'Meds',    icon:'pill'},
  {key:'lab',      label:'Lab',      icon:'flask-outline'},
  {key:'discharge',label:'Discharge',icon:'logout'},
];

// ─── Shared ───────────────────────────────────────────────────────────────────
function InfoRow({label, value}: {label: string; value?: string|null}) {
  if (!value) return null;
  return (
    <View style={h.infoRow}>
      <Text style={h.infoLabel}>{label}</Text>
      <Text style={h.infoValue}>{value}</Text>
    </View>
  );
}

function Card({title, color = COLORS.primary, children}: any) {
  return (
    <View style={[h.card, {borderLeftColor: color}]}>
      {title && <Text style={h.cardTitle}>{title}</Text>}
      {children}
    </View>
  );
}

function Empty({icon, title}: {icon: string; title: string}) {
  return (
    <View style={h.empty}>
      <Icon name={icon} size={36} color={COLORS.border}/>
      <Text style={h.emptyText}>{title}</Text>
    </View>
  );
}

function Field({label, value, onChange, placeholder, keyboardType, multiline}: any) {
  return (
    <View style={{marginBottom: SPACING.sm}}>
      <Text style={h.fieldLabel}>{label}</Text>
      <TextInput
        style={[h.fieldInput, multiline && {height:70, textAlignVertical:'top'}]}
        value={value} onChangeText={onChange} placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        keyboardType={keyboardType||'default'} multiline={multiline}/>
    </View>
  );
}

function Btn({label, onPress, loading}: any) {
  return (
    <TouchableOpacity style={[h.btn,{opacity:loading?0.7:1}]} onPress={onPress} disabled={loading}>
      {loading ? <ActivityIndicator color={COLORS.white}/> : <Text style={h.btnText}>{label}</Text>}
    </TouchableOpacity>
  );
}

function SmBtn({label, icon, onPress}: any) {
  return (
    <TouchableOpacity style={h.smBtn} onPress={onPress}>
      <Icon name={icon} size={13} color={COLORS.white}/>
      <Text style={h.smBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Details Tab ──────────────────────────────────────────────────────────────
function TabDetails({data}: {data: any}) {
  const admission = data?.admissions?.[0] || data;
  const user      = data?.patient?.user || data?.user;
  const room      = data?.roomBookings?.[0]?.room;
  const bg: Record<string,string> = {A_PLUS:'A+',B_PLUS:'B+',O_PLUS:'O+',AB_PLUS:'AB+',A_MINUS:'A-',B_MINUS:'B-',O_MINUS:'O-',AB_MINUS:'AB-'};
  return (
    <ScrollView contentContainerStyle={h.scroll}>
      <Card title="Patient" color="#3B82F6">
        <InfoRow label="Name"       value={user ? `${user.fName||''} ${user.lName||''}`.trim() : null}/>
        <InfoRow label="Age"        value={data?.patient?.patientInfo?.age ? `${data.patient.patientInfo.age} yrs` : null}/>
        <InfoRow label="Gender"     value={data?.patient?.patientInfo?.gender}/>
        <InfoRow label="Phone"      value={user?.phoneNumber}/>
        <InfoRow label="Blood Group"value={user?.bloodGroup ? bg[user.bloodGroup]||user.bloodGroup : null}/>
      </Card>
      <Card title="Admission" color="#F59E0B">
        <InfoRow label="Date"   value={admission?.admissionDateTime ? format(new Date(admission.admissionDateTime),'dd MMM yyyy') : null}/>
        <InfoRow label="Status" value={admission?.status}/>
        <InfoRow label="Reason" value={admission?.reason}/>
        <InfoRow label="Room"   value={room?.roomNumber ? `Room ${room.roomNumber}` : null}/>
      </Card>
    </ScrollView>
  );
}

// ─── Vitals Tab ───────────────────────────────────────────────────────────────
function TabVitals({admissionId, data, refetch}: any) {
  const queryClient = useQueryClient();
  const vitals = data?.patientVitals || [];
  const [show, setShow] = useState(false);
  const [f, setF] = useState({temperature:'',pulse:'',bloodPressureSystolic:'',bloodPressureDiastolic:'',oxygenSaturation:'',weight:'',height:''});
  const mut = useMutation({
    mutationFn: (p: any) => instance.post(api.doctorAddVitals, p),
    onSuccess: () => {Alert.alert('Saved','Vitals recorded'); setShow(false); setF({temperature:'',pulse:'',bloodPressureSystolic:'',bloodPressureDiastolic:'',oxygenSaturation:'',weight:'',height:''}); queryClient.invalidateQueries({queryKey:['dr-ipd',admissionId]}); refetch();},
    onError: (e: any) => Alert.alert('Error', e?.response?.data?.message||'Failed'),
  });
  return (
    <ScrollView contentContainerStyle={h.scroll}>
      <View style={h.row}>
        <Text style={h.secTitle}>Vitals</Text>
        <SmBtn label={show?'Cancel':'Add'} icon={show?'close':'plus'} onPress={()=>setShow(v=>!v)}/>
      </View>
      {show && (
        <Card color={COLORS.primary}>
          <View style={h.grid}>
            <Field label="Temp (°F)"   value={f.temperature}            onChange={(v:string)=>setF(p=>({...p,temperature:v}))}            keyboardType="decimal-pad" placeholder="98.6"/>
            <Field label="Pulse"       value={f.pulse}                  onChange={(v:string)=>setF(p=>({...p,pulse:v}))}                  keyboardType="numeric"     placeholder="72"/>
            <Field label="BP Sys"      value={f.bloodPressureSystolic}  onChange={(v:string)=>setF(p=>({...p,bloodPressureSystolic:v}))}  keyboardType="numeric"     placeholder="120"/>
            <Field label="BP Dia"      value={f.bloodPressureDiastolic} onChange={(v:string)=>setF(p=>({...p,bloodPressureDiastolic:v}))} keyboardType="numeric"     placeholder="80"/>
            <Field label="SpO2 (%)"    value={f.oxygenSaturation}       onChange={(v:string)=>setF(p=>({...p,oxygenSaturation:v}))}       keyboardType="decimal-pad" placeholder="98"/>
            <Field label="Weight (kg)" value={f.weight}                 onChange={(v:string)=>setF(p=>({...p,weight:v}))}                 keyboardType="decimal-pad" placeholder="70"/>
          </View>
          <Btn label="Save" onPress={()=>mut.mutate({admissionId,patientId:data?.patient?.id,time:new Date().toISOString(),temperature:f.temperature?parseFloat(f.temperature):undefined,pulse:f.pulse?parseInt(f.pulse):undefined,bloodPressureSystolic:f.bloodPressureSystolic?parseInt(f.bloodPressureSystolic):undefined,bloodPressureDiastolic:f.bloodPressureDiastolic?parseInt(f.bloodPressureDiastolic):undefined,oxygenSaturation:f.oxygenSaturation?parseFloat(f.oxygenSaturation):undefined,weight:f.weight?parseFloat(f.weight):undefined,height:f.height?parseFloat(f.height):undefined})} loading={mut.isPending}/>
        </Card>
      )}
      {vitals.length === 0 ? <Empty icon="heart-pulse" title="No vitals recorded"/> :
        vitals.map((v:any,i:number) => (
          <Card key={v.id||i}>
            <Text style={h.meta}>{v.time ? format(new Date(v.time),'dd MMM yyyy, h:mm a') : '—'}</Text>
            <View style={h.grid}>
              {v.temperature            && <View style={h.vCell}><Text style={h.vLabel}>Temp</Text><Text style={h.vVal}>{v.temperature}°F</Text></View>}
              {v.pulse                  && <View style={h.vCell}><Text style={h.vLabel}>Pulse</Text><Text style={h.vVal}>{v.pulse} bpm</Text></View>}
              {v.oxygenSaturation       && <View style={h.vCell}><Text style={h.vLabel}>SpO2</Text><Text style={h.vVal}>{v.oxygenSaturation}%</Text></View>}
              {v.weight                 && <View style={h.vCell}><Text style={h.vLabel}>Weight</Text><Text style={h.vVal}>{v.weight}kg</Text></View>}
            </View>
          </Card>
        ))
      }
    </ScrollView>
  );
}

// ─── Visits Tab ───────────────────────────────────────────────────────────────
function TabVisits({admissionId, data, refetch}: any) {
  const queryClient = useQueryClient();
  const visits = data?.visits || [];
  const [show, setShow] = useState(false);
  const [f, setF] = useState({chiefComplaint:'', examination:'', diagnosis:'', testReportsToCarry:'', nextReviewDate:''});
  const mut = useMutation({
    mutationFn: (p: any) => instance.post(api.doctorAddVisit, p),
    onSuccess: () => {Alert.alert('Saved','Visit notes added'); setShow(false); setF({chiefComplaint:'',examination:'',diagnosis:'',testReportsToCarry:'',nextReviewDate:''}); queryClient.invalidateQueries({queryKey:['dr-ipd',admissionId]}); refetch();},
    onError: (e: any) => Alert.alert('Error', e?.response?.data?.message||'Failed'),
  });
  return (
    <ScrollView contentContainerStyle={h.scroll}>
      <View style={h.row}>
        <Text style={h.secTitle}>Visits</Text>
        <SmBtn label={show?'Cancel':'Add'} icon={show?'close':'plus'} onPress={()=>setShow(v=>!v)}/>
      </View>
      {show && (
        <Card color={COLORS.primary}>
          <Field label="Chief Complaint *" value={f.chiefComplaint}     onChange={(v:string)=>setF(p=>({...p,chiefComplaint:v}))}     multiline placeholder="Chief complaint..."/>
          <Field label="Examination"        value={f.examination}        onChange={(v:string)=>setF(p=>({...p,examination:v}))}        multiline placeholder="Examination..."/>
          <Field label="Diagnosis *"        value={f.diagnosis}          onChange={(v:string)=>setF(p=>({...p,diagnosis:v}))}          multiline placeholder="Diagnosis..."/>
          <Field label="Next Review (Days)" value={f.nextReviewDate}     onChange={(v:string)=>setF(p=>({...p,nextReviewDate:v}))}     keyboardType="numeric" placeholder="e.g. 1"/>
          <Btn label="Save Visit Notes" onPress={()=>{if(!f.chiefComplaint.trim()||!f.diagnosis.trim()){Alert.alert('Required','Chief complaint and diagnosis required');return;} mut.mutate({...f,admissionId,patientId:data?.patient?.id,visitDate:new Date().toISOString(),visitType:'IPD'});}} loading={mut.isPending}/>
        </Card>
      )}
      {visits.length === 0 ? <Empty icon="stethoscope" title="No visit notes"/> :
        visits.map((v:any) => (
          <Card key={v.id}>
            <Text style={h.meta}>{v.visitDate ? format(new Date(v.visitDate),'dd MMM yyyy, h:mm a') : '—'}</Text>
            <InfoRow label="Chief Complaint" value={v.chiefComplaint}/>
            <InfoRow label="Diagnosis"        value={v.diagnosis}/>
            <InfoRow label="Examination"      value={v.examination}/>
          </Card>
        ))
      }
    </ScrollView>
  );
}

// ─── Medication Tab ───────────────────────────────────────────────────────────
function TabMedication({admissionId, data, refetch}: any) {
  const queryClient   = useQueryClient();
  const prescriptions = data?.prescriptions || data?.prescribedTo || [];
  const [show, setShow]   = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [selected, setSelected] = useState<any[]>([]);

  useEffect(() => {
    if (!search.trim()) {setResults([]); return;}
    const t = setTimeout(async () => {
      try {
        const r = await instance.get(api.doctorSearchMedicines,{params:{search,limit:10}});
        setResults(r.data?.data||[]);
      } catch {setResults([]);}
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const mut = useMutation({
    mutationFn: (p: any) => instance.post(api.doctorAddPrescription, p),
    onSuccess: () => {Alert.alert('Saved','Prescription added'); setShow(false); setSelected([]); queryClient.invalidateQueries({queryKey:['dr-ipd',admissionId]}); refetch();},
    onError: (e: any) => Alert.alert('Error', e?.response?.data?.message||'Failed'),
  });

  return (
    <ScrollView contentContainerStyle={h.scroll}>
      <View style={h.row}>
        <Text style={h.secTitle}>Prescriptions</Text>
        <SmBtn label={show?'Cancel':'Add'} icon={show?'close':'plus'} onPress={()=>setShow(v=>!v)}/>
      </View>
      {show && (
        <Card color={COLORS.primary}>
          <TextInput style={h.search} placeholder="Search medicine..." placeholderTextColor={COLORS.textMuted} value={search} onChangeText={setSearch}/>
          {results.length > 0 && (
            <View style={h.dropdown}>
              {results.map((med:any) => (
                <TouchableOpacity key={med.id} style={h.dropItem} onPress={()=>{if(!selected.find(s=>s.itemId===med.id))setSelected(p=>[...p,{itemId:med.id,name:med.name,frequency:'',duration:'',dosage:''}]);setSearch('');setResults([]);}}>
                  <Text style={h.dropText}>{med.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {selected.map((item,idx) => (
            <View key={idx} style={h.medItem}>
              <View style={h.row}>
                <Text style={h.medName}>{item.name}</Text>
                <TouchableOpacity onPress={()=>setSelected(p=>p.filter((_,i)=>i!==idx))}>
                  <Icon name="close-circle" size={16} color={COLORS.error}/>
                </TouchableOpacity>
              </View>
              <View style={h.grid}>
                <Field label="Dosage"    value={item.dosage}    onChange={(v:string)=>setSelected(p=>p.map((s,i)=>i===idx?{...s,dosage:v}:s))}    placeholder="500mg"/>
                <Field label="Frequency" value={item.frequency} onChange={(v:string)=>setSelected(p=>p.map((s,i)=>i===idx?{...s,frequency:v}:s))} placeholder="Twice daily"/>
                <Field label="Duration"  value={item.duration}  onChange={(v:string)=>setSelected(p=>p.map((s,i)=>i===idx?{...s,duration:v}:s))}  placeholder="5 days"/>
              </View>
            </View>
          ))}
          {selected.length > 0 && <Btn label="Save Prescription" onPress={()=>mut.mutate({admissionId,patientId:data?.patient?.id,prescriptionItems:selected.map(s=>({itemId:s.itemId,dosage:s.dosage,frequency:s.frequency,duration:s.duration,timing:'AFTER_MEAL'}))})} loading={mut.isPending}/>}
        </Card>
      )}
      {prescriptions.length === 0 ? <Empty icon="pill" title="No prescriptions"/> :
        prescriptions.map((p:any) => (
          <Card key={p.id}>
            <Text style={h.meta}>{p.createdAt ? format(new Date(p.createdAt),'dd MMM yyyy') : '—'}</Text>
            {p.prescriptionItems?.map((item:any,i:number) => (
              <View key={i} style={{paddingVertical:4, borderBottomWidth:1, borderBottomColor:COLORS.borderLight}}>
                <Text style={h.medName}>{item.item?.name||'Medicine'}</Text>
                <Text style={h.meta}>{[item.dosage,item.frequency,item.duration].filter(Boolean).join(' · ')}</Text>
              </View>
            ))}
          </Card>
        ))
      }
    </ScrollView>
  );
}

// ─── Lab Tab ──────────────────────────────────────────────────────────────────
function TabLab({admissionId, data, refetch}: any) {
  const queryClient = useQueryClient();
  const labOrders   = data?.labOrders || [];
  const [show, setShow]     = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [selected, setSelected] = useState<any[]>([]);

  useEffect(() => {
    if (!search.trim()) {setResults([]); return;}
    const t = setTimeout(async () => {
      try {
        const r = await instance.get(api.doctorSearchLabTests,{params:{search,limit:10}});
        setResults(r.data?.data||[]);
      } catch {setResults([]);}
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const mut = useMutation({
    mutationFn: (p: any) => instance.post(api.doctorCreateLabOrder, p),
    onSuccess: () => {Alert.alert('Saved','Lab order created'); setShow(false); setSelected([]); queryClient.invalidateQueries({queryKey:['dr-ipd',admissionId]}); refetch();},
    onError: (e: any) => Alert.alert('Error', e?.response?.data?.message||'Failed'),
  });

  const SC: Record<string,string> = {PENDING:'#B45309',CONFIRMED:'#1D4ED8',COMPLETED:'#065F46',CANCELLED:'#991B1B'};

  return (
    <ScrollView contentContainerStyle={h.scroll}>
      <View style={h.row}>
        <Text style={h.secTitle}>Lab Orders</Text>
        <SmBtn label={show?'Cancel':'Order'} icon={show?'close':'plus'} onPress={()=>setShow(v=>!v)}/>
      </View>
      {show && (
        <Card color={COLORS.primary}>
          <TextInput style={h.search} placeholder="Search lab tests..." placeholderTextColor={COLORS.textMuted} value={search} onChangeText={setSearch}/>
          {results.length > 0 && (
            <View style={h.dropdown}>
              {results.map((t:any) => (
                <TouchableOpacity key={t.id} style={h.dropItem} onPress={()=>{if(!selected.find(s=>s.id===t.id))setSelected(p=>[...p,t]);setSearch('');setResults([]);}}>
                  <Text style={h.dropText}>{t.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {selected.map((t,i) => (
            <View key={i} style={h.row}>
              <Icon name="flask-outline" size={13} color={COLORS.primary}/>
              <Text style={{flex:1,fontSize:FONTS.sizes.sm,color:COLORS.text}}>{t.name}</Text>
              <TouchableOpacity onPress={()=>setSelected(p=>p.filter((_,idx)=>idx!==i))}>
                <Icon name="close-circle" size={16} color={COLORS.error}/>
              </TouchableOpacity>
            </View>
          ))}
          {selected.length > 0 && <Btn label="Create Lab Order" onPress={()=>mut.mutate({admissionId,patientId:data?.patient?.id,testIds:selected.map(s=>s.id),orderDate:new Date().toISOString(),status:'PENDING'})} loading={mut.isPending}/>}
        </Card>
      )}
      {labOrders.length === 0 ? <Empty icon="flask-outline" title="No lab orders"/> :
        labOrders.map((o:any) => (
          <Card key={o.id}>
            <View style={h.row}>
              <Text style={h.meta}>{o.orderDate ? format(new Date(o.orderDate),'dd MMM yyyy') : '—'}</Text>
              <View style={{backgroundColor:(SC[o.status]||'#6B7280')+'20',paddingHorizontal:8,paddingVertical:3,borderRadius:20}}>
                <Text style={{fontSize:10,fontWeight:'700',color:SC[o.status]||'#6B7280'}}>{o.status}</Text>
              </View>
            </View>
          </Card>
        ))
      }
    </ScrollView>
  );
}

// ─── Discharge Tab ────────────────────────────────────────────────────────────
function TabDischarge({admissionId, data, refetch}: any) {
  const queryClient = useQueryClient();
  const admission   = data?.admissions?.[0] || data;
  const discharge   = data?.dischargeSummaries?.[0];
  const [f, setF]   = useState({dischargeSummary:'', conditionAtDischarge:'', followUpDate:'', followUpNotes:''});

  const mut = useMutation({
    mutationFn: (p: any) => instance.post(api.patientDischargeSummary, p),
    onSuccess: () => {Alert.alert('Saved','Discharge summary submitted'); queryClient.invalidateQueries({queryKey:['dr-ipd',admissionId]}); refetch();},
    onError: (e: any) => Alert.alert('Error', e?.response?.data?.message||'Failed'),
  });

  if (discharge) {
    return (
      <ScrollView contentContainerStyle={h.scroll}>
        <Card title="Discharge Summary" color="#065F46">
          <InfoRow label="Summary"    value={discharge.dischargeSummary}/>
          <InfoRow label="Condition"  value={discharge.conditionAtDischarge}/>
          <InfoRow label="Follow Up"  value={discharge.followUpDate ? format(new Date(discharge.followUpDate),'dd MMM yyyy') : null}/>
          <InfoRow label="Notes"      value={discharge.followUpNotes}/>
          <InfoRow label="Status"     value={admission?.status}/>
        </Card>
      </ScrollView>
    );
  }

  if (admission?.status !== 'ADMITTED') {
    return <Empty icon="logout" title={`Status: ${admission?.status || '—'}`}/>;
  }

  return (
    <ScrollView contentContainerStyle={h.scroll}>
      <Card title="Initiate Discharge" color={COLORS.primary}>
        <Field label="Summary *"          value={f.dischargeSummary}     onChange={(v:string)=>setF(p=>({...p,dischargeSummary:v}))}     multiline placeholder="Treatment summary..."/>
        <Field label="Condition"          value={f.conditionAtDischarge} onChange={(v:string)=>setF(p=>({...p,conditionAtDischarge:v}))} placeholder="e.g. Stable"/>
        <Field label="Follow-up Date"     value={f.followUpDate}         onChange={(v:string)=>setF(p=>({...p,followUpDate:v}))}         placeholder="YYYY-MM-DD"/>
        <Field label="Follow-up Notes"    value={f.followUpNotes}        onChange={(v:string)=>setF(p=>({...p,followUpNotes:v}))}        multiline placeholder="Instructions..."/>
        <Btn label="Submit Discharge" onPress={()=>{if(!f.dischargeSummary.trim()){Alert.alert('Required','Summary is required');return;} mut.mutate({admissionId,patientId:data?.patient?.id,...f});}} loading={mut.isPending}/>
      </Card>
    </ScrollView>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function DoctorInPatientDetailScreen({route, navigation}: any) {
  const {id}   = route.params;
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState('details');

  const {data, isLoading, refetch} = useQuery({
    queryKey: ['dr-ipd', id],
    queryFn:  async () => (await instance.get(api.doctorGetAdmissionById(id))).data?.data,
    enabled:  !!id,
  });

  const user        = data?.patient?.user;
  const patientName = user ? `${user.fName||''} ${user.lName||''}`.trim() || 'Patient' : 'Patient';
  const admission   = data?.admissions?.[0] || data;

  if (isLoading) return (
    <View style={{flex:1,justifyContent:'center',alignItems:'center'}}>
      <ActivityIndicator size="large" color={COLORS.primary}/>
    </View>
  );

  return (
    <View style={[s.safe,{paddingTop:insets.top,paddingBottom:insets.bottom}]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} translucent={false}/>

      <View style={s.header}>
        <TouchableOpacity onPress={()=>navigation.goBack()} style={{padding:4}}>
          <Icon name="arrow-left" size={22} color={COLORS.white}/>
        </TouchableOpacity>
        <View style={{flex:1}}>
          <Text style={s.title} numberOfLines={1}>{patientName}</Text>
          <Text style={s.sub}>In-Patient · {admission?.status||'—'}</Text>
        </View>
        <TouchableOpacity style={s.iconBtn} onPress={()=>refetch()}>
          <Icon name="refresh" size={18} color={COLORS.white}/>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabBar} style={{backgroundColor:COLORS.primary,maxHeight:56}}>
        {TABS.map(t => {
          const active = tab === t.key;
          return (
            <TouchableOpacity key={t.key} style={[s.tab,active&&s.tabActive]} onPress={()=>setTab(t.key)}>
              <Icon name={t.icon} size={13} color={active?COLORS.primary:'rgba(255,255,255,0.7)'}/>
              <Text style={[s.tabText,active&&s.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={{flex:1,backgroundColor:COLORS.background}}>
        {tab==='details'   && <TabDetails    data={data}/>}
        {tab==='vitals'    && <TabVitals     admissionId={id} data={data} refetch={refetch}/>}
        {tab==='visits'    && <TabVisits     admissionId={id} data={data} refetch={refetch}/>}
        {tab==='medication'&& <TabMedication admissionId={id} data={data} refetch={refetch}/>}
        {tab==='lab'       && <TabLab        admissionId={id} data={data} refetch={refetch}/>}
        {tab==='discharge' && <TabDischarge  admissionId={id} data={data} refetch={refetch}/>}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:        {flex:1,backgroundColor:COLORS.primary},
  header:      {flexDirection:'row',alignItems:'center',padding:SPACING.lg,gap:SPACING.md},
  title:       {fontSize:FONTS.sizes.lg,fontWeight:FONTS.weights.bold,color:COLORS.white},
  sub:         {fontSize:FONTS.sizes.xs,color:'rgba(255,255,255,0.75)',marginTop:2},
  iconBtn:     {backgroundColor:'rgba(255,255,255,0.2)',borderRadius:20,padding:8},
  tabBar:      {paddingHorizontal:SPACING.lg,paddingBottom:SPACING.sm,gap:SPACING.xs},
  tab:         {flexDirection:'row',alignItems:'center',gap:4,paddingHorizontal:SPACING.md,paddingVertical:7,borderRadius:20,backgroundColor:'rgba(255,255,255,0.15)'},
  tabActive:   {backgroundColor:COLORS.white},
  tabText:     {fontSize:FONTS.sizes.xs,color:'rgba(255,255,255,0.8)',fontWeight:FONTS.weights.medium},
  tabTextActive:{color:COLORS.primary,fontWeight:FONTS.weights.bold},
});

const h = StyleSheet.create({
  scroll:     {padding:SPACING.base,gap:SPACING.md,paddingBottom:60},
  card:       {backgroundColor:COLORS.white,borderRadius:RADIUS.lg,padding:SPACING.base,borderLeftWidth:3,borderLeftColor:COLORS.primary,...SHADOW.sm,marginBottom:SPACING.sm},
  cardTitle:  {fontSize:FONTS.sizes.base,fontWeight:FONTS.weights.bold,color:COLORS.text,marginBottom:SPACING.sm},
  infoRow:    {flexDirection:'row',justifyContent:'space-between',paddingVertical:5,borderBottomWidth:1,borderBottomColor:COLORS.borderLight},
  infoLabel:  {fontSize:FONTS.sizes.sm,color:COLORS.textMuted,flex:1},
  infoValue:  {fontSize:FONTS.sizes.sm,color:COLORS.text,fontWeight:FONTS.weights.medium,flex:2,textAlign:'right'},
  row:        {flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:SPACING.xs,gap:SPACING.xs},
  secTitle:   {fontSize:FONTS.sizes.base,fontWeight:FONTS.weights.bold,color:COLORS.text},
  smBtn:      {flexDirection:'row',alignItems:'center',gap:4,backgroundColor:COLORS.primary,paddingHorizontal:SPACING.sm,paddingVertical:6,borderRadius:RADIUS.sm},
  smBtnText:  {color:COLORS.white,fontSize:FONTS.sizes.xs,fontWeight:FONTS.weights.semibold},
  btn:        {backgroundColor:COLORS.primary,borderRadius:RADIUS.md,padding:SPACING.md,alignItems:'center',marginTop:SPACING.sm},
  btnText:    {color:COLORS.white,fontWeight:FONTS.weights.bold,fontSize:FONTS.sizes.base},
  fieldLabel: {fontSize:FONTS.sizes.sm,fontWeight:FONTS.weights.medium,color:COLORS.text,marginBottom:4},
  fieldInput: {borderWidth:1,borderColor:COLORS.border,borderRadius:RADIUS.sm,paddingHorizontal:SPACING.sm,paddingVertical:SPACING.xs+2,fontSize:FONTS.sizes.base,color:COLORS.text,backgroundColor:COLORS.white},
  grid:       {flexDirection:'row',flexWrap:'wrap',gap:SPACING.xs},
  vCell:      {backgroundColor:COLORS.background,borderRadius:RADIUS.sm,padding:SPACING.sm,minWidth:'30%',flex:1},
  vLabel:     {fontSize:FONTS.sizes.xs,color:COLORS.textMuted},
  vVal:       {fontSize:FONTS.sizes.sm,fontWeight:FONTS.weights.bold,color:COLORS.text},
  meta:       {fontSize:FONTS.sizes.xs,color:COLORS.textMuted,marginBottom:SPACING.xs},
  empty:      {alignItems:'center',paddingVertical:40,gap:SPACING.sm},
  emptyText:  {fontSize:FONTS.sizes.base,color:COLORS.textSecondary},
  search:     {borderWidth:1,borderColor:COLORS.border,borderRadius:RADIUS.md,paddingHorizontal:SPACING.md,paddingVertical:SPACING.sm,fontSize:FONTS.sizes.base,color:COLORS.text,marginBottom:SPACING.xs},
  dropdown:   {borderWidth:1,borderColor:COLORS.border,borderRadius:RADIUS.md,backgroundColor:COLORS.white,marginBottom:SPACING.sm,maxHeight:180,overflow:'hidden'},
  dropItem:   {padding:SPACING.sm,borderBottomWidth:1,borderBottomColor:COLORS.borderLight},
  dropText:   {fontSize:FONTS.sizes.sm,color:COLORS.text},
  medItem:    {backgroundColor:COLORS.background,borderRadius:RADIUS.sm,padding:SPACING.sm,marginBottom:SPACING.sm},
  medName:    {fontSize:FONTS.sizes.sm,fontWeight:FONTS.weights.bold,color:COLORS.text},
});