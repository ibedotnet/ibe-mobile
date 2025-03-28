import React, { createContext, useState, useEffect } from "react";
import { themes } from "./themes";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [themeName, setThemeName] = useState("Blue-White"); // Default theme
  const [theme, setTheme] = useState(themes["Blue-White"]);

  useEffect(() => {
    const loadTheme = async () => {
      const savedTheme = await AsyncStorage.getItem("selectedTheme");
      if (savedTheme && themes[savedTheme]) {
        setThemeName(savedTheme);
        setTheme(themes[savedTheme]);
      }
    };
    loadTheme();
  }, []);

  const updateTheme = async (newTheme) => {
    setThemeName(newTheme);
    setTheme(themes[newTheme]);
    await AsyncStorage.setItem("selectedTheme", newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, themeName, updateTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
