import { Dimensions } from "react-native";

const screenDimension = {
  width: Dimensions.get("window").width,
  height: Dimensions.get("window").height,
};

// Define breakpoints
const isSmallDevice = screenDimension.width < 375;
const isMediumDevice =
  screenDimension.width >= 375 && screenDimension.width < 768;
const isLargeDevice = screenDimension.width >= 768;

export { isLargeDevice, isMediumDevice, isSmallDevice, screenDimension };