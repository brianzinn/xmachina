import { Nullable } from "./index";
import { Observable } from "./subscriptions/Observable";
import { NotificationType } from './subscriptions/NotificationType';
import { Observer } from "./subscriptions/Observer";
import { EventData } from "./subscriptions/EventData";
import { EventState } from "./subscriptions/EventState";
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

  start(): IMachina<S, E, T>
  /**
   * Edge to follow from current state to another state (edge is the input that triggers a transition).
   * Return the result of the transition (or null) instead of IMachine, so cannot be used fluently.
   */
  transition(edge: E): Nullable<MachinaState<S, E, T>>

  /**
   * Current machine state (includes transitions out of current state, if any)
   */
  readonly state: MachinaState<S, E, T>

  /**
   * Subscribe a callback with optional filtering by NotificationType and value for notifications.
   *
   * @param callback Will be called when events occur and can optionally include filtering.
   * @param notificationType Only notify when this specific notification occurs (ie: State change, Transition followed) (defaults to All notificatons)
   * @param valueFilter Should not be used with All notifications, only makes sense when already filtering by Scene/Transition (defaults to null - not filtering)
   * @param insertFirst Should be inserted first and be notified before other already registered observers.  (defaults false)
   * @param nextNotificationOnly Only a single notification should occur.  Observer will automatically unsubscribe after first notification (default false)
   */
  subscribe(callback: (eventData: EventData<S | E>, eventState?: EventState) => void, notificationType?: NotificationType, valueFilter?: S | E, insertFirst?: boolean, nextNotificationOnly?: boolean): Nullable<Observer<S, E>>
  /**
   * Unregister an existing observer.
   * @param observer observer to unsubscribe from receiving further notifications.
   */
  unsubscribe(observer: Nullable<Observer<S, E>>): boolean

  /**
   * Unregister by the callback method from receiving further notifications.
   * @param callback callback method to unsubscribe
   */
  unsubscribeCallback(callback: (eventData: EventData<S | E>, eventState: EventState) => void): boolean
}

export type NodeState<S, E, T extends Transition<S, E>> = {
  onEnter?: () => Promise<void>
  onLeave?: () => Promise<void>
  outEdges: T[]
}

export class Machina<S, E, T extends Transition<S, E>> implements IMachina<S, E, T> {
  private currentState: S;
  private started = false;

  /**
   * Observable event triggered each time a transition or state change occurs.
   */
  private onEventObservable = new Observable<S, E>();

  constructor(initialState: S, private stateMap: Map<S, NodeState<S, E, T>>) {
    this.currentState = initialState;
    return this;
  }

  start(): IMachina<S, E, T> {
    const currentNodeState: NodeState<S, E, T> | undefined = this.stateMap.get(this.currentState);
    this.onEventObservable.notifyObservers({
      notificationType: NotificationType.StateEnter,
      value: this.currentState
    });
    if (currentNodeState !== undefined && currentNodeState.onEnter) {
      currentNodeState.onEnter();
    }
    this.started = true;
    return this;
  }

  subscribe(callback: (eventData: EventData<S | E>, eventState: EventState) => void, notificationType: NotificationType = NotificationType.All, valueFilter: Nullable<S | E> = null, insertFirst: boolean = false, nextNotificationOnly: boolean = false): Nullable<Observer<S, E>> {
    return this.onEventObservable.add(callback, notificationType, valueFilter, insertFirst, nextNotificationOnly);
  }

  unsubscribe(observer: Nullable<Observer<S, E>>): boolean {
    return this.onEventObservable.remove(observer);
  }

  unsubscribeCallback(callback: (eventData: EventData<S | E>, eventState: EventState) => void): boolean {
    return this.onEventObservable.removeCallback(callback);
  }

  get state(): MachinaState<S, E, T> {
    return {
      current: this.currentState,
      possibleTransitions: this.stateMap.get(this.currentState)!.outEdges
    }
  }

  transition = (edge: E) => {
    if (!this.started) {
      throw new Error('Must start() Machine before transition(...).')
    }
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

      this.onEventObservable.notifyObservers({
        notificationType: NotificationType.StateEnter,
        value: match.nextState
      });

      return result;
    }
  }
}