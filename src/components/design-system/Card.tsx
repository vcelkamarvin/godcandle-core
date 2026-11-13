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
        "rounded-[20px] bg-white border border-black/[0.06] text-[#0A0A0A] overflow-hidden",
        "shadow-xs",
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
        "flex items-center justify-between pb-3.5 mb-3.5 border-b border-black/[0.06] shrink-0",
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
        "text-[15px] leading-[22px] font-bold text-[#0A0A0A] tracking-tight",
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
  return <p className={cn("text-[12px] leading-[16px] text-[#737887]", className)}>{children}</p>;
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
