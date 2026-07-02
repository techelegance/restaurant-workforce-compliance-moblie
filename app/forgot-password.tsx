import React, { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const BRAND = {
  primary: "#8B3A0F",
  bg: "#F5F0EB",
  white: "#FFFFFF",
  border: "#D8D3CE",
  textPrimary: "#1A1A1A",
  textSecondary: "#5A5550",
  textPlaceholder: "#B0AAA4",
  inputBg: "#FAFAF9",
};

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  const handleSubmit = () => {
    Alert.alert("ส่งลิงก์แล้ว", `Mock reset link ถูกส่งไปที่ ${email || "your email"}`);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={BRAND.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Forgot Password</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.body}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Ionicons name="mail-outline" size={28} color={BRAND.primary} />
          </View>
          <Text style={styles.title}>Reset your password</Text>
          <Text style={styles.subtitle}>ใส่ Work Email เพื่อจำลองการส่งลิงก์รีเซ็ตรหัสผ่าน</Text>

          <Text style={styles.label}>Work Email</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="mail-outline" size={18} color={BRAND.textSecondary} />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="name@restaurant.com"
              placeholderTextColor={BRAND.textPlaceholder}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity style={styles.button} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Send Reset Link</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BRAND.bg },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 18 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: BRAND.textPrimary },
  body: { flex: 1, justifyContent: "center", padding: 16 },
  card: { backgroundColor: BRAND.white, borderColor: BRAND.border, borderRadius: 12, borderWidth: 0.5, padding: 22 },
  iconCircle: { alignItems: "center", alignSelf: "center", backgroundColor: "#FBF0EB", borderRadius: 28, height: 56, justifyContent: "center", marginBottom: 12, width: 56 },
  title: { color: BRAND.textPrimary, fontSize: 22, fontWeight: "800", textAlign: "center" },
  subtitle: { color: BRAND.textSecondary, fontSize: 14, lineHeight: 21, marginBottom: 22, marginTop: 8, textAlign: "center" },
  label: { color: BRAND.textSecondary, fontSize: 13, fontWeight: "700", marginBottom: 8 },
  inputWrap: { alignItems: "center", backgroundColor: BRAND.inputBg, borderColor: BRAND.border, borderRadius: 10, borderWidth: 1, flexDirection: "row", gap: 8, height: 48, paddingHorizontal: 12 },
  input: { color: BRAND.textPrimary, flex: 1, fontSize: 15, padding: 0 },
  button: { alignItems: "center", backgroundColor: BRAND.primary, borderRadius: 10, flexDirection: "row", gap: 8, height: 50, justifyContent: "center", marginTop: 18 },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "800" },
});
