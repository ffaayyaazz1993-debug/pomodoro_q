"""
Pomodoro Application - Projects View
"""
import logging
from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QPushButton, QLabel,
    QListWidget, QListWidgetItem, QFrame, QMessageBox
)
from PySide6.QtCore import Qt

from app.database import Database
from app.models import Project, ProjectStatus
from app.core.statistics_engine import StatisticsEngine

logger = logging.getLogger("pomodoro_app.projects_view")


class ProjectsView(QWidget):
    """Projects management view"""
    
    def __init__(self, db: Database):
        super().__init__()
        self.db = db
        
        self._setup_ui()
        self._load_projects()
    
    def _setup_ui(self):
        """Setup UI"""
        layout = QVBoxLayout(self)
        layout.setContentsMargins(32, 32, 32, 32)
        
        # Header
        header = QHBoxLayout()
        
        title = QLabel("Projects")
        title.setStyleSheet("font-size: 24px; font-weight: bold; color: #111827;")
        header.addWidget(title)
        
        header.addStretch()
        
        add_btn = QPushButton("+ New Project")
        add_btn.clicked.connect(self._add_project)
        header.addWidget(add_btn)
        
        layout.addLayout(header)
        layout.addSpacing(16)
        
        # Project list
        self.project_list = QListWidget()
        self.project_list.setStyleSheet("""
            QListWidget {
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                background-color: white;
            }
            QListWidget::item {
                padding: 16px;
                border-bottom: 1px solid #f3f4f6;
            }
            QListWidget::item:selected {
                background-color: #eef2ff;
            }
        """)
        layout.addWidget(self.project_list)
        
        # Action buttons
        action_layout = QHBoxLayout()
        
        edit_btn = QPushButton("Edit")
        edit_btn.clicked.connect(self._edit_project)
        action_layout.addWidget(edit_btn)
        
        delete_btn = QPushButton("Delete")
        delete_btn.clicked.connect(self._delete_project)
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
    
    def _load_projects(self):
        """Load projects from database"""
        self.project_list.clear()
        projects = self.db.get_all_projects()
        tasks = self.db.get_all_tasks()
        sessions = self.db.get_all_sessions()
        
        stats_engine = StatisticsEngine(sessions, tasks, projects)
        
        for project in projects:
            item = QListWidgetItem()
            item.setData(Qt.ItemDataRole.UserRole, project.id)
            
            stats = stats_engine.get_project_stats(project.id)
            
            text = f"{project.icon} {project.name}\n"
            text += f"{stats['tasks']} tasks • {stats['pomodoros']} pomodoros • {stats['focus_minutes']}m focus"
            
            item.setText(text)
            
            # Color indicator
            color_dot = f"● {project.color}"
            
            self.project_list.addItem(item)
    
    def _add_project(self):
        """Add a new project"""
        from app.ui.dialogs import ProjectDialog
        dialog = ProjectDialog(self.db, self)
        if dialog.exec():
            self._load_projects()
    
    def _edit_project(self):
        """Edit selected project"""
        current_item = self.project_list.currentItem()
        if not current_item:
            QMessageBox.warning(self, "No Selection", "Please select a project to edit.")
            return
        
        project_id = current_item.data(Qt.ItemDataRole.UserRole)
        project = self.db.get_project(project_id)
        
        if project:
            from app.ui.dialogs import ProjectDialog
            dialog = ProjectDialog(self.db, self, project)
            if dialog.exec():
                self._load_projects()
    
    def _delete_project(self):
        """Delete selected project"""
        current_item = self.project_list.currentItem()
        if not current_item:
            QMessageBox.warning(self, "No Selection", "Please select a project to delete.")
            return
        
        reply = QMessageBox.question(
            self,
            "Confirm Delete",
            "Are you sure you want to delete this project?",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No
        )
        
        if reply == QMessageBox.StandardButton.Yes:
            project_id = current_item.data(Qt.ItemDataRole.UserRole)
            self.db.delete_project(project_id)
            self._load_projects()
    
    def showEvent(self, event):
        """Refresh when shown"""
        super().showEvent(event)
        self._load_projects()
