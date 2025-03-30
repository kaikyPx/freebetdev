import React, { useState, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { Column } from './organization/Column';
import { Card } from './organization/Card';
import { SortableCard } from './organization/SortableCard';

interface CardType {
  id: string;
  content: string;
  columnId: string;
  color?: string;
  attachments?: string[];
  description?: string;
  isNew?: boolean;
}

interface ColumnType {
  id: string;
  title: string;
}

const Organization = () => {
  const [columns, setColumns] = useState<ColumnType[]>(() => {
    const saved = localStorage.getItem('columns');
    return saved ? JSON.parse(saved) : [
      { id: 'todo', title: 'A Fazer' },
      { id: 'inProgress', title: 'Em Andamento' },
      { id: 'done', title: 'Concluído' },
    ];
  });

  const [cards, setCards] = useState<CardType[]>(() => {
    const saved = localStorage.getItem('cards');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeId, setActiveId] = useState<string | null>(null);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [showNewColumnInput, setShowNewColumnInput] = useState(false);

  useEffect(() => {
    localStorage.setItem('columns', JSON.stringify(columns));
  }, [columns]);

  useEffect(() => {
    localStorage.setItem('cards', JSON.stringify(cards));
  }, [cards]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeCard = cards.find(card => card.id === active.id);
    const overCard = cards.find(card => card.id === over.id);

    if (!activeCard) return;

    if (overCard) {
      const activeIndex = cards.findIndex(card => card.id === active.id);
      const overIndex = cards.findIndex(card => card.id === over.id);

      if (activeCard.columnId !== overCard.columnId) {
        setCards(cards.map(card => 
          card.id === activeCard.id 
            ? { ...card, columnId: overCard.columnId }
            : card
        ));
      }

      setCards(arrayMove(cards, activeIndex, overIndex));
    } else {
      const newColumnId = over.id as string;
      if (activeCard.columnId !== newColumnId) {
        setCards(cards.map(card =>
          card.id === activeCard.id
            ? { ...card, columnId: newColumnId }
            : card
        ));
      }
    }

    setActiveId(null);
  };

  const handleDragOver = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const activeCard = cards.find(card => card.id === active.id);
    const overCard = cards.find(card => card.id === over.id);

    if (!activeCard) return;

    if (overCard && activeCard.columnId !== overCard.columnId) {
      setCards(cards.map(card => 
        card.id === activeCard.id 
          ? { ...card, columnId: overCard.columnId }
          : card
      ));
    } else if (!overCard) {
      const newColumnId = over.id as string;
      if (activeCard.columnId !== newColumnId) {
        setCards(cards.map(card =>
          card.id === activeCard.id
            ? { ...card, columnId: newColumnId }
            : card
        ));
      }
    }
  };

  const handleAddCard = (columnId: string) => {
    const newCard: CardType = {
      id: `card-${Date.now()}`,
      content: 'Novo Card',
      columnId,
      color: 'bg-white',
      attachments: [],
      description: '',
      isNew: true,
    };
    setCards([...cards, newCard]);
  };

  const handleUpdateCard = (cardId: string, updates: Partial<CardType>) => {
    setCards(cards.map(card =>
      card.id === cardId ? { ...card, ...updates, isNew: false } : card
    ));
  };

  const handleDeleteCard = (cardId: string) => {
    setCards(cards.filter(card => card.id !== cardId));
  };

  const handleAddColumn = () => {
    if (newColumnTitle.trim()) {
      const newColumn: ColumnType = {
        id: `column-${Date.now()}`,
        title: newColumnTitle,
      };
      setColumns([...columns, newColumn]);
      setNewColumnTitle('');
      setShowNewColumnInput(false);
    }
  };

  const handleUpdateColumnTitle = (columnId: string, newTitle: string) => {
    setColumns(columns.map(column =>
      column.id === columnId ? { ...column, title: newTitle } : column
    ));
  };

  const handleDeleteColumn = (columnId: string) => {
    setColumns(columns.filter(column => column.id !== columnId));
    setCards(cards.filter(card => card.columnId !== columnId));
  };

  return (
    <div className="flex-1 p-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Organização</h1>
        <button
          onClick={() => setShowNewColumnInput(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nova Coluna
        </button>
      </div>

      {showNewColumnInput && (
        <div className="mb-6 flex gap-2">
          <input
            type="text"
            value={newColumnTitle}
            onChange={(e) => setNewColumnTitle(e.target.value)}
            placeholder="Nome da coluna"
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && handleAddColumn()}
          />
          <button
            onClick={handleAddColumn}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Adicionar
          </button>
          <button
            onClick={() => setShowNewColumnInput(false)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Cancelar
          </button>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
      >
        <div className="flex gap-6 overflow-x-auto pb-4">
          {columns.map(column => (
            <Column
              key={column.id}
              id={column.id}
              title={column.title}
              onAddCard={() => handleAddCard(column.id)}
              onDelete={() => handleDeleteColumn(column.id)}
              onUpdateTitle={(newTitle) => handleUpdateColumnTitle(column.id, newTitle)}
            >
              <SortableContext
                items={cards.filter(card => card.columnId === column.id).map(card => card.id)}
                strategy={verticalListSortingStrategy}
              >
                {cards
                  .filter(card => card.columnId === column.id)
                  .map(card => (
                    <SortableCard
                      key={card.id}
                      id={card.id}
                      content={card.content}
                      color={card.color}
                      attachments={card.attachments}
                      description={card.description}
                      isNew={card.isNew}
                      onUpdate={(updates) => handleUpdateCard(card.id, updates)}
                      onDelete={() => handleDeleteCard(card.id)}
                    />
                  ))}
              </SortableContext>
            </Column>
          ))}
        </div>

        <DragOverlay>
          {activeId ? (
            <Card
              id={activeId}
              content={cards.find(card => card.id === activeId)?.content || ''}
              color={cards.find(card => card.id === activeId)?.color}
              attachments={cards.find(card => card.id === activeId)?.attachments}
              description={cards.find(card => card.id === activeId)?.description}
              onUpdate={() => {}}
              onDelete={() => {}}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default Organization;