import type { ReactNode, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  hero?: boolean;
}

export function Card({ children, className, hero = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[24px] bg-[#14161B] border border-white/[0.06] text-[#F5F5F6] overflow-hidden",
        "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]",
        hero ? "p-6" : "p-6",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-between pb-4 mb-4 border-b border-white/[0.06] shrink-0",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement> & { children: ReactNode; className?: string }) {
  return (
    <h3
      className={cn(
        "text-[16px] leading-[24px] font-semibold text-[#F5F5F6] tracking-tight",
        className,
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <p className={cn("text-[12px] leading-[16px] text-[#A8A8B3]", className)}>{children}</p>;
}

export function CardBody({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-4 flex-1 min-h-0", className)} {...props}>
      {children}
    </div>
  );
}

export const CardContent = CardBody;
