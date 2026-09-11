"""
Pomodoro Application - History View
"""
import logging
from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QListWidget,
    QListWidgetItem, QComboBox, QPushButton, QFileDialog
)
from PySide6.QtCore import Qt

from app.database import Database
from app.models import TimerMode, SessionStatus
from app.utils import format_duration, format_datetime

logger = logging.getLogger("pomodoro_app.history_view")


class HistoryView(QWidget):
    """Session history view"""
    
    def __init__(self, db: Database):
        super().__init__()
        self.db = db
        
        self._setup_ui()
        self._load_sessions()
    
    def _setup_ui(self):
        """Setup UI"""
        layout = QVBoxLayout(self)
        layout.setContentsMargins(32, 32, 32, 32)
        
        # Header
        header = QHBoxLayout()
        
        title = QLabel("Session History")
        title.setStyleSheet("font-size: 24px; font-weight: bold; color: #111827;")
        header.addWidget(title)
        
        header.addStretch()
        
        export_btn = QPushButton("Export CSV")
        export_btn.clicked.connect(self._export_csv)
        header.addWidget(export_btn)
        
        layout.addLayout(header)
        layout.addSpacing(16)
        
        # Filters
        filter_layout = QHBoxLayout()
        
        self.mode_filter = QComboBox()
        self.mode_filter.addItems(["All Modes", "Focus", "Short Break", "Long Break"])
        self.mode_filter.currentTextChanged.connect(self._load_sessions)
        filter_layout.addWidget(self.mode_filter)
        
        self.status_filter = QComboBox()
        self.status_filter.addItems(["All Statuses", "Completed", "Skipped", "Abandoned"])
        self.status_filter.currentTextChanged.connect(self._load_sessions)
        filter_layout.addWidget(self.status_filter)
        
        filter_layout.addStretch()
        layout.addLayout(filter_layout)
        layout.addSpacing(16)
        
        # Session list
        self.session_list = QListWidget()
        self.session_list.setStyleSheet("""
            QListWidget {
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                background-color: white;
            }
            QListWidget::item {
                padding: 12px;
                border-bottom: 1px solid #f3f4f6;
            }
        """)
        layout.addWidget(self.session_list)
    
    def _load_sessions(self):
        """Load sessions from database"""
        self.session_list.clear()
        sessions = self.db.get_all_sessions(limit=500)
        
        mode_filter = self.mode_filter.currentText()
        status_filter = self.status_filter.currentText()
        
        for session in sessions:
            # Apply filters
            if mode_filter != "All Modes":
                mode_map = {"Focus": TimerMode.FOCUS, "Short Break": TimerMode.SHORT_BREAK, "Long Break": TimerMode.LONG_BREAK}
                if session.mode != mode_map.get(mode_filter):
                    continue
            
            if status_filter != "All Statuses":
                status_map = {"Completed": SessionStatus.COMPLETED, "Skipped": SessionStatus.SKIPPED, "Abandoned": SessionStatus.ABANDONED}
                if session.status != status_map.get(status_filter):
                    continue
            
            item = QListWidgetItem()
            
            mode_text = {
                TimerMode.FOCUS: "🍅 Focus",
                TimerMode.SHORT_BREAK: "☕ Short Break",
                TimerMode.LONG_BREAK: "🌴 Long Break",
            }.get(session.mode, "Unknown")
            
            status_icon = {
                SessionStatus.COMPLETED: "✓",
                SessionStatus.SKIPPED: "⏭",
                SessionStatus.ABANDONED: "⏹",
                SessionStatus.CANCELLED: "✗",
            }.get(session.status, "")
            
            duration = format_duration(session.actual_duration)
            date = format_datetime(session.start_time)
            
            text = f"{status_icon} {mode_text} - {duration} - {date}"
            item.setText(text)
            
            self.session_list.addItem(item)
    
    def _export_csv(self):
        """Export sessions to CSV"""
        file_path, _ = QFileDialog.getSaveFileName(
            self, "Export Sessions", "sessions.csv", "CSV Files (*.csv)"
        )
        
        if file_path:
            import csv
            sessions = self.db.get_all_sessions()
            
            with open(file_path, 'w', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                writer.writerow(["Date", "Mode", "Status", "Duration (min)", "Task", "Project"])
                
                for session in sessions:
                    writer.writerow([
                        session.start_time.strftime("%Y-%m-%d %H:%M"),
                        session.mode.value,
                        session.status.value,
                        session.actual_duration // 60,
                        session.task_id or "",
                        session.project_id or "",
                    ])
            
            from PySide6.QtWidgets import QMessageBox
            QMessageBox.information(self, "Export Complete", f"Sessions exported to {file_path}")
    
    def showEvent(self, event):
        """Refresh when shown"""
        super().showEvent(event)
        self._load_sessions()
