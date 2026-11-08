import type {
  HTMLAttributes,
  TableHTMLAttributes,
  ThHTMLAttributes,
  TdHTMLAttributes,
  ReactNode,
} from "react";
import { cn } from "@/lib/utils";

export function Table({
  children,
  className,
  ...props
}: TableHTMLAttributes<HTMLTableElement> & { children: ReactNode; className?: string }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn("w-full border-collapse text-[13px] text-left", className)} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLTableSectionElement> & { children: ReactNode; className?: string }) {
  return (
    <thead className={cn("[&_tr]:bg-[#1E1E22] [&_tr]:rounded-[12px]", className)} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLTableSectionElement> & { children: ReactNode; className?: string }) {
  return (
    <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({
  children,
  className,
  header = false,
  ...props
}: HTMLAttributes<HTMLTableRowElement> & {
  children: ReactNode;
  className?: string;
  header?: boolean;
}) {
  return (
    <tr
      className={cn(
        "transition-colors duration-150 border-b border-white/[0.06]",
        header ? "h-11 bg-[#1E1E22] rounded-[12px] border-none" : "h-14 hover:bg-[#1E1E22]/60",
        className,
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableHead({
  children,
  className,
  numeric = false,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement> & {
  children?: ReactNode;
  className?: string;
  numeric?: boolean;
}) {
  return (
    <th
      className={cn(
        "px-4 text-[12px] font-medium text-[#A8A8B3] select-none first:rounded-l-[12px] last:rounded-r-[12px]",
        numeric ? "text-right tabular-nums" : "text-left",
        className,
      )}
      {...props}
    >
      {children}
    </th>
  );
}

export function TableCell({
  children,
  className,
  numeric = false,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement> & {
  children?: ReactNode;
  className?: string;
  numeric?: boolean;
}) {
  return (
    <td
      className={cn(
        "px-4 text-[13px] text-[#F5F5F6]",
        numeric ? "text-right tabular-nums font-sans" : "text-left",
        className,
      )}
      {...props}
    >
      {children}
    </td>
  );
}
