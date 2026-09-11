"""
Pomodoro Application - Statistics View
"""
import logging
from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QFrame, QGridLayout, QComboBox
)
from PySide6.QtCore import Qt

from app.database import Database
from app.core.statistics_engine import StatisticsEngine
from app.utils import format_duration

logger = logging.getLogger("pomodoro_app.statistics_view")


class StatisticsView(QWidget):
    """Statistics and analytics view"""
    
    def __init__(self, db: Database):
        super().__init__()
        self.db = db
        
        self._setup_ui()
    
    def _setup_ui(self):
        """Setup UI"""
        layout = QVBoxLayout(self)
        layout.setContentsMargins(32, 32, 32, 32)
        
        # Header
        header = QHBoxLayout()
        
        title = QLabel("Statistics")
        title.setStyleSheet("font-size: 24px; font-weight: bold; color: #111827;")
        header.addWidget(title)
        
        header.addStretch()
        
        self.range_combo = QComboBox()
        self.range_combo.addItems(["7 days", "30 days", "90 days"])
        self.range_combo.currentTextChanged.connect(self._update_stats)
        header.addWidget(self.range_combo)
        
        layout.addLayout(header)
        layout.addSpacing(20)
        
        # Stats grid
        grid = QGridLayout()
        grid.setSpacing(16)
        
        # Total Pomodoros
        self.total_pomodoros_card = self._create_stat_card("Total Pomodoros", "0", "#6366f1")
        grid.addWidget(self.total_pomodoros_card, 0, 0)
        
        # Total Focus Time
        self.total_focus_card = self._create_stat_card("Total Focus Time", "0h", "#10b981")
        grid.addWidget(self.total_focus_card, 0, 1)
        
        # Longest Streak
        self.streak_card = self._create_stat_card("Longest Streak", "0 days", "#f59e0b")
        grid.addWidget(self.streak_card, 0, 2)
        
        # Completed Tasks
        self.tasks_card = self._create_stat_card("Completed Tasks", "0", "#8b5cf6")
        grid.addWidget(self.tasks_card, 1, 0)
        
        # Projects Completed
        self.projects_card = self._create_stat_card("Projects Completed", "0", "#06b6d4")
        grid.addWidget(self.projects_card, 1, 1)
        
        layout.addLayout(grid)
        layout.addSpacing(24)
        
        # Insights
        insights_frame = QFrame()
        insights_frame.setStyleSheet("""
            QFrame {
                background-color: #eef2ff;
                border-radius: 12px;
                padding: 20px;
            }
        """)
        insights_layout = QVBoxLayout(insights_frame)
        
        insights_title = QLabel("💡 Insights")
        insights_title.setStyleSheet("font-size: 16px; font-weight: 600; color: #4338ca;")
        insights_layout.addWidget(insights_title)
        
        self.insights_label = QLabel("Start tracking to see insights!")
        self.insights_label.setStyleSheet("color: #6366f1; font-size: 14px;")
        self.insights_label.setWordWrap(True)
        insights_layout.addWidget(self.insights_label)
        
        layout.addWidget(insights_frame)
        layout.addStretch()
    
    def _create_stat_card(self, title: str, value: str, color: str) -> QFrame:
        """Create a statistics card"""
        card = QFrame()
        card.setStyleSheet("""
            QFrame {
                background-color: white;
                border: 1px solid #e5e7eb;
                border-radius: 12px;
                padding: 20px;
            }
        """)
        
        layout = QVBoxLayout(card)
        
        title_label = QLabel(title)
        title_label.setStyleSheet("font-size: 12px; color: #6b7280;")
        layout.addWidget(title_label)
        
        value_label = QLabel(value)
        value_label.setStyleSheet(f"font-size: 32px; font-weight: bold; color: {color};")
        layout.addWidget(value_label)
        
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
        all_time_stats = stats_engine.get_all_time_stats()
        
        # Update cards
        self.total_pomodoros_card.value_label.setText(str(all_time_stats["total_pomodoros"]))
        self.total_focus_card.value_label.setText(f"{all_time_stats['total_focus_hours']}h")
        self.streak_card.value_label.setText(f"{all_time_stats['longest_streak']} days")
        self.tasks_card.value_label.setText(str(all_time_stats["completed_tasks"]))
        self.projects_card.value_label.setText(str(all_time_stats["projects_completed"]))
        
        # Update insights
        insights = stats_engine.get_insights()
        if insights:
            self.insights_label.setText("\n".join(f"• {insight}" for insight in insights))
        else:
            self.insights_label.setText("Start tracking to see insights!")
