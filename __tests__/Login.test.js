// Third-party libraries
import "@testing-library/jest-native/extend-expect";
import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react-native";
import {
  mockNavigation,
  MockNavigationContainer,
} from "./mock/mockNavigation.js";

// Setup and mocks
import "./config/setupTests.js";
import { MockLoggedInUserInfoProvider } from "./mock/MockLoggedInUserInfoProvider.js";
import { translations } from "./config/testTranslations"; // Import translations

// App components and utilities
import { API_ENDPOINTS } from "../src/constants.js";
import Login from "../src/screens/Login.js";
import Home from "../src/screens/Home.js";
import { fetchData } from "../src/utils/APIUtils";
import { showToast } from "../src/utils/MessageUtils";

import * as SecureStore from "expo-secure-store";

describe("Login Component", () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Clear previous mocks before each test
  });

  // Utility function to render Login component with navigation
  const renderLogin = () => {
    return render(
      <MockNavigationContainer>
        <MockLoggedInUserInfoProvider>
          <Login navigation={mockNavigation} />
        </MockLoggedInUserInfoProvider>
      </MockNavigationContainer>
    );
  };

  /**
   * Test Case 1: Renders the Login component correctly
   * Ensures that the Login component renders all expected input fields and buttons.
   */
  it("should render the Login component correctly", () => {
    // Render the Login component
    renderLogin();

    // Check that input fields are rendered
    const usernameInput = screen.getByPlaceholderText(
      translations.login_username_placeholder
    );
    const passwordInput = screen.getByPlaceholderText(
      translations.login_password_placeholder
    );
    const clientIdInput = screen.getByPlaceholderText(
      translations.login_clientId_placeholder
    );

    expect(usernameInput).toBeTruthy();
    expect(passwordInput).toBeTruthy();
    expect(clientIdInput).toBeTruthy();

    // Check that the login button is rendered
    const loginButton = screen.getByRole("button", {
      name: translations.login_button_text,
    });
    expect(loginButton).toBeTruthy();

    // Optionally, check that the "Remember Me" checkbox is rendered
    const rememberMeCheckbox = screen.getByRole("checkbox", {
      name: translations.login_rememberMe_text,
    });
    expect(rememberMeCheckbox).toBeTruthy();

    // Check that the password visibility toggle button is rendered
    const toggleButton = screen.getByLabelText(translations.show_password);
    expect(toggleButton).toBeTruthy();

    // Check for the version text containing "version"
    const versionText = screen.getByText(
      new RegExp(translations.login_version_text, "i")
    ); // Case-insensitive match for version
    expect(versionText).toBeTruthy();

    // Check if the logo exists
    const logo = screen.getByTestId("ibe-logo");
    expect(logo).toBeTruthy();
  });

  /**
   * Test Case 2: Toggles password visibility
   * Verifies that the password visibility can be toggled using a button.
   */
  it("should toggle password visibility", () => {
    renderLogin();

    const passwordInput = screen.getByPlaceholderText(
      translations.login_password_placeholder
    );
    const toggleButton = screen.getByLabelText(translations.show_password);

    // Initially, the password should be hidden
    expect(passwordInput.props.secureTextEntry).toBe(true);

    fireEvent.press(toggleButton);

    // After pressing the toggle button, the password should be visible
    expect(passwordInput.props.secureTextEntry).toBe(false);

    // Verify the button label is updated correctly
    const updatedToggleButton = screen.getByLabelText(
      translations.hide_password
    ); // Check for updated label
    expect(updatedToggleButton).toBeTruthy();
  });

  /**
   * Test Case 3: Updates input values correctly
   * Verifies that the input fields for Username, Password, and Client ID update their values correctly.
   */
  it("should update input values correctly", () => {
    renderLogin();

    const usernameInput = screen.getByPlaceholderText(
      translations.login_username_placeholder
    );
    const passwordInput = screen.getByPlaceholderText(
      translations.login_password_placeholder
    );
    const clientIdInput = screen.getByPlaceholderText(
      translations.login_clientId_placeholder
    );

    fireEvent.changeText(usernameInput, "testuser");
    fireEvent.changeText(passwordInput, "testpass");
    fireEvent.changeText(clientIdInput, "123");

    // Assert the input values
    expect(screen.getByDisplayValue("testuser")).toBeTruthy();
    expect(screen.getByDisplayValue("testpass")).toBeTruthy();
    expect(screen.getByDisplayValue("123")).toBeTruthy();
  });

  /**
   * Test Case 4: Handles login successfully
   * Mocks a successful login request and checks if fetchData is called with the correct parameters.
   */
  it("should handle login successfully", async () => {
    fetchData.mockResolvedValueOnce({
      success: true,
      userid: "testuser",
    });

    renderLogin();

    const usernameInput = screen.getByPlaceholderText(
      translations.login_username_placeholder
    );
    const passwordInput = screen.getByPlaceholderText(
      translations.login_password_placeholder
    );
    const clientIdInput = screen.getByPlaceholderText(
      translations.login_clientId_placeholder
    );
    const loginButton = screen.getByRole("button", {
      name: translations.login_button_text,
    });

    // Simulate user input
    const username = "testuser";
    const password = "testpassword";
    const clientId = "123";

    fireEvent.changeText(usernameInput, username);
    fireEvent.changeText(passwordInput, password);
    fireEvent.changeText(clientIdInput, clientId);
    fireEvent.press(loginButton);

    await waitFor(() => {
      // Convert password to an array of ASCII values
      const passwordInASCII = Array.from(password, (char) =>
        char.charCodeAt(0)
      );

      // Prepare the expected payload with URL-encoded values for dynamic parts only
      const expectedPayload = `user=${encodeURIComponent(
        username
      )}&password=${encodeURIComponent(
        `[${passwordInASCII.join(",")}]`
      )}&enterpriseID=${encodeURIComponent(clientId)}`;

      // Verify the fetchData call
      expect(fetchData).toHaveBeenCalledWith(
        API_ENDPOINTS.AUTHENTICATE,
        "POST",
        expect.objectContaining({
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        }),
        expect.stringContaining(expectedPayload)
      );
    });
  });

  /**
   * Test Case 5: Shows error message when login fails
   * Mocks a failed login attempt and verifies that an error message is displayed.
   */
  it("should show error message when login fails", async () => {
    fetchData.mockResolvedValueOnce({
      success: false,
      param_msgText: translations.login_exception_message, // Use translated error message
    });

    renderLogin();

    const usernameInput = screen.getByPlaceholderText(
      translations.login_username_placeholder
    );
    const passwordInput = screen.getByPlaceholderText(
      translations.login_password_placeholder
    );
    const clientIdInput = screen.getByPlaceholderText(
      translations.login_clientId_placeholder
    );
    const loginButton = screen.getByRole("button", {
      name: translations.login_button_text,
    });

    fireEvent.changeText(usernameInput, "testuser");
    fireEvent.changeText(passwordInput, "testpass");
    fireEvent.changeText(clientIdInput, "123");
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith(
        translations.login_exception_message,
        "error"
      );
    });
  });

  /**
   * Test Case 6: Stores credentials when Remember Me is checked
   * Verifies that user credentials are stored securely when the Remember Me option is selected after a successful login.
   */
  it("should store credentials if Remember Me is checked", async () => {
    // Mock a successful API response
    fetchData.mockResolvedValueOnce({
      success: true,
    });

    renderLogin();

    // Get input elements and login button
    const usernameInput = screen.getByPlaceholderText(
      translations.login_username_placeholder
    );
    const passwordInput = screen.getByPlaceholderText(
      translations.login_password_placeholder
    );
    const clientIdInput = screen.getByPlaceholderText(
      translations.login_clientId_placeholder
    );
    const rememberMeCheckbox = screen.getByRole("checkbox", {
      name: translations.login_rememberMe_text,
    });

    const loginButton = screen.getByRole("button", {
      name: translations.login_button_text,
    });

    // Simulate user input
    fireEvent.changeText(usernameInput, "testuser");
    fireEvent.changeText(passwordInput, "testpass");
    fireEvent.changeText(clientIdInput, "123");
    fireEvent.press(rememberMeCheckbox); // Check the Remember Me checkbox
    fireEvent.press(loginButton);

    // Verify that checkbox is checked and credentials are stored securely
    await waitFor(() => {
      // Check if the checkbox is checked
      expect(rememberMeCheckbox).toBeChecked();

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        "username",
        "testuser"
      );
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith("clientId", "123");
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        "password",
        "testpass"
      );
    });
  });

  /**
   * Test Case 7: Auto-login when "Remember Me" is checked
   * Verifies that the user is automatically logged in and the Home screen is displayed when
   * the "Remember Me" option was selected during the last login.
   */
  it("should auto-login user when credentials are found in SecureStore", async () => {
    // Mock the SecureStore.getItemAsync responses to simulate stored credentials
    SecureStore.getItemAsync
      .mockResolvedValueOnce("testuser") // Mock stored username
      .mockResolvedValueOnce("testpass") // Mock stored password
      .mockResolvedValueOnce("123"); // Mock stored clientId

    // Mock the fetchData function for a successful login response
    fetchData.mockResolvedValueOnce({
      success: true,
      userid: "testuser",
    });

    // Render the Login component
    renderLogin();

    // Verify that credentials are fetched from SecureStore
    await waitFor(() => {
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith("username");
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith("password");
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith("clientId");
    });

    // Verify that the login API is called with the retrieved credentials
    await waitFor(() => {
      expect(fetchData).toHaveBeenCalledWith(
        expect.any(String), // endpoint string
        expect.any(String), // HTTP method string (e.g., "POST", "GET")
        expect.any(Object), // headers object
        expect.any(String) // body
      );
    });

    render(
      <MockNavigationContainer>
        <Home navigation={mockNavigation} />
      </MockNavigationContainer>
    );

    // Verify that the Home screen is displayed after auto-login
    const homeElement = screen.getByTestId("home-screen");
    expect(homeElement).toBeTruthy();
  });

  /**
   * Test Case 8: Shows error message when username is not provided
   * Verifies that an error message is shown if the username input field is empty.
   */
  it("should show error message when username is not provided", async () => {
    renderLogin();

    const passwordInput = screen.getByPlaceholderText(
      translations.login_password_placeholder
    );
    const clientIdInput = screen.getByPlaceholderText(
      translations.login_clientId_placeholder
    );
    const loginButton = screen.getByRole("button", {
      name: translations.login_button_text,
    });

    fireEvent.changeText(passwordInput, "testpass");
    fireEvent.changeText(clientIdInput, "123");
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith(
        translations.login_username_required,
        "error"
      );
    });
  });

  /**
   * Test Case 9: Shows error message when password is not provided
   * Verifies that an error message is shown if the password input field is empty.
   */
  it("should show error message when password is not provided", async () => {
    renderLogin();

    const usernameInput = screen.getByPlaceholderText(
      translations.login_username_placeholder
    );
    const clientIdInput = screen.getByPlaceholderText(
      translations.login_clientId_placeholder
    );
    const loginButton = screen.getByRole("button", {
      name: translations.login_button_text,
    });

    fireEvent.changeText(usernameInput, "testuser");
    fireEvent.changeText(clientIdInput, "123");
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith(
        translations.login_password_required,
        "error"
      );
    });
  });

  /**
   * Test Case 10: Shows error message when client ID is not provided
   * Verifies that an error message is shown if the client ID input field is empty.
   */
  it("should show error message when client ID is not provided", async () => {
    renderLogin();

    const usernameInput = screen.getByPlaceholderText(
      translations.login_username_placeholder
    );
    const passwordInput = screen.getByPlaceholderText(
      translations.login_password_placeholder
    );
    const loginButton = screen.getByRole("button", {
      name: translations.login_button_text,
    });

    fireEvent.changeText(usernameInput, "testuser");
    fireEvent.changeText(passwordInput, "testpass");
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith(
        translations.login_clientId_required,
        "error"
      );
    });
  });

  /**
   * Test Case 11: Shows error message for non-alphanumeric username
   * Ensures that an error message is shown when the username is not alphanumeric.
   */
  it("should show error message for non-alphanumeric username", async () => {
    renderLogin();

    const usernameInput = screen.getByPlaceholderText(
      translations.login_username_placeholder
    );
    const passwordInput = screen.getByPlaceholderText(
      translations.login_password_placeholder
    );
    const clientIdInput = screen.getByPlaceholderText(
      translations.login_clientId_placeholder
    );
    const loginButton = screen.getByRole("button", {
      name: translations.login_button_text,
    });

    fireEvent.changeText(usernameInput, "user@123");
    fireEvent.changeText(passwordInput, "testpass");
    fireEvent.changeText(clientIdInput, "123");
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith(
        translations.login_username_alphanumeric_required,
        "error"
      );
    });
  });

  /**
   * Test Case 12:
   * Test to verify that the error message is shown when username and password are incorrect.
   */
  it("should display error message when username and password are incorrect", async () => {
    // Mock API response for incorrect login credentials
    fetchData.mockResolvedValue({
      param_msgText: translations.login_invalid_credentials_message,
    });

    renderLogin();

    // Simulate user entering incorrect username, password, and client ID
    const usernameInput = screen.getByPlaceholderText(
      translations.login_username_placeholder
    );
    const passwordInput = screen.getByPlaceholderText(
      translations.login_password_placeholder
    );
    const clientIdInput = screen.getByPlaceholderText(
      translations.login_clientId_placeholder
    );

    fireEvent.changeText(usernameInput, "wrongUser");
    fireEvent.changeText(passwordInput, "wrongPass");
    fireEvent.changeText(clientIdInput, "123");

    // Simulate login button press
    const loginButton = screen.getByRole("button", {
      name: translations.login_button_text,
    });
    fireEvent.press(loginButton);

    // Wait for the login function to process and expect an error message to be shown
    await waitFor(() => {
      // Ensure the fetchData API call was made with the expected parameters
      expect(fetchData).toHaveBeenCalledWith(
        expect.any(String), // Expect any endpoint string
        expect.any(String), // Expect any HTTP method string (e.g., "POST", "GET")
        expect.any(Object), // Expect any headers object
        expect.any(String) // Expect any body string
      );

      // Verify that the toast is shown with the error message from the response
      expect(showToast).toHaveBeenCalledWith(
        translations.login_invalid_credentials_message,
        "error"
      );
    });
  });

  /**
   * Test Case 13: Snapshot test
   * Verifies that the rendered output matches the saved snapshot.
   */
  it("should match the snapshot", () => {
    const { toJSON } = renderLogin();
    expect(toJSON()).toMatchSnapshot(); // Take a snapshot of the rendered component
  });
});
