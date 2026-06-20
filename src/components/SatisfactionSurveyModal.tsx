import { useState } from 'react';
import { Star, X, MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react';
import { SatisfactionRating, SATISFACTION_RATING_LABELS } from '@/types';
import { cn } from '@/lib/utils';

interface SatisfactionSurveyModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (rating: SatisfactionRating, comment: string) => void;
  orderNo: string;
}

export default function SatisfactionSurveyModal({
  open,
  onClose,
  onSubmit,
  orderNo,
}: SatisfactionSurveyModalProps) {
  const [rating, setRating] = useState<SatisfactionRating | null>(null);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState('');

  if (!open) return null;

  const displayRating = hoverRating || (rating ?? 0);

  const handleSubmit = () => {
    if (!rating) return;
    onSubmit(rating, comment);
    setRating(null);
    setComment('');
  };

  const handleClose = () => {
    setRating(null);
    setComment('');
    onClose();
  };

  const getRatingColor = (r: number) => {
    if (r <= 2) return 'text-red-500';
    if (r === 3) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
        <div className="relative bg-gradient-to-br from-primary-600 to-primary-800 px-6 py-8 text-center">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white mb-1">服务满意度评价</h2>
          <p className="text-white/80 text-sm">工单编号：{orderNo}</p>
        </div>

        <div className="p-6 space-y-6">
          <div className="text-center">
            <p className="text-gray-600 mb-4">请对本次维修服务进行评价</p>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star as SatisfactionRating)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110 active:scale-95"
                >
                  <Star
                    className={cn(
                      'w-10 h-10 transition-colors',
                      displayRating >= star
                        ? cn('fill-current', getRatingColor(displayRating))
                        : 'text-gray-300'
                    )}
                  />
                </button>
              ))}
            </div>
            {rating && (
              <div className="mt-3">
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium',
                    rating <= 2
                      ? 'bg-red-50 text-red-600'
                      : rating === 3
                      ? 'bg-yellow-50 text-yellow-600'
                      : 'bg-green-50 text-green-600'
                  )}
                >
                  {rating <= 2 ? (
                    <ThumbsDown className="w-4 h-4" />
                  ) : (
                    <ThumbsUp className="w-4 h-4" />
                  )}
                  {SATISFACTION_RATING_LABELS[rating]}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              评价建议 <span className="text-gray-400">（选填）</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="请分享您的服务体验或建议..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none transition-all"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleClose}
              className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
            >
              稍后再说
            </button>
            <button
              onClick={handleSubmit}
              disabled={!rating}
              className={cn(
                'flex-1 py-3 px-4 rounded-xl font-medium text-white transition-all',
                rating
                  ? 'bg-primary-600 hover:bg-primary-700 active:scale-[0.98]'
                  : 'bg-gray-300 cursor-not-allowed'
              )}
            >
              提交评价
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
