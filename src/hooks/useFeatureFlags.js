import { useState, useEffect, useCallback } from 'react';
import { featureFlags } from '../services/featureFlagsService';

export const useFeatureFlags = () => {
  const [isReady, setIsReady] = useState(featureFlags.getInitialized());
  const [features, setFeatures] = useState(featureFlags.getAllFeatures());
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
  
    if (!isReady) {
      featureFlags.initialize().then(initialized => {
        setIsReady(initialized);
        setFeatures(featureFlags.getAllFeatures());
        setLastUpdated(new Date());
      });
    }


    const unsubscribe = featureFlags.addListener(() => {
      setFeatures(featureFlags.getAllFeatures());
      setLastUpdated(new Date());
    });

    return unsubscribe;
  }, [isReady]);

  const isEnabled = useCallback((featureKey) => {
    return featureFlags.isEnabled(featureKey);
  }, []);

  const getFeature = useCallback((featureKey) => {
    return featureFlags.getFeature(featureKey);
  }, []);

  const refresh = useCallback(async () => {
    const success = await featureFlags.refresh();
    if (success) {
      setFeatures(featureFlags.getAllFeatures());
      setLastUpdated(new Date());
    }
    return success;
  }, []);

  return {
    isReady,
    features,
    lastUpdated,
    featuresCount: features.length,

    isEnabled,
    getFeature,
    refresh,
    areEnabled: featureFlags.areEnabled.bind(featureFlags),
    anyEnabled: featureFlags.anyEnabled.bind(featureFlags),

    isLoading: !isReady && features.length === 0
  };
};


export const useFeature = (featureKey, defaultValue = false) => {
  const { isEnabled, getFeature, isReady } = useFeatureFlags();
  
  return {
    isEnabled: isReady ? isEnabled(featureKey) : defaultValue,
    feature: getFeature(featureKey),
    isReady
  };
};