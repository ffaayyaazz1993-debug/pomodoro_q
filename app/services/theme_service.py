"""
Pomodoro Application - Theme Service
"""
import logging
from typing import Optional

logger = logging.getLogger("pomodoro_app.theme")


class ThemeService:
    """Theme management service"""
    
    LIGHT_STYLESHEET = """
        QMainWindow {
            background-color: #f9fafb;
        }
        QWidget {
            background-color: #ffffff;
            color: #111827;
        }
        QPushButton {
            background-color: #6366f1;
            color: white;
            border: none;
            border-radius: 8px;
            padding: 8px 16px;
            font-weight: 500;
        }
        QPushButton:hover {
            background-color: #4f46e5;
        }
        QPushButton:pressed {
            background-color: #4338ca;
        }
        QPushButton:disabled {
            background-color: #d1d5db;
            color: #9ca3af;
        }
        QLineEdit, QTextEdit, QPlainTextEdit {
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 8px;
            color: #111827;
        }
        QLineEdit:focus, QTextEdit:focus {
            border: 2px solid #6366f1;
        }
        QComboBox {
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 8px;
            color: #111827;
        }
        QComboBox:hover {
            border: 1px solid #d1d5db;
        }
        QComboBox::drop-down {
            border: none;
            width: 30px;
        }
        QCheckBox {
            spacing: 8px;
            color: #374151;
        }
        QCheckBox::indicator {
            width: 18px;
            height: 18px;
            border: 2px solid #d1d5db;
            border-radius: 4px;
            background-color: white;
        }
        QCheckBox::indicator:checked {
            background-color: #6366f1;
            border: 2px solid #6366f1;
        }
        QTabWidget::pane {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            background-color: white;
        }
        QTabBar::tab {
            background-color: #f3f4f6;
            border: 1px solid #e5e7eb;
            border-bottom: none;
            border-top-left-radius: 8px;
            border-top-right-radius: 8px;
            padding: 8px 16px;
            margin-right: 2px;
        }
        QTabBar::tab:selected {
            background-color: white;
            border-bottom: 2px solid #6366f1;
        }
        QScrollBar:vertical {
            background-color: #f9fafb;
            width: 12px;
            border-radius: 6px;
        }
        QScrollBar::handle:vertical {
            background-color: #d1d5db;
            border-radius: 6px;
            min-height: 20px;
        }
        QScrollBar::handle:vertical:hover {
            background-color: #9ca3af;
        }
    """
    
    DARK_STYLESHEET = """
        QMainWindow {
            background-color: #111827;
        }
        QWidget {
            background-color: #1f2937;
            color: #f9fafb;
        }
        QPushButton {
            background-color: #6366f1;
            color: white;
            border: none;
            border-radius: 8px;
            padding: 8px 16px;
            font-weight: 500;
        }
        QPushButton:hover {
            background-color: #818cf8;
        }
        QPushButton:pressed {
            background-color: #4f46e5;
        }
        QPushButton:disabled {
            background-color: #374151;
            color: #6b7280;
        }
        QLineEdit, QTextEdit, QPlainTextEdit {
            background-color: #374151;
            border: 1px solid #4b5563;
            border-radius: 8px;
            padding: 8px;
            color: #f9fafb;
        }
        QLineEdit:focus, QTextEdit:focus {
            border: 2px solid #818cf8;
        }
        QComboBox {
            background-color: #374151;
            border: 1px solid #4b5563;
            border-radius: 8px;
            padding: 8px;
            color: #f9fafb;
        }
        QComboBox:hover {
            border: 1px solid #6b7280;
        }
        QComboBox::drop-down {
            border: none;
            width: 30px;
        }
        QCheckBox {
            spacing: 8px;
            color: #d1d5db;
        }
        QCheckBox::indicator {
            width: 18px;
            height: 18px;
            border: 2px solid #6b7280;
            border-radius: 4px;
            background-color: #374151;
        }
        QCheckBox::indicator:checked {
            background-color: #6366f1;
            border: 2px solid #6366f1;
        }
        QTabWidget::pane {
            border: 1px solid #4b5563;
            border-radius: 8px;
            background-color: #1f2937;
        }
        QTabBar::tab {
            background-color: #374151;
            border: 1px solid #4b5563;
            border-bottom: none;
            border-top-left-radius: 8px;
            border-top-right-radius: 8px;
            padding: 8px 16px;
            margin-right: 2px;
        }
        QTabBar::tab:selected {
            background-color: #1f2937;
            border-bottom: 2px solid #818cf8;
        }
        QScrollBar:vertical {
            background-color: #1f2937;
            width: 12px;
            border-radius: 6px;
        }
        QScrollBar::handle:vertical {
            background-color: #4b5563;
            border-radius: 6px;
            min-height: 20px;
        }
        QScrollBar::handle:vertical:hover {
            background-color: #6b7280;
        }
    """
    
    def __init__(self, theme: str = "system"):
        self.theme = theme
        logger.info(f"Theme service initialized (theme={theme})")
    
    def get_stylesheet(self) -> str:
        """Get stylesheet for current theme"""
        if self.theme == "light":
            return self.LIGHT_STYLESHEET
        elif self.theme == "dark":
            return self.DARK_STYLESHEET
        else:  # system
            # Detect system theme
            try:
                from PySide6.QtGui import QPalette
                from PySide6.QtWidgets import QApplication
                from PySide6.QtCore import Qt
                
                app = QApplication.instance()
                if app:
                    palette = app.palette()
                    # Check if dark theme
                    bg_color = palette.color(QPalette.ColorRole.Window)
                    brightness = (bg_color.red() * 299 + bg_color.green() * 587 + bg_color.blue() * 114) / 1000
                    if brightness < 128:
                        return self.DARK_STYLESHEET
            except Exception as e:
                logger.debug(f"Failed to detect system theme: {e}")
            
            return self.LIGHT_STYLESHEET
    
    def set_theme(self, theme: str):
        """Set theme (light, dark, or system)"""
        self.theme = theme
        logger.info(f"Theme set to {theme}")
    
    def apply_theme(self, widget):
        """Apply current theme to a widget"""
        stylesheet = self.get_stylesheet()
        widget.setStyleSheet(stylesheet)
