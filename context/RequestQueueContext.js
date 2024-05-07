import React, { createContext, useContext, useState } from "react";

/**
 * Context for managing the request queue state.
 * @typedef {Object} RequestQueueContextType
 * @property {boolean} isRequestQueueEnabled - Indicates whether the request queue feature is enabled.
 * @property {Function} setIsRequestQueueEnabled - Function to set the state of the request queue feature.
 */

// Create the RequestQueueContext
const RequestQueueContext = createContext();

/**
 * Provider component for managing the request queue state.
 * @param {Object} props - Component props.
 * @param {React.ReactNode} props.children - Child components wrapped by the provider.
 * @returns {JSX.Element} Provider component for managing request queue context.
 */
export const RequestQueueProvider = ({ children }) => {
  // State variable to track if the request queue feature is enabled
  const [isRequestQueueEnabled, setIsRequestQueueEnabled] = useState(false);

  // Create the context value
  const contextValue = {
    isRequestQueueEnabled,
    setIsRequestQueueEnabled,
  };

  // Provide the context value to the wrapped components
  return (
    <RequestQueueContext.Provider value={contextValue}>
      {children}
    </RequestQueueContext.Provider>
  );
};

/**
 * Hook for accessing the request queue context.
 * Returns an object containing the request queue state and methods to update it.
 * @returns {Object} An object containing the request queue state and methods to update it.
 * @property {boolean} isRequestQueueEnabled - Indicates whether the request queue feature is enabled.
 * @property {Function} setIsRequestQueueEnabled - Function to set the state of the request queue feature.
 */
export const useRequestQueueContext = () => useContext(RequestQueueContext);

export default RequestQueueContext;
