import { useThemeStyles } from "../theme/useThemeStyles";

const disableOpacity = 90;

const useCommonStyles = () => {
  const styles = useThemeStyles(); // Get theme-based styles

  return {
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: styles.common.container.backgroundColor, // Themed background
      padding: "4%",
    },
    header: {
      headerStyle: {
        backgroundColor: styles.home.card.backgroundColor, // Themed primary color
      },
      headerTintColor: "#fff", // Themed text color
      headerTitleStyle: {
        fontWeight: "bold",
      },
    },
    loadingText: {
      color: styles.home.card.backgroundColor, // Themed primary color
      fontWeight: "bold",
    },
  };
};

export { useCommonStyles, disableOpacity };
