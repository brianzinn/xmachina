/**
 * Right now only allows to notify that future observers should be skipped, but we likely want to allow an observer to block some events (ie: Transition)
 */
export type EventState = {
  /**
   * An Observer can set this property to true to prevent subsequent observers of being notified.
   * TODO: consider a cancellation with same functionality
   */
  skipNextObservers: boolean;
}