import { createContext, useContext, useState, type ReactNode } from 'react';
import { ReferenceHub } from './ReferenceHub';
import type { ReferenceRequest } from '../data/references';

type ReferenceActions = { openHub: (request?: ReferenceRequest) => void };
const ReferenceContext = createContext<ReferenceActions>({ openHub: () => undefined });

export function ReferenceProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<ReferenceRequest | null>(null);
  const openHub = (next: ReferenceRequest = {}) => setRequest(next);
  return (
    <ReferenceContext.Provider value={{ openHub }}>
      {children}
      <ReferenceHub request={request} onClose={() => setRequest(null)} />
    </ReferenceContext.Provider>
  );
}

export function useReferenceHub() {
  return useContext(ReferenceContext);
}

export function ReferenceButton({ cardId, children }: { cardId?: string; children: ReactNode }) {
  const { openHub } = useReferenceHub();
  return <button type="button" className="reference-inline-button" onClick={() => openHub(cardId ? { cardId } : {})}>{children}</button>;
}
