"use client";

import { motion, PanInfo, useMotionValue, useTransform } from "framer-motion";
import { Check, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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

  const rotateZ = useTransform(x, [-200, 200], [-15, 15]);
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
        className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 bg-red-500 text-white p-3 rounded-full"
        style={{ opacity: leftIndicatorOpacity }}
      >
        <X className="w-6 h-6" />
      </motion.div>
      <motion.div
        className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 bg-green-500 text-white p-3 rounded-full"
        style={{ opacity: rightIndicatorOpacity }}
      >
        <Check className="w-6 h-6" />
      </motion.div>
      <motion.div
        className="absolute left-1/2 -top-4 -translate-x-1/2 z-10 bg-blue-500 text-white p-3 rounded-full"
        style={{ opacity: upIndicatorOpacity }}
      >
        <Users className="w-6 h-6" />
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
        <Card className="p-8 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 shadow-xl">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold">{item.name}</h2>
            {item.quantity > 1 && (
              <p className="text-muted-foreground">
                {item.quantity} × {formatCurrency(item.unitPrice, currency)}
              </p>
            )}
            <p className="text-4xl font-bold text-primary">
              {formatCurrency(item.totalPrice, currency)}
            </p>
          </div>
        </Card>
      </motion.div>

      {/* Action buttons */}
      <div className="flex justify-center gap-4 mt-6">
        <Button
          variant="outline"
          size="lg"
          className="rounded-full w-14 h-14 p-0 border-red-200 hover:bg-red-50 hover:border-red-300"
          onClick={onSwipeLeft}
        >
          <X className="w-6 h-6 text-red-500" />
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="rounded-full w-14 h-14 p-0 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
          onClick={onSwipeUp}
        >
          <Users className="w-6 h-6 text-blue-500" />
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="rounded-full w-14 h-14 p-0 border-green-200 hover:bg-green-50 hover:border-green-300"
          onClick={onSwipeRight}
        >
          <Check className="w-6 h-6 text-green-500" />
        </Button>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 mt-4 text-sm text-muted-foreground">
        <span>← Not mine</span>
        <span>↑ Shared</span>
        <span>Mine →</span>
      </div>
    </div>
  );
}
