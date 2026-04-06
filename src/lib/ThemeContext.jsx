import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState({
    primaryColor: localStorage.getItem("smart_theme_primary") || "#065f46", // Deep Emerald
    accentColor: localStorage.getItem("smart_theme_accent") || "#c5a059",   // Gold
    glassIntensity: parseFloat(localStorage.getItem("smart_theme_glass")) || 0.7,
    showWatermark: localStorage.getItem("smart_theme_watermark") !== "false",
    sidebarStyle: localStorage.getItem("smart_theme_sidebar") || "dark",
    fontColor: localStorage.getItem("smart_theme_font") || "#1e293b", // Slate-800
  });

  useEffect(() => {
    // Apply CSS Variables to :root
    const root = document.documentElement;
    root.style.setProperty("--smart-primary", theme.primaryColor);
    root.style.setProperty("--smart-accent", theme.accentColor);
    root.style.setProperty("--smart-glass-opacity", theme.glassIntensity);
    
    localStorage.setItem("smart_theme_primary", theme.primaryColor);
    localStorage.setItem("smart_theme_accent", theme.accentColor);
    localStorage.setItem("smart_theme_glass", theme.glassIntensity);
    localStorage.setItem("smart_theme_watermark", theme.showWatermark);
    localStorage.setItem("smart_theme_sidebar", theme.sidebarStyle);
    localStorage.setItem("smart_theme_font", theme.fontColor);
    root.style.setProperty("--smart-text", theme.fontColor);
  }, [theme]);

  const updateTheme = (newSettings) => {
    setTheme(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <ThemeContext.Provider value={{ theme, updateTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useSmartTheme = () => useContext(ThemeContext);
