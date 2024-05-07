// Comment.js
import React from "react";
import { StyleSheet, Text, View } from "react-native";

const Comment = () => (
  <View style={styles.tabContainer}>
    <Text>Comment Tab Content</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default Comment;
