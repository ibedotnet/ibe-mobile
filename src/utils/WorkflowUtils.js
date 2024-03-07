import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, {
  Circle,
  Text as SvgText,
  Defs,
  Path,
  TextPath,
} from "react-native-svg";

const workflowLabelStamp = (text = "Hello", stampRadius = 24) => {
  const textPathId = "textPathCircle";

  return (
    <View style={styles.container}>
      <Svg height={stampRadius * 2} width={stampRadius * 2}>
        <Defs>
          <Path
            id={textPathId}
            d={`M${stampRadius},0 A${stampRadius},${stampRadius} 0 1,1 ${
              stampRadius * 2
            },0`}
          />
        </Defs>
        <Circle
          cx={stampRadius}
          cy={stampRadius}
          r={stampRadius}
          stroke="black"
          strokeWidth="2"
          fill="transparent"
        />
        <SvgText fontSize="16" fill="black">
          <TextPath href={`#${textPathId}`} startOffset="50%">
            {text}
          </TextPath>
        </SvgText>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
});

export default workflowLabelStamp;
