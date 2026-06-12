import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

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
};

const REQUIRED_BREAK_SECONDS = 1800; // 30 min
const WARNING_THRESHOLD = 3600;      // 60 min — unusually long break

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatClock(date: Date): string {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
  const h12 = (date.getHours() % 12 || 12).toString().padStart(2, '0');
  return `${h12}:${m} ${ampm}`;
}

function formatTimer(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  if (h > 0) return `${h}:${m}:${s}`;
  return `${m}:${s}`;
}

function getBreakPhase(seconds: number): {
  label: string;
  color: string;
  bg: string;
  sublabel: string;
} {
  if (seconds < REQUIRED_BREAK_SECONDS) {
    const remaining = REQUIRED_BREAK_SECONDS - seconds;
    const m = Math.ceil(remaining / 60);
    return {
      label: 'On Break',
      color: BRAND.amber,
      bg: BRAND.amberBg,
      sublabel: `ต้องพักอีก ${m} นาทีจึงจะ Compliant`,
    };
  }
  if (seconds < WARNING_THRESHOLD) {
    return {
      label: 'Break OK',
      color: BRAND.green,
      bg: BRAND.greenBg,
      sublabel: 'พักครบ 30 นาทีแล้ว — สามารถกลับได้เลย',
    };
  }
  return {
    label: 'Break นาน',
    color: BRAND.red,
    bg: BRAND.redBg,
    sublabel: 'พักเกิน 60 นาที — กรุณาแจ้ง Manager',
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function BreakScreen() {
  const router = useRouter();

  // In real usage pass breakStartTime via params:
  // const { breakStartTime } = useLocalSearchParams<{ breakStartTime: string }>();
  const breakStart = new Date(new Date().getTime() - 5 * 60 * 1000); // mock: started 5 min ago

  const [elapsed, setElapsed] = useState(
    Math.floor((Date.now() - breakStart.getTime()) / 1000),
  );
  const [loading, setLoading] = useState(false);

  // Tick every second
  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - breakStart.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [breakStart]);

  const phase = getBreakPhase(elapsed);

  const handleEndBreak = useCallback(async () => {
    if (elapsed < REQUIRED_BREAK_SECONDS) {
      Alert.alert(
        'Break สั้นเกินไป',
        `พักมาเพียง ${Math.floor(elapsed / 60)} นาที — ต้องพักอย่างน้อย 30 นาทีเพื่อให้ Compliant\n\nต้องการกลับงานตอนนี้เลยหรือไม่?`,
        [
          { text: 'พักต่อ', style: 'cancel' },
          {
            text: 'กลับงานเลย',
            style: 'destructive',
            onPress: () => doEndBreak(),
          },
        ],
      );
    } else {
      doEndBreak();
    }
  }, [elapsed]);

  const doEndBreak = async () => {
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 700));
      router.replace('/');
    } catch {
      Alert.alert('End Break ล้มเหลว', 'กรุณาลองอีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  // Progress ring values
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(1, elapsed / REQUIRED_BREAK_SECONDS);
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <MaterialCommunityIcons name="coffee-outline" size={22} color={BRAND.primary} />
        <Text style={styles.headerTitle}>Break Time</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.body}>
        {/* Status badge */}
        <View style={[styles.phaseBadge, { backgroundColor: phase.bg }]}>
          <View style={[styles.phaseDot, { backgroundColor: phase.color }]} />
          <Text style={[styles.phaseLabel, { color: phase.color }]}>{phase.label}</Text>
        </View>

        {/* Progress ring + timer */}
        <View style={styles.ringWrap}>
          <svg
            width={220}
            height={220}
            viewBox="0 0 220 220"
            style={{ position: 'absolute' }}
          />
          {/* SVG ring via react-native-svg alternative: plain circle overlay */}
          <View style={styles.ringBg} />
          <View
            style={[
              styles.ringFill,
              {
                borderColor: phase.color,
                // Rotate trick: show arc proportional to progress
                opacity: progress > 0 ? 1 : 0,
              },
            ]}
          />
          <View style={styles.ringCenter}>
            <Text style={[styles.timerText, { color: phase.color }]}>
              {formatTimer(elapsed)}
            </Text>
            <Text style={styles.timerSub}>elapsed</Text>
          </View>
        </View>

        {/* Sub label */}
        <Text style={[styles.phaseSubLabel, { color: phase.color }]}>
          {phase.sublabel}
        </Text>

        {/* Break start info */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <Ionicons name="play-circle-outline" size={18} color={BRAND.primary} />
              <Text style={styles.infoLabel}>Break started</Text>
            </View>
            <Text style={styles.infoValue}>{formatClock(breakStart)}</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <Ionicons name="time-outline" size={18} color={BRAND.primary} />
              <Text style={styles.infoLabel}>Minimum required</Text>
            </View>
            <Text style={styles.infoValue}>30:00</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <Ionicons name="checkmark-circle-outline" size={18} color={BRAND.primary} />
              <Text style={styles.infoLabel}>Remaining</Text>
            </View>
            <Text style={[
              styles.infoValue,
              elapsed >= REQUIRED_BREAK_SECONDS && { color: BRAND.green },
            ]}>
              {elapsed >= REQUIRED_BREAK_SECONDS
                ? 'Complete ✓'
                : formatTimer(Math.max(0, REQUIRED_BREAK_SECONDS - elapsed))}
            </Text>
          </View>
        </View>

        {/* End Break button */}
        <TouchableOpacity
          style={[styles.btnEndBreak, loading && styles.btnDisabled]}
          onPress={handleEndBreak}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="End Break"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons name="food-fork-drink" size={20} color="#fff" />
              <Text style={styles.btnEndBreakText}>End Break</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.footNote}>
          การพักน้อยกว่า 30 นาทีอาจถูกบันทึกว่า Missing Break
        </Text>
      </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: BRAND.textPrimary, letterSpacing: -0.3 },

  body: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
    gap: 18,
  },

  phaseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
  },
  phaseDot: { width: 8, height: 8, borderRadius: 4 },
  phaseLabel: { fontSize: 13, fontWeight: '700', letterSpacing: 0.2 },

  // Ring (pure RN — no SVG dep required)
  ringWrap: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ringBg: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 10,
    borderColor: '#EDE8E3',
  },
  ringFill: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 10,
    borderLeftColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  ringCenter: { alignItems: 'center', gap: 4 },
  timerText: {
    fontSize: 46,
    fontWeight: '800',
    letterSpacing: -1.5,
    fontVariant: ['tabular-nums'],
  },
  timerSub: { fontSize: 13, color: BRAND.textMuted, fontWeight: '500' },

  phaseSubLabel: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
  },

  infoCard: {
    backgroundColor: BRAND.white,
    borderRadius: 14,
    width: '100%',
    borderWidth: 0.5,
    borderColor: BRAND.border,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  infoLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoLabel: { fontSize: 14, color: BRAND.textSecondary },
  infoValue: { fontSize: 14, fontWeight: '600', color: BRAND.textPrimary, fontVariant: ['tabular-nums'] },
  infoDivider: { height: 0.5, backgroundColor: BRAND.border, marginLeft: 44 },

  btnEndBreak: {
    width: '100%',
    height: 52,
    backgroundColor: BRAND.primary,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  btnEndBreakText: { fontSize: 17, fontWeight: '700', color: '#fff', letterSpacing: -0.2 },
  btnDisabled: { opacity: 0.5 },

  footNote: {
    fontSize: 12,
    color: BRAND.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    fontStyle: 'italic',
  },
});