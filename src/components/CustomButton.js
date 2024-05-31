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
  icon = {}, // Default value to ensure it's always an object
  backgroundColor = true,
  disabled = false,
  style = {}, // Default value to ensure it's always an object
  labelStyle,
}) => {
  const [pressed, setPressed] = useState(false);

  /**
   * Callback function invoked when the button is pressed, invokes the onPress callback.
   */
  const handlePress = () => {
    onPress();
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
          opacity: pressed || disabled ? 0.5 : 1,
        },
        style, // Merge additional styles passed via props
      ]}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={handlePress}
      disabled={disabled}
    >
      {/* Icon component */}
      {icon.name && (
        <IconComponent
          name={icon.name}
          size={icon.size || 18}
          color={iconColor}
          style={[
            styles.buttonIcon,
            style && style.icon,
            { opacity: pressed || disabled ? 0.5 : 1 },
          ]} // Merge icon styles
          accessibilityLabel={`${label} button`}
        />
      )}
      {/* Text label */}
      <Text
        style={[
          styles.buttonLabel,
          !backgroundColor && { color: "black" },
          labelStyle,
          { opacity: pressed || disabled ? 0.5 : 1 },
        ]}
        numberOfLines={1}
        ellipsizeMode="tail"
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
    paddingHorizontal: "2%",
  },
  buttonIcon: {
    marginRight: 5,
  },
  buttonLabel: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default CustomButton;
