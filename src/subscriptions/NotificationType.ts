export enum NotificationType {
  /**
   * Should not be used
   */
  None = 0,
  /**
   * When a state is entered
   * NOTE: 0x001
   */
  StateEnter = 1,
  /**
   * When a state is left
   * NOTE: 0x010
   */
  // tslint:disable-next-line:no-bitwise
  StateLeave = 1 << 1,
  /**
   * When a transition occurs
   * NOTE: 0x0100
   */
  // tslint:disable-next-line:no-bitwise
  Transition = 1 << 2,
  /**
   * Includes state enter/leave/transition.  You need to use the event to determine what has occured.
   * NOTE: 0x0111
   */
  // tslint:disable-next-line:no-bitwise
  All = ~(~0 << 3)
}