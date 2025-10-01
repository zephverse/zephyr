"use client";

import { Button } from "@zephyr/ui/shadui/button";
import { Card, CardContent } from "@zephyr/ui/shadui/card";
import { motion } from "framer-motion";
import { CompassIcon, Home, Newspaper, Search, TrendingUp } from "lucide-react";
import Link from "next/link";

type NavigationCardProps = {
  isCollapsed: boolean;
  className?: string;
  stickyTop?: string;
};

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Navigation card requires multiple conditional rendering and styling logic
export default function NavigationCard({
  isCollapsed,
  className = "",
  stickyTop = "0",
}: NavigationCardProps) {
  return (
    <Card
      className={`max-h-fit bg-card transition-all duration-300 ease-in-out ${
        isCollapsed ? "w-12" : "w-full"
      } ${className} sticky`}
      style={{ top: stickyTop }}
    >
      <CardContent
        className={`justify-centeritems-center flex flex-col space-y-2 ${
          isCollapsed ? "p-2" : "p-4"
        }`}
      >
        <div className="block w-full">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link className="block w-full" href="/">
              <Button
                className={`w-full ${
                  isCollapsed ? "justify-center" : "justify-start"
                }`}
                size={isCollapsed ? "icon" : "lg"}
                title="Home"
                variant="ghost"
              >
                <Home
                  className={`h-5 w-5 text-muted-foreground ${
                    isCollapsed ? "" : "mr-4"
                  }`}
                />
                {!isCollapsed && <span>Home</span>}
              </Button>
            </Link>
          </motion.div>
        </div>

        <div className="block w-full">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link className="block w-full" href="/search?q=zephyr">
              <Button
                className={`w-full ${
                  isCollapsed ? "justify-center" : "justify-start"
                }`}
                size={isCollapsed ? "icon" : "lg"}
                title="Explore"
                variant="ghost"
              >
                <Search
                  className={`h-5 w-5 text-muted-foreground ${
                    isCollapsed ? "" : "mr-4"
                  }`}
                />
                {!isCollapsed && <span>Explore</span>}
              </Button>
            </Link>
          </motion.div>
        </div>

        <div className="block w-full">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link className="block w-full" href="/discover">
              <Button
                className={`w-full ${
                  isCollapsed ? "justify-center" : "justify-start"
                }`}
                size={isCollapsed ? "icon" : "lg"}
                title="Discover"
                variant="ghost"
              >
                <CompassIcon
                  className={`h-5 w-5 text-muted-foreground ${
                    isCollapsed ? "" : "mr-4"
                  }`}
                />
                {!isCollapsed && <span>Zephyrians</span>}
              </Button>
            </Link>
          </motion.div>
        </div>

        <div className="block w-full">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link className="block w-full" href="/hackernews">
              <Button
                className={`w-full ${
                  isCollapsed ? "justify-center" : "justify-start"
                }`}
                size={isCollapsed ? "icon" : "lg"}
                title="Aggregator (BETA)"
                variant="ghost"
              >
                <Newspaper
                  className={`h-5 w-5 text-muted-foreground ${
                    isCollapsed ? "" : "mr-4"
                  }`}
                />
                {!isCollapsed && <span>HackerNews</span>}
              </Button>
            </Link>
          </motion.div>
        </div>

        <div className="block w-full">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link className="block w-full" href="/soon">
              <Button
                className={`w-full ${
                  isCollapsed ? "justify-center" : "justify-start"
                }`}
                size={isCollapsed ? "icon" : "lg"}
                title="Gusts"
                variant="ghost"
              >
                <TrendingUp
                  className={`h-5 w-5 text-muted-foreground ${
                    isCollapsed ? "" : "mr-4"
                  }`}
                />
                {!isCollapsed && <span>Gusts</span>}
              </Button>
            </Link>
          </motion.div>
        </div>
      </CardContent>
    </Card>
  );
}
