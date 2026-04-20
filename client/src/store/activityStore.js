import { create } from 'zustand';
import activityApi from '../api/activityApi';

const useActivityStore = create((set, get) => ({
  activities: [],
  loading: false,
  error: null,
  filters: {
    customerId: null,
    dealId: null,
    type: null,
    fromDate: null,
    toDate: null
  },

  // Fetch activities with filters
  fetchActivities: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await activityApi.list(filters);
      set({
        activities: response.data || [],
        filters,
        loading: false
      });
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Get activity detail
  getActivity: async (id) => {
    try {
      const response = await activityApi.get(id);
      return response.data;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // Create activity
  addActivity: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await activityApi.create(data);
      const newActivity = response.data;
      set((state) => ({
        activities: [newActivity, ...state.activities],
        loading: false
      }));
      return newActivity;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Update activity
  editActivity: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const response = await activityApi.update(id, data);
      const updatedActivity = response.data;
      set((state) => ({
        activities: state.activities.map((a) =>
          a.id === id ? updatedActivity : a
        ),
        loading: false
      }));
      return updatedActivity;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Delete activity
  removeActivity: async (id) => {
    set({ loading: true, error: null });
    try {
      await activityApi.delete(id);
      set((state) => ({
        activities: state.activities.filter((a) => a.id !== id),
        loading: false
      }));
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Clear error
  clearError: () => set({ error: null })
}));

export default useActivityStore;
