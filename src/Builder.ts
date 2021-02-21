import { Machina, NodeState, Transition } from "./Machina";

export interface IMachinaBuilder<S, E, T extends Transition<S, E>> {
  /**
   * Add state and list of possible transitions (can be called with same state, but name must be unique)
   * @param state State to include
   * @param transitions transition(s) from state to include
   */
  addState(state: S, transitions: T | T[], onEnter?: () => Promise<void>): IMachinaBuilder<S, E, T>
  /**
   * Return the state machine based on all states and transitions added.
   */
  build(): Machina<S, E, T>
}

/**
 * Machine builder.
 */
export class MachinaBuilder<S, E, T extends Transition<S, E>> implements IMachinaBuilder<S, E, T> {
  private stateMap: Map<S, NodeState<S, E, T>> = new Map<S, NodeState<S, E, T>>();

  constructor(private initialState: S) {
  }

  addState = (state: S, transitions: T | T[], onEnter?: () => Promise<void>) => {
    let nodeState: NodeState<S, E, T>;
    if(this.stateMap.has(state)) {
      nodeState = this.stateMap.get(state)!;
    } else {
      nodeState = {
        outEdges: []
      }
      this.stateMap.set(state, nodeState);
    }

    const newTransitions: T[] = Array.isArray(transitions) ? transitions : [transitions];
    nodeState.outEdges.push(...newTransitions);

    if (onEnter !== undefined) {
      if (nodeState.onEnter !== undefined) {
        // not the most useful error for non-string enums...
        console.warn(`overwriting state '${state}' onEnter (did you mean to use a transition.onEnter instead)`);
      }
      nodeState.onEnter = onEnter;
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
export const createMachina = <S, E>(initialState: S): IMachinaBuilder<S, E, Transition<S, E>> => {
  return new MachinaBuilder<S, E, Transition<S, E>>(initialState);
}
