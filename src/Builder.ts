import { Machina, Transition } from "./Machina";

export interface IMachinaBuilder<S, T extends Transition<S>> {
  /**
   * Add state and list of possible transitions (can be called with same state, but name must be unique)
   * @param state State to include
   * @param transitions transition(s) from state to include
   */
  addState(state: S, transitions: T | T[]): IMachinaBuilder<S, T>
  /**
   * Return the state machine based on all states and transitions added.
   */
  build(): Machina<S, T>
}

export class MachinaBuilder<S, T extends Transition<S>> implements IMachinaBuilder<S, T> {
  private stateMap: Map<S, T[]> = new Map<S, T[]>();

  constructor(private initialState: S) {
  }

  addState = (state: S, transitions: T | T[]) => {
    const newTransitions: T[] = Array.isArray(transitions) ? transitions : [transitions];
    if(this.stateMap.has(state)) {
      this.stateMap.get(state)?.push(...newTransitions);
    } else {
      this.stateMap.set(state, newTransitions);
    }
    return this;
  };

  build = () => {
    return new Machina(this.initialState, this.stateMap);
  }
}

/**
 * Factory method to create a fluent/builder for a state type.
 * @param initialState Start state
 */
export const createMachina = <S, T extends Transition<S>>(initialState: S): IMachinaBuilder<S, T> => {
  return new MachinaBuilder<S, T>(initialState);
}
