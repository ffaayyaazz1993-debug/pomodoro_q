"""
Pomodoro Application - Notification Service
"""
import logging
import sys
from typing import Optional

logger = logging.getLogger("pomodoro_app.notifications")


class NotificationService:
    """Desktop notification service using Qt's system tray notifications"""
    
    def __init__(self, enabled: bool = True):
        self.enabled = enabled
        self._system_tray = None
        logger.info(f"Notification service initialized (enabled={enabled})")
    
    def set_system_tray(self, tray):
        """Set system tray icon for notifications"""
        self._system_tray = tray
    
    def send_notification(self, title: str, message: str, icon: Optional[str] = None):
        """Send a desktop notification"""
        if not self.enabled:
            return
        
        try:
            if self._system_tray:
                from PySide6.QtWidgets import QSystemTrayIcon
                self._system_tray.showMessage(
                    title,
                    message,
                    QSystemTrayIcon.MessageIcon.Information,
                    5000  # 5 seconds
                )
                logger.info(f"Notification sent: {title}")
            else:
                # Fallback: try Windows toast notification
                if sys.platform == "win32":
                    self._send_windows_notification(title, message)
                else:
                    logger.warning("No notification method available")
        except Exception as e:
            logger.error(f"Failed to send notification: {e}")
    
    def _send_windows_notification(self, title: str, message: str):
        """Send Windows toast notification (fallback)"""
        try:
            from win10toast import ToastNotifier
            toaster = ToastNotifier()
            toaster.show_toast(title, message, duration=5, threaded=True)
        except ImportError:
            logger.debug("win10toast not available, skipping notification")
        except Exception as e:
            logger.error(f"Windows notification failed: {e}")
    
    def notify_pomodoro_complete(self, task_title: Optional[str] = None):
        """Notify that a pomodoro is complete"""
        title = "Pomodoro Complete!"
        message = "Time for a break. Great work!"
        if task_title:
            message = f'"{task_title}" - Time for a break!'
        self.send_notification(title, message)
    
    def notify_break_complete(self, task_title: Optional[str] = None):
        """Notify that a break is complete"""
        title = "Break Complete!"
        message = "Ready to focus again?"
        if task_title:
            message = f'"{task_title}" - Ready to focus again?'
        self.send_notification(title, message)
    
    def notify_goal_achieved(self, goal_description: str):
        """Notify that a goal is achieved"""
        self.send_notification("Goal Achieved!", goal_description)
    
    def notify_warning(self, minutes: int):
        """Notify about upcoming timer completion"""
        self.send_notification("Timer Warning", f"{minutes} minute{'s' if minutes != 1 else ''} remaining")
    
    def set_enabled(self, enabled: bool):
        """Enable or disable notifications"""
        self.enabled = enabled
        logger.info(f"Notifications {'enabled' if enabled else 'disabled'}")
