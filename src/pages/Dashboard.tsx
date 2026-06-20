import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store';
import { trendData } from '@/data/mockData';
import {
  ClipboardList,
  Wrench,
  CheckCircle2,
  PlusCircle,
  AlertTriangle,
  Clock,
  MapPin,
  User,
  Phone,
  ChevronRight,
  Package,
  Warehouse,
  AlertCircle,
  Star,
  ThumbsDown,
} from 'lucide-react';
import type { RepairOrder, OrderStatus, UrgencyLevel } from '@/types';
import { URGENCY_WEIGHT } from '@/types';
import { cn } from '@/lib/utils';

function getUrgencyColor(urgency: UrgencyLevel) {
  switch (urgency) {
    case '普通':
      return 'bg-gray-100 text-gray-700';
    case '紧急':
      return 'bg-orange-100 text-orange-700';
    case '非常紧急':
      return 'bg-red-100 text-red-700';
  }
}

function getStatusColor(status: OrderStatus) {
  switch (status) {
    case '待派单':
      return 'bg-yellow-100 text-yellow-700';
    case '已派单':
      return 'bg-blue-100 text-blue-700';
    case '已接单':
      return 'bg-indigo-100 text-indigo-700';
    case '维修中':
      return 'bg-purple-100 text-purple-700';
    case '待确认':
      return 'bg-cyan-100 text-cyan-700';
    case '已完成':
      return 'bg-green-100 text-green-700';
    case '已取消':
      return 'bg-gray-100 text-gray-700';
  }
}

function formatTime(isoString: string) {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}天前`;
}

function StatCard({
  icon: Icon,
  label,
  value,
  colorClass,
  delay,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  colorClass: string;
  delay: number;
}) {
  return (
    <div
      className="card p-6 opacity-0 animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-800">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${colorClass}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

function TrendChart({ data }: { data: { date: string; count: number }[] }) {
  const width = 500;
  const height = 220;
  const padding = { top: 20, right: 20, bottom: 40, left: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxCount = Math.max(...data.map((d) => d.count));
  const minCount = 0;

  const points = data.map((d, i) => {
    const x = padding.left + (i * chartWidth) / (data.length - 1);
    const y = padding.top + chartHeight - ((d.count - minCount) * chartHeight) / (maxCount - minCount || 1);
    return { x, y, ...d };
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`)
    .join(' ');

  const areaD = `${pathD} L${points[points.length - 1].x},${padding.top + chartHeight} L${points[0].x},${padding.top + chartHeight} Z`;

  const yTicks = 4;
  const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) =>
    Math.round(minCount + (i * (maxCount - minCount)) / yTicks)
  );

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      <defs>
        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e3a5f" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#1e3a5f" stopOpacity="0" />
        </linearGradient>
      </defs>

      {yTickValues.map((val, i) => {
        const y = padding.top + chartHeight - (i * chartHeight) / yTicks;
        return (
          <g key={i}>
            <line
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              stroke="#e5e7eb"
              strokeDasharray="4 4"
            />
            <text
              x={padding.left - 8}
              y={y + 4}
              textAnchor="end"
              className="fill-gray-400 text-xs"
            >
              {val}
            </text>
          </g>
        );
      })}

      <path d={areaD} fill="url(#areaGradient)" />
      <path d={pathD} fill="none" stroke="#1e3a5f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="5" fill="white" stroke="#1e3a5f" strokeWidth="2.5" />
          <text
            x={p.x}
            y={p.y - 12}
            textAnchor="middle"
            className="fill-gray-600 text-xs font-medium"
          >
            {p.count}
          </text>
          <text
            x={p.x}
            y={height - padding.bottom + 20}
            textAnchor="middle"
            className="fill-gray-500 text-xs"
          >
            {p.date}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const orders = useAppStore((s) => s.orders);
  const inventoryItems = useAppStore((s) => s.inventoryItems);
  const addStockTransaction = useAppStore((s) => s.addStockTransaction);
  const currentUser = useAppStore((s) => s.currentUser);
  const complaintTodos = useAppStore((s) => s.complaintTodos);

  const stats = useMemo(() => {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    return {
      pending: orders.filter((o) => o.status === '待派单').length,
      inProgress: orders.filter((o) => ['已派单', '已接单', '维修中'].includes(o.status)).length,
      completed: orders.filter((o) => o.status === '已完成').length,
      todayNew: orders.filter((o) => new Date(o.createdAt) >= todayStart).length,
    };
  }, [orders]);

  const inventoryStats = useMemo(() => {
    return {
      totalTypes: inventoryItems.length,
      totalStock: inventoryItems.reduce((sum, i) => sum + i.stock, 0),
      totalValue: inventoryItems.reduce((sum, i) => sum + i.stock * i.unitPrice, 0),
      lowStock: inventoryItems.filter((i) => i.stock < i.safeStock),
    };
  }, [inventoryItems]);

  const complaintStats = useMemo(() => {
    return {
      total: complaintTodos.length,
      pending: complaintTodos.filter((c) => c.status === '待处理').length,
      inProgress: complaintTodos.filter((c) => c.status === '处理中').length,
    };
  }, [complaintTodos]);

  const urgentOrders = useMemo(() => {
    return orders
      .filter((o) => URGENCY_WEIGHT[o.urgency] >= 2 && !['已完成', '已取消'].includes(o.status))
      .sort((a, b) => URGENCY_WEIGHT[b.urgency] - URGENCY_WEIGHT[a.urgency])
      .slice(0, 5);
  }, [orders]);

  const recentOrders = useMemo(() => {
    return [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8);
  }, [orders]);

  const handleQuickRestock = (itemId: string) => {
    const item = inventoryItems.find((i) => i.id === itemId);
    if (!item) return;
    const restockQty = item.safeStock * 2 - item.stock;
    const success = addStockTransaction({
      inventoryItemId: item.id,
      type: '入库',
      quantity: restockQty,
      operator: currentUser.name,
      remark: 'Dashboard快捷补货',
    });
    return success;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 opacity-0 animate-fade-in-up" style={{ animationDelay: '0ms' }}>
          <h1 className="text-2xl font-bold text-primary-900">工作台</h1>
          <p className="text-gray-500 mt-1">欢迎使用小区物业报修管理系统</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={ClipboardList}
            label="待处理工单"
            value={stats.pending}
            colorClass="bg-yellow-500"
            delay={50}
          />
          <StatCard
            icon={Wrench}
            label="进行中工单"
            value={stats.inProgress}
            colorClass="bg-blue-500"
            delay={100}
          />
          <StatCard
            icon={CheckCircle2}
            label="已完工工单"
            value={stats.completed}
            colorClass="bg-green-500"
            delay={150}
          />
          <StatCard
            icon={PlusCircle}
            label="今日新增"
            value={stats.todayNew}
            colorClass="bg-primary-700"
            delay={200}
          />
        </div>

        {inventoryStats.lowStock.length > 0 && currentUser.role === 'admin' && (
          <div
            className="card p-5 mb-6 border-2 border-orange-300 bg-orange-50/50 opacity-0 animate-fade-in-up cursor-pointer hover:shadow-md transition-shadow"
            style={{ animationDelay: '220ms' }}
            onClick={() => navigate('/inventory')}
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-orange-100 shrink-0">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold text-orange-800">
                    库存预警：{inventoryStats.lowStock.length} 种耗材需要补货
                  </h3>
                  <ChevronRight className="w-5 h-5 text-orange-400 shrink-0" />
                </div>
                <p className="text-sm text-orange-700 mt-1">
                  以下耗材已低于安全库存，请及时安排采购
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {inventoryStats.lowStock.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-lg border border-orange-200"
                    >
                      <span className="text-sm font-medium text-gray-800">{item.name}</span>
                      <span className="text-xs text-orange-600 font-semibold tabular-nums">
                        {item.stock.toLocaleString()}/{item.safeStock.toLocaleString()}{item.unit}
                      </span>
                    </div>
                  ))}
                  {inventoryStats.lowStock.length > 5 && (
                    <span className="px-2.5 py-1 text-xs text-gray-500">
                      等 {inventoryStats.lowStock.length} 种
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {complaintStats.pending > 0 && currentUser.role === 'admin' && (
          <div
            className="card p-5 mb-6 border-2 border-red-300 bg-red-50/50 opacity-0 animate-fade-in-up cursor-pointer hover:shadow-md transition-shadow"
            style={{ animationDelay: '230ms' }}
            onClick={() => navigate('/orders?tab=completed')}
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-red-100 shrink-0">
                <ThumbsDown className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold text-red-800">
                    客诉待办：{complaintStats.pending} 条待处理
                  </h3>
                  <ChevronRight className="w-5 h-5 text-red-400 shrink-0" />
                </div>
                <p className="text-sm text-red-700 mt-1">
                  以下低满意度工单需要跟进处理
                </p>
                <div className="space-y-2 mt-3">
                  {complaintTodos
                    .filter((c) => c.status === '待处理')
                    .slice(0, 3)
                    .map((complaint) => (
                      <div
                        key={complaint.id}
                        className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-red-200"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={cn(
                                  'w-3.5 h-3.5',
                                  star <= complaint.rating
                                    ? 'fill-red-500 text-red-500'
                                    : 'text-gray-300'
                                )}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-medium text-gray-800 truncate">
                            {complaint.roomNumber} - {complaint.repairType}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 shrink-0 ml-2">
                          {complaint.orderNo}
                        </span>
                      </div>
                    ))}
                </div>
                {complaintStats.pending > 3 && (
                  <p className="text-xs text-gray-500 mt-2">
                  等 {complaintStats.pending} 条待处理客诉
                </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 card p-6 opacity-0 animate-fade-in-up" style={{ animationDelay: '250ms' }}>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">近7日报修趋势</h2>
            <TrendChart data={trendData} />
          </div>

          <div className="space-y-6">
            <div className="card p-6 opacity-0 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">紧急工单提醒</h2>
                <span className="badge bg-red-100 text-red-700">{urgentOrders.length}</span>
              </div>
              <div className="space-y-3">
                {urgentOrders.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">暂无紧急工单</p>
                ) : (
                  urgentOrders.map((order, idx) => (
                    <div
                      key={order.id}
                      onClick={() => navigate(`/orders/${order.id}`)}
                      className="p-3 rounded-lg border-2 border-red-400 bg-red-50 animate-pulse-slow cursor-pointer hover:bg-red-100 transition-colors"
                      style={{ animationDelay: `${idx * 200}ms` }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`badge ${getUrgencyColor(order.urgency)}`}>
                              {order.urgency}
                            </span>
                            <span className={`badge ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-gray-800 mt-1 truncate">{order.repairType} - {order.roomNumber}</p>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-1">{order.description}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div
              className="card p-6 opacity-0 animate-fade-in-up cursor-pointer hover:shadow-md transition-all"
              style={{ animationDelay: '320ms' }}
              onClick={() => navigate('/inventory')}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary-700" />
                  <h2 className="text-lg font-semibold text-gray-800">耗材库存概览</h2>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-lg bg-primary-50 text-center">
                  <p className="text-2xl font-bold text-primary-800 tabular-nums">{inventoryStats.totalTypes.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-0.5">物品种类</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-50 text-center">
                  <p className="text-2xl font-bold text-blue-700 tabular-nums">{inventoryStats.totalStock.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-0.5">库存总量</p>
                </div>
              </div>
              {inventoryStats.lowStock.length > 0 ? (
                <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-orange-600 shrink-0" />
                    <span className="text-sm font-semibold text-orange-800">
                      {inventoryStats.lowStock.length} 种需要补货
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {inventoryStats.lowStock.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-xs">
                        <span className="text-gray-700 truncate flex-1">{item.name}</span>
                        <span className={cn(
                          'font-semibold ml-2 shrink-0 tabular-nums',
                          item.stock <= 0 ? 'text-red-600' : 'text-orange-600'
                        )}>
                          {item.stock.toLocaleString()}/{item.safeStock.toLocaleString()}{item.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                    <span className="text-sm font-medium text-green-800">库存状态良好</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card overflow-hidden opacity-0 animate-fade-in-up" style={{ animationDelay: '350ms' }}>
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">最近工单</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">工单编号</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">房号</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">报修类型</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">报修人</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">紧急程度</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-primary-800">{order.orderNo}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {order.roomNumber}
                    </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{order.repairType}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center">
                          <User className="w-4 h-4 text-primary-700" />
                        </div>
                        <span className="text-sm text-gray-700">{order.ownerName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`badge ${getUrgencyColor(order.urgency)}`}>{order.urgency}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`badge ${getStatusColor(order.status)}`}>{order.status}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        {formatTime(order.createdAt)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
      </div>
    </div>
  );
}
