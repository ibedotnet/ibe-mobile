// Import react-native extensions for better assertions
import "@testing-library/react-native/extend-expect";

// Import jest-native extensions for better assertions
import "@testing-library/jest-native/extend-expect";

// Import i18n for mocking changeLanguage method
import i18n from "../../src/i18n";

// Mock APP configuration for testing
jest.mock("../../src/constants", () => ({
  APP: {
    LOGIN_USER_DATE_FORMAT: "MM-dd-yyyy", // Provide a valid date format for testing
  },
}));

// Mock expo-localization to simulate device locale
jest.mock("expo-localization", () => ({
  locale: "xx-YY", // Unsupported locale for testing purposes to verify default behaviors
}));

// Mock AsyncStorage to simulate getting and storing credentials
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(), // Mock function to simulate retrieving items from AsyncStorage
  setItem: jest.fn(), // Mock function to simulate storing items in AsyncStorage
  removeItem: jest.fn(), // Mock function to simulate removing items from AsyncStorage
}));

// Mock expo-secure-store to simulate secure storage operations
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(), // Mock function to simulate retrieving items from SecureStore
  setItemAsync: jest.fn(), // Mock function to simulate storing items in SecureStore
}));

// Mock i18n changeLanguage method to prevent actual language changes during tests
jest.spyOn(i18n, "changeLanguage").mockImplementation(jest.fn());

// Mock fetchData to simulate API requests for authentication
jest.mock("../../src/utils/APIUtils", () => ({
  fetchData: jest.fn(), // Mock function to simulate API calls for login
}));

// Mock showToast to simulate showing error or success messages in the app
jest.mock("../../src/utils/MessageUtils", () => ({
  showToast: jest.fn(), // Mock function to simulate toast notifications
}));