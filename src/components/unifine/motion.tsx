"use client";

import { useEffect, useRef, useState } from "react";
import {
  animate,
  motion,
  MotionConfig,
  useInView,
  useReducedMotion,
  type HTMLMotionProps,
  type Variants,
} from "framer-motion";

/** Shared easing — a soft "ease-out-expo" that feels native on mobile. */
export const EASE = [0.22, 1, 0.36, 1] as const;

/** Wrap the app once: honours the OS "reduce motion" setting for every animation. */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.35, ease: EASE }}>
      {children}
    </MotionConfig>
  );
}

/** Page/view transition — fade + slight rise. Key it on the view name. */
export function PageTransition({ children, className, ...rest }: HTMLMotionProps<"div">) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.32, ease: EASE }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.055, delayChildren: 0.04 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.42, ease: EASE } },
};

/** Grid/list whose children animate in one after another. */
export function Stagger({ children, className, ...rest }: HTMLMotionProps<"div">) {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className={className} {...rest}>
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className, ...rest }: HTMLMotionProps<"div">) {
  return (
    <motion.div variants={item} className={className} {...rest}>
      {children}
    </motion.div>
  );
}

/** Reveal on scroll (used on the landing page). */
export function Reveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, ease: EASE, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Animated number. `format` turns the running value into display text (e.g. ₹ formatting).
 * Falls back to the final value instantly when reduced motion is on.
 */
export function CountUp({
  value,
  format = (n) => Math.round(n).toLocaleString("en-IN"),
  duration = 0.9,
}: {
  value: number;
  format?: (n: number) => string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(() => format(0));
  const from = useRef(0);

  useEffect(() => {
    if (!inView || reduce) return;
    const controls = animate(from.current, value, {
      duration,
      ease: EASE,
      onUpdate: (v) => setDisplay(format(v)),
    });
    from.current = value;
    return () => controls.stop();
  }, [value, inView, reduce]);

  return <span ref={ref}>{reduce ? format(value) : display}</span>;
}

export { motion, AnimatePresence } from "framer-motion";
