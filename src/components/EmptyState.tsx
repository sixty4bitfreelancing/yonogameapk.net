import type { ReactNode } from "react";

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center">
      <p className="font-medium text-gray-900">{title}</p>
      {children ? <div className="mt-1 text-sm text-gray-600">{children}</div> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
