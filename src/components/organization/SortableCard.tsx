import React, { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from './Card';

interface SortableCardProps {
  id: string;
  content: string;
  color?: string;
  attachments?: string[];
  description?: string;
  isNew?: boolean;
  onUpdate: (updates: any) => void;
  onDelete: () => void;
}

export const SortableCard = ({
  id,
  content,
  color,
  attachments,
  description,
  isNew,
  onUpdate,
  onDelete,
}: SortableCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const [isEditing, setIsEditing] = useState(isNew || false);
  const [editableContent, setEditableContent] = useState(content);
  const [editableDescription, setEditableDescription] = useState(description || '');
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && contentRef.current) {
      contentRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    onUpdate({
      content: editableContent,
      description: editableDescription,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditableContent(content);
    setEditableDescription(description || '');
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    // Fix: Don't capture space keypress in description field
    if (e.target === descriptionRef.current) {
      return;
    }
    
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="mb-2"
    >
      {isEditing ? (
        <div className="p-3 bg-white rounded-lg shadow border-2 border-blue-400">
          <textarea
            ref={contentRef}
            value={editableContent}
            onChange={(e) => setEditableContent(e.target.value)}
            onKeyDown={handleKeyPress}
            className="w-full resize-none border rounded p-2 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
            placeholder="Título do card"
          />
          <textarea
            ref={descriptionRef}
            value={editableDescription}
            onChange={(e) => setEditableDescription(e.target.value)}
            className="w-full resize-none border rounded p-2 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Descrição (opcional)"
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={handleCancel}
              className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Salvar
            </button>
          </div>
        </div>
      ) : (
        <div onDoubleClick={() => setIsEditing(true)}>
          <Card
            id={id}
            content={content}
            color={color}
            attachments={attachments}
            description={description}
            onUpdate={() => setIsEditing(true)}
            onDelete={onDelete}
          />
        </div>
      )}
    </div>
  );
};