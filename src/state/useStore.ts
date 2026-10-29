import { useContext } from 'react';
import { StoreContext, type StoreValue } from './storeContext';

export function useStore(): StoreValue {
  const value = useContext(StoreContext);
  if (!value) throw new Error('useStore must be used inside StoreProvider');
  return value;
}
