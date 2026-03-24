"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";

type FilePickerProps = {
  name: string;
  accept?: string;
  label: string;
  emptyLabel: string;
  className?: string;
};

export function FilePicker({
  name,
  accept,
  label,
  emptyLabel,
  className,
}: FilePickerProps) {
  const id = useId();
  const [fileName, setFileName] = useState("");

  return (
    <div className={cn("rounded-2xl border border-border bg-background/40 p-3", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label
          htmlFor={id}
          className="inline-flex h-10 cursor-pointer items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-medium transition hover:bg-accent"
        >
          {label}
        </label>

        <span className="min-w-0 truncate text-sm text-muted-foreground">
          {fileName || emptyLabel}
        </span>
      </div>

      <input
        id={id}
        type="file"
        name={name}
        accept={accept}
        className="sr-only"
        onChange={(event) => {
          setFileName(event.target.files?.[0]?.name ?? "");
        }}
      />
    </div>
  );
}
