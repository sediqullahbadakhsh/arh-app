import AsyncStorage from '@react-native-async-storage/async-storage';


export const setLocalStorage = async (key, value) => {
  try {
    if (typeof value === 'object') {
      value = JSON.stringify(value);
    }
    await AsyncStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error('Error setting localStorage:', error);
    throw error;
  }
};

export const getLocalStorage = async (key) => {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value === null) return null;
    
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  } catch (error) {
    console.error('Error getting localStorage:', error);
    throw error;
  }
};


export const removeLocalStorage = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Error removing localStorage:', error);
    throw error;
  }
};