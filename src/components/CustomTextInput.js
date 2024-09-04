import React from "react";
import { TextInput, View, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

/**
 * CustomTextInput Component
 *
 * @param {string} value - The text input value.
 * @param {function} onChangeText - Callback to handle text input change.
 * @param {string} placeholder - Placeholder text for the input.
 * @param {string} placeholderTextColor - Color of the placeholder text.
 * @param {boolean} editable - If false, the text input is not editable.
 * @param {object} containerStyle - Custom styles for the input container.
 * @param {object} inputStyle - Custom styles for the text input.
 * @param {object} clearButtonStyle - Custom styles for the clear button.
 * @param {boolean} showSearchIcon - If true, shows a search icon.
 * @param {function} onSearchPress - Callback to handle search icon press.
 * @param {object} searchIconStyle - Custom styles for the search button.
 * @param {boolean} searchButtonDisabled - If true, disables the search button.
 * @param {boolean} showClearButton - If true, shows a clear button.
 * @param {boolean} forceEnableClearButton - If true, overrides the editable prop to always show the clear button.
 * @param {string} keyboardType - Type of keyboard to use for the input.
 * @param {boolean} multiline - If true, allows multiple lines of input.
 *
 * @returns {React.Component} CustomTextInput component.
 */
const CustomTextInput = ({
  value = "",
  onChangeText,
  placeholder = "Enter text...",
  placeholderTextColor,
  editable = true,
  containerStyle = {},
  inputStyle = {},
  clearButtonStyle = {},
  showSearchIcon = false,
  onSearchPress,
  searchIconStyle = {},
  searchButtonDisabled = false,
  showClearButton = true,
  forceEnableClearButton = false,
  keyboardType = "default",
  multiline = false,
}) => {
  // Handler to clear the text input
  const handleClear = () => {
    onChangeText("");
  };

  const isClearButtonEnabled = forceEnableClearButton ? true : editable;

  return (
    <View style={[styles.container, containerStyle]}>
      <TextInput
        style={[styles.input, inputStyle, !editable && styles.disabledInput]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor}
        editable={editable}
        keyboardType={keyboardType}
        multiline={multiline}
      />

      {/* Show clear button if enabled, editable, and value is not empty */}
      {showClearButton && isClearButtonEnabled && value.length > 0 && (
        <TouchableOpacity
          onPress={handleClear}
          style={[styles.clearButton, clearButtonStyle]}
        >
          <Ionicons name="close-circle" size={24} color="blue" />
        </TouchableOpacity>
      )}

      {/* Show search icon if enabled */}
      {showSearchIcon && (
        <TouchableOpacity
          onPress={!searchButtonDisabled ? onSearchPress : null}
          style={[
            styles.searchButton,
            searchIconStyle,
            searchButtonDisabled && styles.disabledButton,
          ]}
          disabled={searchButtonDisabled}
        >
          <MaterialCommunityIcons name="text-search" size={26} color="blue" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    padding: 5,
  },
  input: {
    flex: 1,
    padding: 10,
  },
  clearButton: {
    padding: 5,
  },
  searchButton: {
    padding: 10,
  },
  disabledButton: {
    opacity: 0.6,
  },
  disabledInput: {
    opacity: 0.6,
    color: "black",
  },
});

export default CustomTextInput;
