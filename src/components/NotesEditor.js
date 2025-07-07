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
  const cellRefs = useRef({});

  // Fetch notes on mount
  useEffect(() => {
    if (!user) return;
    fetchNotes();
  }, [user]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user) return;
    
    const channel = supabase
      .channel('notes-updates')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'note_cells' 
      }, payload => {
        if (payload.new) {
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
        if (payload.new) {
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
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchNotes = async () => {
    const { data } = await supabase
      .from('note_cells')
      .select('*')
      .order('order', { ascending: true });
    
    if (data && data.length > 0) {
      setCells(data);
      setNextCellId(Math.max(...data.map(cell => cell.id)) + 1);
    }
  };

  const saveCell = async (cell) => {
    if (!user) return;
    
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
    
    // Save to database
    await saveCell(newCell);
    
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
    
    // Save immediately
    const updatedCell = cells.find(cell => cell.id === cellId);
    if (updatedCell) {
      saveCell({ ...updatedCell, content: newContent });
    }
  };

  const handleCellKeyDown = (e, cellId) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      // Find next empty cell
      const nextEmptyCell = findNextEmptyCell(cellId);
      if (nextEmptyCell) {
        focusCell(nextEmptyCell.id);
      } else {
        // If no empty cell found, create new one at the end
        createNewCell();
      }
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
    }
  };

  const handleCellFocus = (cellId) => {
    setEditingCell(cellId);
  };

  const handleCellBlur = () => {
    setEditingCell(null);
  };

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
          Press Enter to navigate • Arrow keys to move
        </span>
      </div>
      
      <div className="notes-content">
        <div className="cells-container">
          {cells.map((cell) => (
            <div key={cell.id} className="cell-row">
              <textarea
                ref={el => cellRefs.current[cell.id] = el}
                value={cell.content}
                onChange={(e) => handleCellChange(cell.id, e.target.value)}
                onKeyDown={(e) => handleCellKeyDown(e, cell.id)}
                onFocus={() => handleCellFocus(cell.id)}
                onBlur={handleCellBlur}
                className={`cell-textarea ${editingCell === cell.id ? 'editing' : ''}`}
                placeholder="Type here..."
                rows={1}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 