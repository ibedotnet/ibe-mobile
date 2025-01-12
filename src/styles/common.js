import { StyleSheet } from "react-native";

const disableOpacity = 90;

const common = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: "4%",
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
  loadingText: {
    color: "#005eb8",
    fontWeight: "bold",
  },
});

export { common, disableOpacity };
