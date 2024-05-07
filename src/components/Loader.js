import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import PropTypes from "prop-types";

/**
 * Loader component displays an activity indicator with an optional background overlay.
 * 
 * @param {object} props - Component props.
 * @param {string|number} [props.size="large"] - The size of the activity indicator. 
 * Can be "small", "large", or a numeric value.
 * @param {string} [props.color="#0000ff"] - The color of the activity indicator.
 * 
 * @returns {JSX.Element} - Loader component.
 */
const Loader = ({ size = "large", color = "#0000ff" }) => (
  <View style={styles.loader}>
    <ActivityIndicator size={size} color={color} />
  </View>
);

/**
 * Prop types for the Loader component.
 * 
 * @property {string|number} [size="large"] - The size of the activity indicator.
 * @property {string} [color="#0000ff"] - The color of the activity indicator.
 */
Loader.propTypes = {
  size: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  color: PropTypes.string,
};

const styles = StyleSheet.create({
  loader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default Loader;
