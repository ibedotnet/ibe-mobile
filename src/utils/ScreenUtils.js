import { Dimensions } from "react-native";

const screenDimension = {
  width: Dimensions.get("window").width,
  height: Dimensions.get("window").height,
};

export { screenDimension };
