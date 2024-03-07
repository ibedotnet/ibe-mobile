import React from "react";
import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const Header = ({
  route,
  navigation,
  busObjCat,
  recordCount,
  showFilters = true,
}) => {
  const navigateToHomeScreen = () => {
    navigation.navigate("Home");
  };

  const navigateToFilters = () => {
    navigation.navigate("Filters");
  };

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={navigateToHomeScreen}>
        <Ionicons name="home" size={30} color="white" />
      </TouchableOpacity>
      {busObjCat && (
        <Text style={styles.recordCountText}>
          {`${busObjCat}${recordCount > 0 ? "s" : ""}: ${
            recordCount > 0 ? recordCount : "No records"
          }`}
        </Text>
      )}
      {showFilters && (
        <TouchableOpacity onPress={navigateToFilters}>
          <Ionicons name="filter" size={30} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "4%",
    backgroundColor: "#005EB8",
    height: "10%",
    elevation: 5,
  },
  recordCountText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
});

export default Header;
