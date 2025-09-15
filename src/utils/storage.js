import AsyncStorage from '@react-native-async-storage/async-storage';

export const  setLocalStorage = async (key, value)=>{
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export const getLocalStorage = async (key)=>{
  const s = await AsyncStorage.getItem(key);
  return s ? JSON.parse(s) : null;
}
