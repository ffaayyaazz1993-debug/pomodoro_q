"""
Pomodoro Application - Dashboard View
"""
import logging
from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QFrame, QGridLayout, QPushButton
)
from PySide6.QtCore import Qt

from app.core.timer_engine import TimerEngine
from app.database import Database
from app.core.statistics_engine import StatisticsEngine
from app.models import TimerMode, SessionStatus
from app.utils import format_time, format_duration

logger = logging.getLogger("pomodoro_app.dashboard")


class DashboardView(QWidget):
    """Dashboard with overview statistics"""
    
    def __init__(self, db: Database, timer_engine: TimerEngine):
        super().__init__()
        self.db = db
        self.timer_engine = timer_engine
        
        self._setup_ui()
    
    def _setup_ui(self):
        """Setup UI"""
        layout = QVBoxLayout(self)
        layout.setContentsMargins(32, 32, 32, 32)
        
        # Title
        title = QLabel("Dashboard")
        title.setStyleSheet("font-size: 24px; font-weight: bold; color: #111827;")
        layout.addWidget(title)
        layout.addSpacing(20)
        
        # Stats grid
        grid = QGridLayout()
        grid.setSpacing(16)
        
        # Today's Pomodoros
        self.pomodoros_card = self._create_stat_card(
            "🍅", "Today's Pomodoros", "0", "#6366f1"
        )
        grid.addWidget(self.pomodoros_card, 0, 0)
        
        # Focus Time
        self.focus_card = self._create_stat_card(
            "⏱️", "Focus Time", "0m", "#10b981"
        )
        grid.addWidget(self.focus_card, 0, 1)
        
        # Streak
        self.streak_card = self._create_stat_card(
            "🔥", "Streak", "0 days", "#f59e0b"
        )
        grid.addWidget(self.streak_card, 0, 2)
        
        # Tasks Completed
        self.tasks_card = self._create_stat_card(
            "✅", "Tasks Completed", "0", "#8b5cf6"
        )
        grid.addWidget(self.tasks_card, 1, 0)
        
        layout.addLayout(grid)
        layout.addSpacing(24)
        
        # Timer summary
        timer_frame = QFrame()
        timer_frame.setStyleSheet("""
            QFrame {
                background-color: #f9fafb;
                border-radius: 12px;
                padding: 20px;
            }
        """)
        timer_layout = QVBoxLayout(timer_frame)
        
        timer_title = QLabel("Current Timer")
        timer_title.setStyleSheet("font-size: 16px; font-weight: 600; color: #111827;")
        timer_layout.addWidget(timer_title)
        
        self.timer_info = QLabel("No active timer")
        self.timer_info.setStyleSheet("color: #6b7280; font-size: 14px;")
        timer_layout.addWidget(self.timer_info)
        
        layout.addWidget(timer_frame)
        layout.addStretch()
    
    def _create_stat_card(self, icon: str, title: str, value: str, color: str) -> QFrame:
        """Create a statistics card"""
        card = QFrame()
        card.setStyleSheet(f"""
            QFrame {{
                background-color: white;
                border: 1px solid #e5e7eb;
                border-radius: 12px;
                padding: 20px;
            }}
        """)
        
        layout = QVBoxLayout(card)
        
        # Icon and title
        header = QHBoxLayout()
        icon_label = QLabel(icon)
        icon_label.setStyleSheet("font-size: 24px;")
        header.addWidget(icon_label)
        
        title_label = QLabel(title)
        title_label.setStyleSheet("font-size: 12px; color: #6b7280;")
        header.addWidget(title_label)
        header.addStretch()
        
        layout.addLayout(header)
        
        # Value
        value_label = QLabel(value)
        value_label.setStyleSheet(f"font-size: 32px; font-weight: bold; color: {color};")
        layout.addWidget(value_label)
        
        # Store reference to value label for updates
        card.value_label = value_label
        
        return card
    
    def showEvent(self, event):
        """Update stats when shown"""
        super().showEvent(event)
        self._update_stats()
    
    def _update_stats(self):
        """Update statistics"""
        sessions = self.db.get_all_sessions()
        tasks = self.db.get_all_tasks()
        projects = self.db.get_all_projects()
        
        stats_engine = StatisticsEngine(sessions, tasks, projects)
        
        # Update cards
        pomodoros = stats_engine.get_today_pomodoros()
        self.pomodoros_card.value_label.setText(str(pomodoros))
        
        focus_minutes = stats_engine.get_today_focus_minutes()
        self.focus_card.value_label.setText(format_duration(focus_minutes * 60))
        
        streak = stats_engine.get_streak()
        self.streak_card.value_label.setText(f"{streak} days")
        
        completed_tasks = stats_engine.get_today_completed_tasks()
        self.tasks_card.value_label.setText(str(completed_tasks))
        
        # Update timer info
        if self.timer_engine.is_running or self.timer_engine.is_paused:
            mode_text = {
                TimerMode.FOCUS: "Focus",
                TimerMode.SHORT_BREAK: "Short Break",
                TimerMode.LONG_BREAK: "Long Break",
            }.get(self.timer_engine.mode, "Focus")
            
            time_text = format_time(self.timer_engine.remaining_seconds)
            status = "Running" if self.timer_engine.is_running else "Paused"
            
            self.timer_info.setText(f"{mode_text} - {time_text} ({status})")
        else:
            self.timer_info.setText("No active timer")
