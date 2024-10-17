import React, { useContext, useState } from "react";
import RequestQueueContext from "../../context/RequestQueueContext";

/**
 * MockRequestQueueProvider Component
 *
 * This component provides a mock implementation of the RequestQueueContext
 * for testing purposes. It holds the state indicating whether the request
 * queue is enabled and provides a function to update this state.
 *
 * @param {Object} props - The component props.
 * @param {React.ReactNode} props.children - The child components that will consume the context.
 * @returns {JSX.Element} The context provider wrapping the child components.
 */
export const MockRequestQueueProvider = ({ children }) => {
  // State to hold whether the request queue is enabled
  const [isRequestQueueEnabled, setIsRequestQueueEnabled] = useState(false);

  return (
    // Provide the state and setter function to the context
    <RequestQueueContext.Provider
      value={{ isRequestQueueEnabled, setIsRequestQueueEnabled }}
    >
      {children}
      {/* Render the child components that will consume this context */}
    </RequestQueueContext.Provider>
  );
};

/**
 * useRequestQueueContext Hook
 *
 * This custom hook allows components to access the request queue context
 * easily without the need to use the context API directly.
 *
 * It throws an error if used outside of a MockRequestQueueProvider, ensuring
 * that components can safely rely on the context being available.
 *
 * @returns {Object} The current context value containing the request queue state and its setter function.
 * @throws {Error} If called outside of a MockRequestQueueProvider.
 */
export const useRequestQueueContext = () => {
  const context = useContext(RequestQueueContext);
  if (!context) {
    throw new Error(
      "useRequestQueueContext must be used within a MockRequestQueueProvider"
    );
  }
  return context;
};