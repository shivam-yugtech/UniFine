import { Badge } from "@/components/ui/badge";
import { STATUS_TONE } from "./utils";

const LABELS: Record<string, string> = {
  PENDING: "Pending",
  PAID: "Paid",
  OVERDUE: "Overdue",
};

export function StatusBadge({ status, className = "" }: { status: string; className?: string }) {
  return (
    <Badge variant="outline" className={`text-[10px] font-bold ${STATUS_TONE[status] ?? ""} ${className}`}>
      {LABELS[status] ?? status}
    </Badge>
  );
}
