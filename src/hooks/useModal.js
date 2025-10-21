import { useState, useCallback } from 'react';

export const useModal = () => {
  const [isProgressVisible, setIsProgressVisible] = useState(false);
  const [isSuccessVisible, setIsSuccessVisible] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [modal, setModal] = useState({ visible: false, title: '', message: '' });

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

    const showModal = (title, message) => {
    setModal({ visible: true, title, message });
  };

  const hideModal = () => {
    setModal({ ...modal, visible: false });
  };

  return {
    modal, showModal, hideModal,
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


