import React from 'react';
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
  onUpdate: (updates: { content?: string; color?: string; description?: string; attachments?: string[] }) => void;
  onDelete: () => void;
}

export const SortableCard: React.FC<SortableCardProps> = (props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: props.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab'
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <Card {...props} />
    </div>
  );
};