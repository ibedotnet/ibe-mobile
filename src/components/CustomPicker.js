import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Picker } from "@react-native-picker/picker";

const CustomPicker = ({ route, navigation }) => {
  const context = route?.params?.context ?? "";
  const items = route?.params?.items ?? [];

  const [selectedValue, setSelectedValue] = useState("");

  return (
    <View>
      <Picker
        selectedValue={selectedValue}
        onValueChange={(itemValue) => setSelectedValue(itemValue)}
        testID={`${context}_Picker`}
      >
        {items.map((item, index) => (
          <Picker.Item key={index} label={item.label} value={item.value} />
        ))}
      </Picker>
    </View>
  );
};

const styles = StyleSheet.create({});

export default CustomPicker;
