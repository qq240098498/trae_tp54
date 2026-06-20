import { useState, useMemo } from 'react';
import { X, User, Phone, Wrench, Star, Clock, CheckCircle, AlertCircle, Wallet, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useAppStore } from '@/store';
import { RepairType, Worker } from '@/types';
import { cn } from '@/lib/utils';
import { checkPropertyFeeStatus } from '@/utils';

interface AssignWorkerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (workerId: string) => void;
  repairType: RepairType;
  orderNo: string;
  roomNumber?: string;
}

interface WorkerWithScore extends Worker {
  matchScore: number;
  hasMatchingSkill: boolean;
}

const statusColors: Record<Worker['status'], string> = {
  空闲: 'bg-green-100 text-green-700 border-green-200',
  忙碌: 'bg-amber-100 text-amber-700 border-amber-200',
  休息: 'bg-gray-100 text-gray-600 border-gray-200',
};

export default function AssignWorkerModal({
  isOpen,
  onClose,
  onAssign,
  repairType,
  orderNo,
  roomNumber,
}: AssignWorkerModalProps) {
  const { workers, orders, propertyFees } = useAppStore();
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);

  const propertyFeeCheck = useMemo(() => {
    if (!roomNumber) return null;
    const keyword = roomNumber.trim().toLowerCase();
    const record = propertyFees.find(
      (p) => p.roomNumber.trim().toLowerCase() === keyword
    );
    return checkPropertyFeeStatus(record);
  }, [roomNumber, propertyFees]);

  const sortedWorkers = useMemo<WorkerWithScore[]>(() => {
    return workers
      .map((worker) => {
        const hasMatchingSkill = worker.skills.includes(repairType);
        const activeOrders = orders.filter(
          (o) => o.assigneeId === worker.id && ['已派单', '已接单', '维修中'].includes(o.status)
        ).length;

        let matchScore = 0;
        if (hasMatchingSkill) matchScore += 50;
        if (worker.status === '空闲') matchScore += 30;
        if (worker.status === '忙碌') matchScore += 10;
        matchScore += Math.min(worker.completedOrders / 10, 20);
        matchScore -= activeOrders * 5;

        return {
          ...worker,
          matchScore,
          hasMatchingSkill,
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore);
  }, [workers, repairType, orders]);

  const recommendedWorker = sortedWorkers.find(
    (w) => w.hasMatchingSkill && w.status === '空闲'
  ) || sortedWorkers.find((w) => w.hasMatchingSkill) || sortedWorkers[0];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-fade-in-up">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-800">分配维修工</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              工单 <span className="font-medium text-primary-800">{orderNo}</span>
              {' · '}
              维修类型 <span className="font-medium text-primary-800">{repairType}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 物业费状态提示 */}
        {propertyFeeCheck && propertyFeeCheck.record && propertyFeeCheck.level !== 'normal' && (
          <div
            className={cn(
              'mx-6 mt-4 p-3 rounded-xl flex items-start gap-3 border',
              propertyFeeCheck.level === 'danger'
                ? 'bg-orange-50 border-orange-200'
                : 'bg-yellow-50 border-yellow-200'
            )}
          >
            {propertyFeeCheck.level === 'danger' ? (
              <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="text-sm flex-1">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-gray-500" />
                <span
                  className={cn(
                    'font-semibold',
                    propertyFeeCheck.level === 'danger' ? 'text-orange-800' : 'text-yellow-800'
                  )}
                >
                  业主物业费状态：
                </span>
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-medium',
                    propertyFeeCheck.level === 'danger'
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-yellow-100 text-yellow-700'
                  )}
                >
                  {propertyFeeCheck.record.status}
                </span>
              </div>
              <p
                className={cn(
                  'mt-1',
                  propertyFeeCheck.level === 'danger' ? 'text-orange-700' : 'text-yellow-700'
                )}
              >
                {propertyFeeCheck.message}
              </p>
              {propertyFeeCheck.level === 'danger' && (
                <p className="text-xs text-gray-500 mt-1">
                  欠费已超过3个月，建议派单时同步提醒业主尽快缴费，本次报修正常受理不受影响。
                </p>
              )}
            </div>
          </div>
        )}

        {propertyFeeCheck && propertyFeeCheck.level === 'normal' && (
          <div className="mx-6 mt-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-gray-500" />
                <span className="font-semibold text-green-800">物业费缴纳正常</span>
              </div>
              <p className="text-green-700 mt-1">{propertyFeeCheck.message}</p>
            </div>
          </div>
        )}

        {/* 推荐提示 */}
        {recommendedWorker && (
          <div className="mx-6 mt-4 p-3 bg-primary-50 border border-primary-200 rounded-xl flex items-start gap-3">
            <Star className="w-5 h-5 text-primary-700 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <span className="font-semibold text-primary-800">智能推荐：</span>
              <span className="text-primary-700">
                {recommendedWorker.name}，精通 {recommendedWorker.skills.join('、')}，当前
                {recommendedWorker.status}，已完成 {recommendedWorker.completedOrders} 单
              </span>
            </div>
          </div>
        )}

        {/* 维修工列表 */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {sortedWorkers.map((worker, index) => (
            <div
              key={worker.id}
              onClick={() => worker.status !== '休息' && setSelectedWorkerId(worker.id)}
              className={cn(
                'p-4 rounded-xl border-2 transition-all duration-200',
                worker.status === '休息'
                  ? 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed'
                  : selectedWorkerId === worker.id
                  ? 'bg-primary-50 border-primary-500 shadow-md'
                  : 'bg-white border-gray-200 hover:border-primary-300 hover:bg-primary-50/30 cursor-pointer'
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      'w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-lg',
                      worker.status === '休息' ? 'bg-gray-400' : 'bg-primary-800'
                    )}
                  >
                    {worker.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800">{worker.name}</span>
                      {recommendedWorker?.id === worker.id && (
                        <span className="badge bg-primary-100 text-primary-800 border-primary-200">
                          <Star className="w-3 h-3 mr-1 fill-current" />
                          推荐
                        </span>
                      )}
                      {index === 0 && worker.status === '空闲' && worker.hasMatchingSkill && (
                        <span className="badge bg-green-100 text-green-700 border-green-200">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          最佳匹配
                        </span>
                      )}
                      {worker.status === '休息' && (
                        <span className="badge bg-gray-100 text-gray-600 border-gray-200">
                          <Clock className="w-3 h-3 mr-1" />
                          休息中
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1.5 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" />
                        {worker.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <Wrench className="w-3.5 h-3.5" />
                        已完成 {worker.completedOrders} 单
                      </span>
                    </div>
                  </div>
                </div>
                <span className={cn('badge border', statusColors[worker.status])}>
                  {worker.status}
                </span>
              </div>

              {/* 技能标签 */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {worker.skills.map((skill) => (
                  <span
                    key={skill}
                    className={cn(
                      'px-2 py-0.5 rounded-md text-xs font-medium',
                      skill === repairType
                        ? 'bg-primary-100 text-primary-800 border border-primary-200'
                        : 'bg-gray-100 text-gray-600'
                    )}
                  >
                    {skill === repairType && <CheckCircle className="w-3 h-3 inline mr-0.5 -mt-0.5" />}
                    {skill}
                  </span>
                ))}
              </div>

              {/* 匹配度评分 */}
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-gray-500">匹配度</span>
                <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      worker.matchScore >= 70
                        ? 'bg-green-500'
                        : worker.matchScore >= 50
                        ? 'bg-primary-600'
                        : 'bg-amber-500'
                    )}
                    style={{ width: `${Math.min(worker.matchScore, 100)}%` }}
                  />
                </div>
                <span
                  className={cn(
                    'text-xs font-semibold w-8 text-right',
                    worker.matchScore >= 70
                      ? 'text-green-600'
                      : worker.matchScore >= 50
                      ? 'text-primary-700'
                      : 'text-amber-600'
                  )}
                >
                  {Math.round(worker.matchScore)}
                </span>
              </div>

              {!worker.hasMatchingSkill && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                  <AlertCircle className="w-3.5 h-3.5" />
                  该维修工不精通此维修类型，可能影响维修效率
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 底部操作 */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="btn-secondary">
            取消
          </button>
          <button
            onClick={() => {
              if (selectedWorkerId) {
                onAssign(selectedWorkerId);
                onClose();
              }
            }}
            disabled={!selectedWorkerId}
            className="btn-primary flex items-center gap-2"
          >
            <User className="w-4 h-4" />
            确认派单
          </button>
        </div>
      </div>
    </div>
  );
}
