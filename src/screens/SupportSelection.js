import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  TextInput,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons, FontAwesome } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import BottomNavbar from "../components/BottomNavbar";

const SupportRow = ({ icon, label, onPress, width }) => (
  <TouchableOpacity
    style={[styles.row, { width: width || "100%" }]}
    onPress={onPress}
    activeOpacity={0.7}
    accessibilityRole="button"
    accessibilityLabel={label}
  >
    <View style={styles.rowIconWrap}>
      {icon}
    </View>
    <Text style={styles.rowLabel}>{label}</Text>
    <Ionicons name="chevron-forward" size={20} color="#1A1A1A" />
  </TouchableOpacity>
);

const SupportSelection = ({ navigation }) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const horizontalPadding = screenWidth * 0.053;
  const contentWidth = Math.min(600, screenWidth - (horizontalPadding * 2));
  const carouselBoxWidth = Math.min(130, contentWidth * 0.35);
  const carouselBoxHeight = carouselBoxWidth * 1.13;

  const faqCards = [
    {
      id: "1",
      title: "Can i migrate my existing data?",
      icon: "database",
      colors: ["#005EB8", "rgba(0, 94, 184, 0.5)"],
    },
    {
      id: "2",
      title: "How much does iBE cost?",
      icon: "credit-card-outline",
      colors: ["#57A166", "rgba(87, 161, 102, 0.5)"],
    },
    {
      id: "3",
      title: "Is there a free trial?",
      icon: "gift-outline",
      colors: ["#F59E0B", "rgba(245, 158, 11, 0.5)"],
    },
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
        <Text style={styles.headerTitle}>Support</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: horizontalPadding,
            paddingBottom: (insets.bottom || 20) + 100
          },
        ]}
      >
        <Text style={styles.mainTitle}>Have any question?</Text>
        <View style={[styles.searchBox, { width: contentWidth }]}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search here"
            placeholderTextColor="#757575"
          />
          <View style={styles.searchIcons}>
            <Ionicons name="search-outline" size={20} color="#757575" />
            <View style={styles.searchDivider} />
            <MaterialCommunityIcons name="microphone-outline" size={20} color="#1A1A1A" />
          </View>
        </View>

        <View style={[styles.sectionHeader, { width: contentWidth }]}>
          <Text style={styles.sectionTitle}>Frequently Asked Question</Text>
          <TouchableOpacity onPress={() => navigation.navigate("FAQSelection")}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carouselContainer}
          snapToInterval={carouselBoxWidth + 12}
          decelerationRate="fast"
        >
          {faqCards.map((card) => (
            <LinearGradient
              key={card.id}
              colors={card.colors}
              style={[styles.faqCard, { width: carouselBoxWidth, height: carouselBoxHeight }]}
            >
              <Text style={styles.faqCardText} numberOfLines={3}>
                {card.title}
              </Text>
              <MaterialCommunityIcons
                name={card.icon}
                size={24}
                color="#FFFFFF"
                style={styles.faqCardIcon}
              />
            </LinearGradient>
          ))}
        </ScrollView>

        <View style={[styles.contactInfo, { width: contentWidth }]}>
          <Text style={styles.contactText}>
            Didn't find the answer you were looking for?{"\n"}
            Contact our <Text style={styles.supportLink}>support center</Text>
          </Text>
        </View>
        <SupportRow
          width={contentWidth}
          label="Go to our Website"
          icon={<Ionicons name="globe-outline" size={22} color="#005EB8" />}
          onPress={() => { }}
        />
        <SupportRow
          width={contentWidth}
          label="Email Us"
          icon={<MaterialCommunityIcons name="email-outline" size={22} color="#005EB8" />}
          onPress={() => { }}
        />
        <SupportRow
          width={contentWidth}
          label="Terms of Service"
          icon={<MaterialCommunityIcons name="file-document-outline" size={22} color="#005EB8" />}
          onPress={() => { }}
        />
      </ScrollView>

      <BottomNavbar navigation={navigation} activeRoute="Help" />
    </View>
  );
};

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
    paddingTop: 30,
    alignItems: "center",
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A1A1A",
    alignSelf: "flex-start",
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  searchBox: {
    height: 51,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    marginBottom: 25,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#1A1A1A",
  },
  searchIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  searchDivider: {
    width: 1,
    height: 20,
    backgroundColor: "#E0E0E0",
    marginHorizontal: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  viewAllText: {
    fontSize: 13,
    color: "#005EB8",
    fontWeight: "500",
  },
  carouselContainer: {
    paddingLeft: 5,
    paddingBottom: 20,
  },
  faqCard: {
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    justifyContent: "space-between",
  },
  faqCardText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    lineHeight: 18,
  },
  faqCardIcon: {
    alignSelf: "flex-end",
    opacity: 0.8,
  },
  contactInfo: {
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  contactText: {
    fontSize: 14,
    color: "#757575",
    lineHeight: 20,
  },
  supportLink: {
    color: "#005EB8",
    fontWeight: "600",
  },
  row: {
    height: 51.28,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
    }),
  },
  rowIconWrap: {
    width: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    fontWeight: "500",
    color: "#1A1A1A",
  },
});

export default SupportSelection;
