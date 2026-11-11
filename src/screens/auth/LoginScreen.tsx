import React, {useState} from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, TextInput,
} from 'react-native';
import {useForm, Controller} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {COLORS, FONTS, SPACING, RADIUS} from '../../constants/theme';
import {instance} from '../../services/axios';
import {useAuth} from '../../services/AuthContext';
import {Button} from '../../components/common';

const loginSchema = z.object({
  identifier: z.string().min(1, 'Email / Phone is required'),
  password: z.string().min(1, 'Password is required'),
});
type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen({navigation}: any) {
  const {login} = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {control, handleSubmit, formState: {errors, isSubmitting}} = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    const {identifier, password} = data;
    try {
      const res = await instance.post('/api/v1/auth/signin', {identifier, password});
      const userData = res.data?.data;

      if (!userData || !userData.token) {
        Toast.show({type: 'error', text1: 'Login Failed', text2: 'Invalid response from server'});
        return;
      }

      // Fetch full user profile to get role flags
      const meRes = await instance.get('/api/v1/auth/me', {
        headers: {Authorization: `Bearer ${userData.token}`},
      });
      const meData = meRes.data?.data;

      let role = 'Staff';
      if (meData?.isAdmin) role = 'Admin';
      else if (meData?.isDoctor) role = 'Doctor';
      else if (meData?.isPatient) role = 'Patient';

      await login({
        token: userData.token,
        role,
        name: `${userData.fName || ''} ${userData.lName || ''}`.trim(),
      });

      Toast.show({
        type: 'success',
        text1: 'Login Successful',
        text2: `Welcome, ${userData.fName || 'User'}!`,
      });
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Invalid credentials. Please try again.';
      Toast.show({type: 'error', text1: 'Login Failed', text2: message});
    }
  };

  return (
    <KeyboardAvoidingView
      style={{flex: 1}}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled">

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.logoWrap}>
            <Icon name="hospital-box" size={48} color={COLORS.white} />
          </View>
          <Text style={styles.heroTitle}>HMS Mobile</Text>
          <Text style={styles.heroSub}>Hospital Management System</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign In</Text>
          <Text style={styles.cardSub}>Enter your credentials to continue</Text>

          <View style={{marginTop: SPACING.lg}}>

            {/* Identifier */}
            <View style={styles.group}>
              <Text style={styles.label}>
                Email / Phone <Text style={{color: COLORS.error}}>*</Text>
              </Text>
              <Controller
                control={control}
                name="identifier"
                render={({field: {onChange, value}}) => (
                  <View style={[styles.inputWrap, errors.identifier && styles.inputError]}>
                    <Icon name="account-outline" size={18} color={COLORS.textMuted} />
                    <TextInput
                      value={value}
                      onChangeText={onChange}
                      placeholder="Enter email or phone number"
                      placeholderTextColor={COLORS.textMuted}
                      style={styles.input}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  </View>
                )}
              />
              {errors.identifier && (
                <Text style={styles.errorText}>{errors.identifier.message}</Text>
              )}
            </View>

            {/* Password */}
            <View style={styles.group}>
              <Text style={styles.label}>
                Password <Text style={{color: COLORS.error}}>*</Text>
              </Text>
              <Controller
                control={control}
                name="password"
                render={({field: {onChange, value}}) => (
                  <View style={[styles.inputWrap, errors.password && styles.inputError]}>
                    <Icon name="lock-outline" size={18} color={COLORS.textMuted} />
                    <TextInput
                      value={value}
                      onChangeText={onChange}
                      placeholder="Enter your password"
                      placeholderTextColor={COLORS.textMuted}
                      secureTextEntry={!showPassword}
                      style={styles.input}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity onPress={() => setShowPassword(p => !p)}>
                      <Icon
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={18}
                        color={COLORS.textMuted}
                      />
                    </TouchableOpacity>
                  </View>
                )}
              />
              {errors.password && (
                <Text style={styles.errorText}>{errors.password.message}</Text>
              )}
            </View>
          </View>

          <TouchableOpacity
            style={styles.forgotWrap}
            onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <Button
            label={isSubmitting ? 'Signing in...' : 'Sign In'}
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            fullWidth
            style={{marginTop: SPACING.lg}}
          />

          {/* Info hint */}
          <View style={styles.hintBox}>
            <Icon name="information-outline" size={14} color={COLORS.primary} />
            <View style={{flex: 1}}>
              <Text style={styles.hintTitle}>Test Credentials</Text>
              <Text style={styles.hintText}>
                Admin{'\n'}
                Email: vinodkumar@gmail.com{'\n'}
                Password: vinodkumar@123{'\n\n'}
                Doctor{'\n'}
                Email: vikram.reddy@example.com{'\n'}
                Password: vikramreddy@123
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: COLORS.primary},
  scroll: {flexGrow: 1},
  hero: {
    alignItems: 'center',
    paddingTop: SPACING.xxxl + 20,
    paddingBottom: SPACING.xxl,
  },
  logoWrap: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: SPACING.base,
  },
  heroTitle: {
    fontSize: FONTS.sizes.xxxl,
    color: COLORS.white,
    fontWeight: FONTS.weights.bold,
  },
  heroSub: {
    fontSize: FONTS.sizes.base,
    color: 'rgba(255,255,255,0.8)',
    marginTop: SPACING.xs,
  },
  card: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    flex: 1,
    padding: SPACING.xl,
    paddingTop: SPACING.xxl,
  },
  cardTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
  },
  cardSub: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  group: {marginBottom: SPACING.md},
  label: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs,
  },
  inputError: {borderColor: COLORS.error},
  input: {
    flex: 1,
    fontSize: FONTS.sizes.base,
    color: COLORS.text,
    paddingVertical: SPACING.sm + 2,
  },
  errorText: {fontSize: FONTS.sizes.xs, color: COLORS.error, marginTop: 3},
  forgotWrap: {alignSelf: 'flex-end', marginTop: SPACING.sm},
  forgotText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary,
    fontWeight: FONTS.weights.medium,
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.xs,
    marginTop: SPACING.lg,
    backgroundColor: COLORS.primaryLight,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
  },
  hintTitle: {
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.bold,
    color: COLORS.primary,
    marginBottom: 4,
  },
  hintText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.primary,
    lineHeight: 18,
  },
});