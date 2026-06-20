import { useState, useMemo } from 'react';
import { MapPin, User, Phone, FileText, Clock, AlertTriangle, Package, Wrench, CheckCircle, PlayCircle, ClipboardCheck, Wrench as WrenchIcon, Wallet } from 'lucide-react';
import { useAppStore } from '@/store';
import { RepairOrder, URGENCY_WEIGHT } from '@/types';
import { formatDateTime, getUrgencyBadge, formatCurrency, getRelativeTime, checkPropertyFeeStatus } from '@/utils';
import { cn } from '@/lib/utils';
import Empty from '@/components/Empty';
import OrderDetailModal from '@/components/OrderDetailModal';

type TabKey = 'pending' | 'inProgress' | 'completed';

const TABS: { key: TabKey; label: string; statuses: string[] }[] = [
  { key: 'pending', label: '待接单', statuses: ['已派单'] },
  { key: 'inProgress', label: '进行中', statuses: ['已接单', '维修中'] },
  { key: 'completed', label: '已完工', statuses: ['待确认', '已完成'] },
];

function OrderCard({
  order,
  tabKey,
  onAccept,
  onArrive,
  onComplete,
  onViewDetail,
  isUrgent,
  canAccept,
  propertyFees,
}: {
  order: RepairOrder;
  tabKey: TabKey;
  onAccept: () => void;
  onArrive: (remark: string) => void;
  onComplete: (remark: string) => void;
  onViewDetail: () => void;
  isUrgent: boolean;
  canAccept?: boolean;
  propertyFees: ReturnType<typeof useAppStore.getState>['propertyFees'];
}) {
  const [arriveRemark, setArriveRemark] = useState('');
  const [completeRemark, setCompleteRemark] = useState('');
  const [showArriveInput, setShowArriveInput] = useState(false);
  const [showCompleteInput, setShowCompleteInput] = useState(false);

  const totalMaterialCost = order.materials.reduce((sum, m) => sum + m.totalPrice, 0);

  const feeRecord = propertyFees.find(
    (p) => p.roomNumber.trim().toLowerCase() === order.roomNumber.trim().toLowerCase()
  );
  const feeCheck = checkPropertyFeeStatus(feeRecord);

  const handleArrive = () => {
    onArrive(arriveRemark || '已到达现场');
    setArriveRemark('');
    setShowArriveInput(false);
  };

  const handleComplete = () => {
    onComplete(completeRemark || '维修完成');
    setCompleteRemark('');
    setShowCompleteInput(false);
  };

  return (
    <div
      className={cn(
        'card overflow-hidden animate-fade-in-up transition-all duration-300',
        isUrgent && tabKey === 'pending' && 'ring-2 ring-red-400 animate-pulse-slow'
      )}
    >
      {isUrgent && tabKey === 'pending' && (
        <div className="bg-gradient-to-r from-red-500 to-red-600 px-4 py-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-white" />
          <span className="text-white text-sm font-semibold">紧急工单 - 请优先处理</span>
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-sm text-gray-500">{order.orderNo}</span>
              <span className={cn('badge', getUrgencyBadge(order.urgency))}>
                {order.urgency}
              </span>
              {order.autoEscalated && (
                <span className="badge bg-orange-500 text-white">已自动升级</span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary-600" />
                {order.roomNumber}
              </h3>
              {feeCheck.level !== 'normal' && feeCheck.record && (
                <span
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border',
                    feeCheck.level === 'danger'
                      ? 'bg-orange-100 text-orange-700 border-orange-200'
                      : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                  )}
                  title={feeCheck.message}
                >
                  <Wallet className="w-3 h-3" />
                  欠费{feeCheck.record.arrearsMonths}月
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {order.repairType} · {getRelativeTime(order.createdAt)}
            </p>
            {feeCheck.level === 'danger' && feeCheck.record && (
              <p className="text-xs text-orange-600 mt-1 bg-orange-50 px-2 py-1 rounded">
                ⚠️ 业主物业费已欠费{feeCheck.record.arrearsMonths}个月（累计{formatCurrency(feeCheck.record.totalArrears)}），上门服务时可同步提醒缴费
              </p>
            )}
          </div>
          <button
            onClick={onViewDetail}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FileText className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <p className="text-sm text-gray-700 leading-relaxed">{order.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <User className="w-4 h-4 text-gray-400" />
            <span>{order.ownerName}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Phone className="w-4 h-4 text-gray-400" />
            <span>{order.ownerPhone}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-4 h-4 text-gray-400" />
            <span>{formatDateTime(order.createdAt)}</span>
          </div>
          {tabKey !== 'pending' && (
            <div className="flex items-center gap-2 text-gray-600">
              <WrenchIcon className="w-4 h-4 text-gray-400" />
              <span>{order.status}</span>
            </div>
          )}
        </div>

        {order.materials.length > 0 && (
          <div className="border-t border-gray-100 pt-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Package className="w-4 h-4" />
                使用耗材
              </span>
              <span className="text-sm font-semibold text-primary-700">
                {formatCurrency(totalMaterialCost)}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {order.materials.map((m) => (
                <span
                  key={m.id}
                  className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                >
                  {m.name} × {m.quantity}
                </span>
              ))}
            </div>
          </div>
        )}

        {tabKey === 'pending' && (
          <div className="pt-2 border-t border-gray-100">
            <button
              onClick={onAccept}
              disabled={canAccept === false}
              className={cn(
                'w-full py-3 rounded-lg font-medium text-white transition-all duration-200 flex items-center justify-center gap-2',
                isUrgent
                  ? 'bg-red-600 hover:bg-red-700 hover:scale-[1.02] active:scale-[0.98]'
                  : 'bg-primary-600 hover:bg-primary-700 hover:scale-[1.02] active:scale-[0.98]',
                canAccept === false && 'opacity-50 cursor-not-allowed hover:scale-100'
              )}
            >
              <PlayCircle className="w-5 h-5" />
              {canAccept === false ? '请切换到维修工角色' : '立即接单'}
            </button>
          </div>
        )}

        {tabKey === 'inProgress' && (
          <div className="space-y-3 pt-2 border-t border-gray-100">
            {order.status === '已接单' && (
              <>
                {!showArriveInput ? (
                  <button
                    onClick={() => setShowArriveInput(true)}
                    className="w-full py-2.5 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <Wrench className="w-5 h-5" />
                    已到达现场
                  </button>
                ) : (
                  <div className="space-y-2">
                    <textarea
                      value={arriveRemark}
                      onChange={(e) => setArriveRemark(e.target.value)}
                      placeholder="请输入到场备注（选填）"
                      className="textarea-field text-sm"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowArriveInput(false)}
                        className="flex-1 btn-secondary py-2 text-sm"
                      >
                        取消
                      </button>
                      <button
                        onClick={handleArrive}
                        className="flex-1 py-2 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 transition-all text-sm"
                      >
                        确认到场
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {order.status === '维修中' && (
              <>
                {!showCompleteInput ? (
                  <button
                    onClick={() => setShowCompleteInput(true)}
                    className="w-full py-2.5 rounded-lg font-medium text-white bg-green-600 hover:bg-green-700 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    提交完工
                  </button>
                ) : (
                  <div className="space-y-2">
                    <textarea
                      value={completeRemark}
                      onChange={(e) => setCompleteRemark(e.target.value)}
                      placeholder="请输入完工情况和处理说明"
                      className="textarea-field text-sm"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowCompleteInput(false)}
                        className="flex-1 btn-secondary py-2 text-sm"
                      >
                        取消
                      </button>
                      <button
                        onClick={handleComplete}
                        className="flex-1 py-2 rounded-lg font-medium text-white bg-green-600 hover:bg-green-700 transition-all text-sm"
                      >
                        确认完工
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {tabKey === 'completed' && (
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-gray-600 text-sm">
                <ClipboardCheck className="w-4 h-4 text-green-600" />
                <span>
                  {order.status === '已完成' ? '业主已确认' : '等待业主确认'}
                </span>
              </div>
              <span className="text-xs text-gray-400">
                {formatDateTime(order.updatedAt)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Workbench() {
  const { orders, currentUser, acceptOrder, updateOrderStatus, addToast, propertyFees } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabKey>('pending');
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<RepairOrder | null>(null);

  const workerId = currentUser.workerId;
  const canAccept = !!workerId;

  const tabOrders = useMemo(() => {
    const result: Record<TabKey, RepairOrder[]> = {
      pending: [],
      inProgress: [],
      completed: [],
    };

    orders.forEach((order) => {
      if (workerId && order.assigneeId !== workerId) return;

      if (order.status === '已派单') {
        result.pending.push(order);
      } else if (order.status === '已接单' || order.status === '维修中') {
        result.inProgress.push(order);
      } else if (order.status === '待确认' || order.status === '已完成') {
        result.completed.push(order);
      }
    });

    result.pending.sort((a, b) => {
      const urgencyDiff = URGENCY_WEIGHT[b.urgency] - URGENCY_WEIGHT[a.urgency];
      if (urgencyDiff !== 0) return urgencyDiff;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    result.inProgress.sort((a, b) => {
      if (a.status === '维修中' && b.status !== '维修中') return -1;
      if (b.status === '维修中' && a.status !== '维修中') return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    result.completed.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    return result;
  }, [orders, workerId]);

  const handleAccept = (order: RepairOrder) => {
    if (!workerId) {
      addToast('warning', '请切换到维修工角色后再进行接单操作');
      return;
    }
    acceptOrder(order.id, currentUser.name, workerId);
  };

  const handleArrive = (order: RepairOrder, remark: string) => {
    updateOrderStatus(order.id, '维修中', currentUser.name, remark);
  };

  const handleComplete = (order: RepairOrder, remark: string) => {
    updateOrderStatus(order.id, '待确认', currentUser.name, remark);
  };

  const handleViewDetail = (order: RepairOrder) => {
    setSelectedOrder(order);
    setDetailModalOpen(true);
  };

  const currentTabConfig = TABS.find((t) => t.key === activeTab)!;
  const currentOrders = tabOrders[activeTab];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-serif flex items-center gap-2">
              <Wrench className="w-7 h-7 text-primary-700" />
              维修工工作台
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              你好，{currentUser.name} · 今日待处理 {tabOrders.pending.length} 单
            </p>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="flex border-b border-gray-200">
            {TABS.map((tab) => {
              const count = tabOrders[tab.key].length;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'flex-1 px-6 py-4 text-sm font-medium transition-all duration-200 relative',
                    isActive
                      ? 'text-primary-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  )}
                >
                  <span className="flex items-center justify-center gap-2">
                    {tab.label}
                    <span
                      className={cn(
                        'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-semibold',
                        isActive
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-gray-100 text-gray-600'
                      )}
                    >
                      {count}
                    </span>
                  </span>
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="p-6">
            {currentOrders.length === 0 ? (
              <div className="py-16">
                <Empty />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {currentOrders.map((order) => {
                  const isUrgent =
                    order.urgency === '紧急' || order.urgency === '非常紧急';
                  return (
                    <OrderCard
                      key={order.id}
                      order={order}
                      tabKey={activeTab}
                      onAccept={() => handleAccept(order)}
                      onArrive={(remark) => handleArrive(order, remark)}
                      onComplete={(remark) => handleComplete(order, remark)}
                      onViewDetail={() => handleViewDetail(order)}
                      isUrgent={isUrgent}
                      canAccept={canAccept}
                      propertyFees={propertyFees}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

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
