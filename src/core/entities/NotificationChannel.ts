export interface AdminNotification {
  title: string;
  body: string;
  severity: "info" | "warning" | "critical";
  actionUrl?: string;
  signalId?: string;
}

export interface UserNotification {
  title: string;
  body: string;
  severity: "info" | "warning" | "critical";
  actionUrl?: string;
  userId?: string;
  scope?: "user";
}

export type AppNotification = AdminNotification | UserNotification;

export interface NotificationChannel {
  send(notification: AppNotification): Promise<void>;
}
