import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Deals from './pages/Deals';
import Settings from './pages/Settings';
import Reports from './pages/Reports';
import Calendar from './pages/Calendar';
import UsersManagement from './pages/UsersManagement';
import ImportExport from './pages/ImportExport';
import Quotes from './pages/Quotes';
import Products from './pages/Products';
import Invoices from './pages/Invoices';
import LeadSources from './pages/LeadSources';
import Segments from './pages/Segments';
import SupportTickets from './pages/SupportTickets';
import Forecasts from './pages/Forecasts';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />

      <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
      <Route path="/customers" element={<Navigate to="/app/customers" replace />} />
      <Route path="/deals" element={<Navigate to="/app/deals" replace />} />
      <Route path="/settings" element={<Navigate to="/app/settings" replace />} />

      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="customers" element={<Customers />} />
        <Route path="deals" element={<Deals />} />
        <Route path="settings" element={<Settings />} />
        <Route path="reports" element={<Reports />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="quotes" element={<Quotes />} />
        <Route path="products" element={<Products />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="lead-sources" element={<LeadSources />} />
        <Route path="segments" element={<Segments />} />
        <Route path="support-tickets" element={<SupportTickets />} />
        <Route path="forecasts" element={<Forecasts />} />
        <Route path="users" element={<UsersManagement />} />
        <Route path="import-export" element={<ImportExport />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
