"use client";

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
						{title && <ToastTitle>{title}</ToastTitle>}
						{description && <ToastDescription>{description}</ToastDescription>}
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
