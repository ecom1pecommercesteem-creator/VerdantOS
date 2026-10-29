import { createContext } from 'react';
import type { Agent, AppData } from '../types';
import type { StoreActions } from './store';

export interface StoreValue {
  data: AppData;
  currentAgent: Agent | null; // null means nobody is signed in
  actions: StoreActions;
}

export const StoreContext = createContext<StoreValue | null>(null);
