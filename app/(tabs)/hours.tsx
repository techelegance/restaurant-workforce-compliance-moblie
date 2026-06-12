import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type ComplianceStatus = 'compliant' | 'missing_break' | 'overtime' | 'day_off';

interface DayRecord {
  date: string;        // 'YYYY-MM-DD'
  dayLabel: string;    // 'Mon', 'Tue', ...
  clockIn: string;     // 'HH:MM AM'
  clockOut: string;    // 'HH:MM PM'
  workedSeconds: number;
  breakSeconds: number;
  overtimeSeconds: number;
  status: ComplianceStatus;
}

interface WeekSummary {
  label: string;       // 'This Week' | 'Last Week' | ...
  startDate: string;
  endDate: string;
  totalWorked: number; // seconds
  totalOvertime: number;
  days: DayRecord[];
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
  amber: '#B45309',
  amberBg: '#FEF3C7',
  red: '#DC2626',
  redBg: '#FEE2E2',
  blueBg: '#DBEAFE',
  blue: '#1D4ED8',
};

const OVERTIME_THRESHOLD = 28800; // 8h in seconds
const WEEK_LIMIT = 144000;        // 40h in seconds

// ---------------------------------------------------------------------------
// Mock data — replace with API call
// ---------------------------------------------------------------------------
function makeMockWeeks(): WeekSummary[] {
  const now = new Date();
  const weeks: WeekSummary[] = [];

  for (let w = 0; w < 3; w++) {
    const days: DayRecord[] = [];
    let totalWorked = 0;
    let totalOvertime = 0;

    for (let d = 0; d < 7; d++) {
      const date = new Date(now);
      date.setDate(now.getDate() - now.getDay() - w * 7 + d);
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

      // Weekends off
      if (d === 0 || d === 6) {
        days.push({
          date: date.toISOString().slice(0, 10),
          dayLabel: dayNames[d],
          clockIn: '-',
          clockOut: '-',
          workedSeconds: 0,
          breakSeconds: 0,
          overtimeSeconds: 0,
          status: 'day_off',
        });
        continue;
      }

      // Simulate varied data
      const scenarios: Array<[number, number, ComplianceStatus]> = [
        [29700, 2700, 'compliant'],   // 8h 15m
        [30600, 1800, 'missing_break'], // 8h 30m, short break
        [32400, 2700, 'overtime'],    // 9h
        [28800, 2700, 'compliant'],   // 8h exact
        [27000, 2700, 'compliant'],   // 7h 30m
      ];
      const [worked, brk, status] = scenarios[(w * 5 + d) % scenarios.length];
      const ot = Math.max(0, worked - OVERTIME_THRESHOLD);

      totalWorked += worked;
      totalOvertime += ot;

      const inH = 8 + Math.floor(Math.random() * 1);
      const inM = Math.floor(Math.random() * 30);
      const outH = inH + Math.floor(worked / 3600);
      const outM = inM + Math.floor((worked % 3600) / 60);

      days.push({
        date: date.toISOString().slice(0, 10),
        dayLabel: dayNames[d],
        clockIn: `${inH.toString().padStart(2, '0')}:${inM.toString().padStart(2, '0')} AM`,
        clockOut: `${(outH % 24).toString().padStart(2, '0')}:${(outM % 60).toString().padStart(2, '0')} PM`,
        workedSeconds: worked,
        breakSeconds: brk,
        overtimeSeconds: ot,
        status,
      });
    }

    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() - w * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const fmt = (d: Date) =>
      `${d.getDate()} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]}`;

    weeks.push({
      label: w === 0 ? 'This Week' : w === 1 ? 'Last Week' : `${fmt(weekStart)} – ${fmt(weekEnd)}`,
      startDate: weekStart.toISOString().slice(0, 10),
      endDate: weekEnd.toISOString().slice(0, 10),
      totalWorked,
      totalOvertime,
      days,
    });
  }

  return weeks;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function fmtDuration(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m.toString().padStart(2, '0')}m`;
  if (h > 0) return `${h}h 00m`;
  return `${m}m`;
}

function fmtHoursDecimal(s: number): string {
  return (s / 3600).toFixed(1) + 'h';
}

function progressPercent(worked: number, limit: number): number {
  return Math.min(100, Math.round((worked / limit) * 100));
}

function statusConfig(s: ComplianceStatus) {
  switch (s) {
    case 'compliant':    return { color: BRAND.green,   bg: BRAND.greenBg, label: 'OK' };
    case 'missing_break':return { color: BRAND.amber,   bg: BRAND.amberBg, label: 'Break' };
    case 'overtime':     return { color: BRAND.orange,  bg: '#FEF3C7',     label: 'OT' };
    case 'day_off':      return { color: BRAND.textMuted, bg: '#F1EFE8',   label: 'Off' };
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function HoursScreen() {
  const weeks = useMemo(() => makeMockWeeks(), []);
  const [selectedWeek, setSelectedWeek] = useState(0);
  const week = weeks[selectedWeek];

  const pct = progressPercent(week.totalWorked, WEEK_LIMIT);
  const progressColor = pct >= 100 ? BRAND.red : pct >= 85 ? BRAND.amber : BRAND.green;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Hours</Text>
        <TouchableOpacity
          style={styles.exportBtn}
          accessibilityLabel="Export hours"
        >
          <Ionicons name="download-outline" size={18} color={BRAND.primary} />
          <Text style={styles.exportText}>Export</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Week Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.weekTabsWrap}
        >
          {weeks.map((w, i) => (
            <TouchableOpacity
              key={w.startDate}
              style={[styles.weekTab, i === selectedWeek && styles.weekTabActive]}
              onPress={() => setSelectedWeek(i)}
            >
              <Text style={[styles.weekTabText, i === selectedWeek && styles.weekTabTextActive]}>
                {w.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Weekly Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <View style={styles.summaryBlock}>
              <Text style={styles.summaryLabel}>Total Worked</Text>
              <Text style={styles.summaryValue}>{fmtDuration(week.totalWorked)}</Text>
            </View>
            <View style={[styles.summaryBlock, styles.summaryBlockMid]}>
              <Text style={styles.summaryLabel}>Overtime</Text>
              <Text style={[styles.summaryValue, week.totalOvertime > 0 && { color: BRAND.orange }]}>
                {week.totalOvertime > 0 ? fmtDuration(week.totalOvertime) : '—'}
              </Text>
            </View>
            <View style={styles.summaryBlock}>
              <Text style={styles.summaryLabel}>Days Worked</Text>
              <Text style={styles.summaryValue}>
                {week.days.filter(d => d.status !== 'day_off').length}
                <Text style={styles.summaryValueSub}>/5</Text>
              </Text>
            </View>
          </View>

          {/* Weekly progress bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressLabelRow}>
              <Text style={styles.progressLabel}>Weekly target (40h)</Text>
              <Text style={[styles.progressPct, { color: progressColor }]}>{pct}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${pct}%` as any, backgroundColor: progressColor },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Daily Records */}
        <Text style={styles.sectionTitle}>Daily Breakdown</Text>
        <View style={styles.dayList}>
          {week.days.map((day) => {
            const sc = statusConfig(day.status);
            const isOff = day.status === 'day_off';
            return (
              <View key={day.date} style={[styles.dayRow, isOff && styles.dayRowOff]}>
                {/* Left — day label */}
                <View style={styles.dayLabelWrap}>
                  <Text style={[styles.dayLabel, isOff && { color: BRAND.textMuted }]}>
                    {day.dayLabel}
                  </Text>
                  <Text style={styles.dayDate}>
                    {parseInt(day.date.slice(8), 10)}
                  </Text>
                </View>

                {/* Middle — times */}
                {isOff ? (
                  <Text style={styles.dayOffText}>Day off</Text>
                ) : (
                  <View style={styles.dayTimes}>
                    <View style={styles.timeRow}>
                      <Ionicons name="log-in-outline" size={12} color={BRAND.textMuted} />
                      <Text style={styles.timeText}>{day.clockIn}</Text>
                    </View>
                    <View style={styles.timeRow}>
                      <Ionicons name="log-out-outline" size={12} color={BRAND.textMuted} />
                      <Text style={styles.timeText}>{day.clockOut}</Text>
                    </View>
                  </View>
                )}

                {/* Right — hours + badge */}
                <View style={styles.dayRight}>
                  {!isOff && (
                    <Text style={styles.dayHours}>{fmtHoursDecimal(day.workedSeconds)}</Text>
                  )}
                  <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: sc.color }]}>{sc.label}</Text>
                  </View>
                  {day.overtimeSeconds > 0 && (
                    <Text style={styles.otLabel}>+{fmtHoursDecimal(day.overtimeSeconds)} OT</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Compliance legend */}
        <View style={styles.legend}>
          {(['compliant', 'missing_break', 'overtime'] as ComplianceStatus[]).map((s) => {
            const sc = statusConfig(s);
            return (
              <View key={s} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: sc.color }]} />
                <Text style={styles.legendText}>
                  {s === 'compliant' ? 'Compliant' : s === 'missing_break' ? 'Missing Break' : 'Overtime'}
                </Text>
              </View>
            );
          })}
        </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: BRAND.textPrimary, letterSpacing: -0.4 },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: BRAND.primary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  exportText: { fontSize: 13, fontWeight: '600', color: BRAND.primary },

  scroll: { paddingBottom: 32 },

  weekTabsWrap: { paddingHorizontal: 16, gap: 8, paddingBottom: 12 },
  weekTab: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: BRAND.white,
    borderWidth: 0.5,
    borderColor: BRAND.border,
  },
  weekTabActive: { backgroundColor: BRAND.primary, borderColor: BRAND.primary },
  weekTabText: { fontSize: 13, fontWeight: '600', color: BRAND.textSecondary },
  weekTabTextActive: { color: '#fff' },

  // Summary card
  summaryCard: {
    backgroundColor: BRAND.white,
    borderRadius: 14,
    marginHorizontal: 16,
    padding: 18,
    borderWidth: 0.5,
    borderColor: BRAND.border,
    marginBottom: 14,
    gap: 16,
  },
  summaryTop: { flexDirection: 'row' },
  summaryBlock: { flex: 1, alignItems: 'center', gap: 3 },
  summaryBlockMid: {
    borderLeftWidth: 0.5,
    borderRightWidth: 0.5,
    borderColor: BRAND.border,
  },
  summaryLabel: { fontSize: 11, color: BRAND.textMuted, fontWeight: '500', letterSpacing: 0.3 },
  summaryValue: { fontSize: 20, fontWeight: '800', color: BRAND.textPrimary, letterSpacing: -0.5 },
  summaryValueSub: { fontSize: 14, fontWeight: '500', color: BRAND.textMuted },

  progressSection: { gap: 6 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { fontSize: 12, color: BRAND.textMuted },
  progressPct: { fontSize: 12, fontWeight: '700' },
  progressTrack: {
    height: 6,
    backgroundColor: '#F1EFE8',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 3 },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: BRAND.textMuted,
    letterSpacing: 0.6,
    paddingHorizontal: 20,
    marginBottom: 8,
  },

  dayList: {
    backgroundColor: BRAND.white,
    borderRadius: 14,
    marginHorizontal: 16,
    borderWidth: 0.5,
    borderColor: BRAND.border,
    overflow: 'hidden',
    marginBottom: 14,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: BRAND.border,
    gap: 12,
  },
  dayRowOff: { backgroundColor: '#FAFAF8' },

  dayLabelWrap: { width: 32, alignItems: 'center', gap: 2 },
  dayLabel: { fontSize: 11, fontWeight: '700', color: BRAND.textSecondary, letterSpacing: 0.3 },
  dayDate: { fontSize: 16, fontWeight: '700', color: BRAND.textPrimary },

  dayOffText: { flex: 1, fontSize: 13, color: BRAND.textMuted, fontStyle: 'italic' },

  dayTimes: { flex: 1, gap: 3 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeText: { fontSize: 12, color: BRAND.textSecondary, fontVariant: ['tabular-nums'] },

  dayRight: { alignItems: 'flex-end', gap: 4, minWidth: 60 },
  dayHours: { fontSize: 14, fontWeight: '700', color: BRAND.textPrimary, fontVariant: ['tabular-nums'] },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusBadgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  otLabel: { fontSize: 10.5, color: BRAND.orange, fontWeight: '600' },

  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 16,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendText: { fontSize: 11.5, color: BRAND.textMuted },
});
