import { motion } from "motion/react";
import type { ReactNode } from "react";

type AuthButtonWrapperProps = {
  children: ReactNode;
  className?: string;
};

export default function AuthButtonWrapper({
  children,
  className = "",
}: AuthButtonWrapperProps) {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="mb-3 w-full"
      initial={{ opacity: 0, y: 20 }}
      transition={{
        duration: 0.3,
        ease: "easeOut",
      }}
    >
      <div
        className={`group relative overflow-hidden rounded-lg backdrop-blur-md transition-all duration-500 ease-in-out hover:shadow-lg hover:shadow-primary/20 hover:ring-1 hover:ring-primary ${className}`}
      >
        <div className="relative bg-background/50 transition-colors group-hover:bg-background/70">
          {children}
        </div>
      </div>
    </motion.div>
  );
}
