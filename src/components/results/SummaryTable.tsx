"use client";

import { ROLE_INFO } from "@/lib/engine/constants";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import type { RoleSummary } from "@/lib/engine/analytics";

interface SummaryTableProps {
  data: RoleSummary[];
}

export default function SummaryTable({ data }: SummaryTableProps) {
  const sorted = [...data].sort((a, b) => a.totalCost - b.totalCost);
  const bestRole = sorted[0]?.role;

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 overflow-x-auto">
      <h3 className="text-lg font-bold text-earth-800 mb-4">
        Resumen por Eslabon
      </h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-earth-200">
            <th className="text-left py-2 px-2 text-earth-600">Rol</th>
            <th className="text-right py-2 px-2 text-earth-600">
              Sem. Backlog
            </th>
            <th className="text-right py-2 px-2 text-earth-600">Max Inv.</th>
            <th className="text-right py-2 px-2 text-earth-600">
              Max Pedido
            </th>
            <th className="text-right py-2 px-2 text-earth-600">
              Costo Inv.
            </th>
            <th className="text-right py-2 px-2 text-earth-600">Costo BL</th>
            <th className="text-right py-2 px-2 text-earth-600 font-bold">
              Costo Total
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => {
            const info = ROLE_INFO[row.role];
            const isBest = row.role === bestRole;

            return (
              <tr
                key={row.role}
                className={`border-b border-earth-100 ${
                  isBest ? "bg-lemon-50" : ""
                }`}
              >
                <td className="py-2 px-2 font-medium">
                  <span className="mr-1">{info.emoji}</span>
                  {row.roleName}
                  {isBest && (
                    <span className="ml-1 text-xs text-lemon-600">&#9733;</span>
                  )}
                </td>
                <td className="text-right py-2 px-2">{row.weeksWithBacklog}</td>
                <td className="text-right py-2 px-2">{row.maxInventory}</td>
                <td className="text-right py-2 px-2">{row.maxOrder}</td>
                <td className="text-right py-2 px-2 text-campo-600">
                  {formatCurrency(row.inventoryCost)}
                </td>
                <td className="text-right py-2 px-2 text-red-500">
                  {formatCurrency(row.backlogCost)}
                </td>
                <td className="text-right py-2 px-2 font-bold">
                  {formatCurrency(row.totalCost)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
