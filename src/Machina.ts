import { Nullable } from ".";

export type MachinaState<S, T extends Transition<S>> = {
  current: S,
  possibleTransitions: T[]
}

export type Transition<S> = {
  /**
   * Name to uniquely (from this state) identify the transition (not needed to be unique across other states)
   */
  name: string
  /**
   * Description of the transition (optional)
   */
  description?: string
  /**
   * State machina will be in after this transition
   */
  nextState: S
}

export interface IMachina<S, T extends Transition<S>> {
  transitionTo: (transition: T) => Nullable<MachinaState<S, T>>
  readonly state: MachinaState<S, T>
}

export class Machina<S, T extends Transition<S>> implements IMachina<S, T> {
  private currentState: S;
  constructor(initialState: S, private stateMap: Map<S, T[]>) {
    this.currentState = initialState;
  }

  get state(): MachinaState<S, T> {
    return {
      current: this.currentState,
      possibleTransitions: this.stateMap.get(this.currentState) ?? []
    }
  }

  transitionTo = (transition: T | string): Nullable<MachinaState<S, T>> => {
    const transitions: T[] = (this.stateMap.get(this.currentState))!;
    const transitionName: string = typeof(transition) === 'string' ? transition : transition.name;
    const match: T | undefined = transitions.find(t => t.name === transitionName);
    if (match === undefined) {
      return null;
    } else {
      this.currentState = match.nextState;
      const posssibleTransitions = this.stateMap.get(match.nextState);
      const result: MachinaState<S, T> = {
        current: match.nextState,
        possibleTransitions: posssibleTransitions ?? []
      }
      return result;
    }
  }
}