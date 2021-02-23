import { NotificationType } from "./NotificationType";

export type EventData<U> = {
  /**
   * ie: State on Enter/Leave or Transition
   */
  notificationType: NotificationType
  /**
   * For the state or transition the value
   */
  value: U
}