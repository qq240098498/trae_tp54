import { ArrowLeft, PlayCircle, CheckCircle2, PenSquare, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { RepairOrder, UserRole } from '@/types';
import { cn } from '@/lib/utils';

interface OrderActionsProps {
  order: RepairOrder;
  role: UserRole;
  operatorName: string;
  signature?: string;
  onArrive: () => void;
  onComplete: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function OrderActions({
  order,
  role,
  signature,
  onArrive,
  onComplete,
  onConfirm,
  onCancel,
}: OrderActionsProps) {
  const navigate = useNavigate();

  const canArrive =
    role === 'worker' && (order.status === '已派单' || order.status === '已接单');
  const canComplete =
    role === 'worker' && order.status === '维修中';
  const canConfirm =
    role === 'owner' && order.status === '待确认' && !!signature;
  const canCancel =
    role === 'admin' &&
    (order.status === '待派单' ||
      order.status === '已派单' ||
      order.status === '已接单' ||
      order.status === '维修中');

  const isTerminal = order.status === '已完成' || order.status === '已取消';

  return (
    <div
      className={cn(
        'sticky bottom-0 left-0 right-0 z-20 border-t border-gray-200',
        'bg-white/95 backdrop-blur-sm shadow-lg'
      )}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            返回
          </button>

          {!isTerminal && (
            <div className="flex flex-wrap items-center justify-center gap-3">
              {canCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="btn-danger flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  取消工单
                </button>
              )}

              {canArrive && (
                <button
                  type="button"
                  onClick={onArrive}
                  className="btn-primary flex items-center justify-center gap-2"
                >
                  <PlayCircle className="w-4 h-4" />
                  到场
                </button>
              )}

              {canComplete && (
                <button
                  type="button"
                  onClick={onComplete}
                  className="btn-success flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  完工
                </button>
              )}

              {role === 'owner' && order.status === '待确认' && (
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={!signature}
                  className={cn(
                    'btn-primary flex items-center justify-center gap-2',
                    !signature && 'opacity-50 cursor-not-allowed hover:scale-100'
                  )}
                >
                  <PenSquare className="w-4 h-4" />
                  签字确认
                  {!signature && (
                    <span className="text-xs opacity-75">(请先签名)</span>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
