"""
Pomodoro Application - Dialogs
"""
import logging
import uuid
from datetime import datetime
from PySide6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel, QLineEdit,
    QTextEdit, QComboBox, QSpinBox, QDialogButtonBox, QDateEdit,
    QFormLayout
)
from PySide6.QtCore import Qt, QDate

from app.database import Database
from app.models import Task, TaskStatus, TaskPriority, Project, ProjectStatus
from app.utils import validate_title, PROJECT_COLORS, PROJECT_ICONS

logger = logging.getLogger("pomodoro_app.dialogs")


class TaskDialog(QDialog):
    """Dialog for creating/editing tasks"""
    
    def __init__(self, db: Database, parent=None, task: Task = None):
        super().__init__(parent)
        self.db = db
        self.task = task
        
        self.setWindowTitle("Edit Task" if task else "New Task")
        self.setMinimumWidth(500)
        
        self._setup_ui()
        
        if task:
            self._load_task()
    
    def _setup_ui(self):
        """Setup UI"""
        layout = QVBoxLayout(self)
        
        form = QFormLayout()
        
        # Title
        self.title_input = QLineEdit()
        self.title_input.setPlaceholderText("Task title")
        form.addRow("Title:", self.title_input)
        
        # Description
        self.description_input = QTextEdit()
        self.description_input.setPlaceholderText("Description (optional)")
        self.description_input.setMaximumHeight(100)
        form.addRow("Description:", self.description_input)
        
        # Project
        self.project_combo = QComboBox()
        self.project_combo.addItem("No Project", None)
        projects = self.db.get_all_projects()
        for project in projects:
            self.project_combo.addItem(f"{project.icon} {project.name}", project.id)
        form.addRow("Project:", self.project_combo)
        
        # Priority
        self.priority_combo = QComboBox()
        self.priority_combo.addItems(["Low", "Medium", "High", "Critical"])
        form.addRow("Priority:", self.priority_combo)
        
        # Status
        self.status_combo = QComboBox()
        self.status_combo.addItems(["Not Started", "In Progress", "Completed", "Cancelled"])
        form.addRow("Status:", self.status_combo)
        
        # Estimated pomodoros
        self.estimated_spin = QSpinBox()
        self.estimated_spin.setRange(1, 50)
        self.estimated_spin.setValue(1)
        form.addRow("Estimated Pomodoros:", self.estimated_spin)
        
        # Due date
        self.due_date_edit = QDateEdit()
        self.due_date_edit.setCalendarPopup(True)
        self.due_date_edit.setDate(QDate.currentDate())
        form.addRow("Due Date:", self.due_date_edit)
        
        layout.addLayout(form)
        
        # Buttons
        buttons = QDialogButtonBox(
            QDialogButtonBox.StandardButton.Ok | QDialogButtonBox.StandardButton.Cancel
        )
        buttons.accepted.connect(self._save_task)
        buttons.rejected.connect(self.reject)
        layout.addWidget(buttons)
    
    def _load_task(self):
        """Load task data into form"""
        if not self.task:
            return
        
        self.title_input.setText(self.task.title)
        self.description_input.setPlainText(self.task.description)
        
        # Project
        if self.task.project_id:
            for i in range(self.project_combo.count()):
                if self.project_combo.itemData(i) == self.task.project_id:
                    self.project_combo.setCurrentIndex(i)
                    break
        
        # Priority
        priority_map = {
            TaskPriority.LOW: 0,
            TaskPriority.MEDIUM: 1,
            TaskPriority.HIGH: 2,
            TaskPriority.CRITICAL: 3,
        }
        self.priority_combo.setCurrentIndex(priority_map.get(self.task.priority, 1))
        
        # Status
        status_map = {
            TaskStatus.NOT_STARTED: 0,
            TaskStatus.IN_PROGRESS: 1,
            TaskStatus.COMPLETED: 2,
            TaskStatus.CANCELLED: 3,
        }
        self.status_combo.setCurrentIndex(status_map.get(self.task.status, 0))
        
        self.estimated_spin.setValue(self.task.estimated_pomodoros)
        
        if self.task.due_date:
            self.due_date_edit.setDate(QDate.fromString(self.task.due_date.strftime("%Y-%m-%d"), "yyyy-MM-dd"))
    
    def _save_task(self):
        """Save task"""
        title = self.title_input.text().strip()
        if not validate_title(title):
            from PySide6.QtWidgets import QMessageBox
            QMessageBox.warning(self, "Invalid Title", "Please enter a task title.")
            return
        
        priority_map = {
            0: TaskPriority.LOW,
            1: TaskPriority.MEDIUM,
            2: TaskPriority.HIGH,
            3: TaskPriority.CRITICAL,
        }
        
        status_map = {
            0: TaskStatus.NOT_STARTED,
            1: TaskStatus.IN_PROGRESS,
            2: TaskStatus.COMPLETED,
            3: TaskStatus.CANCELLED,
        }
        
        if self.task:
            # Update existing task
            self.task.title = title
            self.task.description = self.description_input.toPlainText()
            self.task.project_id = self.project_combo.currentData()
            self.task.priority = priority_map[self.priority_combo.currentIndex()]
            self.task.status = status_map[self.status_combo.currentIndex()]
            self.task.estimated_pomodoros = self.estimated_spin.value()
            
            qdate = self.due_date_edit.date()
            self.task.due_date = datetime(qdate.year(), qdate.month(), qdate.day())
            
            if self.task.status == TaskStatus.COMPLETED and not self.task.completed_at:
                self.task.completed_at = datetime.now()
            
            self.db.save_task(self.task)
        else:
            # Create new task
            qdate = self.due_date_edit.date()
            due_date = datetime(qdate.year(), qdate.month(), qdate.day())
            
            task = Task(
                id=str(uuid.uuid4()),
                title=title,
                description=self.description_input.toPlainText(),
                project_id=self.project_combo.currentData(),
                priority=priority_map[self.priority_combo.currentIndex()],
                status=status_map[self.status_combo.currentIndex()],
                estimated_pomodoros=self.estimated_spin.value(),
                due_date=due_date,
            )
            
            self.db.save_task(task)
        
        self.accept()


class ProjectDialog(QDialog):
    """Dialog for creating/editing projects"""
    
    def __init__(self, db: Database, parent=None, project: Project = None):
        super().__init__(parent)
        self.db = db
        self.project = project
        
        self.setWindowTitle("Edit Project" if project else "New Project")
        self.setMinimumWidth(500)
        
        self._setup_ui()
        
        if project:
            self._load_project()
    
    def _setup_ui(self):
        """Setup UI"""
        layout = QVBoxLayout(self)
        
        form = QFormLayout()
        
        # Name
        self.name_input = QLineEdit()
        self.name_input.setPlaceholderText("Project name")
        form.addRow("Name:", self.name_input)
        
        # Description
        self.description_input = QTextEdit()
        self.description_input.setPlaceholderText("Description (optional)")
        self.description_input.setMaximumHeight(100)
        form.addRow("Description:", self.description_input)
        
        # Icon
        self.icon_combo = QComboBox()
        for icon in PROJECT_ICONS:
            self.icon_combo.addItem(icon)
        form.addRow("Icon:", self.icon_combo)
        
        # Color
        self.color_combo = QComboBox()
        for color in PROJECT_COLORS:
            self.color_combo.addItem(f"● {color}", color)
        form.addRow("Color:", self.color_combo)
        
        # Goal pomodoros
        self.goal_spin = QSpinBox()
        self.goal_spin.setRange(0, 1000)
        self.goal_spin.setValue(0)
        form.addRow("Goal (Pomodoros):", self.goal_spin)
        
        layout.addLayout(form)
        
        # Buttons
        buttons = QDialogButtonBox(
            QDialogButtonBox.StandardButton.Ok | QDialogButtonBox.StandardButton.Cancel
        )
        buttons.accepted.connect(self._save_project)
        buttons.rejected.connect(self.reject)
        layout.addWidget(buttons)
    
    def _load_project(self):
        """Load project data into form"""
        if not self.project:
            return
        
        self.name_input.setText(self.project.name)
        self.description_input.setPlainText(self.project.description)
        
        # Icon
        if self.project.icon in PROJECT_ICONS:
            self.icon_combo.setCurrentIndex(PROJECT_ICONS.index(self.project.icon))
        
        # Color
        if self.project.color in PROJECT_COLORS:
            self.color_combo.setCurrentIndex(PROJECT_COLORS.index(self.project.color))
        
        self.goal_spin.setValue(self.project.goal_pomodoros)
    
    def _save_project(self):
        """Save project"""
        name = self.name_input.text().strip()
        if not validate_title(name):
            from PySide6.QtWidgets import QMessageBox
            QMessageBox.warning(self, "Invalid Name", "Please enter a project name.")
            return
        
        if self.project:
            # Update existing project
            self.project.name = name
            self.project.description = self.description_input.toPlainText()
            self.project.icon = PROJECT_ICONS[self.icon_combo.currentIndex()]
            self.project.color = PROJECT_COLORS[self.color_combo.currentIndex()]
            self.project.goal_pomodoros = self.goal_spin.value()
            
            self.db.save_project(self.project)
        else:
            # Create new project
            project = Project(
                id=str(uuid.uuid4()),
                name=name,
                description=self.description_input.toPlainText(),
                icon=PROJECT_ICONS[self.icon_combo.currentIndex()],
                color=PROJECT_COLORS[self.color_combo.currentIndex()],
                goal_pomodoros=self.goal_spin.value(),
            )
            
            self.db.save_project(project)
        
        self.accept()
