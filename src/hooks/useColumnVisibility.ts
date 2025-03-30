import { useState, useEffect } from 'react';

export interface Column {
  id: string;
  label: string;
  defaultVisible: boolean;
}

export function useColumnVisibility(columns: Column[]) {
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(() => {
    const savedColumns = localStorage.getItem('visibleColumns');
    if (savedColumns) {
      return new Set(JSON.parse(savedColumns));
    }
    return new Set(columns.filter(col => col.defaultVisible).map(col => col.id));
  });

  useEffect(() => {
    localStorage.setItem('visibleColumns', JSON.stringify(Array.from(visibleColumns)));
  }, [visibleColumns]);

  const toggleColumn = (columnId: string) => {
    setVisibleColumns(prev => {
      const next = new Set(prev);
      if (next.has(columnId)) {
        next.delete(columnId);
      } else {
        next.add(columnId);
      }
      return next;
    });
  };

  const isColumnVisible = (columnId: string) => visibleColumns.has(columnId);

  const updateVisibleColumns = (columns: string[]) => {
    setVisibleColumns(new Set(columns));
  };

  return {
    visibleColumns,
    toggleColumn,
    isColumnVisible,
    updateVisibleColumns
  };
}