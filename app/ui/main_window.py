"""
Pomodoro Application - Main Window
"""
import logging
from typing import Optional

from PySide6.QtWidgets import (
    QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, QPushButton, 
    QLabel, QStackedWidget, QFrame, QShortcut, QMessageBox
)
from PySide6.QtCore import Qt, QTimer, Signal
from PySide6.QtGui import QKeySequence, QIcon

from app.core.timer_engine import TimerEngine
from app.database import Database
from app.models import TimerState, TimerMode, TimerSettings
from app.services import NotificationService, SoundService, ThemeService
from app.ui.dashboard import DashboardView
from app.ui.timer_view import TimerView
from app.ui.tasks_view import TasksView
from app.ui.projects_view import ProjectsView
from app.ui.statistics_view import StatisticsView
from app.ui.history_view import HistoryView
from app.ui.goals_view import GoalsView
from app.ui.settings_view import SettingsView
from app.utils import APP_NAME, APP_VERSION

logger = logging.getLogger("pomodoro_app.main_window")


class MainWindow(QMainWindow):
    """Main application window"""
    
    timer_tick = Signal()
    
    def __init__(self, db: Database):
        super().__init__()
        
        self.db = db
        self.settings = db.get_settings()
        
        # Initialize services
        self.notification_service = NotificationService(self.settings.notifications_enabled)
        self.sound_service = SoundService(self.settings.sound_enabled, self.settings.sound_volume)
        self.theme_service = ThemeService(self.settings.theme)
        
        # Initialize timer engine
        self.timer_engine = TimerEngine(self.settings)
        self.timer_engine.set_on_state_change(self._on_timer_state_change)
        self.timer_engine.set_on_tick(self._on_timer_tick)
        self.timer_engine.set_on_complete(self._on_timer_complete)
        self.timer_engine.set_on_warning(self._on_timer_warning)
        
        # Recover timer state
        timer_data = db.get_timer_data()
        if timer_data.state != TimerState.IDLE:
            self.timer_engine.recover_from_state(timer_data)
        
        # Setup UI
        self._setup_ui()
        self._setup_shortcuts()
        self._apply_theme()
        
        # Timer update
        self.timer_update = QTimer()
        self.timer_update.timeout.connect(self._update_timer)
        self.timer_update.start(200)  # Update every 200ms
        
        logger.info("Main window initialized")
    
    def _setup_ui(self):
        """Setup user interface"""
        self.setWindowTitle(f"{APP_NAME} v{APP_VERSION}")
        self.setMinimumSize(1000, 700)
        self.resize(1200, 800)
        
        # Central widget
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        
        # Main layout
        main_layout = QHBoxLayout(central_widget)
        main_layout.setContentsMargins(0, 0, 0, 0)
        main_layout.setSpacing(0)
        
        # Sidebar
        self.sidebar = self._create_sidebar()
        main_layout.addWidget(self.sidebar)
        
        # Content area
        self.content_area = QStackedWidget()
        main_layout.addWidget(self.content_area, 1)
        
        # Add views
        self.dashboard_view = DashboardView(self.db, self.timer_engine)
        self.timer_view = TimerView(self.db, self.timer_engine)
        self.tasks_view = TasksView(self.db)
        self.projects_view = ProjectsView(self.db)
        self.statistics_view = StatisticsView(self.db)
        self.history_view = HistoryView(self.db)
        self.goals_view = GoalsView(self.db)
        self.settings_view = SettingsView(self.db, self.settings)
        
        self.content_area.addWidget(self.dashboard_view)
        self.content_area.addWidget(self.timer_view)
        self.content_area.addWidget(self.tasks_view)
        self.content_area.addWidget(self.projects_view)
        self.content_area.addWidget(self.statistics_view)
        self.content_area.addWidget(self.history_view)
        self.content_area.addWidget(self.goals_view)
        self.content_area.addWidget(self.settings_view)
        
        # Show dashboard by default
        self.content_area.setCurrentWidget(self.dashboard_view)
        
        # Connect settings changes
        self.settings_view.settings_changed.connect(self._on_settings_changed)
    
    def _create_sidebar(self) -> QFrame:
        """Create sidebar navigation"""
        sidebar = QFrame()
        sidebar.setFixedWidth(200)
        sidebar.setStyleSheet("""
            QFrame {
                background-color: #f3f4f6;
                border-right: 1px solid #e5e7eb;
            }
        """)
        
        layout = QVBoxLayout(sidebar)
        layout.setContentsMargins(16, 16, 16, 16)
        layout.setSpacing(8)
        
        # Logo
        logo_label = QLabel("🍅 FocusFlow")
        logo_label.setStyleSheet("font-size: 18px; font-weight: bold; color: #111827;")
        layout.addWidget(logo_label)
        layout.addSpacing(20)
        
        # Navigation buttons
        nav_items = [
            ("Dashboard", self.dashboard_view),
            ("Timer", self.timer_view),
            ("Tasks", self.tasks_view),
            ("Projects", self.projects_view),
            ("Statistics", self.statistics_view),
            ("History", self.history_view),
            ("Goals", self.goals_view),
            ("Settings", self.settings_view),
        ]
        
        self.nav_buttons = []
        for label, view in nav_items:
            btn = QPushButton(label)
            btn.setCheckable(True)
            btn.setStyleSheet("""
                QPushButton {
                    text-align: left;
                    padding: 10px 16px;
                    border-radius: 8px;
                    background-color: transparent;
                    color: #374151;
                    font-weight: 500;
                    border: none;
                }
                QPushButton:hover {
                    background-color: #e5e7eb;
                }
                QPushButton:checked {
                    background-color: #6366f1;
                    color: white;
                }
            """)
            btn.clicked.connect(lambda checked, v=view: self._navigate_to(v))
            layout.addWidget(btn)
            self.nav_buttons.append(btn)
        
        # Select first button
        if self.nav_buttons:
            self.nav_buttons[0].setChecked(True)
        
        layout.addStretch()
        
        return sidebar
    
    def _navigate_to(self, view: QWidget):
        """Navigate to a view"""
        self.content_area.setCurrentWidget(view)
        
        # Update button states
        for i, btn in enumerate(self.nav_buttons):
            btn.setChecked(self.content_area.widget(i) == view)
    
    def _setup_shortcuts(self):
        """Setup keyboard shortcuts"""
        # Space - Start/Pause timer
        QShortcut(QKeySequence("Space"), self, self._toggle_timer)
        
        # R - Reset timer
        QShortcut(QKeySequence("R"), self, self.timer_engine.reset)
        
        # S - Skip timer
        QShortcut(QKeySequence("S"), self, self.timer_engine.skip)
        
        # Ctrl+1 - Dashboard
        QShortcut(QKeySequence("Ctrl+1"), self, lambda: self._navigate_to(self.dashboard_view))
        
        # Ctrl+2 - Tasks
        QShortcut(QKeySequence("Ctrl+2"), self, lambda: self._navigate_to(self.tasks_view))
        
        # Ctrl+3 - Statistics
        QShortcut(QKeySequence("Ctrl+3"), self, lambda: self._navigate_to(self.statistics_view))
        
        # Ctrl+, - Settings
        QShortcut(QKeySequence("Ctrl+,"), self, lambda: self._navigate_to(self.settings_view))
    
    def _toggle_timer(self):
        """Toggle timer start/pause"""
        if self.timer_engine.is_idle:
            self.timer_engine.start()
        elif self.timer_engine.is_running:
            self.timer_engine.pause()
        elif self.timer_engine.is_paused:
            self.timer_engine.resume()
    
    def _update_timer(self):
        """Update timer (called every 200ms)"""
        session = self.timer_engine.tick()
        
        # Persist timer state
        timer_data = self.timer_engine.get_state_for_persistence()
        self.db.save_timer_data(timer_data)
    
    def _on_timer_state_change(self, state: TimerState):
        """Handle timer state change"""
        logger.info(f"Timer state changed to {state.value}")
        
        # Persist state
        timer_data = self.timer_engine.get_state_for_persistence()
        self.db.save_timer_data(timer_data)
        
        # Update views
        self.timer_tick.emit()
    
    def _on_timer_tick(self, remaining: int):
        """Handle timer tick"""
        self.timer_tick.emit()
    
    def _on_timer_complete(self, mode: TimerMode):
        """Handle timer completion"""
        # Record session
        session = self.timer_engine.get_state_for_persistence()
        # Session is already created in timer engine
        
        # Play sound
        if mode == TimerMode.FOCUS:
            self.sound_service.play_completion_sound()
            self.notification_service.notify_pomodoro_complete()
        else:
            self.sound_service.play_break_sound()
            self.notification_service.notify_break_complete()
        
        # Auto-start logic
        if mode == TimerMode.FOCUS:
            if self.settings.auto_start_short_break or self.settings.auto_start_long_break:
                QTimer.singleShot(1000, self.timer_engine.start)
        else:
            if self.settings.auto_start_focus:
                QTimer.singleShot(1000, self.timer_engine.start)
        
        self.timer_tick.emit()
    
    def _on_timer_warning(self, remaining: int):
        """Handle timer warning"""
        minutes = remaining // 60
        self.sound_service.play_warning_sound()
        self.notification_service.notify_warning(minutes)
    
    def _on_settings_changed(self):
        """Handle settings changes"""
        self.settings = self.settings_view.get_settings()
        self.db.save_settings(self.settings)
        
        # Update services
        self.notification_service.set_enabled(self.settings.notifications_enabled)
        self.sound_service.set_enabled(self.settings.sound_enabled)
        self.sound_service.set_volume(self.settings.sound_volume)
        self.theme_service.set_theme(self.settings.theme)
        
        # Update timer engine
        self.timer_engine.update_settings(self.settings)
        
        # Apply theme
        self._apply_theme()
    
    def _apply_theme(self):
        """Apply current theme"""
        stylesheet = self.theme_service.get_stylesheet()
        self.setStyleSheet(stylesheet)
    
    def closeEvent(self, event):
        """Handle window close"""
        if self.settings.confirm_close and self.timer_engine.is_running:
            reply = QMessageBox.question(
                self,
                "Confirm Close",
                "Timer is running. Are you sure you want to close?",
                QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No,
                QMessageBox.StandardButton.No
            )
            
            if reply == QMessageBox.StandardButton.No:
                event.ignore()
                return
        
        # Save state
        timer_data = self.timer_engine.get_state_for_persistence()
        self.db.save_timer_data(timer_data)
        self.db.save_settings(self.settings)
        
        # Close database
        self.db.close()
        
        event.accept()
