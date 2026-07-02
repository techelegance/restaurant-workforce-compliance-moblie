import React, { useState, useMemo } from 'react';
import {
  Alert,
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  buildWeeks,
  ComplianceStatus,
  DayRecord,
  HoursFormErrors,
  HoursFormValues,
  useHoursStore,
} from '@/lib/hours-store';

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

const WEEK_LIMIT = 144000;        // 40h in seconds

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

const EMPTY_FORM: HoursFormValues = {
  date: new Date().toISOString().slice(0, 10),
  clockIn: '09:00',
  clockOut: '17:00',
  breakMinutes: '30',
};

function recordToForm(record: DayRecord): HoursFormValues {
  return {
    date: record.date,
    clockIn: toTwentyFourHourTime(record.clockIn),
    clockOut: toTwentyFourHourTime(record.clockOut),
    breakMinutes: String(Math.floor(record.breakSeconds / 60)),
  };
}

function toTwentyFourHourTime(value: string) {
  const match = value.match(/^(\d{2}):(\d{2}) (AM|PM)$/);
  if (!match) return value;

  let hour = Number(match[1]);
  const minute = match[2];
  const period = match[3];
  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  return `${hour.toString().padStart(2, '0')}:${minute}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function HoursScreen() {
  const records = useHoursStore((state) => state.records);
  const validateRecord = useHoursStore((state) => state.validateRecord);
  const createRecord = useHoursStore((state) => state.createRecord);
  const updateRecord = useHoursStore((state) => state.updateRecord);
  const deleteRecord = useHoursStore((state) => state.deleteRecord);

  const weeks = useMemo(() => buildWeeks(records), [records]);
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DayRecord | null>(null);
  const [form, setForm] = useState<HoursFormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<HoursFormErrors>({});
  const week = weeks[selectedWeek];

  const pct = progressPercent(week.totalWorked, WEEK_LIMIT);
  const progressColor = pct >= 100 ? BRAND.red : pct >= 85 ? BRAND.amber : BRAND.green;

  const openCreate = () => {
    setEditingRecord(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setModalVisible(true);
  };

  const openEdit = (record: DayRecord) => {
    setEditingRecord(record);
    setForm(recordToForm(record));
    setErrors({});
    setModalVisible(true);
  };

  const setField = (field: keyof HoursFormValues) => (value: string) => {
    const nextForm = { ...form, [field]: value };
    setForm(nextForm);
    const result = validateRecord(nextForm, editingRecord?.id);
    setErrors(result.errors);
  };

  const handleSubmit = () => {
    const result = editingRecord
      ? updateRecord(editingRecord.id, form)
      : createRecord(form);

    setErrors(result.errors);
    if (!result.valid) return;

    setModalVisible(false);
    setEditingRecord(null);
  };

  const handleDelete = (record: DayRecord) => {
    Alert.alert(
      'Delete record',
      `ลบ record วันที่ ${record.date} หรือไม่?`,
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ลบ',
          style: 'destructive',
          onPress: () => {
            const deleted = deleteRecord(record.id);
            if (!deleted) {
              Alert.alert('ลบไม่สำเร็จ', 'ไม่พบ record นี้ใน mock store');
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Hours</Text>
        <TouchableOpacity
          style={styles.exportBtn}
          onPress={openCreate}
          accessibilityLabel="Add hours"
        >
          <Ionicons name="add" size={18} color={BRAND.primary} />
          <Text style={styles.exportText}>Add</Text>
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
          {week.days.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={22} color={BRAND.textMuted} />
              <Text style={styles.emptyTitle}>No records this week</Text>
              <Text style={styles.emptyText}>เพิ่ม mock record เพื่อทดสอบ CRUD โดยไม่ผ่าน DB</Text>
            </View>
          )}

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

                <View style={styles.rowActions}>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => openEdit(day)}
                    accessibilityLabel={`Edit ${day.date}`}
                  >
                    <Ionicons name="create-outline" size={16} color={BRAND.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconButtonDanger}
                    onPress={() => handleDelete(day)}
                    accessibilityLabel={`Delete ${day.date}`}
                  >
                    <Ionicons name="trash-outline" size={16} color={BRAND.red} />
                  </TouchableOpacity>
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

      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingRecord ? 'Edit Hours' : 'Add Hours'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color={BRAND.textPrimary} />
              </TouchableOpacity>
            </View>

            <HoursField
              label="Date"
              value={form.date}
              onChangeText={setField('date')}
              placeholder="YYYY-MM-DD"
              error={errors.date}
            />
            <View style={styles.formGrid}>
              <HoursField
                label="Clock In"
                value={form.clockIn}
                onChangeText={setField('clockIn')}
                placeholder="09:00"
                error={errors.clockIn}
              />
              <HoursField
                label="Clock Out"
                value={form.clockOut}
                onChangeText={setField('clockOut')}
                placeholder="17:00"
                error={errors.clockOut}
              />
            </View>
            <HoursField
              label="Break Minutes"
              value={form.breakMinutes}
              onChangeText={setField('breakMinutes')}
              placeholder="30"
              keyboardType="numeric"
              error={errors.breakMinutes}
            />

            <TouchableOpacity style={styles.saveButton} onPress={handleSubmit}>
              <Ionicons name="checkmark" size={18} color="#fff" />
              <Text style={styles.saveButtonText}>
                {editingRecord ? 'Save Changes' : 'Add Record'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function HoursField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  error,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'numeric';
  error?: string;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, error ? styles.fieldInputError : null]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={BRAND.textMuted}
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize="none"
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
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
  emptyState: {
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  emptyTitle: { color: BRAND.textPrimary, fontSize: 15, fontWeight: '800' },
  emptyText: { color: BRAND.textMuted, fontSize: 12.5, textAlign: 'center' },
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

  dayRight: { alignItems: 'flex-end', gap: 4, minWidth: 54 },
  dayHours: { fontSize: 14, fontWeight: '700', color: BRAND.textPrimary, fontVariant: ['tabular-nums'] },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusBadgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  otLabel: { fontSize: 10.5, color: BRAND.orange, fontWeight: '600' },
  rowActions: { flexDirection: 'row', gap: 6 },
  iconButton: {
    alignItems: 'center',
    borderColor: BRAND.border,
    borderRadius: 8,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  iconButtonDanger: {
    alignItems: 'center',
    backgroundColor: BRAND.redBg,
    borderRadius: 8,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },

  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 16,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendText: { fontSize: 11.5, color: BRAND.textMuted },

  modalBackdrop: {
    backgroundColor: 'rgba(0,0,0,0.32)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: BRAND.white,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    gap: 12,
    padding: 18,
    paddingBottom: 28,
  },
  modalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  modalTitle: { color: BRAND.textPrimary, fontSize: 19, fontWeight: '800' },
  formGrid: { flexDirection: 'row', gap: 10 },
  fieldWrap: { flex: 1, gap: 6 },
  fieldLabel: { color: BRAND.textSecondary, fontSize: 12.5, fontWeight: '700' },
  fieldInput: {
    backgroundColor: '#FAFAF9',
    borderColor: BRAND.border,
    borderRadius: 10,
    borderWidth: 1,
    color: BRAND.textPrimary,
    fontSize: 15,
    height: 46,
    paddingHorizontal: 12,
  },
  fieldInputError: { borderColor: BRAND.red },
  fieldError: { color: BRAND.red, fontSize: 11.5, lineHeight: 16 },
  saveButton: {
    alignItems: 'center',
    backgroundColor: BRAND.primary,
    borderRadius: 10,
    flexDirection: 'row',
    gap: 8,
    height: 50,
    justifyContent: 'center',
    marginTop: 4,
  },
  saveButtonText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
