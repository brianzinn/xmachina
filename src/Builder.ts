import { IMachina, Machina, NodeState, Transition } from "./Machina";

type AddStateOptions<S, E, T extends Transition<S, E>> = {
  onEnter?: (nodeState: NodeState<S, E, T>, machina?: IMachina<S, E, T>) => Promise<void>,
  onLeave?: (nodeState: NodeState<S, E, T>, machina?: IMachina<S, E, T>) => Promise<void>,
  nestedMachinas?: IMachina<any, any, Transition<any, any>>[]
}

export interface IMachinaBuilder<S, E, T extends Transition<S, E>> {
  /**
   * Add state and list of possible transitions (can be called with same state, but name must be unique)
   * @param state State to include
   * @param transitions transition(s) from state to include
   * @param onEnter optional callback when state is entered
   * @param onLeave optional callback when state is left
   */
  addState(
    state: S,
    transitions: T | T[],
    options?: AddStateOptions<S, E, T>
  ): IMachinaBuilder<S, E, T>
  /**
   * Return the state machine based on all states and transitions added.
   */
  build(): IMachina<S, E, T>

  buildAndStart(): IMachina<S, E, T>
}

/**
 * Machine builder.
 */
export class MachinaBuilder<S, E, T extends Transition<S, E>> implements IMachinaBuilder<S, E, T> {
  private stateMap: Map<S, NodeState<S, E, T>> = new Map<S, NodeState<S, E, T>>();

  constructor(private initialState: S, private name?: string) {
  }

  addState = (state: S, transitions: T | T[], options?: AddStateOptions<S, E, T>) => {
    const { onEnter, onLeave, nestedMachinas } = options ?? {}
    let nodeState: NodeState<S, E, T>;
    if(this.stateMap.has(state)) {
      nodeState = this.stateMap.get(state)!;
    } else {
      nodeState = {
        outEdges: [],
        nestedMachinas: []
      }
      this.stateMap.set(state, nodeState);
    }
    if (Array.isArray(nestedMachinas)) {
      nodeState.nestedMachinas!.push(...nestedMachinas);
    }
    const newTransitions: T[] = Array.isArray(transitions) ? transitions : [transitions];
    nodeState.outEdges.push(...newTransitions);

    if (onEnter !== undefined) {
      if (nodeState.onEnter !== undefined) {
        // not the most useful error for non-string enums...
        console.warn(`overwriting state '${state}' onEnter (did you mean to use a transition callback instead?)`);
      }
      nodeState.onEnter = onEnter;
    }
    if (onLeave !== undefined) {
      if (nodeState.onLeave !== undefined) {
        // not the most useful error for non-string enums...
        console.warn(`overwriting state '${state}' onLeave (did you mean to use a transition callback instead?)`);
      }
      nodeState.onLeave = onLeave;
    }
    return this;
  };

  build = (): IMachina<S, E, T> => {
    return new Machina(this.initialState, this.stateMap, this.name);
  }

  buildAndStart = (): IMachina<S, E, T> => {
    return this.build().start();
  }
}

/**
 * Factory method to create a fluent/builder for a state type.
 * @param initialState Start state
 */
export const createMachina = <S, E>(initialState: S, name?: string): IMachinaBuilder<S, E, Transition<S, E>> => {
  return new MachinaBuilder<S, E, Transition<S, E>>(initialState, name);
}
