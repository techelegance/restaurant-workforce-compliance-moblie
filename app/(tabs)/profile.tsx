import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface EmployeeProfile {
  firstName: string;
  lastName: string;
  role: string;
  branch: string;
  employeeId: string;
  email: string;
  phone: string;
  startDate: string;
  avatarInitials: string;
  avatarColor: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const BRAND = {
  primary: '#8B3A0F',
  orange: '#F47C20',
  bg: '#F5F0EB',
  white: '#FFFFFF',
  border: '#E0DAD4',
  textPrimary: '#1A1A1A',
  textSecondary: '#5A5550',
  textMuted: '#9B9490',
  green: '#16A34A',
  greenBg: '#DCFCE7',
  red: '#DC2626',
  redBg: '#FEE2E2',
};

// ---------------------------------------------------------------------------
// Mock — replace with auth context / API
// ---------------------------------------------------------------------------
const MOCK_PROFILE: EmployeeProfile = {
  firstName: 'John',
  lastName: 'Doe',
  role: 'Kitchen Staff',
  branch: 'Store #402 – Central Branch',
  employeeId: 'EMP-20481',
  email: 'john.doe@restaurant.com',
  phone: '081-234-5678',
  startDate: '12 Jan 2023',
  avatarInitials: 'JD',
  avatarColor: '#4B5563',
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrap}>{icon}</View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function MenuRow({
  icon,
  label,
  onPress,
  danger,
  rightElement,
}: {
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
  danger?: boolean;
  rightElement?: React.ReactNode;
}) {
  return (
    <TouchableOpacity
      style={styles.menuRow}
      onPress={onPress}
      activeOpacity={onPress ? 0.6 : 1}
      accessibilityRole={onPress ? 'button' : 'none'}
    >
      <View style={styles.menuLeft}>
        {icon}
        <Text style={[styles.menuLabel, danger && { color: BRAND.red }]}>{label}</Text>
      </View>
      {rightElement ?? (
        onPress && <Ionicons name="chevron-forward" size={16} color={BRAND.textMuted} />
      )}
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function ProfileScreen() {
  const router = useRouter();
  const profile = MOCK_PROFILE;

  const [notifEnabled, setNotifEnabled] = useState(true);

  const handleLogout = () => {
    Alert.alert(
      'ออกจากระบบ',
      'คุณแน่ใจหรือไม่ว่าต้องการออกจากระบบ?',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ออกจากระบบ',
          style: 'destructive',
          onPress: async () => {
            // TODO: clear auth token / session
            // await authStore.logout();
            router.replace('/login');
          },
        },
      ],
    );
  };

  const handleChangePassword = () => {
    router.push('/change-password');
  };

  const handleSupport = () => {
    router.push('/support');
  };

  const handlePrivacy = () => {
    router.push('/privacy-policy');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Avatar + Name Hero */}
        <View style={styles.heroCard}>
          <View style={[styles.avatar, { backgroundColor: profile.avatarColor }]}>
            <Text style={styles.avatarText}>{profile.avatarInitials}</Text>
          </View>
          <Text style={styles.heroName}>{profile.firstName} {profile.lastName}</Text>
          <View style={styles.roleBadge}>
            <MaterialCommunityIcons name="briefcase-outline" size={13} color={BRAND.primary} />
            <Text style={styles.roleBadgeText}>{profile.role}</Text>
          </View>
          <View style={styles.branchBadge}>
            <Ionicons name="location-outline" size={13} color={BRAND.textMuted} />
            <Text style={styles.branchBadgeText}>{profile.branch}</Text>
          </View>
        </View>

        {/* Employee Info */}
        <SectionHeader title="EMPLOYEE INFO" />
        <View style={styles.card}>
          <InfoRow
            icon={<Ionicons name="card-outline" size={18} color={BRAND.primary} />}
            label="Employee ID"
            value={profile.employeeId}
          />
          <View style={styles.rowDivider} />
          <InfoRow
            icon={<Ionicons name="mail-outline" size={18} color={BRAND.primary} />}
            label="Email"
            value={profile.email}
          />
          <View style={styles.rowDivider} />
          <InfoRow
            icon={<Ionicons name="call-outline" size={18} color={BRAND.primary} />}
            label="Phone"
            value={profile.phone}
          />
          <View style={styles.rowDivider} />
          <InfoRow
            icon={<Ionicons name="calendar-outline" size={18} color={BRAND.primary} />}
            label="Start Date"
            value={profile.startDate}
          />
        </View>

        {/* Preferences */}
        <SectionHeader title="PREFERENCES" />
        <View style={styles.card}>
          <MenuRow
            icon={<Ionicons name="notifications-outline" size={18} color={BRAND.primary} />}
            label="Push Notifications"
            rightElement={
              <Switch
                value={notifEnabled}
                onValueChange={setNotifEnabled}
                trackColor={{ false: BRAND.border, true: BRAND.primary }}
                thumbColor="#fff"
              />
            }
          />
        </View>

        {/* Account */}
        <SectionHeader title="ACCOUNT" />
        <View style={styles.card}>
          <MenuRow
            icon={<Ionicons name="lock-closed-outline" size={18} color={BRAND.primary} />}
            label="Change Password"
            onPress={handleChangePassword}
          />
          <View style={styles.rowDivider} />
          <MenuRow
            icon={<Ionicons name="headset-outline" size={18} color={BRAND.primary} />}
            label="Contact Support"
            onPress={handleSupport}
          />
          <View style={styles.rowDivider} />
          <MenuRow
            icon={<Ionicons name="shield-outline" size={18} color={BRAND.primary} />}
            label="Privacy Policy"
            onPress={handlePrivacy}
          />
        </View>

        {/* Logout */}
        <View style={[styles.card, styles.logoutCard]}>
          <MenuRow
            icon={<Ionicons name="log-out-outline" size={18} color={BRAND.red} />}
            label="Log Out"
            onPress={handleLogout}
            danger
          />
        </View>

        {/* App version */}
        <Text style={styles.version}>CompliancePro v1.0.0 · HACCP Certified</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BRAND.bg },

  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: BRAND.textPrimary, letterSpacing: -0.4 },

  scroll: { paddingBottom: 40 },

  // Hero
  heroCard: {
    backgroundColor: BRAND.white,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 18,
    padding: 22,
    borderWidth: 0.5,
    borderColor: BRAND.border,
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarText: { fontSize: 24, fontWeight: '700', color: '#fff' },
  heroName: { fontSize: 20, fontWeight: '800', color: BRAND.textPrimary, letterSpacing: -0.4 },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FBF0EB',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  roleBadgeText: { fontSize: 13, fontWeight: '600', color: BRAND.primary },
  branchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  branchBadgeText: { fontSize: 12.5, color: BRAND.textMuted },

  // Section
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: BRAND.textMuted,
    letterSpacing: 1,
    paddingHorizontal: 22,
    marginBottom: 6,
  },
  card: {
    backgroundColor: BRAND.white,
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 14,
    borderWidth: 0.5,
    borderColor: BRAND.border,
    overflow: 'hidden',
  },
  logoutCard: { marginBottom: 6 },
  rowDivider: { height: 0.5, backgroundColor: BRAND.border, marginLeft: 50 },

  // Info rows
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
  },
  infoIconWrap: { width: 24, alignItems: 'center' },
  infoContent: { flex: 1, gap: 1 },
  infoLabel: { fontSize: 11, color: BRAND.textMuted, fontWeight: '500' },
  infoValue: { fontSize: 14, color: BRAND.textPrimary, fontWeight: '500' },

  // Menu rows
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuLabel: { fontSize: 15, color: BRAND.textPrimary, fontWeight: '500' },

  version: {
    fontSize: 11.5,
    color: BRAND.textMuted,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
});
