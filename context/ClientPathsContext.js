import React, { createContext, useContext, useState } from "react";

// Create a context for managing client paths.
const ClientPathsContext = createContext();

/**
 * ClientPathsProvider component to provide client paths context to its children.
 *
 * @param {React.ReactNode} children - The components that will consume this context.
 * @returns {JSX.Element} The context provider component.
 */
export const ClientPathsProvider = ({ children }) => {
  // State to hold the paths for the client logo, user photo, and user thumbnail.
  const [clientPaths, setClientPaths] = useState({
    clientLogoPath: null,
    userPhotoPath: null,
    userThumbnailPath: null,
  });

  return (
    <ClientPathsContext.Provider value={{ clientPaths, setClientPaths }}>
      {children}
    </ClientPathsContext.Provider>
  );
};

/**
 * Custom hook to use the ClientPathsContext.
 *
 * @returns {Object} An object containing clientPaths and setClientPaths.
 */
export const useClientPaths = () => useContext(ClientPathsContext);
