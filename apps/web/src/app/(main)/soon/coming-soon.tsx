"use client";

import { motion } from "framer-motion";
import {
  Construction,
  MessageSquareMore,
  Rocket,
  Sparkles,
  Wand,
} from "lucide-react";
import type React from "react";
import { FossBanner } from "@/components/misc/foss-banner";

const floatingAnimation = {
  initial: { y: 0 },
  animate: {
    y: [-10, 10, -10],
    transition: {
      duration: 6,
      repeat: Number.POSITIVE_INFINITY,
      ease: "easeInOut",
    },
  },
};

const iconAnimation = {
  initial: { scale: 0, rotate: -180 },
  animate: {
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
    },
  },
};

const textAnimation = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

const containerAnimation = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

export default function ComingSoon() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <motion.div
        animate="animate"
        className="mx-auto max-w-2xl text-center"
        initial="initial"
        variants={containerAnimation}
      >
        <motion.div
          className="relative mx-auto mb-8 h-32 w-32"
          variants={floatingAnimation}
        >
          <motion.div
            className="absolute top-0 left-0"
            variants={iconAnimation}
          >
            <MessageSquareMore className="h-12 w-12 text-primary/80" />
          </motion.div>
          <motion.div
            className="absolute top-0 right-0"
            variants={iconAnimation}
          >
            <Sparkles className="h-10 w-10 text-primary/60" />
          </motion.div>
          <motion.div
            className="absolute bottom-0 left-0"
            variants={iconAnimation}
          >
            <Construction className="h-10 w-10 text-primary/60" />
          </motion.div>
          <motion.div
            className="absolute right-0 bottom-0"
            variants={iconAnimation}
          >
            <Rocket className="h-12 w-12 text-primary/80" />
          </motion.div>
        </motion.div>

        <motion.div className="space-y-6 px-4" variants={textAnimation}>
          <h1 className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text font-bold text-4xl text-transparent">
            Coming Soon
          </h1>
          <p className="text-muted-foreground text-xl">
            We're crafting something special for you
          </p>
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <p className="text-muted-foreground/80">
              Our feature is under development. We're working hard to bring you
              a seamless experience with enhanced features and beautiful design.
            </p>
          </div>

          <motion.div
            className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2"
            variants={containerAnimation}
          >
            <FeatureCard
              description="View all trending posts across internet in one place"
              icon={<Wand className="h-6 w-6" />}
              title="Social Aggregation"
            />
            <FeatureCard
              description="Get personalized suggestions based on your interests and activities"
              icon={<Sparkles className="h-6 w-6" />}
              title="AI Suggestions"
            />
          </motion.div>

          <FossBanner />

          <motion.div
            className="mt-12 flex items-center justify-center gap-2 text-muted-foreground text-sm"
            variants={textAnimation}
          >
            <Construction className="h-4 w-4 animate-spin" />
            <span>Development in progress</span>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      className="rounded-xl border bg-card p-6 transition-colors duration-300 hover:bg-muted"
      whileHover={{ scale: 1.02 }}
    >
      <div className="mb-3 flex items-center gap-3">
        <div className="text-primary">{icon}</div>
        <h3 className="font-semibold">{title}</h3>
      </div>
      <p className="text-left text-muted-foreground text-sm">{description}</p>
    </motion.div>
  );
}
