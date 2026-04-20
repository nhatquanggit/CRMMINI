import { getLeadSourceStats } from '../models/lead-source.model.js';

const isAdmin = (user) => user.role === 'ADMIN' || user.role === 'MANAGER';

export const getLeadSourceDashboard = async (currentUser) => {
  const where = isAdmin(currentUser) ? {} : { assignedTo: currentUser.id };
  const rows = await getLeadSourceStats(where);

  const totalLeads = rows.reduce((s, r) => s + r.total, 0);
  const totalConverted = rows.reduce((s, r) => s + r.converted, 0);

  return {
    summary: {
      totalLeads,
      totalConverted,
      conversionRate: totalLeads > 0 ? Number(((totalConverted / totalLeads) * 100).toFixed(1)) : 0
    },
    breakdown: rows
  };
};
