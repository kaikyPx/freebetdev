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
import { createClient } from '@supabase/supabase-js';
import { Column } from './organization/Column';
import { Card } from './organization/Card';
import { SortableCard } from './organization/SortableCard';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

interface CardType {
  id: string;
  content: string;
  columnId: string;
  color?: string;
  attachments?: string[];
  description?: string;
  isNew?: boolean;
  position: number;
}

interface ColumnType {
  id: string;
  title: string;
  position: number;
}

const Organization = () => {
  const [columns, setColumns] = useState<ColumnType[]>([]);
  const [cards, setCards] = useState<CardType[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [showNewColumnInput, setShowNewColumnInput] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch data from Supabase on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      // Fetch columns
      const { data: columnsData, error: columnsError } = await supabase
        .from('organization_columns')
        .select('*')
        .order('position', { ascending: true });
      
      if (columnsError) {
        console.error('Error fetching columns:', columnsError);
      } else if (columnsData.length === 0) {
        // Create default columns if none exist
        const defaultColumns = [
          { id: crypto.randomUUID(), title: 'A Fazer', position: 0 },
          { id: crypto.randomUUID(), title: 'Em Andamento', position: 1 },
          { id: crypto.randomUUID(), title: 'Concluído', position: 2 },
        ];
        
        for (const column of defaultColumns) {
          await supabase.from('organization_columns').insert(column);
        }
        
        setColumns(defaultColumns);
      } else {
        setColumns(columnsData);
      }
      
      // Fetch cards
      const { data: cardsData, error: cardsError } = await supabase
        .from('organization_cards')
        .select('*')
        .order('position', { ascending: true });
      
      if (cardsError) {
        console.error('Error fetching cards:', cardsError);
      } else {
        setCards(cardsData);
      }
      
      setIsLoading(false);
    };
    
    fetchData();
    
    // Set up real-time subscriptions
    const columnsSubscription = supabase
      .channel('organization_columns_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'organization_columns' }, 
        payload => {
          if (payload.eventType === 'INSERT') {
            setColumns(prev => [...prev, payload.new]);
          } else if (payload.eventType === 'UPDATE') {
            setColumns(prev => prev.map(col => col.id === payload.new.id ? payload.new : col));
          } else if (payload.eventType === 'DELETE') {
            setColumns(prev => prev.filter(col => col.id !== payload.old.id));
          }
        })
      .subscribe();
      
    const cardsSubscription = supabase
      .channel('organization_cards_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'organization_cards' }, 
        payload => {
          if (payload.eventType === 'INSERT') {
            setCards(prev => [...prev, payload.new]);
          } else if (payload.eventType === 'UPDATE') {
            setCards(prev => prev.map(card => card.id === payload.new.id ? payload.new : card));
          } else if (payload.eventType === 'DELETE') {
            setCards(prev => prev.filter(card => card.id !== payload.old.id));
          }
        })
      .subscribe();
    
    return () => {
      supabase.removeChannel(columnsSubscription);
      supabase.removeChannel(cardsSubscription);
    };
  }, []);

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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeCard = cards.find(card => card.id === active.id);
    const overCard = cards.find(card => card.id === over.id);

    if (!activeCard) return;

    if (overCard) {
      const activeIndex = cards.findIndex(card => card.id === active.id);
      const overIndex = cards.findIndex(card => card.id === over.id);

      let newCards = [...cards];

      if (activeCard.columnId !== overCard.columnId) {
        newCards = newCards.map(card => 
          card.id === activeCard.id 
            ? { ...card, columnId: overCard.columnId }
            : card
        );
      }

      newCards = arrayMove(newCards, activeIndex, overIndex);
      
      // Update positions
      const updatedCards = newCards.map((card, index) => ({
        ...card,
        position: index
      }));
      
      setCards(updatedCards);
      
      // Update in Supabase
      await supabase
        .from('organization_cards')
        .update({ 
          columnId: overCard.columnId,
          position: overIndex 
        })
        .eq('id', activeCard.id);
        
      // Update positions for affected cards
      for (const card of updatedCards.filter((_, i) => 
        i >= Math.min(activeIndex, overIndex) && 
        i <= Math.max(activeIndex, overIndex) && 
        card.id !== activeCard.id
      )) {
        await supabase
          .from('organization_cards')
          .update({ position: card.position })
          .eq('id', card.id);
      }
    } else {
      const newColumnId = over.id as string;
      if (activeCard.columnId !== newColumnId) {
        const updatedCard = {
          ...activeCard,
          columnId: newColumnId
        };
        
        setCards(cards.map(card =>
          card.id === activeCard.id ? updatedCard : card
        ));
        
        // Update in Supabase
        await supabase
          .from('organization_cards')
          .update({ columnId: newColumnId })
          .eq('id', activeCard.id);
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

  const handleAddCard = async (columnId: string) => {
    const cardsInColumn = cards.filter(card => card.columnId === columnId);
    const maxPosition = cardsInColumn.length > 0 
      ? Math.max(...cardsInColumn.map(card => card.position)) + 1
      : 0;
    
    const newCard: CardType = {
      id: crypto.randomUUID(),
      content: 'Novo Card',
      columnId,
      color: 'bg-white',
      attachments: [],
      description: '',
      isNew: true,
      position: maxPosition,
    };
    
    setCards([...cards, newCard]);
    
    // Add to Supabase
    await supabase.from('organization_cards').insert(newCard);
  };

  const handleUpdateCard = async (cardId: string, updates: Partial<CardType>) => {
    const updatedCard = {
      ...cards.find(card => card.id === cardId),
      ...updates,
      isNew: false,
      updated_at: new Date().toISOString()
    };
    
    setCards(cards.map(card =>
      card.id === cardId ? updatedCard : card
    ));
    
    // Update in Supabase
    await supabase
      .from('organization_cards')
      .update(updates)
      .eq('id', cardId);
  };

  const handleDeleteCard = async (cardId: string) => {
    setCards(cards.filter(card => card.id !== cardId));
    
    // Delete from Supabase
    await supabase
      .from('organization_cards')
      .delete()
      .eq('id', cardId);
  };

  const handleAddColumn = async () => {
    if (newColumnTitle.trim()) {
      const maxPosition = columns.length > 0 
        ? Math.max(...columns.map(col => col.position)) + 1
        : 0;
      
      const newColumn: ColumnType = {
        id: crypto.randomUUID(),
        title: newColumnTitle,
        position: maxPosition
      };
      
      setColumns([...columns, newColumn]);
      setNewColumnTitle('');
      setShowNewColumnInput(false);
      
      // Add to Supabase
      await supabase.from('organization_columns').insert(newColumn);
    }
  };

  const handleUpdateColumnTitle = async (columnId: string, newTitle: string) => {
    setColumns(columns.map(column =>
      column.id === columnId ? { ...column, title: newTitle } : column
    ));
    
    // Update in Supabase
    await supabase
      .from('organization_columns')
      .update({ title: newTitle })
      .eq('id', columnId);
  };

  const handleDeleteColumn = async (columnId: string) => {
    setColumns(columns.filter(column => column.id !== columnId));
    
    // First delete all cards in this column
    const cardsToDelete = cards.filter(card => card.columnId === columnId);
    setCards(cards.filter(card => card.columnId !== columnId));
    
    // Delete from Supabase
    for (const card of cardsToDelete) {
      await supabase
        .from('organization_cards')
        .delete()
        .eq('id', card.id);
    }
    
    await supabase
      .from('organization_columns')
      .delete()
      .eq('id', columnId);
  };

  if (isLoading) {
    return <div className="flex-1 p-8 flex justify-center items-center">Carregando...</div>;
  }

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
            onKeyDown={(e) => e.key === 'Enter' && handleAddColumn()}
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
                  .sort((a, b) => a.position - b.position)
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