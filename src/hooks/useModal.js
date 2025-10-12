import { useState, useCallback } from 'react';

export const useModal = () => {
  const [isProgressVisible, setIsProgressVisible] = useState(false);
  const [isSuccessVisible, setIsSuccessVisible] = useState(false);
  const [modalData, setModalData] = useState(null);

  const showProgress = useCallback((data = {}) => {
    setIsProgressVisible(true);
    setModalData(data);
  }, []);

  const hideProgress = useCallback(() => {
    setIsProgressVisible(false);
  }, []);

  const showSuccess = useCallback((data = {}) => {
    setIsSuccessVisible(true);
    setModalData(data);
  }, []);

  const hideSuccess = useCallback(() => {
    setIsSuccessVisible(false);
    setModalData(null);
  }, []);

  const autoProgressToSuccess = useCallback((progressData = {}, successData = {}, duration = 3000) => {
    showProgress(progressData);
    
    setTimeout(() => {
      hideProgress();
      showSuccess(successData);
    }, duration);
  }, [showProgress, hideProgress, showSuccess]);

  return {
    isProgressVisible,
    showProgress,
    hideProgress,
    isSuccessVisible,
    showSuccess,
    hideSuccess,
    autoProgressToSuccess,
    modalData,
    setModalData
  };
};