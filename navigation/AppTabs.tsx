// navigation/AppTabs.tsx
import React from "react";
import { View, Pressable, StyleSheet, Platform } from "react-native";
import { createBottomTabNavigator, BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Home as HomeIcon, User, Grid3x3, MessageSquare, ShoppingBag } from "lucide-react-native";

import HomeScreen from "../screens/AccueilConnected";
import ProfileScreen from "../screens/ProfileScreen";
import CollectionScreen from "../screens/CollectionScreen";
import MessagesScreen from "../screens/MessagesScreen";
import ShopScreen from "../screens/ShopScreen";

const Tab = createBottomTabNavigator();

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  const getIcon = (name: string) => {
    switch (name) {
      case "Home":
        return HomeIcon;
      case "Profile":
        return User;
      case "Collection":
        return Grid3x3;
      case "Messages":
        return MessageSquare;
      case "Shop":
      default:
        return ShoppingBag;
    }
  };

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(8, insets.bottom) }]}>
      <View style={styles.row}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const Icon = getIcon(route.name);

          const onPress = () => {
            const e = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
            if (!focused && !e.defaultPrevented) navigation.navigate(route.name as never);
          };

          const onLongPress = () => {
            navigation.emit({ type: "tabLongPress", target: route.key });
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tab}
              android_ripple={{ color: "rgba(255,255,255,0.08)", borderless: true }}
            >
              <Icon size={28} color={focused ? "#ffffff" : "#94a3b8"} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <>
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
        <Tab.Screen name="Collection" component={CollectionScreen} />
        <Tab.Screen name="Messages" component={MessagesScreen} />
        <Tab.Screen name="Shop" component={ShopScreen} />
      </>
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.12)",
    backgroundColor: Platform.select({
      web: "rgba(13,20,28,0.92)",
      default: "rgba(13,20,28,0.95)",
    }),
    paddingTop: 4,
  },
  row: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  tab: {
    flex: 1,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
  },
});
