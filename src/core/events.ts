/**
 * Contrato do log de resolução (somente tipos em P1-001; o resolvedor chega em P1-002).
 * O motor produz o log; animação, áudio e UI apenas o reproduzem.
 */
import type { InstanceId } from './grid';

export const EVENT_TYPES = [
  'START_NIGHT',
  'ACTIVATE',
  'GAIN_CURRENCY',
  'CHANGE_CURSE',
  'COPY_EFFECT',
  'REPEAT_GAIN',
  'DESTROY',
  'END_NIGHT',
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

/** Limite defensivo de eventos processados por noite. Truncar é defeito de design, não balanceamento. */
export const MAX_EVENTS_PER_NIGHT = 256;

interface BaseEvent<T extends EventType> {
  readonly type: T;
  /** Sequência monotônica dentro da noite, começando em 0. */
  readonly seq: number;
  /** Evento que causou este, quando houver. */
  readonly causeSeq?: number;
}

export type GameEvent =
  | (BaseEvent<'START_NIGHT'> & { readonly night: number })
  | (BaseEvent<'ACTIVATE'> & { readonly sourceId: InstanceId })
  | (BaseEvent<'GAIN_CURRENCY'> & { readonly sourceId: InstanceId; readonly amount: number })
  | (BaseEvent<'CHANGE_CURSE'> & { readonly sourceId: InstanceId; readonly delta: number })
  | (BaseEvent<'COPY_EFFECT'> & { readonly sourceId: InstanceId; readonly targetId: InstanceId })
  | (BaseEvent<'REPEAT_GAIN'> & { readonly sourceId: InstanceId; readonly amount: number })
  | (BaseEvent<'DESTROY'> & { readonly sourceId: InstanceId; readonly targetId: InstanceId })
  | (BaseEvent<'END_NIGHT'> & { readonly night: number; readonly truncated: boolean });
