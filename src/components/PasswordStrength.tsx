"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { evaluatePasswordStrength } from "@/lib/password-policy";

type PasswordStrengthProps = {
  password: string;
};

const levelColors = {
  Fraca: "bg-red-500",
  Média: "bg-amber-500",
  Forte: "bg-[#1668e8]",
  "Muito forte": "bg-[#12b76a]"
};

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const result = evaluatePasswordStrength(password);

  return (
    <div className="grid gap-3">
      <div>
        <div className="mb-2 flex items-center justify-between text-xs font-black">
          <span>Força da senha</span>
          <span>{result.level}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-lg bg-[#e4e9f2]">
          <div
            className={`h-full rounded-lg ${levelColors[result.level]}`}
            style={{ width: `${result.percentage}%` }}
          />
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {result.criteria.map((criterion) => (
          <div
            key={criterion.id}
            className={`flex items-center gap-2 text-xs font-bold ${
              criterion.met ? "text-[#128a52]" : "text-[#667085]"
            }`}
          >
            {criterion.met ? <CheckCircle2 size={15} /> : <Circle size={15} />}
            {criterion.label}
          </div>
        ))}
      </div>
    </div>
  );
}
