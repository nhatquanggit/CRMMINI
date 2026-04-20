import api from './api';

const BASE_URL = '/calendar';

export const calendarApi = {
  /**
   * Get events for a date range
   * @param {Date} startDate
   * @param {Date} endDate
   */
  getEvents: (startDate, endDate) => {
    const params = new URLSearchParams({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });
    return api.get(`${BASE_URL}?${params.toString()}`);
  },

  /**
   * Create a new appointment
   * @param {Object} appointmentData
   */
  createAppointment: (appointmentData) => {
    return api.post('/appointments', appointmentData);
  }
};

export default calendarApi;
