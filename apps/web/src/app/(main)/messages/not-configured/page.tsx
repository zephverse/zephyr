"use client";

// @ts-expect-error - static image import
import messagesImage from "@assets/fallbacks/fallback.png";
import { getEnvironmentMode, getStreamConfig } from "@zephyr/config/src/env";
import { Badge } from "@zephyr/ui/shadui/badge";
import { Button } from "@zephyr/ui/shadui/button";
import { Card } from "@zephyr/ui/shadui/card";
import { motion } from "framer-motion";
import { AlertCircle, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { HelpLink } from "@/components/Animations/ImageLinkPreview";

export default function StreamChatNotConfigured() {
  const config = getStreamConfig();
  const { isProduction } = getEnvironmentMode();

  const missingEnvs = {
    NEXT_PUBLIC_STREAM_KEY: !config.apiKey,
    STREAM_SECRET: !config.secret,
  };

  const auroras = useMemo(
    () =>
      new Array(6).fill(0).map((_, i) => ({
        width: 600 + Math.sin(i) * 400,
        height: 600 + Math.cos(i) * 400,
        top: `${(i * 25) % 100}%`,
        left: `${(i * 35) % 100}%`,
        delay: i * 0.8,
        duration: 8 + i * 3,
        opacity: 0.2 + Math.random() * 0.1,
      })),
    []
  );

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background p-4">
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-background/80" />
        {auroras.map((aurora, i) => (
          <motion.div
            animate={{
              opacity: [aurora.opacity, aurora.opacity * 1.2, aurora.opacity],
              scale: [1, 1.1, 1],
              rotate: [0, 180, 0],
            }}
            className="absolute rounded-full blur-[100px]"
            initial={{
              opacity: 0,
              scale: 0.8,
            }}
            key={i}
            style={{
              width: `${aurora.width}px`,
              height: `${aurora.height}px`,
              top: aurora.top,
              left: aurora.left,
              background:
                i % 2 === 0
                  ? "radial-gradient(circle at center, rgba(147,51,234,0.4), transparent 70%)"
                  : "radial-gradient(circle at center, rgba(236,72,153,0.4), transparent 70%)",
            }}
            transition={{
              duration: aurora.duration,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "reverse",
              ease: "easeInOut",
              delay: aurora.delay,
            }}
          />
        ))}
      </div>

      <Card className="relative z-10 mx-auto max-w-2xl border-muted/20 bg-background/60 p-8 backdrop-blur-2xl">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
        >
          <div className="space-y-4">
            <motion.div
              animate={{ scale: 1, opacity: 1 }}
              initial={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h1 className="bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text font-bold text-4xl text-transparent leading-tight tracking-tight md:text-5xl md:leading-tight">
                Chat Not Configured
              </h1>
            </motion.div>
            <p className="text-muted-foreground">
              Stream Chat requires configuration before you can use the
              messaging features.
            </p>
          </div>

          {isProduction && (
            <motion.div
              animate={{ opacity: 1, x: 0 }}
              className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4"
              initial={{ opacity: 0, x: -20 }}
              transition={{ delay: 0.3 }}
            >
              <AlertCircle className="h-5 w-5 text-destructive" />
              <div className="space-y-1">
                <p className="font-medium text-foreground">
                  Production Environment Alert
                </p>
                <p className="text-muted-foreground text-sm">
                  If you're seeing this in production, please contact the system
                  administrator immediately at{" "}
                  <a
                    className="text-primary hover:underline"
                    href={`mailto:${process.env.SUPPORT_EMAIL}`}
                  >
                    {process.env.SUPPORT_EMAIL}
                  </a>
                </p>
              </div>
            </motion.div>
          )}

          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.4 }}
          >
            <div className="space-y-3">
              <h2 className="font-semibold text-foreground text-lg">
                Missing Environment Variables:
              </h2>
              <div className="flex flex-wrap gap-2">
                {Object.entries(missingEnvs).map(
                  ([env, isMissing]) =>
                    isMissing && (
                      <Badge
                        className="font-mono text-xs"
                        key={env}
                        variant="destructive"
                      >
                        {env}
                      </Badge>
                    )
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="font-semibold text-foreground text-lg">
                How to configure:
              </h2>
              <ol className="list-inside list-decimal space-y-2 text-muted-foreground">
                <li>Visit the Stream Chat Dashboard</li>
                <li>Create or select your application</li>
                <li>Copy the API key and secret</li>
                <li>
                  Add them to your{" "}
                  <code className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-xs">
                    .env
                  </code>{" "}
                  file
                </li>
              </ol>
            </div>

            <div className="pt-2">
              <HelpLink
                href="/messages"
                previewImage={messagesImage.src}
                text="See how messages look when configured ↗"
              />
            </div>
          </motion.div>

          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4 sm:flex-row"
            initial={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.5 }}
          >
            <Link className="w-full sm:w-auto" href="/">
              <Button
                className="group relative w-full transition-all hover:scale-105"
                size="lg"
              >
                <span className="relative z-10">Return Home</span>
                <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-primary/50 to-primary opacity-50 blur-lg transition-all group-hover:opacity-75" />
              </Button>
            </Link>

            <a
              className="w-full sm:w-auto"
              href="https://getstream.io/chat/docs/"
              rel="noopener noreferrer"
              target="_blank"
            >
              <Button
                className="group w-full transition-colors hover:border-primary/50"
                size="lg"
                variant="outline"
              >
                <span>Stream Chat Docs</span>
                <ExternalLink className="ml-2 h-4 w-4 transition-colors group-hover:text-primary" />
              </Button>
            </a>
          </motion.div>
        </motion.div>
      </Card>
    </div>
  );
}
