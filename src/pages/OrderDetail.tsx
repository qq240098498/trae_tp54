import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/store';
import OrderInfoPanel from '@/components/OrderInfoPanel';
import OrderTimeline from '@/components/OrderTimeline';
import MaterialForm from '@/components/MaterialForm';
import SignaturePad from '@/components/SignaturePad';
import OrderActions from '@/components/OrderActions';
import Empty from '@/components/Empty';

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
  } = useAppStore();

  const order = orders.find((o) => o.id === id);
  const [signature, setSignature] = useState<string>(order?.signature || '');

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
    </div>
  );
}
