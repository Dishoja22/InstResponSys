import React from 'react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';

interface CardProps extends HTMLMotionProps<"div"> {
  className?: string;
  children: React.ReactNode;
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <motion.div 
      className={cn("glass-card p-6 flex flex-col", className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
