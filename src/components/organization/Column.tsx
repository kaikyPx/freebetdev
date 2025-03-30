import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';

interface ColumnProps {
  id: string;
  title: string;
  children: React.ReactNode;
  onAddCard: () => void;
  onDelete: () => void;
  onUpdateTitle: (newTitle: string) => void;
}

export const Column: React.FC<ColumnProps> = ({
  id,
  title,
  children,
  onAddCard,
  onDelete,
  onUpdateTitle,
}) => {
  const { setNodeRef } = useDroppable({ id });
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);

  const handleTitleSubmit = () => {
    const newTitle = editTitle.trim();
    if (newTitle && newTitle !== title) {
      onUpdateTitle(newTitle);
    } else {
      setEditTitle(title);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSubmit();
    } else if (e.key === 'Escape') {
      setEditTitle(title);
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditTitle(title);
    setIsEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      className="bg-gray-100 rounded-lg p-4 w-80 flex flex-col"
    >
      <div className="flex justify-between items-center mb-4">
        {isEditing ? (
          <div className="flex items-center gap-2 flex-1">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 px-2 py-1 text-lg font-semibold border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              onClick={handleTitleSubmit}
              className="p-1 hover:bg-green-100 rounded text-green-600"
              title="Salvar"
            >
              <Check className="w-5 h-5" />
            </button>
            <button
              onClick={handleCancelEdit}
              className="p-1 hover:bg-red-100 rounded text-red-600"
              title="Cancelar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 group">
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
            <button
              onClick={() => setIsEditing(true)}
              className="p-1 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              title="Editar título"
            >
              <Edit2 className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <button
            onClick={onAddCard}
            className="p-1 hover:bg-gray-200 rounded"
            title="Adicionar card"
          >
            <Plus className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 hover:bg-gray-200 rounded"
            title="Excluir coluna"
          >
            <Trash2 className="w-5 h-5 text-red-600" />
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-2 min-h-[200px]">
        {children}
      </div>
    </div>
  );
};