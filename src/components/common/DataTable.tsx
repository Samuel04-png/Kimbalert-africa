import React from 'react';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  sortable?: boolean;
}

export default function DataTable<T extends { id: string }>({
  rows,
  columns,
  selected,
  onToggle,
}: {
  rows: T[];
  columns: DataTableColumn<T>[];
  selected?: string[];
  onToggle?: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-[var(--r-lg)] border border-slate-700 bg-[#101827] shadow">
      <table className="min-w-full text-sm">
        <thead className="sticky top-0 bg-[#121c2e] text-slate-300">
          <tr>
            {onToggle ? <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide">Sel</th> : null}
            {columns.map((column) => (
              <th key={column.key} className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/70 text-slate-200">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-[#1b273c] transition-[var(--transition-fast)]">
              {onToggle ? (
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selected?.includes(row.id) ?? false}
                    onChange={() => onToggle(row.id)}
                    className="h-4 w-4 rounded border-slate-500 bg-transparent"
                  />
                </td>
              ) : null}
              {columns.map((column) => (
                <td key={`${row.id}-${column.key}`} className="px-3 py-3">
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
