import { create } from 'zustand';
import taskApi from '../api/taskApi';

const useTaskStore = create((set, get) => ({
  tasks: [],
  stats: {
    total: 0,
    todo: 0,
    inProgress: 0,
    done: 0,
    cancelled: 0,
    overdue: 0
  },
  loading: false,
  error: null,
  filters: {
    status: null,
    priority: null,
    customerId: null,
    dealId: null
  },

  // Fetch tasks with filters
  fetchTasks: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await taskApi.list(filters);
      set({
        tasks: response.data || [],
        filters,
        loading: false
      });
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Get task statistics
  fetchStats: async () => {
    try {
      const response = await taskApi.getStats();
      set({ stats: response.data });
      return response.data;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // Get task detail
  getTask: async (id) => {
    try {
      const response = await taskApi.get(id);
      return response.data;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // Create task
  addTask: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await taskApi.create(data);
      const newTask = response.data;
      set((state) => ({
        tasks: [newTask, ...state.tasks],
        stats: {
          ...state.stats,
          total: state.stats.total + 1,
          todo: state.stats.todo + (newTask.status === 'TODO' ? 1 : 0)
        },
        loading: false
      }));
      return newTask;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Update task
  editTask: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const response = await taskApi.update(id, data);
      const updatedTask = response.data;
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === id ? updatedTask : t
        ),
        loading: false
      }));
      return updatedTask;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Update task status (quick action)
  updateTaskStatus: async (id, status) => {
    try {
      const response = await taskApi.updateStatus(id, status);
      const updatedTask = response.data;
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === id ? updatedTask : t
        )
      }));
      // Refresh stats
      get().fetchStats();
      return updatedTask;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // Delete task
  removeTask: async (id) => {
    set({ loading: true, error: null });
    try {
      await taskApi.delete(id);
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id),
        loading: false
      }));
      get().fetchStats();
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Clear error
  clearError: () => set({ error: null })
}));

export default useTaskStore;
