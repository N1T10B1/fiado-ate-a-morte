/**
 * Log de resolução. O motor produz o log; animação, áudio e UI apenas o reproduzem.
 * Tipos mínimos do Prompt Mestre + ARM_MULTIPLIER e NO_EFFECT, só informativos (D019).
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
  'ARM_MULTIPLIER',
  'NO_EFFECT',
  'END_NIGHT',
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

/** Limite defensivo de ativações processadas por noite. Truncar é defeito de design, não balanceamento. */
export const MAX_EVENTS_PER_NIGHT = 256;

export type NoEffectReason =
  | 'no_copy_source'
  | 'no_prior_gain'
  | 'no_skull'
  | 'no_wake_target'
  | 'no_sacrifice';

export type NightOutcome = 'complete' | 'curse_defeat' | 'truncated';

interface Base<T extends EventType> {
  readonly type: T;
  /** Sequência monotônica dentro da noite, começando em 0. */
  readonly seq: number;
}

export type GameEvent =
  | (Base<'START_NIGHT'> & { readonly night: number })
  | (Base<'ACTIVATE'> & { readonly sourceId: InstanceId; readonly byId: InstanceId | null })
  | (Base<'GAIN_CURRENCY'> & {
      readonly sourceId: InstanceId;
      readonly amount: number;
      readonly base: number;
      readonly abyssBonus: number;
      readonly doubledBy: InstanceId | null;
    })
  | (Base<'CHANGE_CURSE'> & { readonly sourceId: InstanceId; readonly delta: number; readonly curse: number })
  | (Base<'COPY_EFFECT'> & { readonly sourceId: InstanceId; readonly targetId: InstanceId; readonly amount: number })
  | (Base<'REPEAT_GAIN'> & { readonly sourceId: InstanceId; readonly amount: number })
  | (Base<'DESTROY'> & { readonly sourceId: InstanceId; readonly targetId: InstanceId })
  | (Base<'ARM_MULTIPLIER'> & { readonly sourceId: InstanceId })
  | (Base<'NO_EFFECT'> & { readonly sourceId: InstanceId; readonly reason: NoEffectReason })
  | (Base<'END_NIGHT'> & { readonly night: number; readonly outcome: NightOutcome });

/** Distribui Omit sobre a união (Omit simples colapsaria os campos específicos). */
export type EventInput = GameEvent extends infer E ? (E extends GameEvent ? Omit<E, 'seq'> : never) : never;
