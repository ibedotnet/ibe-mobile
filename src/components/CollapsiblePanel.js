import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

/**
 * CollapsiblePanel renders a collapsible panel with a toggle button.
 *
 * @param {Object} props - Component props.
 * @param {string} props.title - The title of the panel.
 * @param {JSX.Element} props.children - The content of the panel.
 * @param {boolean} [props.disabled] - Whether the panel is disabled or not.
 * @param {boolean} [props.initiallyCollapsed=true] - Whether the panel is initially collapsed or expanded.
 * @returns {JSX.Element} - Rendered component.
 */
const CollapsiblePanel = ({
  title,
  children,
  disabled,
  initiallyCollapsed = true,
}) => {
  // State to manage the collapsed state of the panel
  const [collapsed, setCollapsed] = useState(initiallyCollapsed);

  /**
   * Toggles the collapsed state of the panel.
   */
  const toggleCollapsed = () => {
    // Toggle the collapsed state only if the panel is not disabled
    if (!disabled) {
      setCollapsed(!collapsed);
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
      {!collapsed && <View style={styles.panelContent}>{children}</View>}
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
  },
});

export default CollapsiblePanel;
