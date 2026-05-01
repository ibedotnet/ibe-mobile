import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import BottomNavbar from "../components/BottomNavbar";

const FAQItem = ({ question, onPress, width }) => (
  <TouchableOpacity
    style={[styles.row, { width: width || "100%" }]}
    onPress={onPress}
    activeOpacity={0.7}
    accessibilityRole="button"
    accessibilityLabel={question}
  >
    <Text style={styles.rowLabel}>{question}</Text>
    <Ionicons name="chevron-forward" size={20} color="#1A1A1A" />
  </TouchableOpacity>
);

const FAQSelection = ({ navigation }) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();


  const horizontalPadding = screenWidth * 0.053;
  const contentWidth = Math.min(600, screenWidth - (horizontalPadding * 2));

  const faqList = [
    "how can i start using iBE.net?",
    "How much does iBE cost?",
    "Is there a free trail?",
    "Can i cancel at any time?",
    "Can i connect to Quickbooks?",
    "Can i pay in my home currency?",
    "Can i migrate my existing data?",
    "What hours is support given?",
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={26} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>FAQ</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: horizontalPadding,
            paddingBottom: (insets.bottom || 20) + (screenHeight * 0.1)
          },
        ]}
        bounces={false}
      >
        <View style={styles.listContainer}>
          {faqList.map((item, index) => (
            <FAQItem
              key={index}
              question={item}
              width={contentWidth}
              onPress={() => { }}
            />
          ))}
        </View>

        <View style={[styles.contactInfo, { width: contentWidth }]}>
          <Text style={styles.contactText}>
            Didn't find the answer you were looking for?{"\n"}
            Contact our <Text style={styles.supportLink}>support center</Text>
          </Text>
        </View>
      </ScrollView>
      <BottomNavbar navigation={navigation} activeRoute="Help" />
    </View>
  );
};

const cardShadow = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  android: { elevation: 3 },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F4F8",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 18,
    backgroundColor: "#FFFFFF",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: { elevation: 4 },
    }),
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    paddingTop: 20,
    alignItems: "center",
  },
  listContainer: {
    width: "100%",
    alignItems: "center",
  },
  row: {
    height: 51.28,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
    ...cardShadow,
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: "#1A1A1A",
  },
  contactInfo: {
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 5,
    width: "100%",
    maxWidth: 600,
  },
  contactText: {
    fontSize: 14,
    color: "#757575",
    lineHeight: 20,
    textAlign: "left",
  },
  supportLink: {
    color: "#0066CC",
    fontWeight: "600"
  },
});

export default FAQSelection;
