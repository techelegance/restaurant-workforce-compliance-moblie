import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const BRAND = {
  primary: "#8B3A0F",
  bg: "#F5F0EB",
  white: "#FFFFFF",
  border: "#E0DAD4",
  textPrimary: "#1A1A1A",
  textSecondary: "#5A5550",
  textMuted: "#9B9490",
  amber: "#B45309",
  amberBg: "#FEF3C7",
  green: "#16A34A",
  greenBg: "#DCFCE7",
};

const NOTIFICATIONS = [
  { icon: "warning-outline", title: "Break reminder", body: "คุณทำงานใกล้ครบ 6 ชั่วโมงแล้ว อย่าลืมพักเบรก", bg: BRAND.amberBg, color: BRAND.amber },
  { icon: "checkmark-circle-outline", title: "Shift saved", body: "Clock out ล่าสุดถูกบันทึกใน mock summary แล้ว", bg: BRAND.greenBg, color: BRAND.green },
  { icon: "time-outline", title: "Overtime watch", body: "ระบบจะแสดงเตือนเมื่อชั่วโมงทำงานเกิน 8 ชั่วโมง", bg: "#E0F2FE", color: "#0369A1" },
] as const;

export default function NotificationsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={BRAND.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {NOTIFICATIONS.map((item) => (
          <View key={item.title} style={styles.card}>
            <View style={[styles.iconWrap, { backgroundColor: item.bg }]}>
              <Ionicons name={item.icon} size={20} color={item.color} />
            </View>
            <View style={styles.content}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.body}>{item.body}</Text>
              <Text style={styles.time}>Just now</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BRAND.bg },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 18 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: BRAND.textPrimary },
  scroll: { padding: 16, paddingBottom: 32, gap: 12 },
  card: { alignItems: "flex-start", backgroundColor: BRAND.white, borderColor: BRAND.border, borderRadius: 12, borderWidth: 0.5, flexDirection: "row", gap: 12, padding: 14 },
  iconWrap: { alignItems: "center", borderRadius: 20, height: 40, justifyContent: "center", width: 40 },
  content: { flex: 1 },
  title: { color: BRAND.textPrimary, fontSize: 15, fontWeight: "800" },
  body: { color: BRAND.textSecondary, fontSize: 14, lineHeight: 20, marginTop: 3 },
  time: { color: BRAND.textMuted, fontSize: 12, marginTop: 8 },
});
