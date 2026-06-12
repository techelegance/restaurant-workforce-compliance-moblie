import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface LoginForm {
  email: string;
  password: string;
  rememberMe: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const BRAND = {
  primary: '#8B3A0F',
  primaryDark: '#7A3210',
  primaryLight: '#FBF0EB',
  bg: '#F5F0EB',
  white: '#FFFFFF',
  border: '#D8D3CE',
  borderCard: '#E0DAD4',
  textPrimary: '#1A1A1A',
  textSecondary: '#5A5550',
  textMuted: '#9B9490',
  textPlaceholder: '#B0AAA4',
  inputBg: '#FAFAF9',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function LoginScreen() {
  const router = useRouter();

  const [form, setForm] = useState<LoginForm>({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<LoginForm>>({});

  // ---- Validation ----------------------------------------------------------
  const validate = (): boolean => {
    const newErrors: Partial<LoginForm> = {};

    if (!form.email.trim()) {
      newErrors.email = 'กรุณากรอก Work Email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'รูปแบบ Email ไม่ถูกต้อง';
    }

    if (!form.password) {
      newErrors.password = 'กรุณากรอก Password';
    } else if (form.password.length < 6) {
      newErrors.password = 'Password ต้องมีอย่างน้อย 6 ตัวอักษร';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ---- Handlers ------------------------------------------------------------
  const handleLogin = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      // TODO: Replace with real API call
      // const response = await authApi.login(form.email, form.password);
      await new Promise((resolve) => setTimeout(resolve, 1200)); // mock delay

      // On success, navigate to the main dashboard
      // router.replace('/(tabs)/dashboard');
    } catch (error) {
      Alert.alert('เข้าสู่ระบบไม่สำเร็จ', 'Email หรือ Password ไม่ถูกต้อง กรุณาลองอีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      // TODO: Replace with real demo-token endpoint
      await new Promise((resolve) => setTimeout(resolve, 800));
      // router.replace('/(tabs)/dashboard');
    } catch {
      Alert.alert('Demo Login ล้มเหลว', 'กรุณาลองอีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    // router.push('/forgot-password');
  };

  // ---- Render --------------------------------------------------------------
  return (
    <SafeAreaView style={styles.safe}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <Ionicons name="shield-checkmark" size={20} color={BRAND.primary} />
          <Text style={styles.brandName}>CompliancePro</Text>
        </View>
        <TouchableOpacity 
        // onPress={() => router.push('/support')}
        >
          <Text style={styles.supportLink}>Support</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <View style={styles.hero}>
            <View style={styles.appIcon}>
              <MaterialCommunityIcons name="food-fork-drink" size={32} color="#fff" />
            </View>
            <Text style={styles.heroTitle}>Employee Portal</Text>
            <Text style={styles.heroSub}>Secure access to your compliance dashboard</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            {/* Email */}
            <Text style={styles.fieldLabel}>Work Email</Text>
            <View style={[styles.inputWrap, errors.email ? styles.inputWrapError : null]}>
              <Ionicons name="mail-outline" size={18} color={BRAND.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="name@restaurant.com"
                placeholderTextColor={BRAND.textPlaceholder}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                value={form.email}
                onChangeText={(v) => {
                  setForm((f) => ({ ...f, email: v }));
                  if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
                }}
              />
            </View>
            {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}

            {/* Password */}
            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Password</Text>
            <View style={[styles.inputWrap, errors.password ? styles.inputWrapError : null]}>
              <Ionicons name="lock-closed-outline" size={18} color={BRAND.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { paddingRight: 44 }]}
                placeholder="••••••••"
                placeholderTextColor={BRAND.textPlaceholder}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                value={form.password}
                onChangeText={(v) => {
                  setForm((f) => ({ ...f, password: v }));
                  if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
                }}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword((v) => !v)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={BRAND.textMuted}
                />
              </TouchableOpacity>
            </View>
            {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}

            {/* Remember me / Forgot */}
            <View style={styles.metaRow}>
              <TouchableOpacity
                style={styles.rememberRow}
                onPress={() => setForm((f) => ({ ...f, rememberMe: !f.rememberMe }))}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: form.rememberMe }}
              >
                <View style={[styles.checkbox, form.rememberMe && styles.checkboxChecked]}>
                  {form.rememberMe && <Ionicons name="checkmark" size={12} color="#fff" />}
                </View>
                <Text style={styles.rememberText}>Remember me</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleForgotPassword}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.btnPrimary, loading && styles.btnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Login"
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.btnPrimaryText}>Login</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>QUICK ACCESS</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Demo Login */}
            <TouchableOpacity
              style={[styles.btnDemo, loading && styles.btnDisabled]}
              onPress={handleDemoLogin}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Demo Login"
            >
              <Ionicons name="person-circle-outline" size={18} color={BRAND.primary} />
              <Text style={styles.btnDemoText}>Demo Login</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By logging in, you agree to the{' '}
              <Text style={styles.footerLink} 
              // onPress={() => router.push('/compliance-standards')}
              >
                Compliance Standards
              </Text>{' '}
              and{' '}
              <Text style={styles.footerLink}
              //  onPress={() => router.push('/privacy-policy')}
               >
                Privacy Policy
              </Text>
              .
            </Text>

            <View style={styles.badges}>
              <View style={styles.badge}>
                <Ionicons name="shield-outline" size={13} color={BRAND.textMuted} />
                <Text style={styles.badgeText}>HACCP CERTIFIED</Text>
              </View>
              <View style={styles.badge}>
                <Ionicons name="lock-closed-outline" size={13} color={BRAND.textMuted} />
                <Text style={styles.badgeText}>TLS ENCRYPTED</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: BRAND.bg },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  brandName: { fontSize: 17, fontWeight: '700', color: BRAND.primary, letterSpacing: -0.3 },
  supportLink: { fontSize: 14, fontWeight: '500', color: BRAND.primary },

  scroll: { paddingBottom: 32 },

  hero: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 24, paddingBottom: 20, gap: 10 },
  appIcon: {
    width: 68,
    height: 68,
    backgroundColor: BRAND.primary,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { fontSize: 24, fontWeight: '700', color: BRAND.textPrimary, letterSpacing: -0.4 },
  heroSub: { fontSize: 14, color: BRAND.textSecondary, textAlign: 'center' },

  card: {
    backgroundColor: BRAND.white,
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 22,
    borderWidth: 0.5,
    borderColor: BRAND.borderCard,
  },

  fieldLabel: { fontSize: 13, fontWeight: '500', color: '#3A3530', marginBottom: 7 },

  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 10,
    backgroundColor: BRAND.inputBg,
    height: 46,
    paddingHorizontal: 12,
  },
  inputWrapError: { borderColor: '#E24B4A' },
  inputIcon: { marginRight: 8 },
  input: {
    flex: 1,
    fontSize: 15,
    color: BRAND.textPrimary,
    padding: 0,
  },
  eyeBtn: { position: 'absolute', right: 12 },

  errorText: { fontSize: 12, color: '#E24B4A', marginTop: 4, marginLeft: 2 },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 20,
  },
  rememberRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox: {
    width: 17,
    height: 17,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: BRAND.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: BRAND.primary, borderColor: BRAND.primary },
  rememberText: { fontSize: 13, color: BRAND.textSecondary },
  forgotText: { fontSize: 13, fontWeight: '500', color: BRAND.primary },

  btnPrimary: {
    backgroundColor: BRAND.primary,
    borderRadius: 12,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnPrimaryText: { fontSize: 16, fontWeight: '600', color: '#fff', letterSpacing: -0.1 },
  btnDisabled: { opacity: 0.6 },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 18 },
  dividerLine: { flex: 1, height: 0.5, backgroundColor: BRAND.borderCard },
  dividerText: { fontSize: 10.5, fontWeight: '600', letterSpacing: 0.8, color: BRAND.textMuted },

  btnDemo: {
    borderWidth: 1.5,
    borderColor: BRAND.primary,
    borderRadius: 12,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnDemoText: { fontSize: 15, fontWeight: '600', color: BRAND.primary },

  footer: { paddingHorizontal: 24, paddingTop: 16, alignItems: 'center', gap: 12 },
  footerText: { fontSize: 11.5, color: BRAND.textMuted, textAlign: 'center', lineHeight: 18 },
  footerLink: { color: BRAND.primary },

  badges: { flexDirection: 'row', gap: 20 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  badgeText: { fontSize: 10.5, fontWeight: '600', color: BRAND.textMuted, letterSpacing: 0.4 },
});
