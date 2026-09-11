"""
Pomodoro Application - Tasks View
"""
import logging
import uuid
from datetime import datetime
from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QPushButton, QLabel,
    QLineEdit, QTextEdit, QComboBox, QListWidget, QListWidgetItem,
    QFrame, QMessageBox, QCheckBox
)
from PySide6.QtCore import Qt

from app.database import Database
from app.models import Task, TaskStatus, TaskPriority, Project
from app.utils import validate_title

logger = logging.getLogger("pomodoro_app.tasks_view")


class TasksView(QWidget):
    """Tasks management view"""
    
    def __init__(self, db: Database):
        super().__init__()
        self.db = db
        
        self._setup_ui()
        self._load_tasks()
    
    def _setup_ui(self):
        """Setup UI"""
        layout = QVBoxLayout(self)
        layout.setContentsMargins(32, 32, 32, 32)
        
        # Header
        header = QHBoxLayout()
        
        title = QLabel("Tasks")
        title.setStyleSheet("font-size: 24px; font-weight: bold; color: #111827;")
        header.addWidget(title)
        
        header.addStretch()
        
        add_btn = QPushButton("+ New Task")
        add_btn.clicked.connect(self._add_task)
        header.addWidget(add_btn)
        
        layout.addLayout(header)
        layout.addSpacing(16)
        
        # Filters
        filter_layout = QHBoxLayout()
        
        self.search_input = QLineEdit()
        self.search_input.setPlaceholderText("Search tasks...")
        self.search_input.textChanged.connect(self._filter_tasks)
        filter_layout.addWidget(self.search_input)
        
        self.status_filter = QComboBox()
        self.status_filter.addItems(["All", "Not Started", "In Progress", "Completed"])
        self.status_filter.currentTextChanged.connect(self._filter_tasks)
        filter_layout.addWidget(self.status_filter)
        
        layout.addLayout(filter_layout)
        layout.addSpacing(16)
        
        # Task list
        self.task_list = QListWidget()
        self.task_list.setStyleSheet("""
            QListWidget {
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                background-color: white;
            }
            QListWidget::item {
                padding: 12px;
                border-bottom: 1px solid #f3f4f6;
            }
            QListWidget::item:selected {
                background-color: #eef2ff;
            }
        """)
        layout.addWidget(self.task_list)
        
        # Action buttons
        action_layout = QHBoxLayout()
        
        complete_btn = QPushButton("Complete")
        complete_btn.clicked.connect(self._complete_task)
        action_layout.addWidget(complete_btn)
        
        delete_btn = QPushButton("Delete")
        delete_btn.clicked.connect(self._delete_task)
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
    
    def _load_tasks(self):
        """Load tasks from database"""
        self.task_list.clear()
        tasks = self.db.get_all_tasks()
        
        for task in tasks:
            item = QListWidgetItem()
            item.setData(Qt.ItemDataRole.UserRole, task.id)
            
            # Format task text
            status_icon = {
                TaskStatus.NOT_STARTED: "○",
                TaskStatus.IN_PROGRESS: "◐",
                TaskStatus.COMPLETED: "●",
                TaskStatus.CANCELLED: "✗",
            }.get(task.status, "○")
            
            priority_icon = {
                TaskPriority.LOW: "🔵",
                TaskPriority.MEDIUM: "🟡",
                TaskPriority.HIGH: "🟠",
                TaskPriority.CRITICAL: "🔴",
            }.get(task.priority, "")
            
            text = f"{status_icon} {priority_icon} {task.title}"
            if task.completed_pomodoros > 0:
                text += f" ({task.completed_pomodoros}/{task.estimated_pomodoros} 🍅)"
            
            item.setText(text)
            
            if task.status == TaskStatus.COMPLETED:
                item.setForeground(Qt.GlobalColor.gray)
            
            self.task_list.addItem(item)
    
    def _add_task(self):
        """Add a new task"""
        from app.ui.dialogs import TaskDialog
        dialog = TaskDialog(self.db, self)
        if dialog.exec():
            self._load_tasks()
    
    def _complete_task(self):
        """Mark selected task as complete"""
        current_item = self.task_list.currentItem()
        if not current_item:
            QMessageBox.warning(self, "No Selection", "Please select a task to complete.")
            return
        
        task_id = current_item.data(Qt.ItemDataRole.UserRole)
        task = self.db.get_task(task_id)
        
        if task:
            task.status = TaskStatus.COMPLETED
            task.completed_at = datetime.now()
            self.db.save_task(task)
            self._load_tasks()
    
    def _delete_task(self):
        """Delete selected task"""
        current_item = self.task_list.currentItem()
        if not current_item:
            QMessageBox.warning(self, "No Selection", "Please select a task to delete.")
            return
        
        reply = QMessageBox.question(
            self,
            "Confirm Delete",
            "Are you sure you want to delete this task?",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No
        )
        
        if reply == QMessageBox.StandardButton.Yes:
            task_id = current_item.data(Qt.ItemDataRole.UserRole)
            self.db.delete_task(task_id)
            self._load_tasks()
    
    def _filter_tasks(self):
        """Filter tasks based on search and status"""
        search_text = self.search_input.text().lower()
        status_filter = self.status_filter.currentText()
        
        tasks = self.db.get_all_tasks()
        
        for i in range(self.task_list.count()):
            item = self.task_list.item(i)
            task_id = item.data(Qt.ItemDataRole.UserRole)
            task = next((t for t in tasks if t.id == task_id), None)
            
            if not task:
                continue
            
            # Search filter
            if search_text and search_text not in task.title.lower():
                item.setHidden(True)
                continue
            
            # Status filter
            if status_filter != "All":
                status_map = {
                    "Not Started": TaskStatus.NOT_STARTED,
                    "In Progress": TaskStatus.IN_PROGRESS,
                    "Completed": TaskStatus.COMPLETED,
                }
                if task.status != status_map.get(status_filter):
                    item.setHidden(True)
                    continue
            
            item.setHidden(False)
    
    def showEvent(self, event):
        """Refresh tasks when shown"""
        super().showEvent(event)
        self._load_tasks()
