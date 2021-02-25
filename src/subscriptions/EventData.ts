import { Nullable } from "../index";
import { NotificationType } from "./NotificationType";

export type EventValues<U> = {
  old: Nullable<U>
  new: U
}

export type EventData<U> = {
  /**
   * ie: State on Enter/Leave or Transition (as enumeration)
   */
  notificationType: NotificationType
  /**
   * Friendly name for the notification (as string)
   */
  event: string
  /**
   * For the state or transition the old (if applicable) and new values
   */
  value: EventValues<U>
}