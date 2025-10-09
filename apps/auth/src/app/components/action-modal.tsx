"use client";

import { Button } from "@zephyr/ui/shadui/button";
import { Card } from "@zephyr/ui/shadui/card";
import { AlertTriangle, Ban, CheckCircle, Info, X } from "lucide-react";
import { motion } from "motion/react";
import type { ModalAction, User } from "../types/types";

type ActionModalProps = {
  user: User;
  action: ModalAction;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ActionModal({
  user,
  action,
  onConfirm,
  onCancel,
}: ActionModalProps) {
  const getModalConfig = () => {
    switch (action) {
      case "suspend":
        return {
          title: "Suspend User",
          description: `Are you sure you want to suspend ${user.name}? They will not be able to access their account until reactivated.`,
          icon: AlertTriangle,
          iconColor: "text-chart-3",
          iconBg: "bg-chart-3/10",
          confirmText: "Suspend User",
          confirmVariant: "default" as const,
          confirmClass: "bg-chart-3 hover:bg-chart-3/90 text-background",
        };
      case "ban":
        return {
          title: "Ban User",
          description: `Are you sure you want to permanently ban ${user.name}? This action is severe and should only be used for serious violations.`,
          icon: Ban,
          iconColor: "text-destructive",
          iconBg: "bg-destructive/10",
          confirmText: "Ban User",
          confirmVariant: "destructive" as const,
          confirmClass: "",
        };
      case "activate":
        return {
          title: "Activate User",
          description: `Reactivate ${user.name}'s account? They will regain full access to the platform.`,
          icon: CheckCircle,
          iconColor: "text-chart-5",
          iconBg: "bg-chart-5/10",
          confirmText: "Activate User",
          confirmVariant: "default" as const,
          confirmClass: "bg-chart-5 hover:bg-chart-5/90 text-background",
        };
      default:
        return {
          title: "User Details",
          description: `Viewing details for ${user.name}`,
          icon: Info,
          iconColor: "text-primary",
          iconBg: "bg-primary/10",
          confirmText: "Close",
          confirmVariant: "default" as const,
          confirmClass: "",
        };
    }
  };

  const config = getModalConfig();

  return (
    <motion.div
      animate={{ opacity: 1 }}
      aria-labelledby="modal-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
      exit={{ opacity: 0 }}
      initial={{ opacity: 0 }}
      onClick={onCancel}
      role="dialog"
      transition={{ duration: 0.15 }}
    >
      <motion.div
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        initial={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        transition={{ duration: 0.15, ease: "easeOut" }}
      >
        <Card className="w-full max-w-md border-border bg-card p-6">
          <div className="mb-4 flex items-start justify-between">
            <div className={`rounded-md p-2.5 ${config.iconBg}`}>
              <config.icon className={`h-6 w-6 ${config.iconColor}`} />
            </div>
            <Button
              aria-label="Close modal"
              className="h-8 w-8 text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground"
              onClick={onCancel}
              size="icon"
              variant="ghost"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="mb-6">
            <h2
              className="mb-2 font-semibold text-foreground text-xl"
              id="modal-title"
            >
              {config.title}
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {config.description}
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              className="border-border bg-transparent transition-colors duration-150 hover:bg-accent"
              onClick={onCancel}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              className={`transition-all duration-150 hover:scale-105 ${config.confirmClass}`}
              onClick={onConfirm}
              variant={config.confirmVariant}
            >
              {config.confirmText}
            </Button>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
