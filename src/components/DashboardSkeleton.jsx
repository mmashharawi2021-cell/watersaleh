import React from 'react';
import { motion } from 'framer-motion';

const SkeletonPulse = ({ className }) => (
  <div className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded-2xl ${className}`} />
);

const DashboardSkeleton = () => {
  return (
    <div className="space-y-12 pb-20 overflow-hidden">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <SkeletonPulse className="w-12 h-12 rounded-2xl" />
            <div className="space-y-2">
              <SkeletonPulse className="w-24 h-3" />
              <SkeletonPulse className="w-32 h-2" />
            </div>
          </div>
          <SkeletonPulse className="w-64 h-12 md:w-96 md:h-16" />
          <SkeletonPulse className="w-48 h-4 md:w-80" />
        </div>
        <SkeletonPulse className="w-full md:w-48 h-16 rounded-[28px]" />
      </div>

      {/* Main Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Stats Column */}
        <div className="lg:col-span-1 space-y-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-8 border-white/40 dark:border-white/5 h-48 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="space-y-3">
                  <SkeletonPulse className="w-20 h-2" />
                  <SkeletonPulse className="w-32 h-8" />
                  <SkeletonPulse className="w-24 h-6 rounded-full" />
                </div>
                <SkeletonPulse className="w-16 h-16 rounded-[24px]" />
              </div>
              <SkeletonPulse className="w-24 h-2 mt-4" />
            </div>
          ))}
        </div>

        {/* Chart Skeleton */}
        <div className="lg:col-span-3 glass-card p-10 border-white/40 dark:border-white/5 h-[600px] flex flex-col">
          <div className="flex justify-between mb-12">
            <div className="space-y-3">
              <SkeletonPulse className="w-48 h-6" />
              <SkeletonPulse className="w-64 h-3" />
            </div>
            <SkeletonPulse className="w-48 h-10 rounded-2xl" />
          </div>
          <div className="flex-1 flex items-end gap-4 px-4">
            {[...Array(7)].map((_, i) => (
              <SkeletonPulse 
                key={i} 
                className="flex-1" 
                style={{ height: `${20 + Math.random() * 60}%` }} 
              />
            ))}
          </div>
          <div className="mt-12 flex justify-between pt-8 border-t border-slate-100 dark:border-white/5">
            <div className="flex gap-10">
              <div className="space-y-2"><SkeletonPulse className="w-20 h-2" /><SkeletonPulse className="w-32 h-6" /></div>
              <div className="space-y-2"><SkeletonPulse className="w-20 h-2" /><SkeletonPulse className="w-32 h-6" /></div>
            </div>
            <SkeletonPulse className="w-32 h-4" />
          </div>
        </div>
      </div>

      {/* Bottom Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center px-2">
            <SkeletonPulse className="w-32 h-8" />
            <SkeletonPulse className="w-20 h-4" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass-card p-6 flex items-center gap-5">
                <SkeletonPulse className="w-16 h-16 rounded-[22px]" />
                <div className="flex-1 space-y-2">
                  <SkeletonPulse className="w-3/4 h-4" />
                  <SkeletonPulse className="w-1/2 h-2" />
                </div>
                <div className="space-y-2">
                  <SkeletonPulse className="w-12 h-6" />
                  <SkeletonPulse className="w-8 h-2" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-1 glass-card p-8 space-y-8">
          <SkeletonPulse className="w-32 h-6" />
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonPulse key={i} className="w-full h-20 rounded-3xl" />
            ))}
          </div>
          <SkeletonPulse className="w-full h-48 rounded-[32px]" />
        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;
