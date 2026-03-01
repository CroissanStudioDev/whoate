"use client";

import { motion, PanInfo, useMotionValue, useTransform } from "framer-motion";
import { Check, Users, X } from "lucide-react";
import { formatCurrency } from "@/types";

interface SwipeCardProps {
  item: {
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  };
  currency: string;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onSwipeUp: () => void;
}

export function SwipeCard({
  item,
  currency,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
}: SwipeCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateZ = useTransform(x, [-200, 200], [-10, 10]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);

  const leftIndicatorOpacity = useTransform(x, [-100, 0], [1, 0]);
  const rightIndicatorOpacity = useTransform(x, [0, 100], [0, 1]);
  const upIndicatorOpacity = useTransform(y, [-100, 0], [1, 0]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100;

    if (info.offset.y < -threshold) {
      onSwipeUp();
    } else if (info.offset.x > threshold) {
      onSwipeRight();
    } else if (info.offset.x < -threshold) {
      onSwipeLeft();
    }
  };

  return (
    <div className="relative w-full max-w-sm mx-auto">
      {/* Indicators */}
      <motion.div
        className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full border border-neutral-200 bg-white"
        style={{ opacity: leftIndicatorOpacity }}
      >
        <X className="w-5 h-5 text-neutral-400" />
      </motion.div>
      <motion.div
        className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full border border-neutral-900 bg-neutral-900"
        style={{ opacity: rightIndicatorOpacity }}
      >
        <Check className="w-5 h-5 text-white" />
      </motion.div>
      <motion.div
        className="absolute left-1/2 -top-2 -translate-x-1/2 z-10 p-2 rounded-full border border-neutral-200 bg-white"
        style={{ opacity: upIndicatorOpacity }}
      >
        <Users className="w-5 h-5 text-neutral-600" />
      </motion.div>

      {/* Card */}
      <motion.div
        drag
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.7}
        onDragEnd={handleDragEnd}
        style={{ x, y, rotateZ, opacity }}
        className="cursor-grab active:cursor-grabbing"
      >
        <div className="p-8 rounded-lg border border-neutral-200 bg-white">
          <div className="text-center space-y-3">
            <h2 className="text-xl font-medium">{item.name}</h2>
            {item.quantity > 1 && (
              <p className="text-neutral-400">
                {item.quantity} × {formatCurrency(item.unitPrice, currency)}
              </p>
            )}
            <p className="text-3xl font-mono">{formatCurrency(item.totalPrice, currency)}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
