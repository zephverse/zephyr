import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type AnimatedWordCounterProps = {
	current: number;
	max: number;
};

export function AnimatedWordCounter({
	current,
	max,
}: AnimatedWordCounterProps) {
	const percentage = (current / max) * 100;
	const isNearLimit = percentage > 90;
	const isOverLimit = current > max;

	return (
		<motion.div
			animate={{ opacity: 1 }}
			className="relative flex items-center gap-1 text-xs"
			initial={{ opacity: 0 }}
			transition={{ duration: 0.2 }}
		>
			<motion.div
				animate={{
					scale: isOverLimit ? [1, 1.1, 1] : 1,
				}}
				className={cn(
					"font-medium",
					isOverLimit
						? "text-destructive"
						: // biome-ignore lint/style/noNestedTernary: ignore
							isNearLimit
							? "text-warning"
							: "text-muted-foreground",
				)}
				transition={{ duration: 0.2 }}
			>
				{current}
			</motion.div>
			<span className="text-muted-foreground">/</span>
			<span className="text-muted-foreground">{max}</span>

			{isNearLimit && (
				<motion.div
					animate={{ opacity: 1, y: 0 }}
					className="-top-6 absolute left-0 text-warning"
					initial={{ opacity: 0, y: 10 }}
				>
					{isOverLimit ? "Too many words" : "Approaching limit"}
				</motion.div>
			)}
		</motion.div>
	);
}
