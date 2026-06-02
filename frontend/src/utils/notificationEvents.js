export const NOTIFICATIONS_UPDATED_EVENT = "ticketor:notifications-updated";

export function notifyNotificationsUpdated() {
  window.dispatchEvent(new Event(NOTIFICATIONS_UPDATED_EVENT));
}
