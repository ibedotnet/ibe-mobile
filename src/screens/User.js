import React from "react";
import {
  Pressable,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Ionicons } from "@expo/vector-icons";

const User = () => {
  const navigateToHomeScreen = () => {
    navigation.navigate("Home");
  };

  const onPress = () => {

  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={navigateToHomeScreen}>
          <Ionicons name="home" size={30} color="white" />
        </TouchableOpacity>
      </View>
      <View style={styles.footer}>
        <Pressable style={styles.logoutButton} onPress={onPress}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#fffff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "4%",
    backgroundColor: "#005EB8",
    height: "10%",
    elevation: 5,
  },
  footer: {
    flex: 1,
    padding: "5%",
    width: "100%",
    justifyContent: "flex-end",
  },
  logoutButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: "5%",
    borderRadius: 30,
    backgroundColor: "#005EB8",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 0.5,
    color: "white",
  },
});

export default User;
