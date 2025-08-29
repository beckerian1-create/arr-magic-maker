import { useState, useCallback } from "react";
import { Upload, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Papa from "papaparse";
import { z } from "zod";

// --- Helpers ---
const SUBS_COLUMN_MAP: Record<string, string> = {
  "plan.amount": "plan_amount",
  "plan interval": "plan_interval",
  "plan.interval": "plan_interval",
  customer: "customer_id",
};
const CHARGES_COLUMN_MAP: Record<string, string> = {
  "created (utc)": "created_at",
  created: "created_at",
  amount: "amount_usd",
  "amount captured": "amount_usd",
  amount_captured: "amount_usd",
  customer: "customer_id",
};

function remap(row: Record<string, any>, map: Record<string, string>) {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(row)) {
    const key = map[k.toLowerCase()] ?? k.toLowerCase();
    out[key] = v;
  }
  return out;
}

function toDollars(n: any) {
  const num = Number(n);
  return !isFinite(num) ? null : Math.abs(num) > 1000 ? num / 100 : num;
}

// --- Validation Schemas ---
const SubSchema = z.object({
  customer_id: z.string().optional(),
  created: z.coerce.date().optional(),
  current_period_start: z.coerce.date().optional(),
  current_period_end: z.coerce.date().optional(),
  plan_amount: z.preprocess((v) => toDollars(v), z.number().optional()),
  plan_interval: z.string().optional(),
});

const ChargeSchema = z.object({
  created_at: z.coerce.date(),
  amount_usd: z.preprocess((v) => toDollars(v), z.number()),
  customer_id: z.string().optional(),
});

interface FileUploadProps {
  onFileUpload: (rows: any[], kind: "subscriptions" | "charges") => void;
  isProcessing?: boolean;
}

export const FileUpload = ({
  onFileUpload,
  isProcessing = false,
}: FileUploadProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseAndValidate = async (file: File) => {
    return new Promise<void>((resolve) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (res) => {
          if (res.errors.length) {
            setError(
              "CSV parse error: " + res.errors.map((e) => e.message).join(", ")
            );
            return resolve();
          }

          const rows = res.data as Record<string, any>[];
          const lowerHeaders = Object.keys(rows[0] || {}).map((h) =>
            h.toLowerCase()
          );

          // crude detection: subs vs charges
          const isSubs = lowerHeaders.some((h) =>
            ["plan.amount", "plan interval", "plan.interval"].includes(h)
          );

          const mapped = rows.map((r) =>
            remap(r, isSubs ? SUBS_COLUMN_MAP : CHARGES_COLUMN_MAP)
          );

          const schema = isSubs ? SubSchema : ChargeSchema;
          const parsed: any[] = [];
          const bad: string[] = [];

          mapped.forEach((row, i) => {
            const result = schema.safeParse(row);
            if (result.success) parsed.push(result.data);
            else bad.push(`Row ${i + 2}: ${result.error.issues[0].message}`);
          });

          if (bad.length) {
            setError(
              `Found ${bad.length} invalid rows. Showing first few:\n${bad
                .slice(0, 5)
                .join("\n")}`
            );
          } else {
            setError(null);
          }

          onFileUpload(parsed, isSubs ? "subscriptions" : "charges");
          resolve();
        },
      });
    });
  };

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      const files = Array.from(e.dataTransfer.files);
      if (!files[0]) return;
      parseAndValidate(files[0]);
    },
    [onFileUpload]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) parseAndValidate(file);
      e.target.value = "";
    },
    [onFileUpload]
  );

  return (
    <Card
      className={`transition-all duration-200 cursor-pointer hover:shadow-lg ${
        isDragOver
          ? "border-primary bg-primary/5 shadow-md"
          : "border-dashed border-border hover:border-primary/50"
      } ${isProcessing ? "opacity-60 pointer-events-none" : ""}`}
      onDrop={handleDrop}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
    >
      <CardContent className="flex flex-col items-center justify-center py-10 space-y-3 text-center">
        <Upload className="h-10 w-10 text-gray-400" />
        <p className="text-gray-600">
          Drag & drop your Stripe CSV here, or click to browse
        </p>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileInput}
          className="hidden"
          id="fileInput"
        />
        <label
          htmlFor="fileInput"
          className="cursor-pointer px-4 py-2 rounded bg-blue-600 text-white"
        >
          Choose File
        </label>
        {isProcessing && <p>Processing…</p>}
        {error && (
          <Alert variant="destructive" className="mt-3">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
