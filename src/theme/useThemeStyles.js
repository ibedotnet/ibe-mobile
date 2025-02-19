import { useContext } from "react";
import { ThemeContext } from "./ThemeContext";
import { Platform } from "react-native";
import { screenDimension } from "../utils/ScreenUtils";

export const useThemeStyles = () => {
  const { theme } = useContext(ThemeContext); // Get active theme

  // Return an object containing styles for each screen
  return {
    // Common
    common: {
      container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        padding: "4%",
      },
      header: {
        headerStyle: {
          backgroundColor: theme.secondary,
        },
        headerTintColor: theme.contrastOnSecondary,
        headerTitleStyle: {
          fontWeight: "bold",
        },
      },
      loadingText: {
        color: theme.primary,
        fontWeight: "bold",
      },
    },

    // Home Screen
    home: {
      headerLeft: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 8,
      },
      headerRight: {
        paddingVertical: 8,
      },
      userPhoto: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: theme.contrastOnSecondary,
        marginRight: 12,
        ...Platform.select({
          ios: {
            width: 32,
            height: 32,
            borderRadius: 16,
          },
        }),
      },
      userName: {
        color: theme.contrastOnSecondary,
        fontWeight: "bold",
        fontSize: 16,
        textDecorationLine: "underline",
      },
      logoContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      },
      main: {
        flex: 2,
        alignItems: "center",
        justifyContent: "center",
      },
      row: {
        flexDirection: "row",
        marginBottom: "4%",
        columnGap: 18,
      },
      card: {
        flex: 1,
        aspectRatio: 1,
        maxWidth: screenDimension.width,
        backgroundColor: theme.card.backgroundColor,
        padding: "16%",
        borderWidth: 0.5,
        borderColor: theme.border.color,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        elevation: 5,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 2,
      },
      cardText: {
        fontWeight: "bold",
        color: theme.secondary,
      },
    },

    // User Preference Screen
    user: {
      container: {
        flex: 1,
        backgroundColor: theme.container.backgroundColor,
      },
      headerRightContainer: {
        width: screenDimension.width / 2,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
      },
      preferenceContainer: {
        padding: "2%",
      },
      logoutButtonText: {
        textDecorationLine: "underline",
        fontSize: 16,
        fontWeight: "bold",
        letterSpacing: 0.5,
        color: "#000",
        alignSelf: "center",
      },
      sectionContainer: {
        marginVertical: "4%",
        padding: "4%",
        backgroundColor: theme.primary,
        borderRadius: 8,
        elevation: 5,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 2,
      },
      saveButtonContainer: {
        flex: 1,
        alignItems: "flex-end",
      },
      toggleContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "2%",
      },
      toggleLabel: {
        fontSize: 16,
      },
      userInfoContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        fontSize: 16,
        marginBottom: "2%",
      },
      userInfoLabel: {
        marginRight: 5,
        fontSize: 16,
      },
      userInfo: {
        fontWeight: "bold",
      },
      buttonLabelWhite: {
        color: "#FFFFFF",
      },
      note: {
        fontSize: 12,
        color: "#0000FF",
        marginTop: 10,
      },
    },
  };
};
