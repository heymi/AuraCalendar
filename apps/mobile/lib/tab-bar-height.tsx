import React, { createContext, useContext, useState, useCallback } from "react";
import type { LayoutChangeEvent } from "react-native";

interface TabBarHeightContextValue {
  tabBarHeight: number;
  onTabBarLayout: (e: LayoutChangeEvent) => void;
}

const TabBarHeightContext = createContext<TabBarHeightContextValue>({
  tabBarHeight: 90,
  onTabBarLayout: () => {},
});

export function TabBarHeightProvider({ children }: { children: React.ReactNode }) {
  const [tabBarHeight, setTabBarHeight] = useState(90);

  const onTabBarLayout = useCallback((e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h > 0) setTabBarHeight(h);
  }, []);

  return (
    <TabBarHeightContext.Provider value={{ tabBarHeight, onTabBarLayout }}>
      {children}
    </TabBarHeightContext.Provider>
  );
}

export function useTabBarHeight() {
  return useContext(TabBarHeightContext);
}
