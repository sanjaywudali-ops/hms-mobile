import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Image} from 'react-native';
import {createDrawerNavigator, DrawerContentScrollView, DrawerItemList} from '@react-navigation/drawer';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import {COLORS, FONTS, SPACING, RADIUS} from '../constants/theme';
import {useAuth} from '../services/AuthContext';

// Screens
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import PatientManagementScreen from '../screens/patients/PatientManagementScreen';
import InPatientListScreen from '../screens/inpatient/InPatientListScreen';
import InPatientDetailScreen from '../screens/inpatient/InPatientDetailScreen';
import OutPatientListScreen from '../screens/outpatient/OutPatientListScreen';
import OutPatientDetailScreen from '../screens/outpatient/OutPatientDetailScreen';
import BookAppointmentScreen from '../screens/outpatient/BookAppointmentScreen';
import LaboratoryScreen from '../screens/laboratory/LaboratoryScreen';
import PharmacyScreen from '../screens/pharmacy/PharmacyScreen';
import StaffRegistryScreen from '../screens/staff/StaffRegistryScreen';
import RoomManagementScreen from '../screens/rooms/RoomManagementScreen';
import PatientHistoryScreen from '../screens/patients/PatientHistoryScreen';
import PatientHistoryDetailScreen from '../screens/patients/PatientHistoryDetailScreen';
import DoctorDashboardScreen from '../screens/doctor/DoctorDashboardScreen';
import DoctorInPatientScreen from '../screens/doctor/DoctorInPatientScreen';
import DoctorOutPatientScreen from '../screens/doctor/DoctorOutPatientScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import AdmitPatientScreen from '../screens/inpatient/AdmitPatientScreen';
import InPatientVitalsScreen from '../screens/inpatient/InPatientVitalsScreen';
import LabOrderDetailScreen from '../screens/laboratory/LabOrderDetailScreen';
import PharmacyBillDetailScreen from '../screens/pharmacy/PharmacyBillDetailScreen';
import GenerateBillScreen from '../screens/pharmacy/GenerateBillScreen';

// ─── Stack Param Lists ────────────────────────────────────────────────────────
export type InPatientStackParamList = {
  InPatientList: undefined;
  InPatientDetail: {id: string};
  AdmitPatient: undefined;
  InPatientVitals: {patientId: string; admissionId: string};
};

export type OutPatientStackParamList = {
  OutPatientList: undefined;
  OutPatientDetail: {id: string};
  BookAppointment: undefined;
};

export type LabStackParamList = {
  Laboratory: undefined;
  LabOrderDetail: {id: string};
};

export type PharmacyStackParamList = {
  Pharmacy: undefined;
  PharmacyBillDetail: {id: string};
  GenerateBill: undefined;
};

export type PatientHistoryStackParamList = {
  PatientHistory: undefined;
  PatientHistoryDetail: {id: string};
};

// ─── Stack Navigators ────────────────────────────────────────────────────────
const InPatientStack = createNativeStackNavigator<InPatientStackParamList>();
function InPatientNavigator() {
  return (
    <InPatientStack.Navigator screenOptions={{headerShown: false}}>
      <InPatientStack.Screen name="InPatientList" component={InPatientListScreen} />
      <InPatientStack.Screen name="InPatientDetail" component={InPatientDetailScreen} />
      <InPatientStack.Screen name="AdmitPatient" component={AdmitPatientScreen} />
      <InPatientStack.Screen name="InPatientVitals" component={InPatientVitalsScreen} />
    </InPatientStack.Navigator>
  );
}

const OutPatientStack = createNativeStackNavigator<OutPatientStackParamList>();
function OutPatientNavigator() {
  return (
    <OutPatientStack.Navigator screenOptions={{headerShown: false}}>
      <OutPatientStack.Screen name="OutPatientList" component={OutPatientListScreen} />
      <OutPatientStack.Screen name="OutPatientDetail" component={OutPatientDetailScreen} />
      <OutPatientStack.Screen name="BookAppointment" component={BookAppointmentScreen} />
    </OutPatientStack.Navigator>
  );
}

const LabStack = createNativeStackNavigator<LabStackParamList>();
function LabNavigator() {
  return (
    <LabStack.Navigator screenOptions={{headerShown: false}}>
      <LabStack.Screen name="Laboratory" component={LaboratoryScreen} />
      <LabStack.Screen name="LabOrderDetail" component={LabOrderDetailScreen} />
    </LabStack.Navigator>
  );
}

const PharmacyStack = createNativeStackNavigator<PharmacyStackParamList>();
function PharmacyNavigator() {
  return (
    <PharmacyStack.Navigator screenOptions={{headerShown: false}}>
      <PharmacyStack.Screen name="Pharmacy" component={PharmacyScreen} />
      <PharmacyStack.Screen name="PharmacyBillDetail" component={PharmacyBillDetailScreen} />
      <PharmacyStack.Screen name="GenerateBill" component={GenerateBillScreen} />
    </PharmacyStack.Navigator>
  );
}

const PatientHistoryStack = createNativeStackNavigator<PatientHistoryStackParamList>();
function PatientHistoryNavigator() {
  return (
    <PatientHistoryStack.Navigator screenOptions={{headerShown: false}}>
      <PatientHistoryStack.Screen name="PatientHistory" component={PatientHistoryScreen} />
      <PatientHistoryStack.Screen name="PatientHistoryDetail" component={PatientHistoryDetailScreen} />
    </PatientHistoryStack.Navigator>
  );
}

// ─── Bottom Tabs ─────────────────────────────────────────────────────────────
const Tab = createBottomTabNavigator();
function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 4,
          height: 60,
        },
        tabBarLabelStyle: {fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.medium},
        tabBarIcon: ({color, size}) => {
          const icons: Record<string, string> = {
            Dashboard: 'view-dashboard-outline',
            Patients: 'account-group-outline',
            Laboratory: 'flask-outline',
            Pharmacy: 'pill',
            More: 'menu',
          };
          return <Icon name={icons[route.name] || 'circle'} size={size} color={color} />;
        },
      })}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Patients" component={PatientManagementScreen} />
      <Tab.Screen name="Laboratory" component={LabNavigator} />
      <Tab.Screen name="Pharmacy" component={PharmacyNavigator} />
      <Tab.Screen name="More" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

// ─── Custom Drawer Content ───────────────────────────────────────────────────
function CustomDrawerContent(props: any) {
  const {logout, user} = useAuth();

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{flex: 1}}>
      {/* Header */}
      <View style={drawerStyles.header}>
        <View style={drawerStyles.avatar}>
          <Text style={drawerStyles.avatarText}>
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </Text>
        </View>
        <Text style={drawerStyles.userName}>{user?.name || 'User'}</Text>
        <Text style={drawerStyles.userRole}>{user?.role || ''}</Text>
      </View>

      <DrawerItemList {...props} />

      {/* Logout */}
      <TouchableOpacity style={drawerStyles.logoutBtn} onPress={logout}>
        <Icon name="logout" size={20} color={COLORS.error} />
        <Text style={drawerStyles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </DrawerContentScrollView>
  );
}

// ─── Main Drawer ─────────────────────────────────────────────────────────────
const Drawer = createDrawerNavigator();
export default function MainDrawer() {
  return (
    <Drawer.Navigator
      drawerContent={props => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerActiveTintColor: COLORS.primary,
        drawerInactiveTintColor: COLORS.textSecondary,
        drawerActiveBackgroundColor: COLORS.primaryLight,
        drawerStyle: {width: 280, backgroundColor: COLORS.white},
        drawerLabelStyle: {fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.medium},
      }}>
      <Drawer.Screen
        name="Home"
        component={BottomTabs}
        options={{drawerLabel: 'Dashboard', drawerIcon: ({color}) => <Icon name="view-dashboard-outline" size={20} color={color} />}}
      />
      <Drawer.Screen
        name="InPatient"
        component={InPatientNavigator}
        options={{drawerLabel: 'In-Patients', drawerIcon: ({color}) => <Icon name="bed-outline" size={20} color={color} />}}
      />
      <Drawer.Screen
        name="OutPatient"
        component={OutPatientNavigator}
        options={{drawerLabel: 'Out-Patients', drawerIcon: ({color}) => <Icon name="calendar-check-outline" size={20} color={color} />}}
      />
      <Drawer.Screen
        name="DoctorDashboard"
        component={DoctorDashboardScreen}
        options={{drawerLabel: 'Doctor Portal', drawerIcon: ({color}) => <Icon name="stethoscope" size={20} color={color} />}}
      />
      <Drawer.Screen
        name="DoctorInPatient"
        component={DoctorInPatientScreen}
        options={{drawerLabel: 'Doctor In-Patients', drawerIcon: ({color}) => <Icon name="hospital-box-outline" size={20} color={color} />}}
      />
      <Drawer.Screen
        name="DoctorOutPatient"
        component={DoctorOutPatientScreen}
        options={{drawerLabel: 'Doctor Out-Patients', drawerIcon: ({color}) => <Icon name="account-clock-outline" size={20} color={color} />}}
      />
      <Drawer.Screen
        name="PatientHistoryNav"
        component={PatientHistoryNavigator}
        options={{drawerLabel: 'Patient History', drawerIcon: ({color}) => <Icon name="history" size={20} color={color} />}}
      />
      <Drawer.Screen
        name="Staff"
        component={StaffRegistryScreen}
        options={{drawerLabel: 'Staff Registry', drawerIcon: ({color}) => <Icon name="badge-account-outline" size={20} color={color} />}}
      />
      <Drawer.Screen
        name="Rooms"
        component={RoomManagementScreen}
        options={{drawerLabel: 'Room Management', drawerIcon: ({color}) => <Icon name="door-open" size={20} color={color} />}}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{drawerLabel: 'Settings', drawerIcon: ({color}) => <Icon name="cog-outline" size={20} color={color} />}}
      />
    </Drawer.Navigator>
  );
}

const drawerStyles = StyleSheet.create({
  header: {
    padding: SPACING.xl,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  avatarText: {fontSize: 28, color: COLORS.white, fontWeight: FONTS.weights.bold},
  userName: {fontSize: FONTS.sizes.md, color: COLORS.white, fontWeight: FONTS.weights.bold},
  userRole: {fontSize: FONTS.sizes.sm, color: 'rgba(255,255,255,0.8)', marginTop: 2},
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.base,
    margin: SPACING.base,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.error + '30',
    backgroundColor: COLORS.errorLight,
  },
  logoutText: {color: COLORS.error, fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.medium},
});
