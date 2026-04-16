import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const UserMemoryContext = createContext();

/** Generate or retrieve a persistent device ID for anonymous user tracking */
function getDeviceId() {
  let id = localStorage.getItem('smartfarm_device_id');
  if (!id) {
    id = 'device_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    localStorage.setItem('smartfarm_device_id', id);
  }
  return id;
}

export function UserMemoryProvider({ children }) {
  const [deviceId] = useState(() => getDeviceId());
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const debounceRef = useRef(null);

  // Load profile on mount
  useEffect(() => {
    if (!deviceId) return;
    loadProfile();
  }, [deviceId]);

  const loadProfile = useCallback(async () => {
    if (!deviceId) return;
    try {
      const { getUserProfile, getLearningStats } = await import('../services/api');
      const [profileRes, statsRes] = await Promise.allSettled([
        getUserProfile(deviceId),
        getLearningStats(deviceId),
      ]);
      if (profileRes.status === 'fulfilled') {
        setProfile(profileRes.value.data);
      }
      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data);
      }
    } catch {
      // Silently fail - profile is optional
    } finally {
      setInitialized(true);
    }
  }, [deviceId]);

  const updatePreferences = useCallback(async (prefs) => {
    if (!deviceId) return;
    try {
      const { updateUserPreferences } = await import('../services/api');
      await updateUserPreferences({ device_id: deviceId, ...prefs });
      // Reload profile
      loadProfile();
    } catch {}
  }, [deviceId, loadProfile]);

  const submitFeedback = useCallback(async (feedbackData) => {
    if (!deviceId) return;
    try {
      const { submitFeedback } = await import('../services/api');
      await submitFeedback({ ...feedbackData, device_id: deviceId });
    } catch {}
  }, [deviceId]);

  const submitCorrection = useCallback(async (correctionData) => {
    if (!deviceId) return;
    try {
      const { submitCorrection } = await import('../services/api');
      await submitCorrection({ ...correctionData, device_id: deviceId });
    } catch {}
  }, [deviceId]);

  const recordCropOutcome = useCallback(async (outcomeData) => {
    if (!deviceId) return;
    try {
      const { recordCropOutcome } = await import('../services/api');
      await recordCropOutcome({ device_id: deviceId, ...outcomeData });
    } catch {}
  }, [deviceId]);

  const refreshStats = useCallback(async () => {
    if (!deviceId) return;
    try {
      const { getLearningStats } = await import('../services/api');
      const res = await getLearningStats(deviceId);
      setStats(res.data);
    } catch {}
  }, [deviceId]);

  // Debounced preference save (e.g., from chat topic extraction)
  const debouncedPreferenceUpdate = useCallback((prefs) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updatePreferences(prefs);
    }, 2000);
  }, [updatePreferences]);

  return (
    <UserMemoryContext.Provider value={{
      deviceId,
      profile,
      stats,
      loading,
      initialized,
      updatePreferences,
      submitFeedback,
      submitCorrection,
      recordCropOutcome,
      refreshStats,
      debouncedPreferenceUpdate,
    }}>
      {children}
    </UserMemoryContext.Provider>
  );
}

export function useUserMemory() {
  const context = useContext(UserMemoryContext);
  if (!context) {
    throw new Error('useUserMemory must be used within a UserMemoryProvider');
  }
  return context;
}
