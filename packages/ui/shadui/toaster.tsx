"use client";

// biome-ignore lint/performance/noNamespaceImport: ignore
import * as React from "react";
import { useToast } from "../hooks/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "./toast";

type ToasterProps = {
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  containerClassName?: string;
};

export function Toaster({
  position = "bottom-right",
  containerClassName,
}: ToasterProps = {}) {
  const { toasts } = useToast();

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: ignore
  function renderNode(node: React.ReactNode): React.ReactNode {
    if (
      React.isValidElement(node) ||
      typeof node === "string" ||
      typeof node === "number" ||
      node === null ||
      node === undefined
    ) {
      return node as React.ReactNode;
    }
    try {
      const anyNode = node as unknown as Record<string, unknown>;
      if (anyNode && typeof anyNode === "object") {
        if (typeof (anyNode as { message?: unknown }).message === "string") {
          return (anyNode as { message: string }).message;
        }
        if (typeof (anyNode as { error?: unknown }).error === "string") {
          return (anyNode as { error: string }).error;
        }
        if ("json" in anyNode) {
          const j = (anyNode as { json?: unknown }).json as
            | Record<string, unknown>
            | string
            | undefined;
          if (typeof j === "string") {
            return j;
          }
          if (j && typeof j === "object") {
            if (typeof (j as { message?: unknown }).message === "string") {
              return (j as { message: string }).message;
            }
            if (typeof (j as { error?: unknown }).error === "string") {
              return (j as { error: string }).error;
            }
            const str = JSON.stringify(j);
            return str.length > 300 ? `${str.slice(0, 300)}…` : str;
          }
        }
        const str = JSON.stringify(anyNode);
        return str.length > 300 ? `${str.slice(0, 300)}…` : str;
      }
      const str = String(node);
      return str.length > 300 ? `${str.slice(0, 300)}…` : str;
    } catch {
      const str = String(node);
      return str.length > 300 ? `${str.slice(0, 300)}…` : str;
    }
  }

  const getViewportClassName = () => {
    switch (position) {
      case "top-right":
        return "top-0 right-0";
      case "top-left":
        return "top-0 left-0";
      case "bottom-left":
        return "bottom-0 left-0";
      default:
        return "bottom-0 right-0";
    }
  };

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, ...props }) => (
        <Toast key={id} {...props} className="w-auto min-w-[200px] max-w-md">
          <div className="relative pr-6">
            {title && <ToastTitle>{renderNode(title)}</ToastTitle>}
            {description && (
              <ToastDescription>{renderNode(description)}</ToastDescription>
            )}
            {action}
            <ToastClose className="absolute top-0 right-0" />
          </div>
        </Toast>
      ))}
      <ToastViewport
        className={`${getViewportClassName()} ${containerClassName || ""}`}
      />
    </ToastProvider>
  );
}
