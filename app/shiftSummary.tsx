import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMockAttendance } from '@/lib/mock-attendance';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type ComplianceStatus = 'compliant' | 'missing_break' | 'overtime' | 'early_out';

export interface ShiftSummaryParams {
  employeeName: string;
  clockInTime: string;   // ISO string
  clockOutTime: string;  // ISO string
  totalBreakSeconds: number;
  unpaidBreakSeconds: number;
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
  greenLight: '#F0FDF4',
  amber: '#B45309',
  amberBg: '#FEF3C7',
  red: '#DC2626',
  redBg: '#FEE2E2',
};

const REQUIRED_BREAK_SECONDS = 1800; // 30 min required break
const OVERTIME_THRESHOLD = 28800;    // 8h = overtime

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function parseTime(iso: string): Date {
  return new Date(iso);
}

function formatClock(date: Date): string {
  const h = date.getHours();
  const m = date.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = (h % 12 || 12).toString().padStart(2, '0');
  return `${h12}:${m} ${ampm}`;
}

function formatClockHHMM(date: Date): string {
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

function formatAmPm(date: Date): string {
  return date.getHours() >= 12 ? 'PM' : 'AM';
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`;
  return `${m}m`;
}

function formatDurationShort(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

function getCompliance(workedSeconds: number, breakSeconds: number): ComplianceStatus {
  if (workedSeconds >= OVERTIME_THRESHOLD) return 'overtime';
  if (workedSeconds >= 21600 /* 6h */ && breakSeconds < REQUIRED_BREAK_SECONDS) return 'missing_break';
  return 'compliant';
}

function getComplianceConfig(status: ComplianceStatus) {
  switch (status) {
    case 'compliant':
      return { label: 'COMPLIANT', bg: BRAND.greenBg, text: BRAND.green, icon: 'checkmark-circle' as const };
    case 'missing_break':
      return { label: 'MISSING BREAK', bg: BRAND.amberBg, text: BRAND.amber, icon: 'warning' as const };
    case 'overtime':
      return { label: 'OVERTIME', bg: BRAND.amberBg, text: BRAND.amber, icon: 'time' as const };
    case 'early_out':
      return { label: 'EARLY OUT', bg: BRAND.redBg, text: BRAND.red, icon: 'close-circle' as const };
  }
}

// ---------------------------------------------------------------------------
// Mock data — replace with real route params or navigation state
// ---------------------------------------------------------------------------
const MOCK: ShiftSummaryParams = {
  employeeName: 'John',
  clockInTime: new Date(new Date().setHours(8, 47, 0, 0)).toISOString(),
  clockOutTime: new Date(new Date().setHours(17, 2, 0, 0)).toISOString(),
  totalBreakSeconds: 2700,  // 45 min
  unpaidBreakSeconds: 1800, // 30 min
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function ShiftSummaryScreen() {
  const router = useRouter();
  const attendance = useMockAttendance();

  const params = attendance.lastShift ?? MOCK;

  const clockIn = useMemo(() => parseTime(params.clockInTime), [params.clockInTime]);
  const clockOut = useMemo(() => parseTime(params.clockOutTime), [params.clockOutTime]);

  const workedSeconds = useMemo(() => {
    const gross = Math.floor((clockOut.getTime() - clockIn.getTime()) / 1000);
    return Math.max(0, gross - params.unpaidBreakSeconds);
  }, [clockIn, clockOut, params.unpaidBreakSeconds]);

  const complianceStatus = useMemo(
    () => getCompliance(workedSeconds, params.totalBreakSeconds),
    [workedSeconds, params.totalBreakSeconds],
  );
  const complianceConfig = getComplianceConfig(complianceStatus);

  const handleShare = async () => {
    try {
      await Share.share({
        message:
          `Shift Summary — ${params.employeeName}\n` +
          `Clock In: ${formatClock(clockIn)}\n` +
          `Clock Out: ${formatClock(clockOut)}\n` +
          `Total Worked: ${formatDuration(workedSeconds)}\n` +
          `Break: ${formatDuration(params.totalBreakSeconds)}\n` +
          `Status: ${complianceConfig.label}`,
      });
    } catch {
      // user cancelled
    }
  };

  const handleClose = () => {
    router.replace('/(tabs)');
  };

  // ---- Render --------------------------------------------------------------
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Text style={styles.brandName}>CompliancePro</Text>
        <TouchableOpacity
          style={styles.avatarCircle}
          onPress={() => router.push('/(tabs)/profile')}
          accessibilityLabel="Profile"
        >
          <Text style={styles.avatarText}>
            {params.employeeName.slice(0, 2).toUpperCase()}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Hero */}
        <View style={styles.heroCard}>
          <View style={styles.heroIconWrap}>
            <View style={styles.heroIconInner}>
              <Ionicons name="checkmark" size={28} color={BRAND.green} />
            </View>
          </View>
          <Text style={styles.heroTitle}>Shift Completed</Text>
          <Text style={styles.heroSub}>
            Great work today, {params.employeeName}. See you tomorrow!
          </Text>

          {/* Clock Out time block */}
          <View style={styles.clockOutBlock}>
            <Text style={styles.clockOutLabel}>CLOCK OUT TIME</Text>
            <View style={styles.clockOutRow}>
              <Text style={styles.clockOutTime}>{formatClockHHMM(clockOut)}</Text>
              <View style={styles.ampmBadge}>
                <Text style={styles.ampmText}>{formatAmPm(clockOut)}</Text>
              </View>
            </View>
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={styles.statHeader}>
                <MaterialCommunityIcons name="clock-outline" size={16} color={BRAND.orange} />
                <Text style={styles.statLabel}>Total Worked</Text>
              </View>
              <Text style={styles.statValue}>{formatDuration(workedSeconds)}</Text>
            </View>

            <View style={[styles.statCard, { borderLeftWidth: 0.5, borderLeftColor: BRAND.border }]}>
              <View style={styles.statHeader}>
                <Ionicons name="checkmark-circle" size={16} color={complianceConfig.text} />
                <Text style={styles.statLabel}>Status</Text>
              </View>
              <View style={[styles.complianceBadge, { backgroundColor: complianceConfig.bg }]}>
                <Text style={[styles.complianceBadgeText, { color: complianceConfig.text }]}>
                  {complianceConfig.label}
                </Text>
              </View>
            </View>
          </View>

          {/* Compliance warning detail */}
          {complianceStatus !== 'compliant' && (
            <View style={[styles.warningBanner, { backgroundColor: complianceConfig.bg }]}>
              <Ionicons name={complianceConfig.icon} size={15} color={complianceConfig.text} />
              <Text style={[styles.warningBannerText, { color: complianceConfig.text }]}>
                {complianceStatus === 'missing_break'
                  ? `พักน้อยกว่า 30 นาที — ตรวจสอบกับ Manager`
                  : complianceStatus === 'overtime'
                  ? `ทำงานเกิน 8 ชั่วโมง — OT ต้องได้รับการอนุมัติ`
                  : `เลิกงานก่อนกำหนด`}
              </Text>
            </View>
          )}

          {/* Detail rows */}
          <View style={styles.detailSection}>
            <DetailRow label="Clock In Time" value={formatClock(clockIn)} />
            <DetailRow
              label="Total Break Time"
              value={formatDurationShort(params.totalBreakSeconds)}
            />
            <DetailRow
              label="Unpaid Breaks"
              value={formatDurationShort(params.unpaidBreakSeconds)}
              valueColor={params.unpaidBreakSeconds < REQUIRED_BREAK_SECONDS ? BRAND.amber : BRAND.textPrimary}
            />
          </View>
        </View>

        {/* Share row */}
        <TouchableOpacity style={styles.shareRow} onPress={handleShare}>
          <Ionicons name="share-outline" size={16} color={BRAND.textMuted} />
          <Text style={styles.shareText}>Share summary</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Close Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.btnClose}
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel="Close summary"
        >
          <Ionicons name="close" size={18} color="#fff" />
          <Text style={styles.btnCloseText}>Close Summary</Text>
        </TouchableOpacity>
        <Text style={styles.emailNote}>
          A copy of this summary has been sent to your registered email.
        </Text>
      </View>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Sub-component
// ---------------------------------------------------------------------------
function DetailRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, valueColor ? { color: valueColor } : null]}>
        {value}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BRAND.bg },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  brandName: { fontSize: 17, fontWeight: '700', color: BRAND.primary, letterSpacing: -0.3 },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4B5563',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  scroll: { paddingHorizontal: 16, paddingBottom: 16, gap: 10 },

  // Hero card
  heroCard: {
    backgroundColor: BRAND.white,
    borderRadius: 16,
    padding: 22,
    borderWidth: 0.5,
    borderColor: BRAND.border,
    alignItems: 'center',
    gap: 0,
  },
  heroIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: BRAND.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  heroIconInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BRAND.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: BRAND.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  heroSub: {
    fontSize: 14,
    color: BRAND.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },

  // Clock out block
  clockOutBlock: {
    width: '100%',
    backgroundColor: BRAND.bg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  clockOutLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: BRAND.textMuted,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  clockOutRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  clockOutTime: {
    fontSize: 40,
    fontWeight: '800',
    color: BRAND.textPrimary,
    letterSpacing: -1.5,
    fontVariant: ['tabular-nums'],
  },
  ampmBadge: {
    backgroundColor: '#FFE4D6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 6,
  },
  ampmText: { fontSize: 13, fontWeight: '700', color: BRAND.primary },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    borderWidth: 0.5,
    borderColor: BRAND.border,
    borderRadius: 12,
    marginBottom: 14,
    overflow: 'hidden',
  },
  statCard: { flex: 1, padding: 14, gap: 6 },
  statHeader: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statLabel: { fontSize: 12, color: BRAND.textSecondary, fontWeight: '500' },
  statValue: { fontSize: 20, fontWeight: '800', color: BRAND.textPrimary, letterSpacing: -0.5 },
  complianceBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  complianceBadgeText: { fontSize: 11.5, fontWeight: '700', letterSpacing: 0.4 },

  // Warning banner
  warningBanner: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
  },
  warningBannerText: { fontSize: 13, fontWeight: '500', flex: 1 },

  // Detail rows
  detailSection: {
    width: '100%',
    gap: 0,
    borderTopWidth: 0.5,
    borderTopColor: BRAND.border,
    paddingTop: 14,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: BRAND.border,
  },
  detailLabel: { fontSize: 14, color: BRAND.textSecondary },
  detailValue: { fontSize: 14, fontWeight: '600', color: BRAND.textPrimary },

  // Share
  shareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  shareText: { fontSize: 13, color: BRAND.textMuted },

  // Footer
  footer: { paddingHorizontal: 16, paddingBottom: 8, paddingTop: 10, gap: 10, alignItems: 'center' },
  btnClose: {
    width: '100%',
    height: 50,
    backgroundColor: BRAND.primary,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnCloseText: { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: -0.2 },
  emailNote: {
    fontSize: 12,
    color: BRAND.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 17,
  },
});
