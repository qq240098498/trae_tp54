import { useState, useMemo } from 'react';
import { Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ListFilter, Eye, UserPlus, ClipboardList } from 'lucide-react';
import { useAppStore } from '@/store';
import { RepairOrder, OrderStatus, RepairType, UrgencyLevel, ORDER_STATUSES, REPAIR_TYPES, URGENCY_LEVELS, URGENCY_WEIGHT } from '@/types';
import { formatDateTime, getUrgencyColor, getStatusColor, sortOrders } from '@/utils';
import { cn } from '@/lib/utils';
import AssignWorkerModal from '@/components/AssignWorkerModal';
import OrderDetailModal from '@/components/OrderDetailModal';
import Empty from '@/components/Empty';

type SortKey = 'urgency' | 'createdAt' | null;
type SortDirection = 'asc' | 'desc';

const PAGE_SIZE = 8;

export default function OrderList() {
  const { orders } = useAppStore();

  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<RepairType | ''>('');
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyLevel | ''>('');
  const [roomSearch, setRoomSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('urgency');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<RepairOrder | null>(null);

  const filteredOrders = useMemo(() => {
    let result = [...orders];

    if (statusFilter) {
      result = result.filter((o) => o.status === statusFilter);
    }
    if (typeFilter) {
      result = result.filter((o) => o.repairType === typeFilter);
    }
    if (urgencyFilter) {
      result = result.filter((o) => o.urgency === urgencyFilter);
    }
    if (roomSearch.trim()) {
      const keyword = roomSearch.trim().toLowerCase();
      result = result.filter((o) => o.roomNumber.toLowerCase().includes(keyword));
    }

    result = sortOrders(result);

    if (sortKey === 'urgency') {
      result.sort((a, b) => {
        const diff = URGENCY_WEIGHT[b.urgency] - URGENCY_WEIGHT[a.urgency];
        return sortDirection === 'asc' ? -diff : diff;
      });
    } else if (sortKey === 'createdAt') {
      result.sort((a, b) => {
        const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        return sortDirection === 'asc' ? -diff : diff;
      });
    }

    return result;
  }, [orders, statusFilter, typeFilter, urgencyFilter, roomSearch, sortKey, sortDirection]);

  const totalPages = Math.ceil(filteredOrders.length / PAGE_SIZE);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
  };

  const handleAssign = (order: RepairOrder) => {
    setSelectedOrder(order);
    setAssignModalOpen(true);
  };

  const handleViewDetail = (order: RepairOrder) => {
    setSelectedOrder(order);
    setDetailModalOpen(true);
  };

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortKey !== columnKey) {
      return <ChevronUp className="w-3 h-3 text-gray-300" />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-3 h-3 text-primary-600" />
    ) : (
      <ChevronDown className="w-3 h-3 text-primary-600" />
    );
  };

  const clearFilters = () => {
    setStatusFilter('');
    setTypeFilter('');
    setUrgencyFilter('');
    setRoomSearch('');
    setCurrentPage(1);
  };

  const hasFilters = statusFilter || typeFilter || urgencyFilter || roomSearch;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-serif flex items-center gap-2">
              <ClipboardList className="w-7 h-7 text-primary-700" />
              工单管理
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              共 {filteredOrders.length} 条工单记录
            </p>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <ListFilter className="w-4 h-4 text-primary-600" />
            <span className="font-medium text-gray-700">筛选条件</span>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="ml-auto text-sm text-primary-600 hover:text-primary-700 hover:underline"
              >
                清空筛选
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">
                工单状态
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as OrderStatus | '');
                  setCurrentPage(1);
                }}
                className="select-field"
              >
                <option value="">全部状态</option>
                {ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">
                报修类型
              </label>
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value as RepairType | '');
                  setCurrentPage(1);
                }}
                className="select-field"
              >
                <option value="">全部类型</option>
                {REPAIR_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">
                紧急程度
              </label>
              <select
                value={urgencyFilter}
                onChange={(e) => {
                  setUrgencyFilter(e.target.value as UrgencyLevel | '');
                  setCurrentPage(1);
                }}
                className="select-field"
              >
                <option value="">全部紧急程度</option>
                {URGENCY_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">
                房号搜索
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={roomSearch}
                  onChange={(e) => {
                    setRoomSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="输入房号搜索..."
                  className="input-field pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="card overflow-hidden">
          {paginatedOrders.length === 0 ? (
            <div className="py-16">
              <Empty />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        工单号
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        房号
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        报修类型
                      </th>
                      <th
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                        onClick={() => handleSort('urgency')}
                      >
                        <div className="flex items-center gap-1">
                          紧急程度
                          <SortIcon columnKey="urgency" />
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        状态
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        派单人
                      </th>
                      <th
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                        onClick={() => handleSort('createdAt')}
                      >
                        <div className="flex items-center gap-1">
                          创建时间
                          <SortIcon columnKey="createdAt" />
                        </div>
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedOrders.map((order, index) => (
                      <tr
                        key={order.id}
                        className={cn(
                          'hover:bg-gray-50 transition-colors animate-fade-in-up',
                          index % 2 === 1 && 'bg-gray-50/50'
                        )}
                      >
                        <td className="px-4 py-3.5">
                          <span className="font-mono text-sm text-gray-900">
                            {order.orderNo}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-sm text-gray-900 font-medium">
                            {order.roomNumber}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-sm text-gray-700">{order.repairType}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={cn('badge border', getUrgencyColor(order.urgency))}>
                            {order.urgency}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={cn('badge border', getStatusColor(order.status))}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-sm text-gray-600">
                            {order.assigneeName || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-sm text-gray-500">
                            {formatDateTime(order.createdAt)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-end gap-2">
                            {(order.status === '待派单' || order.status === '已取消') && (
                              <button
                                onClick={() => handleAssign(order)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                              >
                                <UserPlus className="w-3.5 h-3.5" />
                                派单
                              </button>
                            )}
                            <button
                              onClick={() => handleViewDetail(order)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              详情
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-4 border-t border-gray-100">
                  <div className="text-sm text-gray-500">
                    显示 {(currentPage - 1) * PAGE_SIZE + 1} -{' '}
                    {Math.min(currentPage * PAGE_SIZE, filteredOrders.length)} 条，共{' '}
                    {filteredOrders.length} 条
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4 text-gray-600" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={cn(
                          'w-9 h-9 rounded-lg text-sm font-medium transition-colors',
                          currentPage === page
                            ? 'bg-primary-600 text-white'
                            : 'hover:bg-gray-100 text-gray-600'
                        )}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <AssignWorkerModal
        isOpen={assignModalOpen}
        onClose={() => {
          setAssignModalOpen(false);
          setSelectedOrder(null);
        }}
        onAssign={(workerId) => {
          if (selectedOrder) {
            const { assignOrder, currentUser } = useAppStore.getState();
            assignOrder(selectedOrder.id, workerId, currentUser.name);
          }
        }}
        repairType={selectedOrder?.repairType || '水电'}
        orderNo={selectedOrder?.orderNo || ''}
      />

      <OrderDetailModal
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedOrder(null);
        }}
        order={selectedOrder}
      />
    </div>
  );
}
