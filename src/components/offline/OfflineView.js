import React, { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { useConnectivityContext } from "../../../context/ConnectivityContext";

/**
 * Component to display an offline notice when the device loses internet connectivity.
 * It listens for network status changes via the ConnectivityContext and shows the offline notice accordingly.
 */
const OfflineView = () => {
  // Use the hook to access the isConnected state from the context
  const { isConnected } = useConnectivityContext(); // Call the hook to get the context value
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Update the state based on the isConnected value from the context
    setIsOffline(!isConnected);
  }, [isConnected]);

  // Render the offline notice if the device is offline
  if (isOffline)
    return (
      <View style={styles.container}>
        <Image
          style={styles.image}
          source={require("../../assets/images/offline.png")}
        />
        <Text style={styles.text}>No Internet Connection</Text>
      </View>
    );

  return null;
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    width: "100%",
    zIndex: 1,
  },
  image: {
    height: 200,
    width: 200,
  },
  text: {
    fontSize: 25,
  },
});

export default OfflineView;
