import {
  Home,
  User,
  Phone,
  Wrench,
  AlertTriangle,
  Clock,
  UserCheck,
  Hash,
  Wallet,
} from 'lucide-react';
import { RepairOrder } from '@/types';
import { formatDateTime, getStatusColor, getUrgencyColor, checkPropertyFeeStatus } from '@/utils';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store';

interface OrderInfoPanelProps {
  order: RepairOrder;
}

export default function OrderInfoPanel({ order }: OrderInfoPanelProps) {
  const { propertyFees } = useAppStore();

  const feeRecord = propertyFees.find(
    (p) => p.roomNumber.trim().toLowerCase() === order.roomNumber.trim().toLowerCase()
  );
  const feeCheck = checkPropertyFeeStatus(feeRecord);

  const getFeeBadgeClass = () => {
    if (feeCheck.level === 'danger') return 'bg-orange-100 text-orange-700 border-orange-200';
    if (feeCheck.level === 'warning') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-green-100 text-green-700 border-green-200';
  };

  const infoItems = [
    {
      icon: Hash,
      label: '工单编号',
      value: order.orderNo,
    },
    {
      icon: Home,
      label: '房号',
      value: order.roomNumber,
    },
    {
      icon: User,
      label: '报修人',
      value: order.ownerName,
    },
    {
      icon: Phone,
      label: '联系电话',
      value: order.ownerPhone,
    },
    {
      icon: Wrench,
      label: '报修类型',
      value: order.repairType,
    },
    {
      icon: AlertTriangle,
      label: '紧急程度',
      value: order.urgency,
      isBadge: true,
      badgeClass: getUrgencyColor(order.urgency),
    },
    {
      icon: Wallet,
      label: '物业费状态',
      value: feeCheck.record?.status || '未查询',
      isBadge: true,
      badgeClass: getFeeBadgeClass(),
      tooltip: feeCheck.message || '未查询到物业费记录',
    },
    {
      icon: Clock,
      label: '创建时间',
      value: formatDateTime(order.createdAt),
    },
    {
      icon: UserCheck,
      label: '派单人',
      value: order.assigneeName || '暂未派单',
    },
  ];

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-primary-900">工单基本信息</h2>
          <p className="text-sm text-gray-500 mt-1">工单详细信息一览</p>
        </div>
        <span
          className={cn(
            'badge border',
            getStatusColor(order.status)
          )}
        >
          {order.status}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {infoItems.map((item, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-3 rounded-lg bg-primary-50/50 hover:bg-primary-50 transition-colors"
            title={(item as any).tooltip}
          >
            <div className="p-2 rounded-lg bg-primary-100 text-primary-700 shrink-0">
              <item.icon className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-500 mb-0.5">{item.label}</p>
              {item.isBadge ? (
                <span
                  className={cn(
                    'badge border',
                    item.badgeClass
                  )}
                >
                  {item.value}
                </span>
              ) : (
                <p className="text-sm font-medium text-gray-900 truncate">{item.value}</p>
              )}
            </div>
          </div>
        ))}
      </div>
      {feeCheck.level !== 'normal' && feeCheck.record && (
        <div
          className={cn(
            'mt-4 p-3 rounded-lg border flex items-start gap-2',
            feeCheck.level === 'danger'
              ? 'bg-orange-50 border-orange-200'
              : 'bg-yellow-50 border-yellow-200'
          )}
        >
          <Wallet
            className={cn(
              'w-4 h-4 mt-0.5 shrink-0',
              feeCheck.level === 'danger' ? 'text-orange-600' : 'text-yellow-600'
            )}
          />
          <div className="flex-1 min-w-0">
            <p
              className={cn(
                'text-sm',
                feeCheck.level === 'danger' ? 'text-orange-700' : 'text-yellow-700'
              )}
            >
              {feeCheck.message}
            </p>
            {feeCheck.level === 'danger' && (
              <p className="text-xs text-gray-500 mt-1">
                欠费已超过3个月，已标记提示。本次报修正常受理，不受影响。
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
