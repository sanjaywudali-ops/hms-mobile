// src/components/common/index.tsx
// ─── All shared UI primitives in one file ────────────────────────────────────

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {COLORS, FONTS, SPACING, RADIUS, SHADOW} from '../../constants/theme';

// ─── ScreenHeader ────────────────────────────────────────────────────────────
interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: {icon: string; onPress: () => void};
  navigation?: any;
}
export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title, subtitle, onBack, rightAction, navigation,
}) => (
  <View style={headerStyles.container}>
    <TouchableOpacity
      onPress={onBack || (() => navigation?.goBack())}
      style={headerStyles.backBtn}
      hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
      <Icon name="arrow-left" size={22} color={COLORS.text} />
    </TouchableOpacity>
    <View style={{flex: 1}}>
      <Text style={headerStyles.title}>{title}</Text>
      {subtitle ? <Text style={headerStyles.subtitle}>{subtitle}</Text> : null}
    </View>
    {rightAction && (
      <TouchableOpacity onPress={rightAction.onPress} style={headerStyles.rightBtn}>
        <Icon name={rightAction.icon} size={22} color={COLORS.primary} />
      </TouchableOpacity>
    )}
  </View>
);
const headerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.base,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  backBtn: {padding: SPACING.xs},
  title: {fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: COLORS.text},
  subtitle: {fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginTop: 1},
  rightBtn: {padding: SPACING.xs},
});

// ─── Card ────────────────────────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}
export const Card: React.FC<CardProps> = ({children, style, onPress}) => {
  if (onPress) {
    return (
      <TouchableOpacity style={[cardStyles.card, style]} onPress={onPress} activeOpacity={0.75}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={[cardStyles.card, style]}>{children}</View>;
};
const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    ...SHADOW.md,
    marginBottom: SPACING.md,
  },
});

// ─── Badge ───────────────────────────────────────────────────────────────────
type BadgeVariant = 'admitted' | 'planned' | 'discharged' | 'cancelled' | 'completed' | 'inProgress' | 'default';
interface BadgeProps {label: string; variant?: BadgeVariant}
const BADGE_COLORS: Record<BadgeVariant, {bg: string; text: string}> = {
  admitted:   {bg: COLORS.admitted,   text: COLORS.admittedText},
  planned:    {bg: COLORS.planned,    text: COLORS.plannedText},
  discharged: {bg: COLORS.discharged, text: COLORS.dischargedText},
  cancelled:  {bg: COLORS.cancelled,  text: COLORS.cancelledText},
  completed:  {bg: COLORS.completed,  text: COLORS.completedText},
  inProgress: {bg: COLORS.inProgress, text: COLORS.inProgressText},
  default:    {bg: COLORS.borderLight, text: COLORS.textSecondary},
};
export const Badge: React.FC<BadgeProps> = ({label, variant = 'default'}) => {
  const colors = BADGE_COLORS[variant] || BADGE_COLORS.default;
  return (
    <View style={[badgeStyles.badge, {backgroundColor: colors.bg}]}>
      <Text style={[badgeStyles.text, {color: colors.text}]}>{label}</Text>
    </View>
  );
};
const badgeStyles = StyleSheet.create({
  badge: {paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: RADIUS.full},
  text: {fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.semibold},
});

// ─── Button ──────────────────────────────────────────────────────────────────
interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'ghost' | 'destructive';
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  style?: ViewStyle;
  fullWidth?: boolean;
}
export const Button: React.FC<ButtonProps> = ({
  label, onPress, variant = 'primary', loading, disabled, icon, style, fullWidth,
}) => {
  const isDisabled = disabled || loading;
  const btnStyle = [
    btnStyles.base,
    variant === 'primary' && btnStyles.primary,
    variant === 'outline' && btnStyles.outline,
    variant === 'ghost' && btnStyles.ghost,
    variant === 'destructive' && btnStyles.destructive,
    isDisabled && btnStyles.disabled,
    fullWidth && {width: '100%' as any},
    style,
  ];
  const textColor =
    variant === 'primary' ? COLORS.white :
    variant === 'destructive' ? COLORS.white :
    variant === 'outline' ? COLORS.primary : COLORS.textSecondary;
  return (
    <TouchableOpacity style={btnStyle} onPress={onPress} disabled={isDisabled} activeOpacity={0.8}>
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <View style={{flexDirection: 'row', alignItems: 'center', gap: SPACING.xs}}>
          {icon && <Icon name={icon} size={16} color={textColor} />}
          <Text style={[btnStyles.text, {color: textColor}]}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};
const btnStyles = StyleSheet.create({
  base: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md - 2,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primary: {backgroundColor: COLORS.primary},
  outline: {backgroundColor: 'transparent', borderWidth: 1.5, borderColor: COLORS.primary},
  ghost: {backgroundColor: 'transparent'},
  destructive: {backgroundColor: COLORS.error},
  disabled: {opacity: 0.5},
  text: {fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.semibold},
});

// ─── SearchBar ───────────────────────────────────────────────────────────────
interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: ViewStyle;
}
export const SearchBar: React.FC<SearchBarProps> = ({value, onChangeText, placeholder, style}) => (
  <View style={[searchStyles.container, style]}>
    <Icon name="magnify" size={20} color={COLORS.textMuted} />
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder || 'Search...'}
      placeholderTextColor={COLORS.textMuted}
      style={searchStyles.input}
    />
    {value.length > 0 && (
      <TouchableOpacity onPress={() => onChangeText('')}>
        <Icon name="close-circle" size={18} color={COLORS.textMuted} />
      </TouchableOpacity>
    )}
  </View>
);
const searchStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    gap: SPACING.sm,
  },
  input: {flex: 1, fontSize: FONTS.sizes.base, color: COLORS.text, padding: 0},
});

// ─── FormInput ───────────────────────────────────────────────────────────────
interface FormInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  multiline?: boolean;
  numberOfLines?: number;
  required?: boolean;
  icon?: string;
}
export const FormInput: React.FC<FormInputProps> = ({
  label, value, onChangeText, placeholder, error, secureTextEntry,
  keyboardType, multiline, numberOfLines, required, icon,
}) => (
  <View style={formStyles.group}>
    <Text style={formStyles.label}>
      {label}{required && <Text style={{color: COLORS.error}}> *</Text>}
    </Text>
    <View style={[formStyles.inputWrap, error ? formStyles.inputError : null]}>
      {icon && <Icon name={icon} size={18} color={COLORS.textMuted} style={{marginRight: SPACING.xs}} />}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={numberOfLines}
        style={[formStyles.input, multiline && {height: (numberOfLines || 3) * 22, textAlignVertical: 'top'}]}
      />
    </View>
    {error && <Text style={formStyles.error}>{error}</Text>}
  </View>
);
const formStyles = StyleSheet.create({
  group: {marginBottom: SPACING.md},
  label: {fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.semibold, color: COLORS.text, marginBottom: SPACING.xs},
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
  },
  input: {flex: 1, fontSize: FONTS.sizes.base, color: COLORS.text, paddingVertical: SPACING.sm + 2},
  inputError: {borderColor: COLORS.error},
  error: {fontSize: FONTS.sizes.xs, color: COLORS.error, marginTop: 3},
});

// ─── EmptyState ──────────────────────────────────────────────────────────────
interface EmptyStateProps {icon?: string; title: string; subtitle?: string; action?: {label: string; onPress: () => void}}
export const EmptyState: React.FC<EmptyStateProps> = ({icon, title, subtitle, action}) => (
  <View style={emptyStyles.container}>
    {icon && <Icon name={icon} size={52} color={COLORS.textMuted} style={{marginBottom: SPACING.md}} />}
    <Text style={emptyStyles.title}>{title}</Text>
    {subtitle && <Text style={emptyStyles.subtitle}>{subtitle}</Text>}
    {action && (
      <Button label={action.label} onPress={action.onPress} style={{marginTop: SPACING.base}} />
    )}
  </View>
);
const emptyStyles = StyleSheet.create({
  container: {flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xxl},
  title: {fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.semibold, color: COLORS.text, textAlign: 'center'},
  subtitle: {fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.xs},
});

// ─── LoadingScreen ───────────────────────────────────────────────────────────
export const LoadingScreen: React.FC<{message?: string}> = ({message}) => (
  <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background}}>
    <ActivityIndicator size="large" color={COLORS.primary} />
    {message && <Text style={{marginTop: SPACING.md, color: COLORS.textSecondary, fontSize: FONTS.sizes.sm}}>{message}</Text>}
  </View>
);

// ─── SectionHeader ───────────────────────────────────────────────────────────
export const SectionHeader: React.FC<{title: string; action?: {label: string; onPress: () => void}}> = ({title, action}) => (
  <View style={sectionStyles.row}>
    <Text style={sectionStyles.title}>{title}</Text>
    {action && (
      <TouchableOpacity onPress={action.onPress}>
        <Text style={sectionStyles.action}>{action.label}</Text>
      </TouchableOpacity>
    )}
  </View>
);
const sectionStyles = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.md},
  title: {fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: COLORS.text},
  action: {fontSize: FONTS.sizes.sm, color: COLORS.primary, fontWeight: FONTS.weights.medium},
});

// ─── InfoRow ─────────────────────────────────────────────────────────────────
export const InfoRow: React.FC<{label: string; value: string; icon?: string}> = ({label, value, icon}) => (
  <View style={infoStyles.row}>
    <View style={infoStyles.labelWrap}>
      {icon && <Icon name={icon} size={14} color={COLORS.textMuted} style={{marginRight: 4}} />}
      <Text style={infoStyles.label}>{label}</Text>
    </View>
    <Text style={infoStyles.value}>{value || '—'}</Text>
  </View>
);
const infoStyles = StyleSheet.create({
  row: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: SPACING.xs},
  labelWrap: {flexDirection: 'row', alignItems: 'center'},
  label: {fontSize: FONTS.sizes.sm, color: COLORS.textSecondary},
  value: {fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.medium, color: COLORS.text, maxWidth: '60%', textAlign: 'right'},
});

// ─── StatCard ────────────────────────────────────────────────────────────────
interface StatCardProps {label: string; value: string | number; iconName: string; color: string; bgColor: string}
export const StatCard: React.FC<StatCardProps> = ({label, value, iconName, color, bgColor}) => (
  <View style={[statStyles.card, {borderLeftColor: color}]}>
    <View style={[statStyles.iconWrap, {backgroundColor: bgColor}]}>
      <Icon name={iconName} size={20} color={color} />
    </View>
    <Text style={[statStyles.value, {color}]}>{value}</Text>
    <Text style={statStyles.label}>{label}</Text>
  </View>
);
const statStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderLeftWidth: 3,
    ...SHADOW.sm,
    flex: 1,
    minWidth: 140,
    margin: SPACING.xs,
  },
  iconWrap: {width: 36, height: 36, borderRadius: RADIUS.sm, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.xs},
  value: {fontSize: FONTS.sizes.xxl, fontWeight: FONTS.weights.bold},
  label: {fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginTop: 2},
});
