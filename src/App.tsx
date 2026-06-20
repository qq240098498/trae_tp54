import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import Toast from '@/components/Toast';
import WorkerManagement from '@/components/WorkerManagement';
import Dashboard from '@/pages/Dashboard';
import RepairForm from '@/pages/RepairForm';
import OrderList from '@/pages/OrderList';
import OrderDetail from '@/pages/OrderDetail';
import Workbench from '@/pages/Workbench';
import { useAppStore } from '@/store';

export default function App() {
  const checkAndEscalateOrders = useAppStore((s) => s.checkAndEscalateOrders);

  useEffect(() => {
    const interval = setInterval(() => {
      checkAndEscalateOrders();
    }, 30 * 1000);
    return () => clearInterval(interval);
  }, [checkAndEscalateOrders]);

  return (
    <Router>
      <Toast />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Navigate to="/" replace />} />
          <Route path="orders" element={<OrderList />} />
          <Route path="orders/:id" element={<OrderDetail />} />
          <Route path="order/:id" element={<Navigate to="/orders/:id" replace />} />
          <Route path="workbench" element={<Workbench />} />
          <Route path="repair/new" element={<RepairForm />} />
          <Route path="repair" element={<Navigate to="/repair/new" replace />} />
          <Route path="workers" element={<WorkerManagement />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}
