import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

const markdownComponents: Components = {
  p: ({ className, ...props }) => (
    <p
      className={cn("text-sm leading-6 text-zinc-700 dark:text-zinc-300", className)}
      {...props}
    />
  ),
  a: ({ className, ...props }) => (
    <a
      className={cn(
        "font-medium text-blue-600 underline decoration-blue-300 underline-offset-2 transition hover:text-blue-700 dark:text-blue-400 dark:decoration-blue-500/50 dark:hover:text-blue-300",
        className,
      )}
      rel="noreferrer"
      target="_blank"
      {...props}
    />
  ),
  ul: ({ className, ...props }) => (
    <ul className={cn("list-disc space-y-1 pl-5 text-sm leading-6 text-zinc-700 dark:text-zinc-300", className)} {...props} />
  ),
  ol: ({ className, ...props }) => (
    <ol
      className={cn("list-decimal space-y-1 pl-5 text-sm leading-6 text-zinc-700 dark:text-zinc-300", className)}
      {...props}
    />
  ),
  li: ({ className, ...props }) => (
    <li className={cn(className)} {...props} />
  ),
  blockquote: ({ className, ...props }) => (
    <blockquote
      className={cn(
        "border-l-2 border-sky-200 pl-4 text-sm leading-6 text-zinc-600 dark:border-sky-500/40 dark:text-zinc-400",
        className,
      )}
      {...props}
    />
  ),
  code: ({ className, children, ...props }) => {
    const content = typeof children === "string" ? children.replace(/\n$/, "") : children;

    return (
      <code
        className={cn(
          "rounded-md bg-zinc-100 px-1.5 py-0.5 font-mono text-[0.8125rem] text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100",
          className,
        )}
        {...props}
      >
        {content}
      </code>
    );
  },
  pre: ({ className, ...props }) => (
    <pre
      className={cn(
        "overflow-x-auto rounded-xl bg-zinc-950/95 p-4 text-sm text-zinc-100 dark:bg-black/40 dark:text-zinc-50",
        className,
      )}
      {...props}
    />
  ),
};

export function TaskUpdateBody({ body, className }: { body: string; className?: string }) {
  return (
    <div className={cn("space-y-3 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0", className)}>
      <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm, remarkBreaks]}>
        {body}
      </ReactMarkdown>
    </div>
  );
}
