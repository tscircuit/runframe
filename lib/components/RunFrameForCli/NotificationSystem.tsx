import React, { useState, useEffect } from "react"
import ReactMarkdown from "react-markdown"
import { X } from "lucide-react"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "../ui/alert-dialog"
import { Button } from "../ui/button"

export interface Notification {
  id: string
  title: string
  contentMd?: string
  createdAt: Date
  read: boolean
  timeout?: number
}

interface NotificationSystemProps {
  notifications: Notification[]
  onDismiss: (id: string) => void
  onMarkAsRead: (id: string) => void
  onClearAll: () => void
}

export const NotificationSystem: React.FC<NotificationSystemProps> = ({
  notifications,
  onDismiss,
  onMarkAsRead,
  onClearAll,
}) => {
  const visibleToasts = notifications.filter((n) => !n.read).map((n) => n.id)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null)

  // Store timeouts in a ref to properly clean them up
  // Using number type instead of NodeJS.Timeout to avoid Symbol.dispose property issues
  const timeoutIdsRef = React.useRef<Record<string, number>>({})

  // Clean up all timeouts when component unmounts
  useEffect(() => {
    return () => {
      // Clear all timeouts when component unmounts
      Object.values(timeoutIdsRef.current).forEach(clearTimeout)
    }
  }, [])

  // Manage notification timeouts
  useEffect(() => {
    const currentVisibleIds = new Set(visibleToasts)

    // Set timeouts for new visible notifications
    notifications.forEach((notification) => {
      if (
        currentVisibleIds.has(notification.id) &&
        !timeoutIdsRef.current[notification.id]
      ) {
        const timeout = notification.timeout || 10000

        timeoutIdsRef.current[notification.id] = window.setTimeout(() => {
          console.log(`Timeout triggered for notification ${notification.id}`)
          onDismiss(notification.id)
          delete timeoutIdsRef.current[notification.id]
        }, timeout)
      }
    })

    // Cleanup timeouts for dismissed notifications
    Object.keys(timeoutIdsRef.current).forEach((id) => {
      if (!currentVisibleIds.has(id)) {
        clearTimeout(timeoutIdsRef.current[id])
        delete timeoutIdsRef.current[id]
      }
    })
  }, [notifications, visibleToasts])

  const handleToastClick = (notification: Notification) => {
    if (notification.contentMd) {
      setSelectedNotification(notification)
      onMarkAsRead(notification.id)
    }
    // State now managed through notifications context
  }

  const handleToastDismiss = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    onDismiss(id)
    // State now managed through notifications context
  }

  // Count unread notifications
  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="rf-absolute !rf-overflow-hidden border-2 border-red-600 rf-right-4 rf-bottom-4 rf-z-50 rf-flex rf-flex-col rf-gap-2">
      {/* Toast notifications */}
      <div className="rf-fixed rf-right-4 rf-bottom-20 rf-flex rf-flex-col rf-gap-2 rf-max-w-sm rf-w-full rf-pointer-events-none">
        {notifications
          .filter((notification) => !notification.read)
          .map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleToastClick(notification)}
              className={`
                rf-bg-white/95 rf-backdrop-blur-sm 
                rf-shadow-lg rf-rounded-lg 
                rf-p-4 rf-w-full 
                rf-transform rf-transition-all rf-duration-200
                rf-animate-in rf-fade-in rf-slide-in-from-right-5
                data-[state=closed]:rf-animate-out data-[state=closed]:rf-fade-out-0 data-[state=closed]:rf-slide-out-to-right-5
                rf-pointer-events-auto
                hover:rf-shadow-xl hover:rf-translate-x-[-2px]
                ${notification.contentMd ? "rf-cursor-pointer hover:rf-bg-gray-50/95" : ""}
              `}
              data-state={!notification.read ? "open" : "closed"}
            >
              <div className="rf-flex rf-flex-col rf-gap-1">
                <div className="rf-flex rf-justify-between rf-items-center">
                  <h4 className="rf-font-semibold rf-text-gray-900">
                    {notification.title}
                  </h4>
                  <button
                    className="rf-p-1 rf-rounded-full rf-text-gray-400 hover:rf-text-gray-600 hover:rf-bg-gray-100 rf-transition-colors"
                    onClick={(e) => handleToastDismiss(e, notification.id)}
                  >
                    <X className="rf-h-4 rf-w-4" />
                  </button>
                </div>
                {notification.contentMd && (
                  <p className="rf-text-xs rf-text-gray-500 rf-flex rf-items-center rf-gap-1">
                    <span>Click to expand</span>
                    <svg
                      className="rf-w-3 rf-h-3"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </p>
                )}
              </div>
            </div>
          ))}
      </div>

      {/* Notification bell icon with unread count */}
      <div className="rf-self-end rf-p-r-4">
        <button
          onClick={() => setIsHistoryOpen(true)}
          className="rf-bg-white rf-shadow-md rf-rounded-full rf-p-2 rf-flex rf-items-center rf-justify-center rf-relative"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
          {unreadCount > 0 && (
            <span className="rf-absolute rf-top-0 rf-right-0 rf-transform rf-bg-red-500 rf-text-white rf-rounded-full rf-text-xs rf-size-2 rf-flex rf-items-center rf-justify-center"></span>
          )}
        </button>
      </div>

      {/* Notification history dialog */}
      <AlertDialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <AlertDialogContent className="rf-max-w-md rf-w-full">
          <AlertDialogHeader>
            <AlertDialogTitle>Notifications</AlertDialogTitle>
            <AlertDialogDescription className="rf-text-sm rf-text-gray-500">
              View and manage your notification history.
            </AlertDialogDescription>
            <div className="rf-mt-2">
              {notifications.length === 0 ? (
                <div className="rf-text-center rf-py-4 rf-text-gray-500">
                  No notifications
                </div>
              ) : (
                <div className="rf-max-h-[50vh] rf-overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`rf-p-3 rf-mb-2 rf-rounded ${
                        notification.contentMd ? "rf-cursor-pointer" : ""
                      } ${
                        notification.read ? "rf-bg-gray-50" : "rf-bg-blue-50"
                      }`}
                      onClick={() => {
                        if (notification.contentMd) {
                          setSelectedNotification(notification)
                          onMarkAsRead(notification.id)
                        }
                      }}
                    >
                      <div className="rf-flex rf-justify-between rf-items-start">
                        <div className="rf-font-medium rf-text-sm">
                          {notification.title}
                        </div>
                        <button
                          className="rf-ml-2 rf-text-gray-400 hover:rf-text-gray-600"
                          onClick={(e) => {
                            e.stopPropagation()
                            onDismiss(notification.id)
                          }}
                        >
                          <X className="rf-h-4 rf-w-4" />
                        </button>
                      </div>
                      <div className="rf-text-xs rf-text-gray-500 rf-mt-1">
                        {notification.createdAt.toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="rf-flex rf-justify-between">
            {notifications.length > 0 && (
              <Button variant="outline" onClick={onClearAll}>
                Clear All
              </Button>
            )}
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Notification content dialog */}
      <AlertDialog
        open={!!selectedNotification}
        onOpenChange={(open) => !open && setSelectedNotification(null)}
      >
        {selectedNotification && (
          <AlertDialogContent className="rf-max-w-2xl rf-w-full rf-max-h-[80vh] rf-overflow-y-auto">
            <AlertDialogHeader>
              <AlertDialogTitle>{selectedNotification.title}</AlertDialogTitle>
              <AlertDialogDescription className="rf-sr-only">
                Detailed notification content
              </AlertDialogDescription>
              <div className="rf-mt-4">
                {selectedNotification.contentMd && (
                  <div className="rf-prose rf-prose-sm rf-max-w-none">
                    <ReactMarkdown>
                      {selectedNotification.contentMd}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Close</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>
    </div>
  )
}
