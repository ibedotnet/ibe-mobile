import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  Animated,
  TextInput,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const CustomToggle = ({ value, onValueChange }) => {
  const [animatedValue] = useState(new Animated.Value(value ? 1 : 0));

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [value]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 24],
  });

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["#D1D1D1", "#0066CC"],
  });

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onValueChange(!value)}
      style={styles.toggleWrapper}
    >
      <Animated.View style={[styles.toggleTrack, { backgroundColor }]}>
        <Animated.View style={[styles.toggleThumb, { transform: [{ translateX }] }]}>
          {value && (
            <Ionicons name="checkmark" size={16} color="#4CAF50" />
          )}
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const LanguageSelection = ({ navigation }) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [isOfflineMode, setIsOfflineMode] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [searchQuery, setSearchQuery] = useState("");

  const languages = [
    { id: "English", label: "English" },
    { id: "Spanish", label: "Spanish" },
    { id: "Hindi", label: "Hindi" },
  ];

  const filteredLanguages = languages.filter((lang) =>
    lang.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedIndex = filteredLanguages.findIndex(l => l.id === selectedLanguage);
  const ITEM_TOTAL_HEIGHT = 48;
  const slideAnim = useRef(new Animated.Value(selectedIndex !== -1 ? selectedIndex * ITEM_TOTAL_HEIGHT : 0)).current;

  useEffect(() => {
    if (selectedIndex !== -1) {
      Animated.spring(slideAnim, {
        toValue: selectedIndex * ITEM_TOTAL_HEIGHT,
        useNativeDriver: true,
        friction: 8,
        tension: 50
      }).start();
    }
  }, [selectedIndex]);


  const horizontalPadding = screenWidth * 0.053;
  const boxWidth = screenWidth - (horizontalPadding * 2);
  const sliderWidth = Math.min(328, boxWidth - 24);

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
        <Text style={styles.headerTitle}>Language</Text>
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
        <View style={[styles.offlineBox, { height: screenHeight * 0.055, marginBottom: screenHeight * 0.06 }]}>
          <Text style={styles.offlineLabel}>Enable offline mode</Text>
          <CustomToggle
            value={isOfflineMode}
            onValueChange={setIsOfflineMode}
          />
        </View>

        <Text style={styles.sectionLabel}>Select Language</Text>
        <View style={[styles.selectionBox, { height: screenHeight * 0.22 }]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listWrapper}
            nestedScrollEnabled={true}
          >
            {selectedIndex !== -1 && (
              <Animated.View
                style={[
                  styles.sliderBar,
                  {
                    width: sliderWidth,
                    transform: [{ translateY: slideAnim }]
                  }
                ]}
              />
            )}

            {filteredLanguages.map((lang) => {
              const isSelected = selectedLanguage === lang.id;
              return (
                <TouchableOpacity
                  key={lang.id}
                  style={[styles.item, { width: sliderWidth }]}
                  onPress={() => setSelectedLanguage(lang.id)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.itemText,
                      isSelected && styles.selectedItemText,
                    ]}
                  >
                    {lang.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={[styles.filterBox, { height: screenHeight * 0.065 }]}>
          <TextInput
            style={styles.filterInput}
            placeholder="Type to filter above list"
            placeholderTextColor="#757575"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
        </View>

        <Text style={styles.noteText}>
          Note: The data that can be modified here is stored in your device’s cache and will be reset when you log out or clear the cache.
        </Text>
      </ScrollView>
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
    paddingTop: 45,
  },
  offlineBox: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.1)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  offlineLabel: {
    fontSize: 15,
    color: "#757575",
  },
  toggleWrapper: {
    width: 50,
    height: 28,
  },
  toggleTrack: {
    width: 50,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: { elevation: 2 },
    }),
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 12,
  },
  selectionBox: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 12,
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
  listWrapper: {
    paddingVertical: 8,
    alignItems: "center",
  },
  sliderBar: {
    position: "absolute",
    height: 40,
    backgroundColor: "#0066CC",
    borderRadius: 7,
    top: 8,
    zIndex: 0,
  },
  item: {
    height: 40,
    borderRadius: 7,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 4,
    zIndex: 1,
  },
  itemText: {
    fontSize: 16,
    color: "#757575",
  },
  selectedItemText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  filterBox: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    marginTop: 20,
    paddingHorizontal: 15,
    justifyContent: "center",
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
  filterInput: {
    fontSize: 15,
    color: "#1A1A1A",
  },
  noteText: {
    fontSize: 13,
    color: "#757575",
    lineHeight: 18,
    marginTop: 24,
    textAlign: "left",
  },
});

export default LanguageSelection;
