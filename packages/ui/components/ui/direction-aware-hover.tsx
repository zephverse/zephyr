"use client";

import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import type React from "react";
import { useRef, useState } from "react";
import { cn } from "../../lib/utils";

export const DirectionAwareHover = ({
  imageUrl,
  children,
  childrenClassName,
  imageClassName,
  className,
}: {
  imageUrl: string;
  children: React.ReactNode | string;
  childrenClassName?: string;
  imageClassName?: string;
  className?: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const [direction, setDirection] = useState<
    "top" | "bottom" | "left" | "right" | string
  >("left");

  const handleMouseEnter = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    if (!ref.current) {
      return;
    }

    const mouseDirection = getDirection(event, ref.current);
    switch (mouseDirection) {
      case 0:
        setDirection("top");
        break;
      case 1:
        setDirection("right");
        break;
      case 2:
        setDirection("bottom");
        break;
      case 3:
        setDirection("left");
        break;
      default:
        setDirection("left");
        break;
    }
  };

  const getDirection = (
    ev: React.MouseEvent<HTMLDivElement, MouseEvent>,
    obj: HTMLElement
  ) => {
    const { width: w, height: h, left, top } = obj.getBoundingClientRect();
    const x = ev.clientX - left - (w / 2) * (w > h ? h / w : 1);
    const y = ev.clientY - top - (h / 2) * (h > w ? w / h : 1);
    const d = Math.round(Math.atan2(y, x) / 1.570_796_33 + 5) % 4;
    return d;
  };

  return (
    <motion.div
      className={cn(
        "group/card relative h-60 w-60 overflow-hidden rounded-lg bg-transparent md:h-96 md:w-96",
        className
      )}
      onMouseEnter={handleMouseEnter}
      ref={ref}
    >
      <AnimatePresence mode="wait">
        <motion.div
          className="relative h-full w-full"
          exit="exit"
          initial="initial"
          whileHover={direction}
        >
          <motion.div className="absolute inset-0 z-10 hidden h-full w-full bg-black/40 transition duration-500 group-hover/card:block" />
          <motion.div
            className="relative h-full w-full bg-gray-50 dark:bg-black"
            transition={{
              duration: 0.2,
              ease: "easeOut",
            }}
            variants={variants}
          >
            <Image
              alt="image"
              className={cn(
                "h-full w-full scale-[1.15] object-cover",
                imageClassName
              )}
              height="1000"
              src={imageUrl}
              width="1000"
            />
          </motion.div>
          <motion.div
            className={cn(
              "absolute bottom-4 left-4 z-40 text-white",
              childrenClassName
            )}
            transition={{
              duration: 0.5,
              ease: "easeOut",
            }}
            variants={textVariants}
          >
            {children}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

const variants = {
  initial: {
    x: 0,
  },

  exit: {
    x: 0,
    y: 0,
  },
  top: {
    y: 20,
  },
  bottom: {
    y: -20,
  },
  left: {
    x: 20,
  },
  right: {
    x: -20,
  },
};

const textVariants = {
  initial: {
    y: 0,
    x: 0,
    opacity: 0,
  },
  exit: {
    y: 0,
    x: 0,
    opacity: 0,
  },
  top: {
    y: -20,
    opacity: 1,
  },
  bottom: {
    y: 2,
    opacity: 1,
  },
  left: {
    x: -2,
    opacity: 1,
  },
  right: {
    x: 20,
    opacity: 1,
  },
};
