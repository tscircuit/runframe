import React from "react"
import { NotificationSystem } from "./NotificationSystem"
import { useNotifications } from "./NotificationContext"

export const NotificationSystemWrapper: React.FC = () => {
  const {
    notifications,
    dismissNotification,
    markAsRead,
    clearAllNotifications,
  } = useNotifications()

  return (
    <NotificationSystem
      notifications={notifications}
      onDismiss={dismissNotification}
      onMarkAsRead={markAsRead}
      onClearAll={clearAllNotifications}
    />
  )
}
