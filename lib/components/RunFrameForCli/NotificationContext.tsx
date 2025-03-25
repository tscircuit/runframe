import React, { createContext, useContext, useState, useEffect } from "react"
import { useEventHandler } from "./useEventHandler"
import type { Notification } from "./NotificationSystem"

interface NotificationContextType {
  notifications: Notification[]
  addNotification: (
    notification: Omit<Notification, "id" | "createdAt" | "read">,
  ) => void
  dismissNotification: (id: string) => void
  markAsRead: (id: string) => void
  clearAllNotifications: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
)

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider",
    )
  }
  return context
}

interface NotificationProviderProps {
  children: React.ReactNode
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const firstRenderTime = React.useMemo(() => Date.now(), [])

  // Listen for NOTIFICATION events
  useEventHandler((event) => {
    if (new Date(event.created_at).valueOf() < firstRenderTime + 500) return
    if (event.event_type === "NOTIFICATION") {
      addNotification({
        title: event.title,
        contentMd: event.contentMd,
        timeout: !event.timeout || event.timeout < 1000 ? 10000 : event.timeout, // Default 10 seconds if timeout is missing or less than 1s
      })
    }
  })

  const addNotification = (
    notification: Omit<Notification, "id" | "createdAt" | "read">,
  ) => {
    const newNotification: Notification = {
      id: crypto.randomUUID(),
      createdAt: new Date(),
      read: false,
      ...notification,
    }
    setNotifications((prev) => [newNotification, ...prev])
  }

  const dismissNotification = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification,
      ),
    )
  }

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification,
      ),
    )
  }

  const clearAllNotifications = () => {
    setNotifications([])
  }

  // Removed localStorage storage as per requirement

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        dismissNotification,
        markAsRead,
        clearAllNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}
