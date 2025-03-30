import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Paperclip, X, Edit2, Save, Download } from 'lucide-react';

interface CardProps {
  id: string;
  content: string;
  color?: string;
  attachments?: Array<{
    name: string;
    data: string;
    type: string;
  }>;
  description?: string;
  isNew?: boolean;
  onUpdate: (updates: { 
    content?: string; 
    color?: string; 
    description?: string; 
    attachments?: Array<{
      name: string;
      data: string;
      type: string;
    }>; 
  }) => void;
  onDelete: () => void;
}

export const Card: React.FC<CardProps> = ({
  id,
  content,
  color = 'bg-white',
  attachments = [],
  description = '',
  isNew = false,
  onUpdate,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(isNew);
  const [editContent, setEditContent] = useState(content);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editDescription, setEditDescription] = useState(description);
  const [selectedColor, setSelectedColor] = useState(color);
  const [cardAttachments, setCardAttachments] = useState(attachments);
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const colors = [
    'bg-white',
    'bg-red-100',
    'bg-yellow-100',
    'bg-green-100',
    'bg-blue-100',
    'bg-purple-100',
    'bg-pink-100'
  ];

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditContent(content);
  };

  const handleBlur = () => {
    if (editContent.trim() !== content) {
      onUpdate({ content: editContent.trim() });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleBlur();
    }
    if (e.key === 'Escape') {
      setEditContent(content);
      setIsEditing(false);
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditContent(e.target.value);
  };

  const handleColorChange = (newColor: string) => {
    setSelectedColor(newColor);
    onUpdate({ color: newColor });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    try {
      setIsUploading(true);
      const newAttachments = await Promise.all(
        Array.from(files).map(async (file) => {
          return new Promise<{ name: string; data: string; type: string }>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              resolve({
                name: file.name,
                data: reader.result as string,
                type: file.type
              });
            };
            reader.readAsDataURL(file);
          });
        })
      );

      const updatedAttachments = [...cardAttachments, ...newAttachments];
      setCardAttachments(updatedAttachments);
      onUpdate({ attachments: updatedAttachments });
    } catch (error) {
      console.error('Error handling file upload:', error);
      alert('Error uploading file(s). Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAttachment = (index: number) => {
    const updatedAttachments = cardAttachments.filter((_, i) => i !== index);
    setCardAttachments(updatedAttachments);
    onUpdate({ attachments: updatedAttachments });
  };

  const handleDownload = (attachment: { name: string; data: string; type: string }) => {
    try {
      const link = document.createElement('a');
      link.href = attachment.data;
      link.download = attachment.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Error downloading file. Please try again.');
    }
  };

  const handleSaveAll = () => {
    onUpdate({
      content: editContent,
      description: editDescription,
      color: selectedColor,
      attachments: cardAttachments
    });
    setIsModalOpen(false);
  };

  const handleDeleteCard = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this card?')) {
      onDelete();
    }
  };

  return (
    <>
      <div 
        className={`rounded-lg shadow p-3 cursor-pointer hover:shadow-md transition-shadow duration-200 ${selectedColor}`}
        onClick={() => !isEditing && setIsModalOpen(true)}
      >
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1">
            {isEditing ? (
              <textarea
                ref={textareaRef}
                value={editContent}
                onChange={handleContentChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                onClick={(e) => e.stopPropagation()}
                className="w-full p-1 border rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                rows={3}
                style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
              />
            ) : (
              <div className="group flex items-start gap-2">
                <div className="flex-1 text-gray-700 whitespace-pre-wrap">
                  {content}
                </div>
                <button
                  onClick={handleEditClick}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
                  title="Editar título"
                >
                  <Edit2 className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {cardAttachments?.length > 0 && (
              <Paperclip className="w-4 h-4 text-gray-500" />
            )}
            <button
              onClick={handleDeleteCard}
              className="p-1 hover:bg-gray-100 rounded"
              title="Excluir card"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${selectedColor} rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold">Editar Card</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título
                </label>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cor do Card
                </label>
                <div className="flex gap-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      className={`w-6 h-6 rounded ${color} border ${
                        selectedColor === color ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => handleColorChange(color)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Anexos
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  multiple
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                >
                  {isUploading ? 'Enviando...' : 'Adicionar Anexo'}
                </button>
                
                <div className="mt-2 space-y-2">
                  {cardAttachments?.map((attachment, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDownload(attachment)}
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <Download className="w-4 h-4" />
                          <span>{attachment.name}</span>
                        </button>
                      </div>
                      <button
                        onClick={() => handleRemoveAttachment(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveAll}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};