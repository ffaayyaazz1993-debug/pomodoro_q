"""
Pomodoro Application - Goals View
"""
import logging
import uuid
from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QPushButton, QLabel,
    QListWidget, QListWidgetItem, QFrame, QMessageBox, QComboBox,
    QSpinBox
)
from PySide6.QtCore import Qt

from app.database import Database
from app.models import Goal
from app.core.statistics_engine import StatisticsEngine

logger = logging.getLogger("pomodoro_app.goals_view")


class GoalsView(QWidget):
    """Goals management view"""
    
    def __init__(self, db: Database):
        super().__init__()
        self.db = db
        
        self._setup_ui()
        self._load_goals()
    
    def _setup_ui(self):
        """Setup UI"""
        layout = QVBoxLayout(self)
        layout.setContentsMargins(32, 32, 32, 32)
        
        # Header
        header = QHBoxLayout()
        
        title = QLabel("Goals")
        title.setStyleSheet("font-size: 24px; font-weight: bold; color: #111827;")
        header.addWidget(title)
        
        header.addStretch()
        
        add_btn = QPushButton("+ New Goal")
        add_btn.clicked.connect(self._add_goal)
        header.addWidget(add_btn)
        
        layout.addLayout(header)
        layout.addSpacing(16)
        
        # Streak card
        streak_frame = QFrame()
        streak_frame.setStyleSheet("""
            QFrame {
                background-color: #fef3c7;
                border-radius: 12px;
                padding: 20px;
            }
        """)
        streak_layout = QHBoxLayout(streak_frame)
        
        streak_icon = QLabel("🔥")
        streak_icon.setStyleSheet("font-size: 32px;")
        streak_layout.addWidget(streak_icon)
        
        streak_text = QVBoxLayout()
        self.streak_label = QLabel("0")
        self.streak_label.setStyleSheet("font-size: 32px; font-weight: bold; color: #92400e;")
        streak_text.addWidget(self.streak_label)
        
        streak_desc = QLabel("Day Streak")
        streak_desc.setStyleSheet("color: #92400e; font-size: 14px;")
        streak_text.addWidget(streak_desc)
        
        streak_layout.addLayout(streak_text)
        streak_layout.addStretch()
        
        layout.addWidget(streak_frame)
        layout.addSpacing(16)
        
        # Goals list
        self.goal_list = QListWidget()
        self.goal_list.setStyleSheet("""
            QListWidget {
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                background-color: white;
            }
            QListWidget::item {
                padding: 16px;
                border-bottom: 1px solid #f3f4f6;
            }
        """)
        layout.addWidget(self.goal_list)
        
        # Action buttons
        action_layout = QHBoxLayout()
        
        delete_btn = QPushButton("Delete")
        delete_btn.clicked.connect(self._delete_goal)
        delete_btn.setStyleSheet("""
            QPushButton {
                background-color: #fee2e2;
                color: #dc2626;
            }
            QPushButton:hover {
                background-color: #fecaca;
            }
        """)
        action_layout.addWidget(delete_btn)
        
        action_layout.addStretch()
        layout.addLayout(action_layout)
    
    def _load_goals(self):
        """Load goals from database"""
        self.goal_list.clear()
        goals = self.db.get_all_goals()
        
        sessions = self.db.get_all_sessions()
        tasks = self.db.get_all_tasks()
        projects = self.db.get_all_projects()
        stats_engine = StatisticsEngine(sessions, tasks, projects)
        
        # Update streak
        streak = stats_engine.get_streak()
        self.streak_label.setText(str(streak))
        
        for goal in goals:
            item = QListWidgetItem()
            item.setData(Qt.ItemDataRole.UserRole, goal.id)
            
            # Calculate progress
            if goal.type == "daily_pomodoros":
                current = stats_engine.get_today_pomodoros()
                label = "Pomodoros today"
            elif goal.type == "daily_focus_minutes":
                current = stats_engine.get_today_focus_minutes()
                label = "Focus minutes today"
            elif goal.type == "daily_tasks":
                current = stats_engine.get_today_completed_tasks()
                label = "Tasks completed today"
            else:
                current = 0
                label = goal.type
            
            progress = min(100, int((current / goal.target_value) * 100)) if goal.target_value > 0 else 0
            status = "✓" if progress >= 100 else f"{progress}%"
            
            text = f"{goal.type.replace('_', ' ').title()}: {current}/{goal.target_value} {label} - {status}"
            item.setText(text)
            
            if progress >= 100:
                item.setForeground(Qt.GlobalColor.darkGreen)
            
            self.goal_list.addItem(item)
    
    def _add_goal(self):
        """Add a new goal"""
        from PySide6.QtWidgets import QDialog, QFormLayout, QDialogButtonBox
        
        dialog = QDialog(self)
        dialog.setWindowTitle("New Goal")
        dialog.setMinimumWidth(400)
        
        layout = QFormLayout(dialog)
        
        type_combo = QComboBox()
        type_combo.addItems(["daily_pomodoros", "daily_focus_minutes", "daily_tasks", "weekly_pomodoros"])
        layout.addRow("Type:", type_combo)
        
        target_spin = QSpinBox()
        target_spin.setRange(1, 100)
        target_spin.setValue(8)
        layout.addRow("Target:", target_spin)
        
        buttons = QDialogButtonBox(QDialogButtonBox.StandardButton.Ok | QDialogButtonBox.StandardButton.Cancel)
        buttons.accepted.connect(dialog.accept)
        buttons.rejected.connect(dialog.reject)
        layout.addRow(buttons)
        
        if dialog.exec():
            goal = Goal(
                id=str(uuid.uuid4()),
                type=type_combo.currentText(),
                target_value=target_spin.value(),
            )
            self.db.save_goal(goal)
            self._load_goals()
    
    def _delete_goal(self):
        """Delete selected goal"""
        current_item = self.goal_list.currentItem()
        if not current_item:
            QMessageBox.warning(self, "No Selection", "Please select a goal to delete.")
            return
        
        reply = QMessageBox.question(
            self,
            "Confirm Delete",
            "Are you sure you want to delete this goal?",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No
        )
        
        if reply == QMessageBox.StandardButton.Yes:
            goal_id = current_item.data(Qt.ItemDataRole.UserRole)
            self.db.delete_goal(goal_id)
            self._load_goals()
    
    def showEvent(self, event):
        """Refresh when shown"""
        super().showEvent(event)
        self._load_goals()
