import type { Session } from '../data/session';

export type SceneProps = {
  session: Session;
  onSessionChange: (patch: Partial<Session>) => void;
};
