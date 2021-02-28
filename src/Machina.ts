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
  /**
   * Nested (sub) machinas belonging to current state.
   */
  nestedMachinas: IMachina<any, any, Transition<any, any>>[]
}

export type Transition<S, E> = {
  /**
   * Name to uniquely (from this state) identify the transition (not needed to be unique across other states)
   */
  on: E
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
  onTransition?: (machina: IMachina<S, E, Transition<S, E>>) => Promise<void>
}

const getEventData = <U>(notificationType: NotificationType, oldValue: Nullable<U>, newValue: U): EventData<U> => {
  const friendly = (nt: NotificationType): string => {
    if (nt === NotificationType.StateEnter) {
      return 'StateEnter'
    } else if (nt === NotificationType.StateLeave) {
      return 'StateLeave';
    } else {
      return 'Transition';
    }
  }

  return {
    notificationType,
    event: friendly(notificationType),
    value: {
      new: newValue,
      old: oldValue
    }
  }
}

export interface IMachina<S, E, T extends Transition<S, E>> {

  /**
   * Name of machina.
   */
  readonly name: string | undefined

  /**
   * if the machina has been started already.
   */
  readonly isStarted: boolean

  /**
   * Assigned automatically for nested hierarchies (when a machina state has it's own state machine)
   */
  parent: Nullable<IMachina<any, any, Transition<any, any>>>

  /**
   * Must be called before machina can perform any transitions.
   */
  start(): IMachina<S, E, T>

  /**
   * Edge to follow from current state to another state (transition is the input that triggers a transition).
   * Return the result of the transition (or null) instead of IMachine, so cannot be used fluently.
   *
   * @param transition The transition to follow from current state
   */
  transition(transition: E): Promise<Nullable<MachinaState<S, E, T>>>

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
  onEnter?: (nodeState: NodeState<S, E, T>, machina: IMachina<S, E, T>) => Promise<void>
  onLeave?: (nodeState: NodeState<S, E, T>, machina: IMachina<S, E, T>) => Promise<void>
  outEdges: T[]
  nestedMachinas?: IMachina<any, any, Transition<any, any>>[];
}

export class Machina<S, E, T extends Transition<S, E>> implements IMachina<S, E, T> {
  private currentState: S;
  private started = false;
  private machinaName: string | undefined;
  /**
   * Observable event triggered each time a transition or state change occurs.
   */
  private onEventObservable = new Observable<S, E>();

  public parent: Nullable<IMachina<any, any, Transition<any, any>>> = null;

  /**
   * Create a Machina directly (useMachina is the way to fluently build a machina)
   *
   * @param initialState State to start out in
   * @param stateMap Full Map containing all transitions
   * @param machinaName Optional - useful when there are multiple substates.
   */
  constructor(initialState: S, private stateMap: Map<S, NodeState<S, E, T>>, machinaName?: string) {
    this.currentState = initialState;
    this.machinaName = machinaName;

    // assign parent to nestedMachines
    this.stateMap.forEach((value: NodeState<S, E, T>) => {
      if (Array.isArray(value.nestedMachinas)) {
        for (const nestedMachina of value.nestedMachinas!) {
          nestedMachina.parent = this;
        }
      }
    });

    return this;
  }

  get name() { return this.machinaName; }

  get isStarted() { return this.started; }

  start(): IMachina<S, E, T> {
    const currentNodeState: NodeState<S, E, T> | undefined = this.stateMap.get(this.currentState);
    this.onEventObservable.notifyObservers(getEventData<S>(NotificationType.StateEnter, null, this.currentState));

    if (currentNodeState !== undefined && currentNodeState.onEnter) {
      currentNodeState.onEnter(currentNodeState, this);
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
    const nodeState: NodeState<S, E, T> = this.stateMap.get(this.currentState)!;
    return {
      current: this.currentState,
      nestedMachinas: nodeState.nestedMachinas ?? [],
      possibleTransitions: nodeState.outEdges,
    }
  }

  transition = async (transitionEdge: E): Promise<Nullable<MachinaState<S, E, T>>> => {
    if (!this.started) {
      throw new Error(`Must start() machina '${this.name}' before transition(...).`)
    }
    const nodeState: NodeState<S, E, T> = (this.stateMap.get(this.currentState))!;
    const transitionToFollow: T | undefined = nodeState.outEdges.find(t => t.on === transitionEdge);
    if (transitionToFollow === undefined) {
      return null;
    } else {
      // TODO: match.onTraversal(...)
      if (nodeState.onLeave) {
        await nodeState.onLeave(nodeState, this);
      }

      this.onEventObservable.notifyObservers(getEventData<S>(NotificationType.StateLeave, this.currentState, transitionToFollow.nextState));

      if (transitionToFollow.onTransition !== undefined) {
        await transitionToFollow.onTransition(this);
      }

      this.onEventObservable.notifyObservers(getEventData<E>(NotificationType.Transition, null, transitionToFollow.on));

      const nextState: NodeState<S, E, T> = this.stateMap.get(transitionToFollow.nextState)!;
      const previousState = this.currentState;
      this.currentState = transitionToFollow.nextState;

      if (nextState.onEnter) {
        await nextState.onEnter(nextState, this);
      }

      const result: MachinaState<S, E, T> = {
        current: transitionToFollow.nextState,
        nestedMachinas: nextState.nestedMachinas ?? [],
        possibleTransitions: nextState.outEdges
      }

      this.onEventObservable.notifyObservers(getEventData<S>(NotificationType.StateEnter, previousState, transitionToFollow.nextState));

      return result;
    }
  }
}