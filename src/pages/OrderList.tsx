import { useState, useMemo } from 'react';
import { Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ListFilter, Eye, UserPlus, ClipboardList, Star, ThumbsUp, ThumbsDown, AlertTriangle, Wallet } from 'lucide-react';
import { useAppStore } from '@/store';
import { RepairOrder, OrderStatus, RepairType, UrgencyLevel, ORDER_STATUSES, REPAIR_TYPES, URGENCY_LEVELS, URGENCY_WEIGHT, ComplaintTodo } from '@/types';
import { formatDateTime, getUrgencyColor, getStatusColor, sortOrders, checkPropertyFeeStatus } from '@/utils';
import { cn } from '@/lib/utils';
import AssignWorkerModal from '@/components/AssignWorkerModal';
import OrderDetailModal from '@/components/OrderDetailModal';
import Empty from '@/components/Empty';

type SortKey = 'urgency' | 'createdAt' | null;
type SortDirection = 'asc' | 'desc';
type SatisfactionFilter = '' | 'rated' | 'unrated' | 'good' | 'bad';

const PAGE_SIZE = 8;

const SATISFACTION_FILTER_OPTIONS: { value: SatisfactionFilter; label: string }[] = [
  { value: '', label: '全部评价' },
  { value: 'rated', label: '已评价' },
  { value: 'unrated', label: '未评价' },
  { value: 'good', label: '好评（4-5星）' },
  { value: 'bad', label: '差评（1-3星）' },
];

export default function OrderList() {
  const { orders, complaintTodos, propertyFees } = useAppStore();

  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<RepairType | ''>('');
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyLevel | ''>('');
  const [satisfactionFilter, setSatisfactionFilter] = useState<SatisfactionFilter>('');
  const [roomSearch, setRoomSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('urgency');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<RepairOrder | null>(null);

  const getOrderComplaint = (orderId: string): ComplaintTodo | undefined => {
    return complaintTodos.find((c) => c.orderId === orderId);
  };

  const getPropertyFeeBadge = (roomNumber: string) => {
    const keyword = roomNumber.trim().toLowerCase();
    const record = propertyFees.find(
      (p) => p.roomNumber.trim().toLowerCase() === keyword
    );
    const check = checkPropertyFeeStatus(record);
    if (check.level === 'danger') {
      return {
        show: true,
        text: `欠费${check.record?.arrearsMonths}月`,
        title: check.message,
        className: 'bg-orange-100 text-orange-700 border-orange-200',
      };
    }
    if (check.level === 'warning') {
      return {
        show: true,
        text: `欠费${check.record?.arrearsMonths}月`,
        title: check.message,
        className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      };
    }
    return { show: false, text: '', title: '', className: '' };
  };

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
    if (satisfactionFilter) {
      switch (satisfactionFilter) {
        case 'rated':
          result = result.filter((o) => o.satisfactionRating !== undefined);
          break;
        case 'unrated':
          result = result.filter((o) => o.satisfactionRating === undefined);
          break;
        case 'good':
          result = result.filter((o) => o.satisfactionRating !== undefined && o.satisfactionRating >= 4);
          break;
        case 'bad':
          result = result.filter((o) => o.satisfactionRating !== undefined && o.satisfactionRating <= 3);
          break;
      }
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
  }, [orders, statusFilter, typeFilter, urgencyFilter, satisfactionFilter, roomSearch, sortKey, sortDirection]);

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
    setSatisfactionFilter('');
    setRoomSearch('');
    setCurrentPage(1);
  };

  const hasFilters = statusFilter || typeFilter || urgencyFilter || satisfactionFilter || roomSearch;

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                评价状态
              </label>
              <select
                value={satisfactionFilter}
                onChange={(e) => {
                  setSatisfactionFilter(e.target.value as SatisfactionFilter);
                  setCurrentPage(1);
                }}
                className="select-field"
              >
                {SATISFACTION_FILTER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
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
                        评价状态
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
                          <div className="flex flex-col gap-1">
                            <span className="text-sm text-gray-900 font-medium">
                              {order.roomNumber}
                            </span>
                            {(() => {
                              const feeBadge = getPropertyFeeBadge(order.roomNumber);
                              if (!feeBadge.show) return null;
                              return (
                                <span
                                  className={cn(
                                    'inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-medium w-fit',
                                    feeBadge.className
                                  )}
                                  title={feeBadge.title}
                                >
                                  <Wallet className="w-2.5 h-2.5" />
                                  {feeBadge.text}
                                </span>
                              );
                            })()}
                          </div>
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
                          <div className="flex items-center gap-2">
                            <span className={cn('badge border', getStatusColor(order.status))}>
                              {order.status}
                            </span>
                            {(() => {
                              const complaint = getOrderComplaint(order.id);
                              if (!complaint) return null;
                              const isPending = complaint.status === '待处理';
                              return (
                                <span
                                  className={cn(
                                    'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium',
                                    isPending
                                      ? 'bg-red-100 text-red-600 border border-red-200'
                                      : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                                  )}
                                  title={complaint.comment}
                                >
                                  <AlertTriangle className="w-3 h-3" />
                                  {isPending ? '客诉待处理' : '客诉处理中'}
                                </span>
                              );
                            })()}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          {order.satisfactionRating !== undefined ? (
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={cn(
                                      'w-3.5 h-3.5',
                                      star <= order.satisfactionRating!
                                        ? order.satisfactionRating! <= 2
                                          ? 'fill-red-500 text-red-500'
                                          : order.satisfactionRating! === 3
                                          ? 'fill-yellow-500 text-yellow-500'
                                          : 'fill-green-500 text-green-500'
                                        : 'text-gray-300'
                                    )}
                                  />
                                ))}
                              </div>
                              <span
                                className={cn(
                                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                                  order.satisfactionRating! <= 2
                                    ? 'bg-red-50 text-red-600'
                                    : order.satisfactionRating! === 3
                                    ? 'bg-yellow-50 text-yellow-600'
                                    : 'bg-green-50 text-green-600'
                                )}
                              >
                                {order.satisfactionRating! >= 4 ? (
                                  <ThumbsUp className="w-3 h-3" />
                                ) : (
                                  <ThumbsDown className="w-3 h-3" />
                                )}
                                {order.satisfactionRating! >= 4 ? '好评' : '差评'}
                              </span>
                            </div>
                          ) : order.status === '已完成' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
                              <Star className="w-3 h-3" />
                              未评价
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
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
        roomNumber={selectedOrder?.roomNumber}
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
