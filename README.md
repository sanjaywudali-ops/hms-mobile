# HMS Mobile — React Native App

A full-featured Hospital Management System mobile app converted from the React web app. Built with React Native 0.74, TypeScript, React Navigation, and TanStack Query.

---

## Project Structure

```
HMS-Mobile/
├── App.tsx                          # Root component
├── index.js                         # Entry point
├── app.json
├── package.json
├── tsconfig.json
├── babel.config.js
├── metro.config.js
└── src/
    ├── constants/
    │   ├── api.ts                   # All API endpoint strings (mirror of web api.ts)
    │   └── theme.ts                 # Colors, fonts, spacing, shadows
    ├── services/
    │   ├── axios.ts                 # Axios instance with auth interceptors
    │   └── AuthContext.tsx          # Auth state (login/logout/persist)
    ├── navigation/
    │   ├── RootNavigator.tsx        # Auth guard → AuthStack or MainDrawer
    │   ├── AuthStack.tsx            # Login, ForgotPassword
    │   └── MainDrawer.tsx           # Drawer + Bottom tabs + all stack navigators
    ├── components/
    │   └── common/index.tsx         # ScreenHeader, Card, Badge, Button, SearchBar,
    │                                #   FormInput, EmptyState, LoadingScreen,
    │                                #   SectionHeader, InfoRow, StatCard
    ├── hooks/
    │   └── useApi.ts                # All TanStack Query hooks for every API
    ├── types/
    │   └── index.ts                 # TypeScript types (Patient, Admission, etc.)
    ├── utils/
    │   └── helpers.ts               # formatDate, formatCurrency, fullName, etc.
    └── screens/
        ├── auth/
        │   ├── LoginScreen.tsx       # Multi-role login (ADM/DOC/EMP/SADM)
        │   └── ForgotPasswordScreen.tsx
        ├── dashboard/
        │   └── DashboardScreen.tsx   # OPD + IPD stats, quick actions, module nav
        ├── patients/
        │   ├── PatientManagementScreen.tsx   # Overview hub with stats
        │   ├── PatientHistoryScreen.tsx      # Patient list with search
        │   └── PatientHistoryDetailScreen.tsx # 4-tab patient detail (overview/admissions/appts/prescriptions)
        ├── inpatient/
        │   ├── InPatientListScreen.tsx       # Filterable admission list
        │   ├── InPatientDetailScreen.tsx     # Full admission detail + discharge action
        │   ├── AdmitPatientScreen.tsx        # Admit patient form
        │   └── InPatientVitalsScreen.tsx     # Record & view vitals history
        ├── outpatient/
        │   ├── OutPatientListScreen.tsx      # Filterable appointment list + quick actions
        │   ├── OutPatientDetailScreen.tsx    # Appointment detail + status actions
        │   └── BookAppointmentScreen.tsx     # Full booking flow with date/slot picker
        ├── laboratory/
        │   ├── LaboratoryScreen.tsx          # Lab orders list with filters
        │   └── LabOrderDetailScreen.tsx      # Order detail + enter results form
        ├── pharmacy/
        │   ├── PharmacyScreen.tsx            # Bills list
        │   ├── PharmacyBillDetailScreen.tsx  # Bill detail with line items
        │   └── GenerateBillScreen.tsx        # Create new pharmacy bill
        ├── doctor/
        │   ├── DoctorDashboardScreen.tsx     # Doctor-specific dashboard with stats
        │   ├── DoctorInPatientScreen.tsx     # Doctor's own in-patients
        │   └── DoctorOutPatientScreen.tsx    # Doctor's own appointments
        ├── staff/
        │   └── StaffRegistryScreen.tsx       # Staff list with role badges
        ├── rooms/
        │   └── RoomManagementScreen.tsx      # Room list with status filters & availability summary
        └── settings/
            └── SettingsScreen.tsx            # Profile, navigation shortcuts, sign out
```

---

## Setup Instructions

### 1. Prerequisites

- Node.js 18+
- React Native CLI (`npm install -g react-native-cli`)
- Android Studio (for Android) or Xcode (for iOS)
- JDK 17 (Android)

### 2. Install Dependencies

```bash
cd HMS-Mobile
npm install
```

### 3. iOS Setup

```bash
cd ios && pod install && cd ..
```

### 4. Configure Backend URL

Open `src/constants/api.ts` and update:

```ts
export const BASE_URL = 'https://your-actual-backend-url.com';
```

### 5. Vector Icons Setup

**Android** — in `android/app/build.gradle`:
```gradle
apply from: "../../node_modules/react-native-vector-icons/fonts.gradle"
```

**iOS** — in `ios/HMSMobile/Info.plist`, add the fonts array:
```xml
<key>UIAppFonts</key>
<array>
  <string>MaterialCommunityIcons.ttf</string>
</array>
```

### 6. Run the App

```bash
# Android
npm run android

# iOS
npm run ios

# Start Metro bundler only
npm start
```

---

## Authentication

The login screen auto-detects the user role from the code prefix:

| Code Prefix | Role        | API Endpoint           |
|-------------|-------------|------------------------|
| `SADM`      | Super Admin | `/api/superadmin/login`|
| `ADM`       | Admin       | `/api/admin/login`     |
| `DOC`       | Doctor      | `/api/doctors/login`   |
| *(other)*   | Employee    | `/api/employee/login`  |

---

## Key Libraries

| Library | Purpose |
|---------|---------|
| `@react-navigation/native` | Navigation container |
| `@react-navigation/native-stack` | Stack screens |
| `@react-navigation/bottom-tabs` | Bottom tab bar |
| `@react-navigation/drawer` | Side drawer menu |
| `@tanstack/react-query` | Server state, caching, refetching |
| `axios` | HTTP client with auth interceptors |
| `@react-native-async-storage/async-storage` | Token persistence |
| `react-hook-form` + `zod` | Form validation |
| `react-native-vector-icons` | MaterialCommunityIcons |
| `react-native-toast-message` | Success/error toasts |
| `react-native-picker-select` | Dropdown pickers |
| `date-fns` | Date formatting |
| `react-native-safe-area-context` | Safe area insets |
| `react-native-gesture-handler` | Gesture handling (drawer) |
| `react-native-reanimated` | Animations |

---

## Screens & Features

| Screen | Features |
|--------|----------|
| **Login** | Role auto-detection, form validation, show/hide password |
| **Dashboard** | Live OPD/IPD counts, quick actions, module navigation |
| **In-Patient List** | Search, filter by status, paginated |
| **In-Patient Detail** | Full admission info, room, doctor, discharge action |
| **Admit Patient** | Patient/doctor/room pickers, type/priority chips |
| **Vitals** | Record temperature, BP, HR, SpO2, weight; history timeline |
| **Out-Patient List** | Search, filter, quick status change buttons |
| **Out-Patient Detail** | Appointment info, convert to in-patient action |
| **Book Appointment** | Doctor picker → available dates → time slots → type/reason |
| **Laboratory** | Order list, filter by status, start/complete processing |
| **Lab Order Detail** | Order info + results entry form |
| **Pharmacy** | Bill list with totals |
| **Pharmacy Bill Detail** | Line items, discount/tax breakdown |
| **Generate Bill** | Dynamic item builder, live total calculation |
| **Patient History** | Patient search, full history across tabs |
| **Doctor Dashboard** | Doctor-specific stats |
| **Doctor In/Out-Patients** | Filtered to assigned doctor |
| **Staff Registry** | Role-colored cards, search |
| **Room Management** | Status summary, filter, amenities display |
| **Settings** | Profile, navigation shortcuts, sign out |

---

## Notes

- All API calls match the web app's endpoint structure in `src/constants/api.ts`
- Replace `BASE_URL` before running
- The `useApi.ts` hooks file centralises all TanStack Query logic — screens can import hooks from there instead of writing inline queries
- Toast notifications are used for all success/error feedback
- All list screens support pull-to-refresh
