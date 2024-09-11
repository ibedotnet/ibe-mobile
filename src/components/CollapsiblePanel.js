import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { screenDimension } from "../utils/ScreenUtils";

/**
 * CollapsiblePanel renders a collapsible panel with a toggle button.
 *
 * @param {Object} props - Component props.
 * @param {string} props.title - The title of the panel.
 * @param {JSX.Element} props.children - The content of the panel.
 * @param {boolean} [props.disabled] - Whether the panel is disabled or not.
 * @param {boolean} [props.initiallyCollapsed=true] - Whether the panel is initially collapsed or expanded.
 * @param {function(boolean): void} [props.onCollapseChange] - Callback function to notify the parent about the collapsed state change.
 * @returns {JSX.Element} - Rendered component.
 */
const CollapsiblePanel = ({
  title,
  children,
  disabled,
  initiallyCollapsed = true,
  onCollapseChange,
}) => {
  // State to manage the collapsed state of the panel
  const [collapsed, setCollapsed] = useState(initiallyCollapsed);

  /**
   * Toggles the collapsed state of the panel.
   */
  const toggleCollapsed = () => {
    // Toggle the collapsed state only if the panel is not disabled
    if (!disabled) {
      const newCollapsedState = !collapsed;
      setCollapsed(newCollapsedState);

      // Notify the parent component about the state change
      if (onCollapseChange) {
        onCollapseChange(newCollapsedState);
      }
    }
  };

  return (
    <View style={styles.panelContainer}>
      {/* Render the header with a toggle button only if the panel is not disabled */}
      {!disabled && (
        <TouchableOpacity onPress={toggleCollapsed} style={styles.panelHeader}>
          <Text style={styles.panelHeaderText}>{title}</Text>
          {/* Render the toggle button icon based on the collapsed state */}
          <Ionicons
            name={collapsed ? "chevron-down-circle" : "chevron-up-circle"}
            size={24}
            color="black"
          />
        </TouchableOpacity>
      )}
      {/* Render the content of the panel only if it's not collapsed */}
      {!collapsed && (
        <View style={styles.panelContent}>
          <ScrollView>{children}</ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  panelContainer: {
    width: "100%",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    padding: "2%",
    backgroundColor: "#fff",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    marginBottom: 10,
  },
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  panelHeaderText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  panelContent: {
    marginTop: "4%",
    maxHeight: (screenDimension.height * 3) / 4,
  },
});

export default CollapsiblePanel;
