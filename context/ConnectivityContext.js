import React, { createContext, useContext, useEffect, useState } from "react";
import NetInfo from "@react-native-community/netinfo";

/**
 * Context for managing network connectivity state.
 * @typedef {Object} ConnectivityContextType
 * @property {boolean} isConnected - Indicates whether the device is currently connected to the internet.
 */

/**
 * Context object for managing network connectivity state.
 * The context provides access to the network connectivity state.
 * @type {React.Context<ConnectivityContextType>}
 */
export const ConnectivityContext = createContext();

/**
 * Provider component for managing network connectivity state.
 * @param {Object} props - Component props.
 * @param {React.ReactNode} props.children - Child components wrapped by the provider.
 * @returns {JSX.Element} Provider component for managing connectivity context.
 */
export const ConnectivityProvider = ({ children }) => {
  // State variable to track network connectivity
  const [isConnected, setIsConnected] = useState(true); // Assuming initially connected

  useEffect(() => {
    // Function to handle changes in network connectivity
    const handleConnectivityChange = (state) => {
      setIsConnected(state.isConnected);
    };

    // Subscribe to network status changes
    const unsubscribe = NetInfo.addEventListener(handleConnectivityChange);

    // Cleanup function to unsubscribe from network status changes when the component unmounts
    return () => {
      unsubscribe();
    };
  }, []);

  // Provide connectivity context value to the wrapped components
  return (
    <ConnectivityContext.Provider value={{ isConnected }}>
      {children}
    </ConnectivityContext.Provider>
  );
};

/**
 * Hook for accessing the network connectivity context.
 * Returns an object containing the network connectivity state.
 * @returns {Object} An object containing the network connectivity state.
 * @property {boolean} isConnected - Indicates whether the device is currently connected to the internet.
 */
export const useConnectivityContext = () => useContext(ConnectivityContext);
