import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { Button } from "@zephyr/ui/shadui/button";
import { motion } from "motion/react";

export function GithubIssueButton() {
  return (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
      <Button
        asChild
        className="w-full gap-2 bg-background/50 backdrop-blur-sm"
        variant="outline"
      >
        <a
          href="https://github.com/zephverse/zephyr/issues/new/"
          rel="noopener noreferrer"
          target="_blank"
        >
          <GitHubLogoIcon className="h-4 w-4" />
          Report Issue on GitHub
        </a>
      </Button>
    </motion.div>
  );
}
