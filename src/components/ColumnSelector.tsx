import React, { useState } from 'react';
import { Settings } from 'lucide-react';
import type { Column } from '../hooks/useColumnVisibility';

interface ColumnSelectorProps {
  columns: Column[];
  visibleColumns: Set<string>;
  onColumnToggle: (columnId: string) => void;
  onSave: (columns: string[]) => void;
}

export function ColumnSelector({ columns, visibleColumns, onColumnToggle, onSave }: ColumnSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempVisibleColumns, setTempVisibleColumns] = useState<Set<string>>(visibleColumns);

  const handleToggle = (columnId: string) => {
    setTempVisibleColumns(prev => {
      const next = new Set(prev);
      if (next.has(columnId)) {
        next.delete(columnId);
      } else {
        next.add(columnId);
      }
      return next;
    });
  };

  const handleSave = () => {
    onSave(Array.from(tempVisibleColumns));
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempVisibleColumns(visibleColumns);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
      >
        <Settings className="w-4 h-4 mr-2" />
        Configurar Colunas
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 bg-white rounded-md shadow-lg w-64">
          <div className="p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Colunas Visíveis</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {columns.map(column => (
                <label key={column.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={tempVisibleColumns.has(column.id)}
                    onChange={() => handleToggle(column.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{column.label}</span>
                </label>
              ))}
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={handleCancel}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}