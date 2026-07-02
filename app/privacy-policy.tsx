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
  green: "#16A34A",
  greenBg: "#DCFCE7",
};

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={BRAND.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Ionicons name="shield-checkmark" size={30} color={BRAND.green} />
          <Text style={styles.title}>Mock Privacy Notice</Text>
          <Text style={styles.subtitle}>ข้อมูลตัวอย่างสำหรับ UI ก่อนเชื่อมระบบจริง</Text>
        </View>

        <PolicyBlock title="ข้อมูลที่ใช้ในระบบ">
          แอปนี้จะแสดงข้อมูลพนักงาน เวลาเข้างาน พักเบรก เลิกงาน ชั่วโมงทำงาน และสถานะ compliance
        </PolicyBlock>
        <PolicyBlock title="Location Verification">
          หน้าจอ mock แสดงสถานะ verified เพื่อจำลองการตรวจสอบว่าสาขาถูกต้องก่อนบันทึกเวลา
        </PolicyBlock>
        <PolicyBlock title="การเก็บรักษาข้อมูล">
          เมื่อเชื่อม Supabase แล้ว ข้อมูลควรถูกจำกัดสิทธิ์ด้วย session และ role ของพนักงาน/ผู้จัดการ
        </PolicyBlock>
      </ScrollView>
    </SafeAreaView>
  );
}

function PolicyBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.blockTitle}>{title}</Text>
      <Text style={styles.body}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BRAND.bg },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 18 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: BRAND.textPrimary },
  scroll: { padding: 16, paddingBottom: 32, gap: 14 },
  hero: { alignItems: "center", backgroundColor: BRAND.greenBg, borderRadius: 12, padding: 22 },
  title: { color: BRAND.textPrimary, fontSize: 21, fontWeight: "800", marginTop: 8 },
  subtitle: { color: BRAND.textSecondary, fontSize: 14, marginTop: 6, textAlign: "center" },
  card: { backgroundColor: BRAND.white, borderColor: BRAND.border, borderRadius: 12, borderWidth: 0.5, padding: 16 },
  blockTitle: { color: BRAND.textPrimary, fontSize: 16, fontWeight: "800", marginBottom: 8 },
  body: { color: BRAND.textSecondary, fontSize: 14, lineHeight: 22 },
});
