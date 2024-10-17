// Third-party libraries
import "@testing-library/jest-native/extend-expect";
import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";

// Setup and mocks
import "./config/setupTests.js";
import {
  mockNavigation,
  MockNavigationContainer,
} from "./mock/mockNavigation.js";
import { MockLoggedInUserInfoProvider } from "./mock/MockLoggedInUserInfoProvider.js";
import { MockRequestQueueProvider } from "./mock/MockRequestQueueProvider.js";
import { translations } from "./config/testTranslations.js";

import User from "../src/screens/User.js";
import { parseUserComms } from "../src/utils/UserUtils.js";

describe("User Component", () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Clear previous mocks before each test
  });

  // Mock user communications data with available email and phone
  const mockLoggedInUserCommsData = {
    "Person-comms": [
      { type: "email", addressOrNumber: "test@example.com" },
      { type: "mobile", addressOrNumber: "1234567890" },
    ],
  };

  // Mock user communications data without any entries
  const mockLoggedInUserWithoutCommsData = {
    "Person-comms": [],
  };

  // Mock user data with complete user information
  const mockLoggedInUserInfo = {
    loggedInUserInfo: {
      workScheduleName: "Work Schedule Name",
      hireDate: "01-01-2020",
    },
    setLoggedInUserInfo: jest.fn(), // Mock function for setting user info
  };

  // Mock user data without any user information
  const mockLoggedInUserWithoutInfo = {
    loggedInUserInfo: {}, // No user info
    setLoggedInUserInfo: jest.fn(),
  };

  // Utility function to render User component with necessary context
  const renderUser = (mockValue = mockLoggedInUserInfo, user = {}) => {
    const mockRoute = {
      params: {
        user: user,
      },
    };

    return render(
      <MockNavigationContainer>
        <MockLoggedInUserInfoProvider mockValue={mockValue}>
          <MockRequestQueueProvider>
            <User route={mockRoute} navigation={mockNavigation} />
          </MockRequestQueueProvider>
        </MockLoggedInUserInfoProvider>
      </MockNavigationContainer>
    );
  };

  /**
   * Test Case 1: Renders the User component correctly with user information
   * Ensures that the User component renders all expected user information and UI elements.
   */
  it("should render the User component correctly with user information", async () => {
    // Arrange: Render the User component with user data
    renderUser(mockLoggedInUserInfo, mockLoggedInUserCommsData);

    // Act: Check that email, phone, work schedule, hire date and others are rendered
    const { userEmail, userPhone } = parseUserComms(mockLoggedInUserCommsData);
    const emailLabel = screen.getByLabelText("Email label");
    const phoneLabel = screen.getByLabelText("Phone label");
    const workScheduleLabel = screen.getByLabelText("Work schedule label");
    const hireDateLabel = screen.getByLabelText("Hire date label");
    const toggleOfflineLabel = screen.getByLabelText(
      "Enable request queue label"
    );
    const toggleOfflineSwitch = screen.getByRole("switch");
    const languagePicker = screen.getByTestId("language-picker");
    const saveCancelBar = screen.getByTestId("save-cancel-bar");

    // Assert: Check that the expected outcome occurred
    expect(emailLabel).toBeTruthy();
    expect(phoneLabel).toBeTruthy();
    expect(workScheduleLabel).toBeTruthy();
    expect(hireDateLabel).toBeTruthy();
    expect(toggleOfflineLabel).toBeTruthy();
    expect(toggleOfflineSwitch).toBeTruthy();
    expect(languagePicker).toBeTruthy();
    expect(userEmail).toBeTruthy();
    expect(userPhone).toBeTruthy();
    expect(saveCancelBar).toBeTruthy();
  });

  /**
   * Test Case 2: Renders the User component correctly without user information
   * Ensures that the User component renders all expected user information and UI elements.
   */
  it("should render the User component correctly without user information", async () => {
    // Arrange: Render the User component with mock user data that has no info
    renderUser(mockLoggedInUserWithoutInfo, mockLoggedInUserWithoutCommsData);

    // Act: Check that email, phone, work schedule, hire date and others are not rendered
    const emailLabel = screen.queryByLabelText("Email label");
    const phoneLabel = screen.queryByLabelText("Phone label");
    const workScheduleLabel = screen.queryByLabelText("Work schedule label");
    const hireDateLabel = screen.queryByLabelText("Hire date label");

    // Assert: Check that the expected outcome occurred. Expecting null for all variables since no user data should be rendered.
    expect(emailLabel).toBeNull();
    expect(phoneLabel).toBeNull();
    expect(workScheduleLabel).toBeNull();
    expect(hireDateLabel).toBeNull();
  });

  /**
   * Test Case 3: Sets the header options correctly using navigation.setOptions
   * Ensures that navigation.setOptions is called with the correct options when the component mounts.
   */
  it("should set the correct header options when the User component mounts", () => {
    // Arrange: Mock the necessary functions
    const setOptionsSpy = jest.spyOn(mockNavigation, "setOptions");

    // Act: Render the User component
    renderUser();

    // Assert: Verify that navigation.setOptions was called with the correct arguments
    expect(setOptionsSpy).toHaveBeenCalledWith({
      headerTitle: translations.user_preference,
      headerRight: expect.any(Function), // Use expect.any(Function) to allow any function reference
    });
  });

  /**
   * Test Case 4: Toggling the "Enable request queue" switch
   * Ensures that the toggle switch updates the request queue state correctly.
   */
  it("should toggle the request queue switch", async () => {
    // Arrange: Render the User component with initial state
    renderUser();

    // Act: Find the switch and verify its initial state
    const toggleOfflineSwitch = screen.getByRole("switch");

    // Check initial state
    expect(toggleOfflineSwitch.props.value).toBe(false); // Initial state should be false

    // Simulate toggling the switch by triggering the valueChange event
    fireEvent(toggleOfflineSwitch, "valueChange", true);

    // Assert: Wait for the switch to update
    await waitFor(() => {
      expect(toggleOfflineSwitch.props.value).toBe(true); // Now it should be true
    });
  });
});
