import type {
  AppNotification,
  NotificationChannel,
} from "@/core/entities/NotificationChannel";

export class NotificationDispatcher {
  constructor(private readonly channels: NotificationChannel[]) {}

  async dispatch(notification: AppNotification): Promise<void> {
    await Promise.allSettled(
      this.channels.map((ch) => ch.send(notification)),
    );
  }
}
