import { create } from 'zustand';

type UiState = {
  mixerOpen: boolean;
  activeTab: 'timer' | 'dashboard';
  notificationPermission: NotificationPermission | 'default';
};

type UiActions = {
  toggleMixer: () => void;
  setMixerOpen: (open: boolean) => void;
  setActiveTab: (tab: UiState['activeTab']) => void;
  setNotificationPermission: (permission: NotificationPermission) => void;
};

export const useUiStore = create<UiState & UiActions>()((set) => ({
  mixerOpen: false,
  activeTab: 'timer',
  notificationPermission: 'default',

  toggleMixer: () =>
    set((state) => ({ mixerOpen: !state.mixerOpen })),

  setMixerOpen: (open) =>
    set({ mixerOpen: open }),

  setActiveTab: (tab) =>
    set({ activeTab: tab }),

  setNotificationPermission: (permission) =>
    set({ notificationPermission: permission }),
}));
