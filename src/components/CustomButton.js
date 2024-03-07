import React, { useState } from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { FontAwesome, Ionicons } from "@expo/vector-icons";

/**
 * CustomButton component renders a customizable button with an optional icon.
 *
 * @param {Object} props - Component props.
 * @param {function} props.onPress - Callback function invoked when the button is pressed.
 * @param {string} props.label - The text label displayed on the button.
 * @param {Object} props.icon - Object containing information about the icon to be displayed.
 *                               It includes the name of the icon, the library it belongs to,
 *                               size, color, and any other necessary properties.
 *                               Example: { name: "star", library: "FontAwesome", size: 18, color: "white" }
 * @param {boolean} [props.backgroundColor=true] - Boolean indicating whether to apply background color to the button.
 *                                                  Defaults to true.
 * @returns {JSX.Element} - Rendered component.
 */
const CustomButton = ({
  onPress,
  label,
  icon: { name, library, size = 18, color = "white" },
  backgroundColor = true,
  disabled = false,
}) => {
  const [pressed, setPressed] = useState(false);

  /**
   * Callback function invoked when the button is pressed.
   * Sets the pressed state to true, invokes the onPress callback, and resets the pressed state after a delay.
   */
  const handlePress = () => {
    setPressed(true);
    onPress();

    setTimeout(() => {
      setPressed(false);
    }, 100);
  };

  // Define the icon component based on the library prop
  const IconComponent = library === "FontAwesome" ? FontAwesome : Ionicons;

  return (
    <Pressable
      style={[
        styles.button,
        backgroundColor && {
          backgroundColor: pressed ? "#004080" : "#005eb8",
          opacity: disabled ? 0.5 : 1,
        },
      ]}
      onPress={handlePress}
      disabled={disabled}
    >
      {/* Icon component */}
      <IconComponent
        name={name}
        size={size}
        color={color}
        style={styles.buttonIcon}
        accessibilityLabel={`${label} button`}
      />
      {/* Text label */}
      <Text style={[styles.buttonLabel, !backgroundColor && styles.blackLabel]}>
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: "5%",
    flex: 1,
  },
  buttonIcon: {
    paddingRight: 8,
  },
  buttonLabel: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  blackLabel: {
    color: "black",
  },
});

export default CustomButton;
