import { X, MapPin, User, Phone, FileText, Clock, AlertTriangle, Package, CheckSquare, Wrench, Wallet } from 'lucide-react';
import { useAppStore } from '@/store';
import { RepairOrder } from '@/types';
import { formatDateTime, getUrgencyColor, getStatusColor, formatCurrency, getRelativeTime, checkPropertyFeeStatus } from '@/utils';
import { cn } from '@/lib/utils';

interface OrderDetailModalProps {
  open: boolean;
  onClose: () => void;
  order: RepairOrder | null;
}

export default function OrderDetailModal({ open, onClose, order }: OrderDetailModalProps) {
  const { workers, propertyFees } = useAppStore();

  if (!open || !order) return null;

  const assignee = order.assigneeId ? workers.find((w) => w.id === order.assigneeId) : null;
  const totalMaterialCost = order.materials.reduce((sum, m) => sum + m.totalPrice, 0);

  const feeRecord = propertyFees.find(
    (p) => p.roomNumber.trim().toLowerCase() === order.roomNumber.trim().toLowerCase()
  );
  const feeCheck = checkPropertyFeeStatus(feeRecord);
  const feeBadgeColor =
    feeCheck.level === 'danger'
      ? 'bg-orange-100 text-orange-700'
      : feeCheck.level === 'warning'
      ? 'bg-yellow-100 text-yellow-700'
      : 'bg-green-100 text-green-700';
  const feeTextColor =
    feeCheck.level === 'danger'
      ? 'text-orange-600'
      : feeCheck.level === 'warning'
      ? 'text-yellow-700'
      : 'text-green-700';

  const timelineIcons = {
    待派单: FileText,
    已派单: User,
    已接单: CheckSquare,
    维修中: Wrench,
    待确认: Clock,
    已完成: CheckSquare,
    已取消: X,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col animate-slide-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900 font-serif">工单详情</h2>
            <span className={cn('badge border', getStatusColor(order.status))}>
              {order.status}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="card p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary-600" />
                  基本信息
                </h3>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">工单编号</span>
                    <span className="font-mono text-gray-900">{order.orderNo}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">紧急程度</span>
                    <span className={cn('badge border', getUrgencyColor(order.urgency))}>
                      {order.urgency}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">报修类型</span>
                    <span className="text-gray-900">{order.repairType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">创建时间</span>
                    <span className="text-gray-900">{formatDateTime(order.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">创建时间</span>
                    <span className="text-gray-500">{getRelativeTime(order.createdAt)}</span>
                  </div>
                  {order.autoEscalated && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                        自动升级
                      </span>
                      <span className="text-orange-600 text-xs">
                        {order.lastEscalationTime && formatDateTime(order.lastEscalationTime)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="card p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary-600" />
                  业主信息
                </h3>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      房号
                    </span>
                    <span className="text-gray-900 font-medium">{order.roomNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      报修人
                    </span>
                    <span className="text-gray-900">{order.ownerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" />
                      联系电话
                    </span>
                    <span className="text-gray-900">{order.ownerPhone}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                    <span className="text-gray-500 flex items-center gap-1">
                      <Wallet className="w-3.5 h-3.5" />
                      物业费
                    </span>
                    {feeCheck.record ? (
                      <div className="flex items-center gap-2 text-right">
                        <span className={cn('badge', feeBadgeColor)}>
                          {feeCheck.record.status}
                        </span>
                        <span className={cn('text-xs', feeTextColor)}>{feeCheck.message}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">未查询到物业费记录</span>
                    )}
                  </div>
                </div>
              </div>

              {assignee && (
                <div className="card p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4 text-primary-600" />
                    维修人员
                  </h3>
                  <div className="space-y-2.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">姓名</span>
                      <span className="text-gray-900 font-medium">{assignee.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">联系电话</span>
                      <span className="text-gray-900">{assignee.phone}</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-gray-500">技能</span>
                      <div className="flex flex-wrap gap-1 justify-end">
                        {assignee.skills.map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-0.5 bg-primary-50 text-primary-700 rounded text-xs"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="card p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary-600" />
                  问题描述
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg">
                  {order.description}
                </p>
              </div>

              {order.materials.length > 0 && (
                <div className="card p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4 text-primary-600" />
                    使用耗材
                  </h3>
                  <div className="space-y-2">
                    {order.materials.map((material) => (
                      <div
                        key={material.id}
                        className="flex items-center justify-between text-sm py-2 border-b border-gray-100 last:border-0"
                      >
                        <div>
                          <span className="text-gray-900">{material.name}</span>
                          <span className="text-gray-500 ml-2">
                            × {material.quantity}
                          </span>
                        </div>
                        <span className="text-gray-900 font-medium">
                          {formatCurrency(material.totalPrice)}
                        </span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                      <span className="font-medium text-gray-900">合计</span>
                      <span className="font-semibold text-primary-700">
                        {formatCurrency(totalMaterialCost)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card p-4">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary-600" />
              工单进度
            </h3>
            <div className="relative">
              <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-gray-200" />
              <div className="space-y-4">
                {order.timeline.map((node, index) => {
                  const Icon = timelineIcons[node.status] || Clock;
                  const isLast = index === order.timeline.length - 1;
                  return (
                    <div key={index} className="relative flex gap-4 pl-1">
                      <div
                        className={cn(
                          'relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                          isLast
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 text-gray-500'
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 pb-1">
                        <div className="flex items-center justify-between">
                          <span className={cn('font-medium', isLast ? 'text-gray-900' : 'text-gray-600')}>
                            {node.status}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDateTime(node.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">操作人：{node.operator}</p>
                        {node.remark && (
                          <p className="text-sm text-gray-600 mt-1 bg-gray-50 p-2 rounded">
                            备注：{node.remark}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="btn-primary">
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
