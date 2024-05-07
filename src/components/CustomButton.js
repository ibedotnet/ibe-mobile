import React, { useState } from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import {
  FontAwesome,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";

import { disableOpacity } from "../styles/common";

/**
 * CustomButton component renders a customizable button with an optional icon.
 *
 * @param {Object} props - Component props.
 * @param {function} props.onPress - Callback function invoked when the button is pressed.
 * @param {string} props.label - The text label displayed on the button.
 * @param {Object} props.icon - Object containing information about the icon to be displayed,
 *                               including the name, library, size, and color.
 *                               Example: { name: "star", library: "FontAwesome", size: 18, color: "white" }
 * @param {boolean} [props.backgroundColor=true] - Boolean indicating whether to apply background color to the button.
 *                                                  Defaults to true.
 * @param {boolean} [props.disabled=false] - Boolean indicating whether the button is disabled.
 * @param {Object} [props.style] - Additional styles to be applied to the button.
 * @param {Object} [props.labelStyle] - Additional styles to be applied to the button label.
 * @returns {JSX.Element} - Rendered component.
 */
const CustomButton = ({
  onPress,
  label,
  icon,
  backgroundColor = true,
  disabled = false,
  style,
  labelStyle,
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

  // Define the icon component based on the library provided in the icon prop
  let IconComponent;
  switch (icon.library) {
    case "FontAwesome":
      IconComponent = FontAwesome;
      break;
    case "Ionicons":
      IconComponent = Ionicons;
      break;
    case "MaterialCommunityIcons":
      IconComponent = MaterialCommunityIcons;
      break;
    case "MaterialIcons":
      IconComponent = MaterialIcons;
      break;
    default:
      IconComponent = FontAwesome; // Default to FontAwesome
  }

  // Apply opacity to the icon color if disabled
  let iconColor = icon.color || "white";
  const disabledColors = {
    blue: "#000080",
    green: "#008000",
    red: "#800000",
    "#005eb8": "#b0c4de",
  };

  if (disabled && disabledColors[iconColor]) {
    iconColor = disabledColors[iconColor] + disableOpacity;
  }

  return (
    <Pressable
      style={[
        styles.button,
        backgroundColor && {
          backgroundColor: pressed ? "#004080" : "#005eb8",
          opacity: disabled ? 0.5 : 1,
        },
        style, // Merge additional styles passed via props
      ]}
      onPress={handlePress}
      disabled={disabled}
    >
      {/* Icon component */}
      <IconComponent
        name={icon.name}
        size={icon.size || 18}
        color={iconColor}
        style={[styles.buttonIcon, style && style.icon]} // Merge icon styles
        accessibilityLabel={`${label} button`}
      />
      {/* Text label */}
      <Text
        style={[
          styles.buttonLabel,
          !backgroundColor && styles.blackLabel,
          labelStyle,
        ]}
      >
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
