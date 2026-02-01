import { cn } from "@/lib/utils";
import { forwardRef } from "react";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
    value: number;
    max?: number;
    showValue?: boolean;
    size?: "sm" | "md" | "lg";
    color?: string;
}

export const Progress = forwardRef<HTMLDivElement, ProgressProps>(
    ({ className, value, max = 100, showValue = false, size = "md", color = "#00D4FF", ...props }, ref) => {
        const percentage = Math.min(100, Math.max(0, (value / max) * 100));

        const sizes = {
            sm: "h-1",
            md: "h-2",
            lg: "h-3",
        };

        return (
            <div className={cn("w-full", className)} {...props} ref={ref}>
                <div className={cn("w-full bg-gray-800 rounded-full overflow-hidden", sizes[size])}>
                    <div
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{
                            width: `${percentage}%`,
                            backgroundColor: color,
                        }}
                    />
                </div>
                {showValue && (
                    <div className="flex justify-between mt-1 text-xs text-gray-400">
                        <span>{value}</span>
                        <span>{max}</span>
                    </div>
                )}
            </div>
        );
    }
);

Progress.displayName = "Progress";
