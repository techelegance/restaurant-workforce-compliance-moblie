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
  green: "#16A34A",
};

export default function SupportScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={BRAND.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Support</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.statusCard}>
          <View style={styles.statusIcon}>
            <Ionicons name="headset-outline" size={26} color={BRAND.primary} />
          </View>
          <Text style={styles.title}>ช่วยเหลือพนักงาน</Text>
          <Text style={styles.subtitle}>Mock contact center สำหรับทดลอง flow ก่อนต่อ API</Text>
        </View>

        <View style={styles.card}>
          <SupportRow icon="call-outline" label="Manager Hotline" value="02-555-0142" />
          <View style={styles.divider} />
          <SupportRow icon="mail-outline" label="HR Email" value="hr@restaurant.com" />
          <View style={styles.divider} />
          <SupportRow icon="time-outline" label="Support Hours" value="08:00 - 22:00" />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Common Issues</Text>
          <Text style={styles.bullet}>Clock in ไม่ได้: ตรวจสอบ Location Verified</Text>
          <Text style={styles.bullet}>ลืม End Break: แจ้ง Manager เพื่อแก้ไขเวลา</Text>
          <Text style={styles.bullet}>ชั่วโมงไม่ตรง: รอ sync mock data หรือแจ้ง HR</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SupportRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Ionicons name={icon} size={18} color={BRAND.primary} />
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BRAND.bg },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 18 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: BRAND.textPrimary },
  scroll: { padding: 16, paddingBottom: 32, gap: 14 },
  statusCard: { alignItems: "center", backgroundColor: BRAND.white, borderColor: BRAND.border, borderRadius: 12, borderWidth: 0.5, padding: 22 },
  statusIcon: { alignItems: "center", backgroundColor: "#FBF0EB", borderRadius: 22, height: 44, justifyContent: "center", marginBottom: 10, width: 44 },
  title: { color: BRAND.textPrimary, fontSize: 22, fontWeight: "800" },
  subtitle: { color: BRAND.textSecondary, fontSize: 14, marginTop: 6, textAlign: "center" },
  card: { backgroundColor: BRAND.white, borderColor: BRAND.border, borderRadius: 12, borderWidth: 0.5, padding: 16 },
  row: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", gap: 12 },
  rowLeft: { alignItems: "center", flexDirection: "row", gap: 10 },
  rowLabel: { color: BRAND.textSecondary, fontSize: 14, fontWeight: "600" },
  rowValue: { color: BRAND.textPrimary, fontSize: 14, fontWeight: "700" },
  divider: { backgroundColor: BRAND.border, height: 1, marginVertical: 14 },
  sectionTitle: { color: BRAND.textPrimary, fontSize: 15, fontWeight: "800", marginBottom: 10 },
  bullet: { color: BRAND.textSecondary, fontSize: 14, lineHeight: 22, marginTop: 4 },
});
