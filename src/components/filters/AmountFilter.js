import React, { useState } from "react";
import { View, Text, Button } from "react-native";
import CustomTextInput from "../CustomTextInput";

const AmountFilter = ({ onFilter }) => {
  const [lessThan, setLessThan] = useState("");
  const [greaterThan, setGreaterThan] = useState("");

  const handleFilter = () => {
    // Convert input values to numbers if needed
    const lessThanValue = parseFloat(lessThan);
    const greaterThanValue = parseFloat(greaterThan);

    // Validate input values
    if (!isNaN(lessThanValue) && !isNaN(greaterThanValue)) {
      // Pass the filter values to the parent component
      onFilter({ lessThan: lessThanValue, greaterThan: greaterThanValue });
    } else {
      alert("Please enter valid numbers");
    }
  };

  return (
    <View>
      <Text>Amount Filter</Text>
      <View>
        <Text>Less Than:</Text>
        <CustomTextInput
          keyboardType="numeric"
          placeholder="Enter amount"
          value={lessThan}
          onChangeText={(text) => setLessThan(text)}
          showClearButton={false}
        />
      </View>
      <View>
        <Text>Greater Than:</Text>
        <CustomTextInput
          keyboardType="numeric"
          placeholder="Enter amount"
          value={greaterThan}
          onChangeText={(text) => setGreaterThan(text)}
          showClearButton={false}
        />
      </View>
      <Button title="Apply Filter" onPress={handleFilter} />
    </View>
  );
};

export default AmountFilter;
