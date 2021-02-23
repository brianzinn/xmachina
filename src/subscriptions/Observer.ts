import { Nullable } from "../index";
import { EventData } from "./EventData";
import { EventState } from "./EventState";
import { NotificationType } from "./NotificationType";

/**
 * Represent an Observer registered to a given Observable object.
 */
export class Observer<S, T> {
  /** @hidden */
  public willBeUnregistered = false;
  /**
   * Gets or sets a property defining that the observer as to be unregistered after the next notification
   */
  public unregisterOnNextCall = false;

  /**
   * Creates a new observer
   * @param next defines the callback to call when the observer is notified
   * @param notificationType defines what events the observer will receive (used to filter notifications)
   * @param value further optional filter that can restrict to a specific state or transition (node or edge).  Should not be used with NotifyOn.All
   */
  constructor(
      /**
       * Defines the callback to call when the observer is notified
       */
      public next: (eventData: EventData<S | T>, eventState: EventState) => void,
      /**
       * Defines the kind of notifications to subscribe for the observer (used to filter notifications)
       * default: All event types
       */
      public notificationType: NotificationType,
      /**
       * Further filter based on the values (should be used only when you have filtered specifically by state or transition - ie: not All)
       */
      public valueFilter: Nullable<S | T>
      ) {
  }
}