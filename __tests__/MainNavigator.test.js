import React from "react";
import { render, screen, waitFor } from "@testing-library/react-native";
import { MockLoggedInUserInfoProvider } from "./mock/MockLoggedInUserInfoProvider";
import MainNavigator from "../src/navigation/MainNavigator";

describe("MainNavigator", () => {
  /**
   * Test Case 1.1: Renders the Login Screen Initially
   * Ensures that the initial screen shown by the MainNavigator is the Login screen.
   */
  it("renders the Login screen initially", async () => {
    render(
      <MockLoggedInUserInfoProvider>
        <MainNavigator />
      </MockLoggedInUserInfoProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("login-screen")).toBeTruthy();
    });
  });

  /**
   * Test Case 2.1: Logs on Mounting and Unmounting
   * Verifies that logs are correctly printed when the MainNavigator is mounted and unmounted.
   */
  it("logs on mounting and unmounting", () => {
    console.debug = jest.fn(); // Mock console.debug to track calls

    // Render the MainNavigator within the MockLoggedInUserInfoProvider
    const { unmount } = render(
      <MockLoggedInUserInfoProvider>
        <MainNavigator />
      </MockLoggedInUserInfoProvider>
    );

    // Verify that the log for mounting has been called
    expect(console.debug).toHaveBeenCalledWith("MainNavigator mounted");

    // Unmount the component to trigger the cleanup effect
    unmount();

    // Verify that the log for unmounting has been called
    expect(console.debug).toHaveBeenCalledWith("MainNavigator unmounted");
  });

  /**
   * Test Case 3.1: Snapshot Testing
   * Ensures that the MainNavigator component matches its snapshot for regression testing.
   */
  it("matches snapshot", () => {
    const tree = render(
      <MockLoggedInUserInfoProvider>
        <MainNavigator />
      </MockLoggedInUserInfoProvider>
    ).toJSON();
    expect(tree).toMatchSnapshot(); // Compare rendered output with the saved snapshot
  });
});
