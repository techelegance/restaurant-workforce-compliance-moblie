import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const BRAND = {
  primary: '#8B3A0F',
  bg: '#F5F0EB',
  white: '#FFFFFF',
  border: '#D8D3CE',
  borderCard: '#E0DAD4',
  textPrimary: '#1A1A1A',
  textSecondary: '#5A5550',
  textMuted: '#9B9490',
  textPlaceholder: '#B0AAA4',
  inputBg: '#FAFAF9',
  green: '#16A34A',
  greenBg: '#DCFCE7',
  red: '#DC2626',
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface PasswordForm {
  current: string;
  next: string;
  confirm: string;
}

interface PasswordErrors {
  current?: string;
  next?: string;
  confirm?: string;
}

interface Requirement {
  label: string;
  met: (v: string) => boolean;
}

const REQUIREMENTS: Requirement[] = [
  { label: 'อย่างน้อย 8 ตัวอักษร',      met: (v) => v.length >= 8 },
  { label: 'มีตัวพิมพ์ใหญ่ (A–Z)',       met: (v) => /[A-Z]/.test(v) },
  { label: 'มีตัวเลข (0–9)',             met: (v) => /[0-9]/.test(v) },
  { label: 'มีอักขระพิเศษ (!@#$…)',      met: (v) => /[^A-Za-z0-9]/.test(v) },
];

function passwordStrength(v: string): { score: number; label: string; color: string } {
  const score = REQUIREMENTS.filter((r) => r.met(v)).length;
  if (score <= 1) return { score, label: 'อ่อนมาก',   color: BRAND.red };
  if (score === 2) return { score, label: 'พอใช้',      color: '#F97316' };
  if (score === 3) return { score, label: 'ดี',          color: '#EAB308' };
  return             { score, label: 'แข็งแกร่ง', color: BRAND.green };
}

// ---------------------------------------------------------------------------
// PasswordField sub-component
// ---------------------------------------------------------------------------
function PasswordField({
  label,
  value,
  onChange,
  error,
  placeholder,
  returnKeyType = 'next',
  onSubmit,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
  returnKeyType?: 'next' | 'done';
  onSubmit?: () => void;
}) {
  const [show, setShow] = useState(false);
  return (
    <View style={fStyles.wrap}>
      <Text style={fStyles.label}>{label}</Text>
      <View style={[fStyles.inputRow, error ? fStyles.inputError : null]}>
        <Ionicons name="lock-closed-outline" size={18} color={BRAND.textMuted} />
        <TextInput
          style={fStyles.input}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder ?? '••••••••'}
          placeholderTextColor={BRAND.textPlaceholder}
          secureTextEntry={!show}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmit}
        />
        <TouchableOpacity
          onPress={() => setShow((s) => !s)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel={show ? 'Hide password' : 'Show password'}
        >
          <Ionicons
            name={show ? 'eye-off-outline' : 'eye-outline'}
            size={19}
            color={BRAND.textMuted}
          />
        </TouchableOpacity>
      </View>
      {error ? <Text style={fStyles.error}>{error}</Text> : null}
    </View>
  );
}

const fStyles = StyleSheet.create({
  wrap:       { gap: 6, marginBottom: 14 },
  label:      { fontSize: 13, fontWeight: '500', color: '#3A3530' },
  inputRow:   {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: BRAND.border,
    borderRadius: 10, backgroundColor: BRAND.inputBg,
    height: 46, paddingHorizontal: 12, gap: 8,
  },
  inputError: { borderColor: BRAND.red },
  input:      { flex: 1, fontSize: 15, color: BRAND.textPrimary, padding: 0 },
  error:      { fontSize: 12, color: BRAND.red, marginLeft: 2 },
});

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function ChangePasswordScreen() {
  const router = useRouter();

  const [form, setForm]       = useState<PasswordForm>({ current: '', next: '', confirm: '' });
  const [errors, setErrors]   = useState<PasswordErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const strength = passwordStrength(form.next);

  const set = (field: keyof PasswordForm) => (v: string) => {
    setForm((f)   => ({ ...f, [field]: v }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const validate = (): boolean => {
    const e: PasswordErrors = {};
    if (!form.current)                          e.current = 'กรุณากรอกรหัสผ่านปัจจุบัน';
    if (!form.next)                             e.next    = 'กรุณากรอกรหัสผ่านใหม่';
    else if (form.next.length < 8)              e.next    = 'ต้องมีอย่างน้อย 8 ตัวอักษร';
    else if (form.next === form.current)        e.next    = 'รหัสผ่านใหม่ต้องไม่เหมือนเดิม';
    if (!form.confirm)                          e.confirm = 'กรุณายืนยันรหัสผ่าน';
    else if (form.next !== form.confirm)        e.confirm = 'รหัสผ่านไม่ตรงกัน';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      // TODO: POST /api/auth/change-password { currentPassword: form.current, newPassword: form.next }
      await new Promise((r) => setTimeout(r, 1000));
      setSuccess(true);
    } catch {
      Alert.alert('เปลี่ยนรหัสผ่านไม่สำเร็จ', 'รหัสผ่านปัจจุบันไม่ถูกต้อง กรุณาลองอีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  // ---- Success state -------------------------------------------------------
  if (success) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.successBody}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark" size={32} color={BRAND.green} />
          </View>
          <Text style={styles.successTitle}>เปลี่ยนรหัสผ่านสำเร็จ</Text>
          <Text style={styles.successSub}>รหัสผ่านของคุณถูกอัพเดตเรียบร้อยแล้ว</Text>
          <TouchableOpacity style={styles.btnBack} onPress={() => router.back()}>
            <Text style={styles.btnBackText}>กลับหน้า Profile</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ---- Main form -----------------------------------------------------------
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={24} color={BRAND.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Change Password</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <PasswordField
              label="Current Password"
              value={form.current}
              onChange={set('current')}
              error={errors.current}
              placeholder="รหัสผ่านปัจจุบัน"
            />

            <PasswordField
              label="New Password"
              value={form.next}
              onChange={set('next')}
              error={errors.next}
              placeholder="รหัสผ่านใหม่"
            />

            {/* Strength meter */}
            {form.next.length > 0 && (
              <View style={styles.strengthWrap}>
                <View style={styles.strengthBars}>
                  {[1, 2, 3, 4].map((i) => (
                    <View
                      key={i}
                      style={[
                        styles.strengthBar,
                        { backgroundColor: i <= strength.score ? strength.color : '#E5E0DB' },
                      ]}
                    />
                  ))}
                </View>
                <Text style={[styles.strengthLabel, { color: strength.color }]}>
                  {strength.label}
                </Text>
              </View>
            )}

            {/* Requirements checklist */}
            {form.next.length > 0 && (
              <View style={styles.requireList}>
                {REQUIREMENTS.map((r) => {
                  const met = r.met(form.next);
                  return (
                    <View key={r.label} style={styles.requireRow}>
                      <Ionicons
                        name={met ? 'checkmark-circle' : 'ellipse-outline'}
                        size={14}
                        color={met ? BRAND.green : BRAND.textMuted}
                      />
                      <Text style={[styles.requireText, met && { color: BRAND.green }]}>
                        {r.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}

            <PasswordField
              label="Confirm New Password"
              value={form.confirm}
              onChange={set('confirm')}
              error={errors.confirm}
              placeholder="ยืนยันรหัสผ่านใหม่"
              returnKeyType="done"
              onSubmit={handleSubmit}
            />
          </View>

          <TouchableOpacity
            style={[styles.btnSubmit, loading && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Update password"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnSubmitText}>Update Password</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BRAND.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: BRAND.textPrimary, letterSpacing: -0.3 },

  scroll: { paddingHorizontal: 16, paddingBottom: 32, paddingTop: 4 },

  card: {
    backgroundColor: BRAND.white, borderRadius: 14,
    padding: 20, borderWidth: 0.5, borderColor: BRAND.borderCard, marginBottom: 16,
  },

  strengthWrap:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12, marginTop: -4 },
  strengthBars:  { flexDirection: 'row', gap: 4, flex: 1 },
  strengthBar:   { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: { fontSize: 12, fontWeight: '600', minWidth: 60, textAlign: 'right' },

  requireList: { gap: 7, marginBottom: 16 },
  requireRow:  { flexDirection: 'row', alignItems: 'center', gap: 7 },
  requireText: { fontSize: 12.5, color: BRAND.textMuted },

  btnSubmit: {
    backgroundColor: BRAND.primary, borderRadius: 14,
    height: 50, alignItems: 'center', justifyContent: 'center',
  },
  btnSubmitText: { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: -0.2 },
  btnDisabled:   { opacity: 0.5 },

  // Success
  successBody:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 32 },
  successIcon:  {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: BRAND.greenBg, alignItems: 'center', justifyContent: 'center',
  },
  successTitle: { fontSize: 20, fontWeight: '800', color: BRAND.textPrimary, letterSpacing: -0.4 },
  successSub:   { fontSize: 14, color: BRAND.textSecondary, textAlign: 'center' },
  btnBack: {
    marginTop: 8, paddingHorizontal: 28, paddingVertical: 12,
    backgroundColor: BRAND.primary, borderRadius: 12,
  },
  btnBackText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});