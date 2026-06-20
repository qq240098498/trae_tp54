import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, AlertCircle, Star, MessageSquare } from 'lucide-react';
import { useAppStore } from '@/store';
import OrderInfoPanel from '@/components/OrderInfoPanel';
import OrderTimeline from '@/components/OrderTimeline';
import MaterialForm from '@/components/MaterialForm';
import SignaturePad from '@/components/SignaturePad';
import OrderActions from '@/components/OrderActions';
import SatisfactionSurveyModal from '@/components/SatisfactionSurveyModal';
import Empty from '@/components/Empty';
import { SatisfactionRating, SATISFACTION_RATING_LABELS } from '@/types';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/utils';

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    orders,
    currentUser,
    updateOrderStatus,
    addMaterial,
    removeMaterial,
    confirmOrder,
    cancelOrder,
    submitSatisfaction,
  } = useAppStore();

  const order = orders.find((o) => o.id === id);
  const [signature, setSignature] = useState<string>(order?.signature || '');
  const [satisfactionModalOpen, setSatisfactionModalOpen] = useState(false);
  const [hasShownSurvey, setHasShownSurvey] = useState(false);

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 hover:text-primary-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>返回</span>
            </button>
          </div>
        </header>
        <div className="flex-1">
          <Empty />
        </div>
      </div>
    );
  }

  const isTerminal = order.status === '已完成' || order.status === '已取消';
  const isOwner = currentUser.role === 'owner';
  const isWorker = currentUser.role === 'worker';
  const isAdmin = currentUser.role === 'admin';

  const canEditMaterials = (isWorker || isAdmin) && !isTerminal;
  const showSignaturePad = isOwner && order.status === '待确认';
  const showSignatureReadonly = isTerminal && order.signature;

  const handleArrive = () => {
    updateOrderStatus(order.id, '维修中', currentUser.name, '已到达现场，开始维修作业');
  };

  const handleComplete = () => {
    updateOrderStatus(order.id, '待确认', currentUser.name, '维修完成，请业主确认');
  };

  const handleConfirm = () => {
    if (!signature) return;
    confirmOrder(order.id, signature, currentUser.name);
  };

  const handleCancel = () => {
    if (window.confirm('确定要取消此工单吗？取消后将无法恢复。')) {
      cancelOrder(order.id, currentUser.name, '管理员取消工单');
    }
  };

  const handleAddMaterial = (material: { name: string; quantity: number; unitPrice: number }) => {
    addMaterial(order.id, material);
  };

  const handleRemoveMaterial = (materialId: string) => {
    removeMaterial(order.id, materialId);
  };

  const handleSubmitSatisfaction = (rating: SatisfactionRating, comment: string) => {
    submitSatisfaction(order.id, rating, comment, currentUser.name);
    setSatisfactionModalOpen(false);
  };

  useEffect(() => {
    if (order?.status === '已完成' && !order.satisfactionRating && currentUser.role === 'owner' && !hasShownSurvey) {
      const timer = setTimeout(() => {
        setSatisfactionModalOpen(true);
        setHasShownSurvey(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [order?.status, order?.satisfactionRating, currentUser.role, hasShownSurvey]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-primary-800 transition-colors shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary-700 shrink-0" />
                  <h1 className="text-lg font-bold text-primary-900 truncate">工单详情</h1>
                </div>
                <p className="text-sm text-gray-500 truncate">工单编号：{order.orderNo}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6 pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <OrderInfoPanel order={order} />
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-primary-900 mb-4">问题描述</h2>
              <div className="p-4 bg-primary-50/50 rounded-xl">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {order.description}
                </p>
                {order.urgency === '非常紧急' && (
                  <div className="mt-4 flex items-center gap-2 text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span className="text-sm font-medium">此工单为非常紧急级别，请优先处理</span>
                  </div>
                )}
              </div>
            </div>

            <OrderTimeline timeline={order.timeline} />

            <MaterialForm
              materials={order.materials}
              onAdd={handleAddMaterial}
              onRemove={handleRemoveMaterial}
              readonly={!canEditMaterials}
            />

            {(showSignaturePad || showSignatureReadonly) && (
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-primary-900 mb-4">业主签字确认</h2>
                <SignaturePad
                  value={order.signature || signature}
                  onChange={setSignature}
                  readonly={!showSignaturePad}
                />
              </div>
            )}

            {order.status === '已完成' && (
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-primary-900 mb-4">服务满意度评价</h2>
                {order.satisfactionRating ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={cn(
                              'w-6 h-6',
                              star <= order.satisfactionRating!
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            )}
                          />
                        ))}
                      </div>
                      <span
                        className={cn(
                          'px-3 py-1 rounded-full text-sm font-medium',
                          order.satisfactionRating <= 2
                            ? 'bg-red-50 text-red-600'
                            : order.satisfactionRating === 3
                            ? 'bg-yellow-50 text-yellow-600'
                            : 'bg-green-50 text-green-600'
                        )}
                      >
                        {SATISFACTION_RATING_LABELS[order.satisfactionRating]}
                      </span>
                    </div>
                    {order.satisfactionComment && (
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-600 flex items-start gap-2">
                          <MessageSquare className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" />
                          <span>{order.satisfactionComment}</span>
                        </p>
                      </div>
                    )}
                    <p className="text-xs text-gray-400">
                      评价时间：{formatDateTime(order.satisfactionSubmittedAt!)}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <Star className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 mb-4">您还未对本次服务进行评价</p>
                    {currentUser.role === 'owner' && (
                      <button
                        onClick={() => setSatisfactionModalOpen(true)}
                        className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
                      >
                        去评价
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <OrderActions
        order={order}
        role={currentUser.role}
        operatorName={currentUser.name}
        signature={signature}
        onArrive={handleArrive}
        onComplete={handleComplete}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />

      <SatisfactionSurveyModal
        open={satisfactionModalOpen}
        onClose={() => setSatisfactionModalOpen(false)}
        onSubmit={handleSubmitSatisfaction}
        orderNo={order.orderNo}
      />
    </div>
  );
}
