import React from "react";
import { Image, StyleSheet, View } from "react-native";

export default function PhotoPackInscription() {
  const uri = "https://crckgttdlrrebswkvoor.supabase.co/storage/v1/object/public/images/packs/AuthScreen/CalqueInscription.png";
  return (
    <View style={styles.wrap}>
      <Image source={{ uri }} style={styles.img} resizeMode="contain" />
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center", backgroundColor: "transparent" },
  img: { width: "100%", height: "100%" },
});
