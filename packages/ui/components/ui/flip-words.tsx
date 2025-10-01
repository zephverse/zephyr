"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { cn } from "../../lib/utils";

export const FlipWords = ({
  words,
  duration = 3000,
  className,
}: {
  words: string[];
  duration?: number;
  className?: string;
}) => {
  const [currentWord, setCurrentWord] = useState(words[0]);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  // thanks for the fix Julian - https://github.com/Julian-AT
  const startAnimation = useCallback(() => {
    const word = words[words.indexOf(currentWord) + 1] || words[0];
    setCurrentWord(word);
    setIsAnimating(true);
  }, [currentWord, words]);

  useEffect(() => {
    if (!isAnimating) {
      setTimeout(() => {
        startAnimation();
      }, duration);
    }
  }, [isAnimating, duration, startAnimation]);

  return (
    <AnimatePresence
      onExitComplete={() => {
        setIsAnimating(false);
      }}
    >
      <motion.div
        animate={{
          opacity: 1,
          y: 0,
        }}
        className={cn(
          "relative z-10 inline-block px-2 text-left text-neutral-900 dark:text-neutral-100",
          className
        )}
        exit={{
          opacity: 0,
          y: -40,
          x: 40,
          filter: "blur(8px)",
          scale: 2,
          position: "absolute",
        }}
        initial={{
          opacity: 0,
          y: 10,
        }}
        key={currentWord}
        transition={{
          type: "spring",
          stiffness: 100,
          damping: 10,
        }}
      >
        {/* edit suggested by Sajal: https://x.com/DewanganSajal */}
        {currentWord.split(" ").map((word, wordIndex) => (
          <motion.span
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            className="inline-block whitespace-nowrap"
            initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
            key={`word-${word}-${wordIndex}-${currentWord}`}
            transition={{
              delay: wordIndex * 0.3,
              duration: 0.3,
            }}
          >
            {word.split("").map((letter, letterIndex) => (
              <motion.span
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                className="inline-block"
                initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
                // biome-ignore lint/suspicious/noArrayIndexKey: Letters in a word maintain stable order for animation
                key={`${wordIndex}-${letterIndex}`}
                transition={{
                  delay: wordIndex * 0.3 + letterIndex * 0.05,
                  duration: 0.2,
                }}
              >
                {letter}
              </motion.span>
            ))}
            <span className="inline-block">&nbsp;</span>
          </motion.span>
        ))}
      </motion.div>
    </AnimatePresence>
  );
};
