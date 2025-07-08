import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import './NotesEditor.css';

export default function NotesEditor({ user }) {
  const [cells, setCells] = useState([
    { id: 1, content: 'Welcome to Notes', order: 1 },
    { id: 2, content: '', order: 2 },
    { id: 3, content: 'Start typing your notes here...', order: 3 },
    { id: 4, content: '', order: 4 },
    { id: 5, content: 'Features:', order: 5 },
    { id: 6, content: '- Real-time sync', order: 6 },
    { id: 7, content: '- Cell-based editing', order: 7 },
    { id: 8, content: '- Collaborative editing', order: 8 }
  ]);
  const [editingCell, setEditingCell] = useState(null);
  const [nextCellId, setNextCellId] = useState(9);
  const [isUpdating, setIsUpdating] = useState(false);
  const [draggedCell, setDraggedCell] = useState(null);
  const [dragOverCell, setDragOverCell] = useState(null);
  const cellRefs = useRef({});
  const lastSavedContent = useRef({});

  // Fetch notes on mount
  useEffect(() => {
    if (!user) return;
    fetchNotes();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Subscribe to real-time updates with debouncing
  useEffect(() => {
    if (!user) return;
    
    const channel = supabase
      .channel('notes-updates')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'note_cells' 
      }, payload => {
        if (payload.new && !isUpdating) {
          setCells(prev => {
            const newCells = [...prev];
            const existingIndex = newCells.findIndex(cell => cell.id === payload.new.id);
            if (existingIndex >= 0) {
              newCells[existingIndex] = payload.new;
            } else {
              newCells.push(payload.new);
            }
            return newCells.sort((a, b) => a.order - b.order);
          });
        }
      })
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'note_cells' 
      }, payload => {
        if (payload.new && !isUpdating) {
          setCells(prev => {
            const newCells = [...prev];
            const index = newCells.findIndex(cell => cell.id === payload.new.id);
            if (index >= 0) {
              newCells[index] = payload.new;
            }
            return newCells.sort((a, b) => a.order - b.order);
          });
        }
      })
      .on('postgres_changes', { 
        event: 'DELETE', 
        schema: 'public', 
        table: 'note_cells' 
      }, payload => {
        if (payload.old && !isUpdating) {
          setCells(prev => prev.filter(cell => cell.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, isUpdating]);

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('note_cells')
        .select('*')
        .order('order', { ascending: true });
      
      if (error) {
        console.error('Error fetching notes:', error);
        if (error.code === '42501') {
          alert('Permission denied. Please check your authentication.');
        } else {
          alert('Error loading notes: ' + error.message);
        }
        return;
      }
      
      if (data && data.length > 0) {
        setCells(data);
        setNextCellId(Math.max(...data.map(cell => cell.id)) + 1);
        // Initialize last saved content
        data.forEach(cell => {
          lastSavedContent.current[cell.id] = cell.content;
        });
      }
    } catch (err) {
      console.error('Unexpected error fetching notes:', err);
      alert('Unexpected error loading notes');
    }
  };

  const saveCell = async (cell) => {
    if (!user) return;
    
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('note_cells')
        .upsert({ 
          id: cell.id,
          content: cell.content,
          order: cell.order,
          updated_at: new Date().toISOString()
        });
      
      if (error) {
        console.error('Error saving cell:', error);
        if (error.code === '42501') {
          alert('Permission denied. Please check your authentication.');
        } else {
          alert('Error saving note: ' + error.message);
        }
      } else {
        lastSavedContent.current[cell.id] = cell.content;
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const updateCellOrder = async (cells) => {
    if (!user) return;
    
    setIsUpdating(true);
    try {
      // Update all cells with new order
      const updates = cells.map((cell, index) => ({
        id: cell.id,
        content: cell.content,
        order: index + 1,
        updated_at: new Date().toISOString()
      }));
      
      const { error } = await supabase
        .from('note_cells')
        .upsert(updates);
      
      if (error) {
        console.error('Error updating cell order:', error);
        alert('Error reordering notes: ' + error.message);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteCell = async (cellId) => {
    if (!user) return;
    
    // Prevent deletion if it's the last cell
    if (cells.length <= 1) {
      console.log('Cannot delete the last cell');
      return;
    }
    
    // Find the cell to be deleted
    const cellToDelete = cells.find(cell => cell.id === cellId);
    if (!cellToDelete) {
      console.error('Cell not found for deletion');
      return;
    }
    
    // Ask for confirmation if the cell has content
    if (cellToDelete.content.trim() !== '') {
      const confirmed = window.confirm('Are you sure you want to delete this note? This action cannot be undone.');
      if (!confirmed) {
        return;
      }
    }
    
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('note_cells')
        .delete()
        .eq('id', cellId);
      
      if (error) {
        console.error('Error deleting cell:', error);
        // Show error message to user
        alert('Error deleting cell: ' + error.message);
      } else {
        // Remove from local state
        setCells(prev => prev.filter(cell => cell.id !== cellId));
        // Clean up refs and saved content
        delete lastSavedContent.current[cellId];
        delete cellRefs.current[cellId];
        
        // If the deleted cell was being edited, focus on the next available cell
        if (editingCell === cellId) {
          const remainingCells = cells.filter(cell => cell.id !== cellId);
          if (remainingCells.length > 0) {
            const currentIndex = cells.findIndex(cell => cell.id === cellId);
            const nextCell = remainingCells[Math.min(currentIndex, remainingCells.length - 1)];
            if (nextCell) {
              focusCell(nextCell.id);
            }
          }
        }
      }
    } catch (err) {
      console.error('Unexpected error deleting cell:', err);
      alert('Unexpected error deleting cell');
    } finally {
      setIsUpdating(false);
    }
  };

  const createNewCell = async () => {
    if (!user) return;
    
    const newOrder = cells.length + 1;
    const newCellId = nextCellId;
    
    const newCell = {
      id: newCellId,
      content: '',
      order: newOrder
    };
    
    // Immediately update local state
    setCells(prev => [...prev, newCell]);
    setNextCellId(prev => prev + 1);
    setEditingCell(newCellId);
    lastSavedContent.current[newCellId] = '';
    
    // Save to database
    try {
      await saveCell(newCell);
    } catch (error) {
      console.error('Error creating new cell:', error);
      // Remove from local state if save failed
      setCells(prev => prev.filter(cell => cell.id !== newCellId));
      alert('Error creating new note. Please try again.');
    }
    
    // Focus the new cell after a short delay
    setTimeout(() => {
      if (cellRefs.current[newCellId]) {
        cellRefs.current[newCellId].focus();
        cellRefs.current[newCellId].scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
    }, 100);
  };

  const findNextEmptyCell = (currentCellId) => {
    const currentIndex = cells.findIndex(cell => cell.id === currentCellId);
    const nextEmptyCell = cells.slice(currentIndex + 1).find(cell => cell.content.trim() === '');
    return nextEmptyCell;
  };

  const focusCell = (cellId) => {
    setEditingCell(cellId);
    setTimeout(() => {
      if (cellRefs.current[cellId]) {
        cellRefs.current[cellId].focus();
        // Scroll to cell if needed
        cellRefs.current[cellId].scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
    }, 50);
  };

  const handleCellChange = (cellId, newContent) => {
    setCells(prev => 
      prev.map(cell => 
        cell.id === cellId 
          ? { ...cell, content: newContent }
          : cell
      )
    );
    
    // Auto-resize the textarea
    setTimeout(() => {
      const textarea = cellRefs.current[cellId];
      if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
      }
    }, 0);
  };

  const handleCellBlur = async (cellId) => {
    setEditingCell(null);
    const cell = cells.find(c => c.id === cellId);
    if (cell && lastSavedContent.current[cellId] !== cell.content) {
      await saveCell(cell);
    }
  };

  const handleCellKeyDown = (e, cellId) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      
      // Find next empty cell
      const nextEmptyCell = findNextEmptyCell(cellId);
      if (nextEmptyCell) {
        focusCell(nextEmptyCell.id);
      } else {
        // If no empty cell found, create new one at the end
        createNewCell();
      }
    } else if (e.key === 'Enter' && e.shiftKey) {
      // Allow Shift+Enter to create a new line in the same cell
      // Let the default behavior happen (new line in textarea)
      return;
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const currentIndex = cells.findIndex(cell => cell.id === cellId);
      if (currentIndex < cells.length - 1) {
        focusCell(cells[currentIndex + 1].id);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const currentIndex = cells.findIndex(cell => cell.id === cellId);
      if (currentIndex > 0) {
        focusCell(cells[currentIndex - 1].id);
      }
    } else if (e.key === 'Delete' && e.ctrlKey) {
      e.preventDefault();
      deleteCell(cellId);
    }
  };

  const handleCellFocus = (cellId) => {
    setEditingCell(cellId);
  };

  // Drag and drop handlers
  const handleDragStart = (e, cellId) => {
    setDraggedCell(cellId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
  };

  const handleDragOver = (e, cellId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCell(cellId);
  };

  const handleDragLeave = (e) => {
    setDragOverCell(null);
  };

  const handleDrop = async (e, targetCellId) => {
    e.preventDefault();
    
    if (!draggedCell || draggedCell === targetCellId) {
      setDraggedCell(null);
      setDragOverCell(null);
      return;
    }

    const draggedIndex = cells.findIndex(cell => cell.id === draggedCell);
    const targetIndex = cells.findIndex(cell => cell.id === targetCellId);
    
    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedCell(null);
      setDragOverCell(null);
      return;
    }

    // Create new array with reordered cells
    const newCells = [...cells];
    const [draggedCellData] = newCells.splice(draggedIndex, 1);
    newCells.splice(targetIndex, 0, draggedCellData);
    
    // Update order property for all cells
    const updatedCells = newCells.map((cell, index) => ({
      ...cell,
      order: index + 1
    }));
    
    setCells(updatedCells);
    setDraggedCell(null);
    setDragOverCell(null);
    
    // Save the new order to database
    await updateCellOrder(updatedCells);
  };

  // Auto-resize all textareas on mount and when cells change
  useEffect(() => {
    cells.forEach(cell => {
      const textarea = cellRefs.current[cell.id];
      if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
      }
    });
  }, [cells]);

  if (!user) {
    return (
      <div className="notes-container">
        <div className="notes-placeholder">
          <span className="prompt">system@notes:~$</span>
          <span className="placeholder-text">Please login to access notes</span>
        </div>
      </div>
    );
  }

  return (
    <div className="notes-container">
      <div className="notes-header">
        <span className="prompt">notes@terminal:~$</span>
        <span className="notes-title">Collaborative Notes</span>
        <span className="usage-tip">
          Enter to next cell • Shift+Enter for new line • Arrow keys to move • Ctrl+Delete to delete • Drag to reorder
        </span>
      </div>
      
      <div className="notes-content">
        <div className="cells-container">
          {cells.map((cell) => (
            <div 
              key={cell.id} 
              className={`cell-row ${draggedCell === cell.id ? 'dragging' : ''} ${dragOverCell === cell.id ? 'drag-over' : ''}`}
              draggable={true}
              onDragStart={(e) => handleDragStart(e, cell.id)}
              onDragOver={(e) => handleDragOver(e, cell.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, cell.id)}
            >
              <div className="drag-handle">⋮⋮</div>
              <textarea
                ref={el => cellRefs.current[cell.id] = el}
                value={cell.content}
                onChange={(e) => handleCellChange(cell.id, e.target.value)}
                onKeyDown={(e) => handleCellKeyDown(e, cell.id)}
                onFocus={() => handleCellFocus(cell.id)}
                onBlur={() => handleCellBlur(cell.id)}
                className={`cell-textarea ${editingCell === cell.id ? 'editing' : ''}`}
                placeholder="Type here..."
                rows={1}
              />
              <button 
                className="delete-cell-btn"
                onClick={() => deleteCell(cell.id)}
                title="Delete cell (Ctrl+Delete)"
                disabled={cells.length <= 1}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 