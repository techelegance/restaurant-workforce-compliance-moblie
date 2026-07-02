import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMockAttendance } from "@/lib/mock-attendance";

type ClockStatus = "not_clocked_in" | "clocked_in" | "on_break";

interface LocationInfo {
  verified: boolean;
  name: string;
  storeName: string;
  ip: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const BRAND = {
  primary: "#8B3A0F",
  orange: "#F47C20",
  orangeDark: "#D96B10",
  bg: "#F5F0EB",
  white: "#FFFFFF",
  border: "#E0DAD4",
  textPrimary: "#1A1A1A",
  textSecondary: "#5A5550",
  textMuted: "#9B9490",
  green: "#16A34A",
  greenBg: "#DCFCE7",
  amber: "#B45309",
  amberBg: "#FEF3C7",
  blue: "#1D4ED8",
  blueBg: "#DBEAFE",
  cardBg: "#FFFFFF",
};

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatTime(date: Date): string {
  const h = date.getHours().toString().padStart(2, "0");
  const m = date.getMinutes().toString().padStart(2, "0");
  const s = date.getSeconds().toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function formatDateHeader(date: Date): string {
  return `${DAY_NAMES[date.getDay()].toUpperCase()}, ${MONTH_NAMES[
    date.getMonth()
  ].toUpperCase()} ${date.getDate()}`;
}

function formatHoursDecimal(seconds: number): string {
  return (seconds / 3600).toFixed(2) + "h";
}

function getStatusConfig(status: ClockStatus) {
  switch (status) {
    case "clocked_in":
      return {
        label: "Clocked In",
        dotColor: BRAND.green,
        badgeBg: BRAND.greenBg,
        badgeText: BRAND.green,
      };
    case "on_break":
      return {
        label: "On Break",
        dotColor: BRAND.amber,
        badgeBg: BRAND.amberBg,
        badgeText: BRAND.amber,
      };
    default:
      return {
        label: "Not Clocked In",
        dotColor: BRAND.textMuted,
        badgeBg: "transparent",
        badgeText: BRAND.textMuted,
      };
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function TimeClockScreen() {
  const router = useRouter();
  const attendance = useMockAttendance();

  // ---- State ---------------------------------------------------------------
  const [now, setNow] = useState(new Date());
  const [loading, setLoading] = useState<string | null>(null); // action in progress

  const location: LocationInfo = {
    verified: true,
    name: "Main Entrance Hub",
    storeName: "Store #402",
    ip: "192.168.1.104",
  };

  // ---- Tickers -------------------------------------------------------------
  // Wall clock — updates every second
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const hoursToday = useMemo(() => {
    if (!attendance.clockInTime) return 0;
    const activeUntil = attendance.status === "on_break" && attendance.breakStartTime
      ? attendance.breakStartTime
      : now;
    const grossSeconds = Math.max(
      0,
      Math.floor((activeUntil.getTime() - attendance.clockInTime.getTime()) / 1000),
    );
    return Math.max(0, grossSeconds - attendance.totalBreakSeconds);
  }, [
    attendance.breakStartTime,
    attendance.clockInTime,
    attendance.status,
    attendance.totalBreakSeconds,
    now,
  ]);

  // ---- Actions -------------------------------------------------------------
  const handleClockIn = useCallback(async () => {
    setLoading("clockIn");
    try {
      // TODO: POST /api/attendance/clock-in  { locationId, timestamp }
      await new Promise((r) => setTimeout(r, 700));
      attendance.clockIn();
    } catch {
      Alert.alert("Clock In ล้มเหลว", "กรุณาลองอีกครั้ง");
    } finally {
      setLoading(null);
    }
  }, [attendance]);

  const handleStartBreak = useCallback(async () => {
    setLoading("startBreak");
    try {
      // TODO: POST /api/attendance/start-break
      await new Promise((r) => setTimeout(r, 500));
      attendance.startBreak();
      router.push("/break");
    } catch {
      Alert.alert("Start Break ล้มเหลว", "กรุณาลองอีกครั้ง");
    } finally {
      setLoading(null);
    }
  }, [attendance, router]);

  const handleEndBreak = useCallback(async () => {
    setLoading("endBreak");
    try {
      // TODO: POST /api/attendance/end-break
      await new Promise((r) => setTimeout(r, 500));
      attendance.endBreak();
    } catch {
      Alert.alert("End Break ล้มเหลว", "กรุณาลองอีกครั้ง");
    } finally {
      setLoading(null);
    }
  }, [attendance]);

  const handleClockOut = useCallback(async () => {
    Alert.alert(
      "Clock Out",
      `ยืนยันการเลิกงาน?\nชั่วโมงทำงานวันนี้: ${formatHoursDecimal(
        hoursToday
      )}`,
      [
        { text: "ยกเลิก", style: "cancel" },
        {
          text: "Clock Out",
          style: "destructive",
          onPress: async () => {
            setLoading("clockOut");
            try {
              // TODO: POST /api/attendance/clock-out
              await new Promise((r) => setTimeout(r, 700));
              attendance.clockOut();
              router.push("/shiftSummary");
            } catch {
              Alert.alert("Clock Out ล้มเหลว", "กรุณาลองอีกครั้ง");
            } finally {
              setLoading(null);
            }
          },
        },
      ]
    );
  }, [attendance, hoursToday, router]);

  // ---- Derived -------------------------------------------------------------
  const { status } = attendance;
  const statusConfig = getStatusConfig(status);
  const isLoading = loading !== null;

  // ---- Render --------------------------------------------------------------
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={18} color={BRAND.primary} />
          </View>
          <Text style={styles.brandName}>CompliancePro</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/notifications')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Notifications"
        >
          <Ionicons
            name="notifications-outline"
            size={24}
            color={BRAND.textPrimary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Card */}
        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>CURRENT STATUS</Text>
          <View style={styles.statusRow}>
            <View style={styles.statusLeft}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: statusConfig.dotColor },
                ]}
              />
              <Text style={styles.statusText}>{statusConfig.label}</Text>
            </View>
            <View style={styles.locationBadge}>
              <Ionicons name="checkmark-circle" size={14} color={BRAND.green} />
              <Text style={styles.locationBadgeText}>{location.storeName}</Text>
            </View>
          </View>

          {/* Clock In time shown when working */}
          {attendance.clockInTime && (
            <Text style={styles.clockedSince}>
              เข้างานตั้งแต่ {formatTime(attendance.clockInTime)}
            </Text>
          )}
        </View>

        {/* Main Clock Card */}
        <View style={styles.clockCard}>
          {/* Date + Clock */}
          <Text style={styles.dateHeader}>{formatDateHeader(now)}</Text>
          <Text style={styles.clockDisplay}>{formatTime(now)}</Text>

          {/* Hours Today pill */}
          <View style={styles.hoursPill}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={16}
              color={BRAND.primary}
            />
            <Text style={styles.hoursPillText}>
              Hours Today: {formatHoursDecimal(hoursToday)}
            </Text>
          </View>

          {/* Overtime warning */}
          {hoursToday >= 28800 /* 8h */ && (
            <View style={styles.warningBadge}>
              <Ionicons name="warning-outline" size={14} color={BRAND.amber} />
              <Text style={styles.warningText}>เข้าสู่ช่วง Overtime</Text>
            </View>
          )}

          {/* ---- Action Buttons ---- */}
          <View style={styles.actions}>
            {/* Clock In — visible only when not clocked in */}
            {status === "not_clocked_in" && (
              <TouchableOpacity
                style={[styles.btnClockIn, isLoading && styles.btnDisabled]}
                onPress={handleClockIn}
                disabled={isLoading}
                accessibilityRole="button"
                accessibilityLabel="Clock In"
              >
                {loading === "clockIn" ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="log-in-outline" size={20} color="#fff" />
                    <Text style={styles.btnClockInText}>Clock In</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* Start Break + End Break + Clock Out — visible when clocked in */}
            {(status === "clocked_in" || status === "on_break") && (
              <>
                <View style={styles.breakRow}>
                  <TouchableOpacity
                    style={[
                      styles.btnBreak,
                      status === "on_break" && styles.btnBreakDisabledStyle,
                      isLoading && styles.btnDisabled,
                    ]}
                    onPress={handleStartBreak}
                    disabled={isLoading || status === "on_break"}
                    accessibilityRole="button"
                    accessibilityLabel="Start Break"
                  >
                    {loading === "startBreak" ? (
                      <ActivityIndicator color={BRAND.primary} size="small" />
                    ) : (
                      <>
                        <MaterialCommunityIcons
                          name="coffee-outline"
                          size={17}
                          color={
                            status === "on_break"
                              ? BRAND.textMuted
                              : BRAND.primary
                          }
                        />
                        <Text
                          style={[
                            styles.btnBreakText,
                            status === "on_break" && { color: BRAND.textMuted },
                          ]}
                        >
                          Start Break
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.btnBreak,
                      status === "clocked_in" && styles.btnBreakDisabledStyle,
                      isLoading && styles.btnDisabled,
                    ]}
                    onPress={handleEndBreak}
                    disabled={isLoading || status === "clocked_in"}
                    accessibilityRole="button"
                    accessibilityLabel="End Break"
                  >
                    {loading === "endBreak" ? (
                      <ActivityIndicator color={BRAND.primary} size="small" />
                    ) : (
                      <>
                        <MaterialCommunityIcons
                          name="food-fork-drink"
                          size={17}
                          color={
                            status === "clocked_in"
                              ? BRAND.textMuted
                              : BRAND.primary
                          }
                        />
                        <Text
                          style={[
                            styles.btnBreakText,
                            status === "clocked_in" && {
                              color: BRAND.textMuted,
                            },
                          ]}
                        >
                          End Break
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.btnClockOut, isLoading && styles.btnDisabled]}
                  onPress={handleClockOut}
                  disabled={isLoading}
                  accessibilityRole="button"
                  accessibilityLabel="Clock Out"
                >
                  {loading === "clockOut" ? (
                    <ActivityIndicator color={BRAND.primary} />
                  ) : (
                    <>
                      <Ionicons
                        name="log-out-outline"
                        size={20}
                        color={BRAND.primary}
                      />
                      <Text style={styles.btnClockOutText}>Clock Out</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Location Info */}
        <View style={styles.locationRow}>
          <View style={styles.locationLeft}>
            <Ionicons
              name="location"
              size={16}
              color={BRAND.primary}
              style={{ marginTop: 1 }}
            />
            <View>
              <Text style={styles.locationName}>
                Verified at {location.name}
              </Text>
              {attendance.breakStartTime && (
                <Text style={styles.breakSince}>
                  พักตั้งแต่ {formatTime(attendance.breakStartTime)}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.locationRight}>
            <View style={styles.ipDot} />
            <View>
              <Text style={styles.ipLabel}>IP:</Text>
              <Text style={styles.ipValue}>{location.ip}</Text>
            </View>
          </View>
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

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  topBarLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F0E8E2",
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: {
    fontSize: 17,
    fontWeight: "700",
    color: BRAND.primary,
    letterSpacing: -0.3,
  },

  scroll: { paddingHorizontal: 16, paddingBottom: 16, gap: 12 },

  // Status card
  statusCard: {
    backgroundColor: BRAND.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 0.5,
    borderColor: BRAND.border,
    gap: 6,
  },
  statusLabel: {
    fontSize: 10.5,
    fontWeight: "600",
    color: BRAND.textMuted,
    letterSpacing: 0.8,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusDot: { width: 9, height: 9, borderRadius: 5 },
  statusText: {
    fontSize: 17,
    fontWeight: "700",
    color: BRAND.textPrimary,
    letterSpacing: -0.2,
  },
  locationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: BRAND.greenBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  locationBadgeText: { fontSize: 12, fontWeight: "600", color: BRAND.green },
  clockedSince: { fontSize: 12, color: BRAND.textMuted, marginTop: 2 },

  // Clock card
  clockCard: {
    backgroundColor: BRAND.white,
    borderRadius: 14,
    padding: 22,
    borderWidth: 0.5,
    borderColor: BRAND.border,
    alignItems: "center",
    gap: 0,
  },
  dateHeader: {
    fontSize: 12,
    fontWeight: "600",
    color: BRAND.textSecondary,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  clockDisplay: {
    fontSize: 52,
    fontWeight: "800",
    color: BRAND.textPrimary,
    letterSpacing: -2,
    fontVariant: ["tabular-nums"],
    marginBottom: 14,
  },
  hoursPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F5F0EB",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    marginBottom: 16,
  },
  hoursPillText: { fontSize: 13, fontWeight: "600", color: BRAND.primary },
  warningBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: BRAND.amberBg,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 12,
  },
  warningText: { fontSize: 12, fontWeight: "600", color: BRAND.amber },

  // Actions
  actions: { width: "100%", gap: 10, marginTop: 4 },

  btnClockIn: {
    backgroundColor: BRAND.orange,
    borderRadius: 12,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  btnClockInText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: -0.2,
  },

  breakRow: { flexDirection: "row", gap: 10 },
  btnBreak: {
    flex: 1,
    height: 46,
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: BRAND.white,
  },
  btnBreakDisabledStyle: { opacity: 0.45 },
  btnBreakText: { fontSize: 14, fontWeight: "600", color: BRAND.primary },

  btnClockOut: {
    height: 46,
    borderWidth: 1.5,
    borderColor: BRAND.primary,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: BRAND.white,
  },
  btnClockOutText: { fontSize: 15, fontWeight: "600", color: BRAND.primary },

  btnDisabled: { opacity: 0.5 },

  // Location info
  locationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 4,
    gap: 8,
  },
  locationLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    flex: 1,
  },
  locationName: {
    fontSize: 12.5,
    color: BRAND.textSecondary,
    fontWeight: "500",
  },
  breakSince: { fontSize: 11.5, color: BRAND.textMuted, marginTop: 2 },
  locationRight: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  ipDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: BRAND.textMuted,
    marginTop: 5,
  },
  ipLabel: { fontSize: 11, color: BRAND.textMuted, fontWeight: "500" },
  ipValue: { fontSize: 12, color: BRAND.textSecondary, fontWeight: "500" },

  // Tab bar
  tabBar: {
    flexDirection: "row",
    backgroundColor: BRAND.white,
    borderTopWidth: 0.5,
    borderTopColor: BRAND.border,
    paddingBottom: 20,
    paddingTop: 10,
    paddingHorizontal: 20,
  },
  tabItem: { flex: 1, alignItems: "center", gap: 3 },
  tabItemActive: { flex: 1, alignItems: "center", gap: 3 },
  tabIconActive: {
    width: 48,
    height: 28,
    backgroundColor: BRAND.orange,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  tabLabel: { fontSize: 11, color: BRAND.textMuted, fontWeight: "500" },
  tabLabelActive: { fontSize: 11, color: BRAND.orange, fontWeight: "600" },
});
