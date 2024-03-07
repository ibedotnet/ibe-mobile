import { StyleSheet } from "react-native";

const common = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: "5%",
  },
  header: {
    headerStyle: {
      backgroundColor: "#005eb8",
    },
    headerTintColor: "#fff",
    headerTitleStyle: {
      fontWeight: "bold",
    },
  },
});

export default common;
