import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3 md:flex-row md:items-center md:justify-between", className)}>
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-2xl">
          {title}
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
      </div>
      {action}
    </div>
  );
}
