import React from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {COLORS, FONTS, SPACING, RADIUS} from '../../constants/theme';
import {FormInput, Button} from '../../components/common';

export default function ForgotPasswordScreen({navigation}: any) {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={{padding: SPACING.xl}}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Icon name="arrow-left" size={22} color={COLORS.text} />
      </TouchableOpacity>

      <View style={styles.hero}>
        <View style={styles.iconWrap}>
          <Icon name="lock-reset" size={40} color={COLORS.primary} />
        </View>
        <Text style={styles.title}>Forgot Password?</Text>
        <Text style={styles.subtitle}>
          Please contact your system administrator to reset your password.
        </Text>
      </View>

      <View style={styles.infoBox}>
        <Icon name="information-outline" size={20} color={COLORS.primary} />
        <Text style={styles.infoText}>
          For security reasons, password resets are handled by your hospital administrator.
          Please reach out to your IT department or admin team.
        </Text>
      </View>

      <Button label="Back to Login" onPress={() => navigation.goBack()} style={{marginTop: SPACING.xl}} fullWidth />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: COLORS.background},
  backBtn: {padding: SPACING.xs, marginBottom: SPACING.xl, alignSelf: 'flex-start'},
  hero: {alignItems: 'center', marginBottom: SPACING.xl},
  iconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: SPACING.base,
  },
  title: {fontSize: FONTS.sizes.xl, fontWeight: FONTS.weights.bold, color: COLORS.text, textAlign: 'center'},
  subtitle: {fontSize: FONTS.sizes.base, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.sm, lineHeight: 22},
  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm,
    backgroundColor: COLORS.primaryLight, padding: SPACING.base,
    borderRadius: RADIUS.md, borderLeftWidth: 3, borderLeftColor: COLORS.primary,
  },
  infoText: {flex: 1, fontSize: FONTS.sizes.sm, color: COLORS.primary, lineHeight: 20},
});
