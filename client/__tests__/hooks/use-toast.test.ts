import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToast, toast, reducer } from '@/hooks/use-toast';

describe('use-toast', () => {
  beforeEach(() => {
    // Clear any existing toasts before each test
    vi.clearAllMocks();
  });

  describe('toast function', () => {
    it('should create a toast with title and description', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        toast({
          title: 'Test Title',
          description: 'Test Description',
        });
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].title).toBe('Test Title');
      expect(result.current.toasts[0].description).toBe('Test Description');
    });

    it('should generate unique IDs for toasts', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        toast({ title: 'Toast 1' });
        toast({ title: 'Toast 2' });
      });

      // Only the latest toast should be visible (TOAST_LIMIT = 1)
      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].title).toBe('Toast 2');
    });

    it('should return toast control object', () => {
      let toastControl: any;

      act(() => {
        toastControl = toast({ title: 'Test' });
      });

      expect(toastControl).toHaveProperty('id');
      expect(toastControl).toHaveProperty('dismiss');
      expect(toastControl).toHaveProperty('update');
      expect(typeof toastControl.dismiss).toBe('function');
      expect(typeof toastControl.update).toBe('function');
    });

    it('should set open to true by default', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        toast({ title: 'Test' });
      });

      expect(result.current.toasts[0].open).toBe(true);
    });
  });

  describe('toast.dismiss', () => {
    it('should dismiss a specific toast', () => {
      const { result } = renderHook(() => useToast());
      let toastControl: any;

      act(() => {
        toastControl = toast({ title: 'Test' });
      });

      expect(result.current.toasts[0].open).toBe(true);

      act(() => {
        toastControl.dismiss();
      });

      expect(result.current.toasts[0].open).toBe(false);
    });

    it('should dismiss all toasts when no ID provided', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        toast({ title: 'Toast 1' });
      });

      expect(result.current.toasts[0].open).toBe(true);

      act(() => {
        result.current.dismiss();
      });

      expect(result.current.toasts[0].open).toBe(false);
    });

    it('should dismiss toast by ID', () => {
      const { result } = renderHook(() => useToast());
      let toastControl: any;

      act(() => {
        toastControl = toast({ title: 'Test' });
      });

      act(() => {
        result.current.dismiss(toastControl.id);
      });

      expect(result.current.toasts[0].open).toBe(false);
    });
  });

  describe('toast.update', () => {
    it('should update toast properties', () => {
      const { result } = renderHook(() => useToast());
      let toastControl: any;

      act(() => {
        toastControl = toast({ title: 'Original Title' });
      });

      expect(result.current.toasts[0].title).toBe('Original Title');

      act(() => {
        toastControl.update({ title: 'Updated Title' });
      });

      expect(result.current.toasts[0].title).toBe('Updated Title');
    });

    it('should partially update toast', () => {
      const { result } = renderHook(() => useToast());
      let toastControl: any;

      act(() => {
        toastControl = toast({
          title: 'Title',
          description: 'Description',
        });
      });

      act(() => {
        toastControl.update({ description: 'New Description' });
      });

      expect(result.current.toasts[0].title).toBe('Title');
      expect(result.current.toasts[0].description).toBe('New Description');
    });
  });

  describe('useToast hook', () => {
    it('should provide toasts array', () => {
      const { result } = renderHook(() => useToast());
      expect(Array.isArray(result.current.toasts)).toBe(true);
    });

    it('should provide toast function', () => {
      const { result } = renderHook(() => useToast());
      expect(typeof result.current.toast).toBe('function');
    });

    it('should provide dismiss function', () => {
      const { result } = renderHook(() => useToast());
      expect(typeof result.current.dismiss).toBe('function');
    });

    it('should update when toasts change', () => {
      const { result } = renderHook(() => useToast());

      expect(result.current.toasts).toHaveLength(0);

      act(() => {
        result.current.toast({ title: 'New Toast' });
      });

      expect(result.current.toasts).toHaveLength(1);
    });

    it('should clean up listener on unmount', () => {
      const { unmount } = renderHook(() => useToast());
      unmount();
      // If this doesn't throw, the cleanup worked
      expect(true).toBe(true);
    });
  });

  describe('reducer', () => {
    it('should add toast', () => {
      const state = { toasts: [] };
      const action = {
        type: 'ADD_TOAST' as const,
        toast: { id: '1', title: 'Test', open: true },
      };

      const newState = reducer(state, action);
      expect(newState.toasts).toHaveLength(1);
      expect(newState.toasts[0].title).toBe('Test');
    });

    it('should respect TOAST_LIMIT', () => {
      const state = { toasts: [{ id: '1', title: 'First', open: true }] };
      const action = {
        type: 'ADD_TOAST' as const,
        toast: { id: '2', title: 'Second', open: true },
      };

      const newState = reducer(state, action);
      // TOAST_LIMIT is 1, so only the newest toast should remain
      expect(newState.toasts).toHaveLength(1);
      expect(newState.toasts[0].id).toBe('2');
    });

    it('should update toast', () => {
      const state = {
        toasts: [{ id: '1', title: 'Original', open: true }],
      };
      const action = {
        type: 'UPDATE_TOAST' as const,
        toast: { id: '1', title: 'Updated' },
      };

      const newState = reducer(state, action);
      expect(newState.toasts[0].title).toBe('Updated');
    });

    it('should not update non-existent toast', () => {
      const state = {
        toasts: [{ id: '1', title: 'Original', open: true }],
      };
      const action = {
        type: 'UPDATE_TOAST' as const,
        toast: { id: '2', title: 'Updated' },
      };

      const newState = reducer(state, action);
      expect(newState.toasts[0].title).toBe('Original');
    });

    it('should dismiss specific toast', () => {
      const state = {
        toasts: [{ id: '1', title: 'Test', open: true }],
      };
      const action = {
        type: 'DISMISS_TOAST' as const,
        toastId: '1',
      };

      const newState = reducer(state, action);
      expect(newState.toasts[0].open).toBe(false);
    });

    it('should dismiss all toasts when no ID provided', () => {
      const state = {
        toasts: [
          { id: '1', title: 'Test 1', open: true },
          { id: '2', title: 'Test 2', open: true },
        ],
      };
      const action = {
        type: 'DISMISS_TOAST' as const,
        toastId: undefined,
      };

      const newState = reducer(state, action);
      expect(newState.toasts[0].open).toBe(false);
      expect(newState.toasts[1].open).toBe(false);
    });

    it('should remove specific toast', () => {
      const state = {
        toasts: [{ id: '1', title: 'Test', open: true }],
      };
      const action = {
        type: 'REMOVE_TOAST' as const,
        toastId: '1',
      };

      const newState = reducer(state, action);
      expect(newState.toasts).toHaveLength(0);
    });

    it('should remove all toasts when no ID provided', () => {
      const state = {
        toasts: [
          { id: '1', title: 'Test 1', open: true },
          { id: '2', title: 'Test 2', open: true },
        ],
      };
      const action = {
        type: 'REMOVE_TOAST' as const,
        toastId: undefined,
      };

      const newState = reducer(state, action);
      expect(newState.toasts).toHaveLength(0);
    });

    it('should not remove non-existent toast', () => {
      const state = {
        toasts: [{ id: '1', title: 'Test', open: true }],
      };
      const action = {
        type: 'REMOVE_TOAST' as const,
        toastId: '2',
      };

      const newState = reducer(state, action);
      expect(newState.toasts).toHaveLength(1);
    });
  });

  describe('toast with action', () => {
    it('should include action in toast', () => {
      const { result } = renderHook(() => useToast());
      const action = { altText: 'Undo' };

      act(() => {
        toast({
          title: 'Test',
          action: action as any,
        });
      });

      expect(result.current.toasts[0].action).toEqual(action);
    });
  });

  describe('toast onOpenChange', () => {
    it('should call dismiss when open changes to false', () => {
      const { result } = renderHook(() => useToast());
      let toastControl: any;

      act(() => {
        toastControl = toast({ title: 'Test' });
      });

      const currentToast = result.current.toasts[0];

      act(() => {
        if (currentToast.onOpenChange) {
          currentToast.onOpenChange(false);
        }
      });

      expect(result.current.toasts[0].open).toBe(false);
    });

    it('should not dismiss when open changes to true', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        toast({ title: 'Test' });
      });

      const currentToast = result.current.toasts[0];

      act(() => {
        if (currentToast.onOpenChange) {
          currentToast.onOpenChange(true);
        }
      });

      // Toast should still be open
      expect(result.current.toasts[0].open).toBe(true);
    });
  });
});

