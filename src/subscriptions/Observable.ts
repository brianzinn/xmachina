import { Nullable } from "../index";
import { EventData } from "./EventData";
import { EventState } from "./EventState";
import { NotificationType } from "./NotificationType";
import { Observer } from "./Observer";

/**
 * The Observable class is a simple implementation of the Observable pattern.  This is copied (and modified) from BabylonJS (permissive license) /src/Misc/observable.ts
 *
 * There's one slight particularity though: a given Observable can notify its observer using a particular mask value (notificationType or filterValue), only the Observers registered with these filters will be notified.
 * This enable a more fine grained execution without having to rely on multiple different Observable objects.
 * For instance our Observable has different types of notifications: State Enter (0x01), State Leave (0x02), Transition (0X04), All (0X08).
 * A given observer can register itself with only State Enter and Leave (0x03), then it will only be notified when one of these two occurs and will never be for Transition events.
 */
export class Observable<S, T> {
  // or enable "allow-leading-underscore"
  // tslint:disable-next-line:variable-name
  private _observers = new Array<Observer<S, T>>();
  // tslint:disable-next-line:variable-name
  private _eventState: EventState = {
    skipNextObservers: false
  };

  /**
   * Create a new Observer with the specified callback
   * @param callback the callback that will be executed for that Observer
   * @param notificationType the @see NotificationType used to filter observers
   * @param valueFilter further optional filtering of State/Transitions
   * @param insertFirst if true the callback will be inserted at the first position, hence executed before the others ones. If false (default behavior) the callback will be inserted at the last position, executed after all the others already present.
   * @returns the new observer created for the callback
   */
  public add(callback: (eventData: EventData<S | T>, eventState: EventState) => void, notificationType: NotificationType, valueFilter: Nullable<T | S>, insertFirst: boolean, unregisterOnFirstCall: boolean): Nullable<Observer<S, T>> {
    if (!callback) {
      return null;
    }

    const observer = new Observer<S, T>(callback, notificationType, valueFilter);
    observer.unregisterOnNextCall = (unregisterOnFirstCall === true);

    if (insertFirst === true) {
      this._observers.unshift(observer);
    } else {
      this._observers.push(observer);
    }

    return observer;
  }


  /**
   * Remove an Observer from the Observable object
   * @param observer the instance of the Observer to remove
   * @returns false if it doesn't belong to this Observable
   */
  public remove(observer: Nullable<Observer<S, T>>): boolean {
    if (!observer) {
      return false;
    }

    const index = this._observers.indexOf(observer);

    if (index !== -1) {
      this._deferUnregister(observer);
      return true;
    }

    return false;
  }

  /**
   * Remove a callback from the Observable object
   * @param callback the callback to remove
   * @returns false if it doesn't belong to this Observable
   */
  public removeCallback(callback: (eventData: EventData<unknown>, eventState: EventState) => void): boolean {
    for (const observer of this._observers) {
      if (observer.next === callback) {
        this._deferUnregister(observer);
        return true;
      }
    }

    return false;
  }

  private _deferUnregister(observer: Observer<S, T>): void {
    observer.willBeUnregistered = true;

    setTimeout(() => {
      this._remove(observer);
    }, 0);
  }

  // This should only be called when not iterating over _observers to avoid callback skipping.
  // Removes an observer from the _observer Array.
  private _remove(observer: Observer<S, T>): void {
    const index = this._observers.indexOf(observer);

    if (index !== -1) {
      this._observers.splice(index, 1);
    }
  }

  /**
   * Notify all Observers by calling their respective callback with the given data
   * Will return true if all observers were executed, false if an observer set skipNextObservers to true, then prevent the subsequent ones to execute
   * @param eventData defines the data to send to all observers
   * @param notificationType defines the mask of the current notification (observers with incompatible mask (ie mask & observer.mask === 0) will not be notified)
   * @param filterValue further value, which can optionally be filtered.
   * @returns false if the complete observer chain was not processed (because one observer set the skipNextObservers to true)
   */
  public notifyObservers(eventData: EventData<S | T>): boolean {
    if (!this._observers.length) {
      return true;
    }

    const state = this._eventState;
    state.skipNextObservers = false;

    for (const observer of this._observers) {
      if (observer.willBeUnregistered) {
        continue;
      }

      // tslint:disable-next-line:no-bitwise
      if ((observer.notificationType & eventData.notificationType) && (observer.valueFilter === null || (observer.valueFilter === eventData.value))) {
        // if (observer.scope) {
        //     state.lastReturnValue = observer.callback.apply(observer.scope, [eventData, state]);
        // } else {
        observer.next(eventData, state);

        if (observer.unregisterOnNextCall) {
          this._deferUnregister(observer);
        }
      }
      if (state.skipNextObservers) {
        return false;
      }
    }
    return true;
  }

  /**
   * Does this observable handles observer registered with a given mask
   * @param notificationType defines the notificationType to be tested
   * @return whether or not one observer registered with the given mask is handled
   */
  // public hasSpecificMask(notificationType: number = -1): boolean {
  //   for (const observer of this._observers) {
  //     // tslint:disable-next-line:no-bitwise
  //     if (observer.notificationType & notificationType || observer.notificationType === notificationType) {
  //       return true;
  //     }
  //   }
  //   return false;
  // }
}