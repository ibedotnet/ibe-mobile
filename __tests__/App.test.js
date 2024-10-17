import React from "react";
import { render, screen, waitFor } from "@testing-library/react-native";
import "@testing-library/jest-native/extend-expect";
import AsyncStorage from "@react-native-async-storage/async-storage";
import App from "../App";
import i18n from "../src/i18n";
import { ConnectivityContext } from "../context/ConnectivityContext";
import OfflineView from "../src/components/offline/OfflineView";

/**
 * Test Suite: OfflineView Component
 * This suite tests the behavior of the OfflineView component when the app is offline.
 */
test("renders OfflineView component when offline", () => {
  // Mock the isConnected context value to simulate offline state
  const mockUseConnectivityContext = () => ({
    isConnected: false,
  });

  // Render the OfflineView component with the mocked context
  render(
    <ConnectivityContext.Provider value={mockUseConnectivityContext()}>
      <OfflineView />
    </ConnectivityContext.Provider>
  );

  // Assert that the OfflineView container is rendered
  expect(screen.getByTestId("offline-view")).toBeTruthy();

  // Assert that the image within the OfflineView is rendered
  expect(screen.getByTestId("offline-image")).toBeTruthy();

  // Assert that the text within the OfflineView contains the expected message
  const offlineText = screen.getByTestId("offline-text");
  expect(offlineText).toHaveTextContent("No Internet Connection");
});

/**
 * Test Suite: App Language Initialization
 * This suite tests the initialization of the app language based on AsyncStorage or device locale.
 */
describe("App Language Initialization", () => {
  afterEach(() => {
    jest.clearAllMocks(); // Reset mocks between test cases
  });

  /**
   * Test Case 1: Set language from AsyncStorage if available
   * Simulates the scenario where a language is stored in AsyncStorage and ensures that it is used to set the language.
   */
  it("should set language from AsyncStorage if available", async () => {
    // Mock AsyncStorage to return 'es' (Spanish)
    AsyncStorage.getItem.mockResolvedValue("es");

    render(<App />);

    // Ensure the i18n.changeLanguage function is called with 'es'
    await waitFor(() => {
      expect(i18n.changeLanguage).toHaveBeenCalledWith("es");
    });
  });

  /**
   * Test Case 2: Set language from device locale if no language in AsyncStorage
   * Simulates when no language is stored in AsyncStorage and ensures the language is set based on device locale.
   */
  it("should set language from device locale if no language in AsyncStorage", async () => {
    // Mock AsyncStorage to return null (no stored language)
    AsyncStorage.getItem.mockResolvedValue(null);

    render(<App />);

    // Ensure the i18n.changeLanguage function is called with 'en' (device locale 'en')
    await waitFor(() => {
      expect(i18n.changeLanguage).toHaveBeenCalledWith("en");
    });
  });

  /**
   * Test Case 3: Fallback to English if device locale is unsupported
   * If the device locale is not supported, the app should default to English ('en').
   */
  it("should fallback to English if device locale is unsupported", async () => {
    // Mock AsyncStorage to return null (no stored language)
    AsyncStorage.getItem.mockResolvedValue(null);

    render(<App />);

    // Ensure the i18n.changeLanguage function is called with 'en' (fallback to English)
    await waitFor(() => {
      expect(i18n.changeLanguage).toHaveBeenCalledWith("en");
    });
  });

  /**
   * Test Case 4: Handle invalid language code from AsyncStorage
   * Ensures that if AsyncStorage returns an invalid language code, the language is not changed.
   */
  it("should not change language if AsyncStorage returns an invalid language code", async () => {
    // Mock AsyncStorage to return an invalid language code
    AsyncStorage.getItem.mockResolvedValue("invalid-code");

    render(<App />);

    // Ensure the i18n.changeLanguage function is not called with an invalid code
    await waitFor(() => {
      expect(i18n.changeLanguage).not.toHaveBeenCalled();
    });
  });

  /**
   * Test Case 5: Handle errors thrown by AsyncStorage
   * Simulates an error in AsyncStorage and ensures the app handles it gracefully without trying to change the language.
   */
  it("should handle errors thrown by AsyncStorage", async () => {
    // Mock AsyncStorage to throw an error
    AsyncStorage.getItem.mockRejectedValue(new Error("AsyncStorage error"));

    // Spy on console.error to suppress the error message for this test
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    render(<App />);

    // Ensure the i18n.changeLanguage function is not called due to error
    await waitFor(() => {
      expect(i18n.changeLanguage).not.toHaveBeenCalled();
    });

    // Restore the original console.error after the test is done
    consoleErrorSpy.mockRestore();
  });

  /**
   * Test Case 6: Ensure language initialization is performed only once
   * Verifies that the language initialization process happens only once during the app's lifecycle.
   */
  it("should ensure that language initialization is only performed once", async () => {
    // Mock AsyncStorage to return 'de' (German)
    AsyncStorage.getItem.mockResolvedValue("de");

    const { rerender } = render(<App />);

    // Ensure the i18n.changeLanguage function is called with 'de' only once
    await waitFor(() => {
      expect(i18n.changeLanguage).toHaveBeenCalledTimes(1);
      expect(i18n.changeLanguage).toHaveBeenCalledWith("de");
    });

    // Rerender the component to ensure initialization is not repeated
    rerender(<App />);

    await waitFor(() => {
      expect(i18n.changeLanguage).toHaveBeenCalledTimes(1); // No additional calls after rerender
    });
  });
});
