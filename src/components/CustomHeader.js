import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * HeaderItem component represents a touchable component in the header.
 *
 * @component
 *
 * @param {object} props - The properties of the HeaderItem component.
 * @param {JSX.Element} props.child - The child element (component content).
 * @param {function} props.onPress - The callback function to be executed when the component is pressed.
 *
 * @returns {JSX.Element} Returns a TouchableOpacity component.
 */
const HeaderItem = ({ child, onPress }) => {
  return <TouchableOpacity onPress={onPress}>{child}</TouchableOpacity>;
};

/**
 * Header component represents a customizable header with left, middle, and right components.
 *
 * @component
 *
 * @param {object} props - The properties of the Header component.
 * @param {object} props.leftComponent - The configuration object for the left component in the header.
 * @param {function} props.leftComponent.onPress - The callback function to be executed when the left component is pressed.
 * @param {JSX.Element} props.leftComponent.child - The child element of the left component.
 * @param {object} props.rightComponent - The configuration object for the right component in the header.
 * @param {function} props.rightComponent.onPress - The callback function to be executed when the right component is pressed.
 * @param {JSX.Element} props.rightComponent.child - The child element of the right component.
 * @param {JSX.Element} props.middleComponent - The child element in the middle of the header.
 *
 * @returns {JSX.Element} Returns a View component representing the header.
 */
const CustomHeader = ({
  leftComponent = {},
  rightComponent = {},
  middleComponent = {},
}) => {
  return (
    <SafeAreaView>
      <View style={styles.container}>
        {leftComponent && (
          <View style={styles.leftComponent}>
            <HeaderItem
              onPress={leftComponent.onPress}
              child={leftComponent.child}
            />
          </View>
        )}
        {middleComponent && (
          <View style={styles.middleComponent}>{middleComponent}</View>
        )}
        {rightComponent && (
          <View style={styles.rightComponent}>
            <HeaderItem
              onPress={rightComponent.onPress}
              child={rightComponent.child}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: "#005eb8",
  },
  leftComponent: {
    flex: 1,
    alignItems: "flex-start",
  },
  rightComponent: {
    flex: 1,
    alignItems: "flex-end",
  },
  middleComponent: {
    flex: 3,
    alignItems: "center",
  },
});

export default CustomHeader;
