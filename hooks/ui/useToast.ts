"use client"

/**
 * Custom hook and utilities for managing toast notifications.
 * Inspired by react-hot-toast library.
 */
import * as React from "react";

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast";

/**
 * Maximum number of toasts that can be displayed at once
 */
const TOAST_LIMIT = 1;

/**
 * Delay in milliseconds before removing a toast from the DOM after it's dismissed
 */
const TOAST_REMOVE_DELAY = 1000000;

/**
 * Interface for a toast notification with all required properties
 */
export interface ToasterToast extends ToastProps {
  /** Unique identifier for the toast */
  id: string;
  /** Title/header of the toast */
  title?: React.ReactNode;
  /** Main content/description of the toast */
  description?: React.ReactNode;
  /** Optional action element (like a button) that can be included in the toast */
  action?: ToastActionElement;
}

/**
 * Available action types for toast state management
 */
const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;

/**
 * Counter for generating unique toast IDs
 */
let count = 0;

/**
 * Generates a unique ID for a toast
 * @returns {string} A unique string ID
 */
function genId(): string {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type ActionType = typeof actionTypes;

/**
 * Union type for all possible toast actions
 */
type Action =
  | {
      type: ActionType["ADD_TOAST"];
      toast: ToasterToast;
    }
  | {
      type: ActionType["UPDATE_TOAST"];
      toast: Partial<ToasterToast>;
    }
  | {
      type: ActionType["DISMISS_TOAST"];
      toastId?: ToasterToast["id"];
    }
  | {
      type: ActionType["REMOVE_TOAST"];
      toastId?: ToasterToast["id"];
    }

/**
 * Interface for the toast state
 */
interface State {
  /** Array of active toast notifications */
  toasts: ToasterToast[];
}

/**
 * Map to track timeouts for toast removal
 */
const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Adds a toast to the removal queue with a delay
 * @param toastId - The ID of the toast to remove
 */
const addToRemoveQueue = (toastId: string): void => {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
};

/**
 * Reducer function for managing toast state
 * @param state - Current toast state
 * @param action - Action to perform
 * @returns Updated toast state
 */
export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };

    case "DISMISS_TOAST": {
      const { toastId } = action;

      // Side effects - This could be extracted into a dismissToast() action,
      // but kept here for simplicity
      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id);
        });
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      };
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
};

/**
 * List of state change listeners
 */
const listeners: Array<(state: State) => void> = [];

/**
 * In-memory state that persists across hook instances
 */
let memoryState: State = { toasts: [] };

/**
 * Dispatches an action to update the toast state
 * @param action - The action to dispatch
 */
function dispatch(action: Action): void {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

/**
 * Properties for creating a new toast
 */
export type Toast = Omit<ToasterToast, "id">;

/**
 * Creates and displays a new toast notification
 * @param props - Toast properties
 * @returns Object with methods to manipulate the created toast
 */
export function toast(props: Toast) {
  const id = genId();

  /**
   * Updates an existing toast with new properties
   * @param props - New properties to apply to the toast
   */
  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    });

  /**
   * Dismisses the toast
   */
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  return {
    id,
    dismiss,
    update,
  };
}

/**
 * Return value of the useToast hook
 */
export interface UseToastResult {
  /** Array of active toasts */
  toasts: ToasterToast[];
  /** Function to create a new toast */
  toast: typeof toast;
  /** Function to dismiss a toast by ID, or all toasts if no ID is provided */
  dismiss: (toastId?: string) => void;
}

/**
 * Custom hook for managing toast notifications
 * 
 * @example
 * ```tsx
 * import { useToast } from "@/hooks/ui/useToast";
 * 
 * function ToastDemo() {
 *   const { toast } = useToast();
 * 
 *   return (
 *     <Button
 *       onClick={() => {
 *         toast({
 *           title: "Success",
 *           description: "Your action was completed successfully",
 *           variant: "success",
 *         });
 *       }}
 *     >
 *       Show Toast
 *     </Button>
 *   );
 * }
 * ```
 * 
 * @returns Object with methods to create and manage toasts
 */
export function useToast(): UseToastResult {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}
