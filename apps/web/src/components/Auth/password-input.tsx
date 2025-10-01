import { Input } from "@zephyr/ui/shadui/input";
import { Eye, EyeOff } from "lucide-react";
import React, { useState } from "react";
import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const PasswordInput = React.forwardRef<HTMLInputElement, InputProps>(
	({ className, type, ...props }, ref) => {
		const [showPassword, setShowPassword] = useState(false);

		return (
			<div className="relative">
				<Input
					className={cn("pe-10", className)}
					ref={ref}
					type={showPassword ? "text" : "password"}
					{...props}
				/>
				<button
					className="-translate-y-1/2 absolute top-1/2 right-3 transform text-muted-foreground"
					onClick={() => setShowPassword(!showPassword)}
					title={showPassword ? "Hide password" : "Show password"}
					type="button"
				>
					{showPassword ? (
						<EyeOff className="size-5" />
					) : (
						<Eye className="size-5" />
					)}
				</button>
			</div>
		);
	},
);

PasswordInput.displayName = "PasswordInput";
export { PasswordInput };
