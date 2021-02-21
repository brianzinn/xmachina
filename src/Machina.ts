import { Nullable } from "./index";

/**
 * Current state and transitions to other states.
 */
export type MachinaState<S, E, T extends Transition<S, E>> = {
  /**
   * Current machina state
   */
  current: S,
  /**
   * All transitions (edges) to other states, if any.
   */
  possibleTransitions: T[]
}

export type Transition<S, E> = {
  /**
   * Name to uniquely (from this state) identify the transition (not needed to be unique across other states)
   */
  edge: E
  /**
   * Description of the transition (optional)
   */
  description?: string
  /**
   * State machina will be in after this transition
   */
  nextState: S
  /**
   * Optional method to call when this edge is traversed (to next state)
   */
  onTraversal?: () => Promise<void>
}

export interface IMachina<S, E, T extends Transition<S, E>> {
  /**
   * Edge to follow from current state to another state (edge is the input that triggers a transition).
   */
  transition: (edge: E) => Nullable<MachinaState<S, E, T>>

  /**
   * Current machine state (includes transitions out of current state, if any)
   */
  readonly state: MachinaState<S, E, T>
}

export type NodeState<S, E, T extends Transition<S, E>> = {
  onEnter?: () => Promise<void>
  onLeave?: () => Promise<void>
  outEdges: T[]
}

export class Machina<S, E, T extends Transition<S, E>> implements IMachina<S, E, T> {
  private currentState: S;
  constructor(initialState: S, private stateMap: Map<S, NodeState<S, E, T>>) {
    this.currentState = initialState;

    const currentNodeState: NodeState<S, E, T> | undefined = this.stateMap.get(this.currentState);
    if (currentNodeState !== undefined && currentNodeState.onEnter) {
      currentNodeState.onEnter();
    }
  }

  get state(): MachinaState<S, E, T> {
    return {
      current: this.currentState,
      possibleTransitions: this.stateMap.get(this.currentState)!.outEdges
    }
  }

  transition = (edge: E) => {
    const nodeState: NodeState<S, E, T> = (this.stateMap.get(this.currentState))!;
    const match: T | undefined = nodeState.outEdges.find(t => t.edge === edge);
    if (match === undefined) {
      return null;
    } else {
      // TOD: match.onTraversal(...)
      const nextState: NodeState<S, E, T> = this.stateMap.get(match.nextState)!;
      if (nextState.onEnter) {
        // TODO: move async out and await here?
        nextState.onEnter();
      }
      this.currentState = match.nextState;
      const result: MachinaState<S, E, T> = {
        current: match.nextState,
        possibleTransitions: nextState.outEdges
      }
      return result;
    }
  }
}