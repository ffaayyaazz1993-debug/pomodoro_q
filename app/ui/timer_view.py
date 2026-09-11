"""
Pomodoro Application - Timer View
"""
import logging
from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QPushButton, QLabel,
    QComboBox, QFrame
)
from PySide6.QtCore import Qt, QTimer
from PySide6.QtGui import QFont, QPainter, QColor, QPen

from app.core.timer_engine import TimerEngine
from app.database import Database
from app.models import TimerState, TimerMode
from app.utils import format_time

logger = logging.getLogger("pomodoro_app.timer_view")


class TimerView(QWidget):
    """Timer view with circular progress indicator"""
    
    def __init__(self, db: Database, timer_engine: TimerEngine):
        super().__init__()
        self.db = db
        self.timer_engine = timer_engine
        
        self._setup_ui()
        
        # Connect to timer updates
        self.timer_engine.set_on_tick(self._update_display)
        self.timer_engine.set_on_state_change(self._update_display)
    
    def _setup_ui(self):
        """Setup UI"""
        layout = QVBoxLayout(self)
        layout.setContentsMargins(40, 40, 40, 40)
        
        # Mode selector
        mode_layout = QHBoxLayout()
        mode_layout.addStretch()
        
        self.mode_combo = QComboBox()
        self.mode_combo.addItems(["Focus", "Short Break", "Long Break"])
        self.mode_combo.currentIndexChanged.connect(self._on_mode_changed)
        self.mode_combo.setStyleSheet("""
            QComboBox {
                padding: 8px 16px;
                font-size: 14px;
                min-width: 150px;
            }
        """)
        mode_layout.addWidget(self.mode_combo)
        mode_layout.addStretch()
        
        layout.addLayout(mode_layout)
        layout.addSpacing(40)
        
        # Circular timer display
        self.timer_display = CircularTimerDisplay()
        layout.addWidget(self.timer_display, alignment=Qt.AlignmentFlag.AlignCenter)
        
        layout.addSpacing(30)
        
        # Task label
        self.task_label = QLabel("No task selected")
        self.task_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.task_label.setStyleSheet("color: #6b7280; font-size: 14px;")
        layout.addWidget(self.task_label)
        
        layout.addSpacing(30)
        
        # Control buttons
        button_layout = QHBoxLayout()
        button_layout.addStretch()
        
        self.reset_btn = QPushButton("Reset")
        self.reset_btn.clicked.connect(self.timer_engine.reset)
        self.reset_btn.setStyleSheet("""
            QPushButton {
                background-color: #f3f4f6;
                color: #374151;
                padding: 12px 24px;
                font-size: 14px;
                border-radius: 8px;
            }
            QPushButton:hover {
                background-color: #e5e7eb;
            }
        """)
        button_layout.addWidget(self.reset_btn)
        
        self.start_pause_btn = QPushButton("Start")
        self.start_pause_btn.clicked.connect(self._toggle_timer)
        self.start_pause_btn.setStyleSheet("""
            QPushButton {
                background-color: #6366f1;
                color: white;
                padding: 12px 32px;
                font-size: 16px;
                font-weight: 600;
                border-radius: 8px;
                min-width: 120px;
            }
            QPushButton:hover {
                background-color: #4f46e5;
            }
        """)
        button_layout.addWidget(self.start_pause_btn)
        
        self.skip_btn = QPushButton("Skip")
        self.skip_btn.clicked.connect(self.timer_engine.skip)
        self.skip_btn.setStyleSheet("""
            QPushButton {
                background-color: #f3f4f6;
                color: #374151;
                padding: 12px 24px;
                font-size: 14px;
                border-radius: 8px;
            }
            QPushButton:hover {
                background-color: #e5e7eb;
            }
        """)
        button_layout.addWidget(self.skip_btn)
        
        button_layout.addStretch()
        layout.addLayout(button_layout)
        
        layout.addStretch()
        
        # Initial update
        self._update_display()
    
    def _toggle_timer(self):
        """Toggle timer start/pause/resume"""
        if self.timer_engine.is_idle:
            self.timer_engine.start()
        elif self.timer_engine.is_running:
            self.timer_engine.pause()
        elif self.timer_engine.is_paused:
            self.timer_engine.resume()
    
    def _on_mode_changed(self, index: int):
        """Handle mode change"""
        modes = [TimerMode.FOCUS, TimerMode.SHORT_BREAK, TimerMode.LONG_BREAK]
        if index < len(modes):
            self.timer_engine.set_mode(modes[index])
    
    def _update_display(self, *args):
        """Update timer display"""
        # Update circular display
        self.timer_display.set_time(
            self.timer_engine.remaining_seconds,
            self.timer_engine.total_seconds,
            self.timer_engine.mode
        )
        
        # Update button text
        if self.timer_engine.is_running:
            self.start_pause_btn.setText("Pause")
        elif self.timer_engine.is_paused:
            self.start_pause_btn.setText("Resume")
        else:
            self.start_pause_btn.setText("Start")
        
        # Update mode combo
        mode_index = {
            TimerMode.FOCUS: 0,
            TimerMode.SHORT_BREAK: 1,
            TimerMode.LONG_BREAK: 2,
        }.get(self.timer_engine.mode, 0)
        self.mode_combo.setCurrentIndex(mode_index)


class CircularTimerDisplay(QWidget):
    """Circular timer display with progress ring"""
    
    def __init__(self):
        super().__init__()
        self.setFixedSize(300, 300)
        
        self.remaining_seconds = 0
        self.total_seconds = 0
        self.mode = TimerMode.FOCUS
    
    def set_time(self, remaining: int, total: int, mode: TimerMode):
        """Set timer values"""
        self.remaining_seconds = remaining
        self.total_seconds = total
        self.mode = mode
        self.update()
    
    def paintEvent(self, event):
        """Paint circular timer"""
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        
        # Center and radius
        center_x = self.width() // 2
        center_y = self.height() // 2
        radius = 130
        
        # Background circle
        pen = QPen(QColor("#e5e7eb"))
        pen.setWidth(12)
        painter.setPen(pen)
        painter.drawArc(
            center_x - radius, center_y - radius,
            radius * 2, radius * 2,
            0, 360 * 16
        )
        
        # Progress circle
        if self.total_seconds > 0:
            progress = (self.total_seconds - self.remaining_seconds) / self.total_seconds
            angle = int(progress * 360 * 16)
            
            # Color based on mode
            if self.mode == TimerMode.FOCUS:
                color = QColor("#6366f1")
            elif self.mode == TimerMode.SHORT_BREAK:
                color = QColor("#10b981")
            else:
                color = QColor("#06b6d4")
            
            pen = QPen(color)
            pen.setWidth(12)
            pen.setCapStyle(Qt.PenCapStyle.RoundCap)
            painter.setPen(pen)
            painter.drawArc(
                center_x - radius, center_y - radius,
                radius * 2, radius * 2,
                90 * 16, -angle
            )
        
        # Time text
        painter.setPen(QColor("#111827"))
        font = QFont("Arial", 48, QFont.Weight.Bold)
        painter.setFont(font)
        time_text = format_time(self.remaining_seconds)
        painter.drawText(
            self.rect(),
            Qt.AlignmentFlag.AlignCenter,
            time_text
        )
        
        # Mode text
        painter.setPen(QColor("#6b7280"))
        font = QFont("Arial", 14)
        painter.setFont(font)
        mode_text = {
            TimerMode.FOCUS: "Focus",
            TimerMode.SHORT_BREAK: "Short Break",
            TimerMode.LONG_BREAK: "Long Break",
        }.get(self.mode, "Focus")
        
        mode_rect = self.rect()
        mode_rect.setTop(center_y + 40)
        painter.drawText(mode_rect, Qt.AlignmentFlag.AlignHCenter | Qt.AlignmentFlag.AlignTop, mode_text)
        
        painter.end()
