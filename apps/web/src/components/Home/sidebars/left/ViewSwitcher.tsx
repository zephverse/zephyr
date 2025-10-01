"use client";

import { motion } from "framer-motion";
import { Grid, List } from "lucide-react";

type ViewSwitcherProps = {
	view: "grid" | "list";
	onChange: (view: "grid" | "list") => void;
};

export const ViewSwitcher = ({ view, onChange }: ViewSwitcherProps) => {
	return (
		<div className="flex items-center justify-center gap-6">
			{/* biome-ignore lint/a11y/useButtonType: ignore */}
			<button className="group relative pb-1" onClick={() => onChange("list")}>
				<List
					className={`h-4 w-4 transition-colors ${
						view === "list" ? "text-primary" : "text-muted-foreground"
					}`}
				/>
				{view === "list" && (
					<motion.div
						animate={{ opacity: 1 }}
						className="-bottom-1 absolute right-0 left-0 h-[2px] bg-primary"
						initial={{ opacity: 0 }}
						layoutId="viewIndicator"
						transition={{ duration: 0.2 }}
					/>
				)}
			</button>

			{/* biome-ignore lint/a11y/useButtonType: ignore */}
			<button className="group relative pb-1" onClick={() => onChange("grid")}>
				<Grid
					className={`h-4 w-4 transition-colors ${
						view === "grid" ? "text-primary" : "text-muted-foreground"
					}`}
				/>
				{view === "grid" && (
					<motion.div
						animate={{ opacity: 1 }}
						className="-bottom-1 absolute right-0 left-0 h-[2px] bg-primary"
						initial={{ opacity: 0 }}
						layoutId="viewIndicator"
						transition={{ duration: 0.2 }}
					/>
				)}
			</button>
		</div>
	);
};
