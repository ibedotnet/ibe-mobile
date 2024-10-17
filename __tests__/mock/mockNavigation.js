/**
 * Mocks commonly used navigation methods for testing purposes.
 *
 * This setup helps to mock navigation functionalities provided by React Navigation
 * so that navigation-related behavior can be tested without actually navigating
 * between screens. These mocks ensure that calls to `navigate`, `replace`, `goBack`,
 * and `setOptions`, among other navigation actions, can be tracked and asserted in your tests.
 */

// Import necessary dependencies from React Navigation
import { NavigationContainer } from "@react-navigation/native";

// Mock functions for the different navigation actions
const mockNavigate = jest.fn(); // Mock for 'navigate' action
const mockReplace = jest.fn(); // Mock for 'replace' action
const mockGoBack = jest.fn(); // Mock for 'goBack' action
const mockSetOptions = jest.fn(); // Mock for 'setOptions' action

/**
 * mockNavigation object
 *
 * Contains the mocked methods that are commonly used in React Navigation.
 * You can extend this object with any other navigation methods needed in your tests.
 */
const mockNavigation = {
  navigate: mockNavigate, // Mocked navigation method
  replace: mockReplace, // Mocked screen replacement method
  goBack: mockGoBack, // Mocked method for navigating back
  setOptions: mockSetOptions, // Mocked method for setting navigation options
};

/**
 * MockNavigationContainer Component
 *
 * This component wraps the child components with a NavigationContainer and
 * provides the mocked navigation context. It simulates a navigation environment
 * for testing purposes without rendering actual screens.
 *
 * @param {React.ReactNode} children - The child components to be wrapped in the navigation container.
 * @returns {React.ReactElement} A mocked NavigationContainer with child components.
 */
const MockNavigationContainer = ({ children }) => (
  <NavigationContainer>
    {children} {/* Wrap children in the NavigationContainer */}
  </NavigationContainer>
);

// Export the mocked navigation object and the MockNavigationContainer component
export { mockNavigation, MockNavigationContainer };
