import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { profile } from "../services/authApi";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) {
          const parsed = JSON.parse(storedUser);

         
          const freshUser = await profile(); 
 const userInfo = {
      token: parsed.token,   // ✅ save token
      role: freshUser?.data?.Role?.name,
      roleId: parsed?.roleId,
      id: freshUser?.data?.id,
      username: freshUser?.data?.username,
      language: freshUser?.data?.messageLanguage
    };
          console.log("this is user profile: ❤❤❤", freshUser)

          setUser(userInfo);

          await AsyncStorage.setItem("user", JSON.stringify(userInfo));
        }
      } catch (e) {
        console.error("Failed to load user:", e);
        await AsyncStorage.removeItem("user"); 
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
