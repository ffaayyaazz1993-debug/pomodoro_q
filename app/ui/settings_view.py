"""
Pomodoro Application - Settings View
"""
import logging
from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QFrame,
    QSpinBox, QCheckBox, QComboBox, QPushButton, QSlider,
    QTabWidget, QMessageBox
)
from PySide6.QtCore import Qt, Signal

from app.database import Database
from app.models import TimerSettings

logger = logging.getLogger("pomodoro_app.settings_view")


class SettingsView(QWidget):
    """Settings management view"""
    
    settings_changed = Signal()
    
    def __init__(self, db: Database, settings: TimerSettings):
        super().__init__()
        self.db = db
        self.settings = settings
        
        self._setup_ui()
        self._load_settings()
    
    def _setup_ui(self):
        """Setup UI"""
        layout = QVBoxLayout(self)
        layout.setContentsMargins(32, 32, 32, 32)
        
        # Title
        title = QLabel("Settings")
        title.setStyleSheet("font-size: 24px; font-weight: bold; color: #111827;")
        layout.addWidget(title)
        layout.addSpacing(20)
        
        # Tab widget
        tabs = QTabWidget()
        
        # Timer tab
        timer_tab = self._create_timer_tab()
        tabs.addTab(timer_tab, "Timer")
        
        # Appearance tab
        appearance_tab = self._create_appearance_tab()
        tabs.addTab(appearance_tab, "Appearance")
        
        # Sound tab
        sound_tab = self._create_sound_tab()
        tabs.addTab(sound_tab, "Sound")
        
        # Notifications tab
        notifications_tab = self._create_notifications_tab()
        tabs.addTab(notifications_tab, "Notifications")
        
        # Data tab
        data_tab = self._create_data_tab()
        tabs.addTab(data_tab, "Data")
        
        layout.addWidget(tabs)
        
        # Save button
        save_btn = QPushButton("Save Settings")
        save_btn.clicked.connect(self._save_settings)
        save_btn.setStyleSheet("""
            QPushButton {
                background-color: #6366f1;
                color: white;
                padding: 12px 32px;
                font-size: 14px;
                font-weight: 600;
                border-radius: 8px;
            }
            QPushButton:hover {
                background-color: #4f46e5;
            }
        """)
        layout.addWidget(save_btn, alignment=Qt.AlignmentFlag.AlignRight)
    
    def _create_timer_tab(self) -> QWidget:
        """Create timer settings tab"""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        
        # Focus duration
        focus_layout = QHBoxLayout()
        focus_layout.addWidget(QLabel("Focus Duration (minutes):"))
        self.focus_spin = QSpinBox()
        self.focus_spin.setRange(1, 120)
        self.focus_spin.setValue(25)
        focus_layout.addWidget(self.focus_spin)
        focus_layout.addStretch()
        layout.addLayout(focus_layout)
        
        # Short break
        short_layout = QHBoxLayout()
        short_layout.addWidget(QLabel("Short Break (minutes):"))
        self.short_break_spin = QSpinBox()
        self.short_break_spin.setRange(1, 30)
        self.short_break_spin.setValue(5)
        short_layout.addWidget(self.short_break_spin)
        short_layout.addStretch()
        layout.addLayout(short_layout)
        
        # Long break
        long_layout = QHBoxLayout()
        long_layout.addWidget(QLabel("Long Break (minutes):"))
        self.long_break_spin = QSpinBox()
        self.long_break_spin.setRange(1, 60)
        self.long_break_spin.setValue(15)
        long_layout.addWidget(self.long_break_spin)
        long_layout.addStretch()
        layout.addLayout(long_layout)
        
        # Long break interval
        interval_layout = QHBoxLayout()
        interval_layout.addWidget(QLabel("Long Break After (pomodoros):"))
        self.interval_spin = QSpinBox()
        self.interval_spin.setRange(2, 10)
        self.interval_spin.setValue(4)
        interval_layout.addWidget(self.interval_spin)
        interval_layout.addStretch()
        layout.addLayout(interval_layout)
        
        layout.addSpacing(20)
        
        # Auto-start options
        self.auto_short_break = QCheckBox("Auto-start short breaks")
        layout.addWidget(self.auto_short_break)
        
        self.auto_long_break = QCheckBox("Auto-start long breaks")
        layout.addWidget(self.auto_long_break)
        
        self.auto_focus = QCheckBox("Auto-start focus sessions")
        layout.addWidget(self.auto_focus)
        
        layout.addSpacing(20)
        
        # Warning
        self.warning_enabled = QCheckBox("Enable warning before completion")
        layout.addWidget(self.warning_enabled)
        
        warning_layout = QHBoxLayout()
        warning_layout.addWidget(QLabel("Warn (minutes) before:"))
        self.warning_minutes_spin = QSpinBox()
        self.warning_minutes_spin.setRange(1, 10)
        self.warning_minutes_spin.setValue(1)
        warning_layout.addWidget(self.warning_minutes_spin)
        warning_layout.addStretch()
        layout.addLayout(warning_layout)
        
        layout.addStretch()
        return widget
    
    def _create_appearance_tab(self) -> QWidget:
        """Create appearance settings tab"""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        
        theme_layout = QHBoxLayout()
        theme_layout.addWidget(QLabel("Theme:"))
        self.theme_combo = QComboBox()
        self.theme_combo.addItems(["system", "light", "dark"])
        theme_layout.addWidget(self.theme_combo)
        theme_layout.addStretch()
        layout.addLayout(theme_layout)
        
        layout.addStretch()
        return widget
    
    def _create_sound_tab(self) -> QWidget:
        """Create sound settings tab"""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        
        self.sound_enabled = QCheckBox("Enable sounds")
        layout.addWidget(self.sound_enabled)
        
        volume_layout = QHBoxLayout()
        volume_layout.addWidget(QLabel("Volume:"))
        self.volume_slider = QSlider(Qt.Orientation.Horizontal)
        self.volume_slider.setRange(0, 100)
        self.volume_slider.setValue(50)
        volume_layout.addWidget(self.volume_slider)
        layout.addLayout(volume_layout)
        
        layout.addStretch()
        return widget
    
    def _create_notifications_tab(self) -> QWidget:
        """Create notifications settings tab"""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        
        self.notifications_enabled = QCheckBox("Enable desktop notifications")
        layout.addWidget(self.notifications_enabled)
        
        layout.addStretch()
        return widget
    
    def _create_data_tab(self) -> QWidget:
        """Create data management tab"""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        
        # Export
        export_btn = QPushButton("Export Data (JSON)")
        export_btn.clicked.connect(self._export_data)
        layout.addWidget(export_btn)
        
        # Import
        import_btn = QPushButton("Import Data (JSON)")
        import_btn.clicked.connect(self._import_data)
        layout.addWidget(import_btn)
        
        layout.addSpacing(20)
        
        # Reset
        reset_btn = QPushButton("Reset All Data")
        reset_btn.clicked.connect(self._reset_data)
        reset_btn.setStyleSheet("""
            QPushButton {
                background-color: #fee2e2;
                color: #dc2626;
            }
            QPushButton:hover {
                background-color: #fecaca;
            }
        """)
        layout.addWidget(reset_btn)
        
        layout.addStretch()
        return widget
    
    def _load_settings(self):
        """Load settings into UI"""
        self.focus_spin.setValue(self.settings.focus_duration)
        self.short_break_spin.setValue(self.settings.short_break_duration)
        self.long_break_spin.setValue(self.settings.long_break_duration)
        self.interval_spin.setValue(self.settings.long_break_interval)
        
        self.auto_short_break.setChecked(self.settings.auto_start_short_break)
        self.auto_long_break.setChecked(self.settings.auto_start_long_break)
        self.auto_focus.setChecked(self.settings.auto_start_focus)
        
        self.warning_enabled.setChecked(self.settings.warning_enabled)
        self.warning_minutes_spin.setValue(self.settings.warning_minutes)
        
        self.theme_combo.setCurrentText(self.settings.theme)
        
        self.sound_enabled.setChecked(self.settings.sound_enabled)
        self.volume_slider.setValue(int(self.settings.sound_volume * 100))
        
        self.notifications_enabled.setChecked(self.settings.notifications_enabled)
    
    def _save_settings(self):
        """Save settings"""
        self.settings.focus_duration = self.focus_spin.value()
        self.settings.short_break_duration = self.short_break_spin.value()
        self.settings.long_break_duration = self.long_break_spin.value()
        self.settings.long_break_interval = self.interval_spin.value()
        
        self.settings.auto_start_short_break = self.auto_short_break.isChecked()
        self.settings.auto_start_long_break = self.auto_long_break.isChecked()
        self.settings.auto_start_focus = self.auto_focus.isChecked()
        
        self.settings.warning_enabled = self.warning_enabled.isChecked()
        self.settings.warning_minutes = self.warning_minutes_spin.value()
        
        self.settings.theme = self.theme_combo.currentText()
        
        self.settings.sound_enabled = self.sound_enabled.isChecked()
        self.settings.sound_volume = self.volume_slider.value() / 100.0
        
        self.settings.notifications_enabled = self.notifications_enabled.isChecked()
        
        self.db.save_settings(self.settings)
        self.settings_changed.emit()
        
        QMessageBox.information(self, "Settings Saved", "Settings have been saved successfully.")
    
    def get_settings(self) -> TimerSettings:
        """Get current settings"""
        return self.settings
    
    def _export_data(self):
        """Export data to JSON"""
        from PySide6.QtWidgets import QFileDialog
        import json
        
        file_path, _ = QFileDialog.getSaveFileName(
            self, "Export Data", "pomodoro_backup.json", "JSON Files (*.json)"
        )
        
        if file_path:
            data = self.db.export_all_data()
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, default=str)
            
            QMessageBox.information(self, "Export Complete", f"Data exported to {file_path}")
    
    def _import_data(self):
        """Import data from JSON"""
        from PySide6.QtWidgets import QFileDialog
        import json
        
        file_path, _ = QFileDialog.getOpenFileName(
            self, "Import Data", "", "JSON Files (*.json)"
        )
        
        if file_path:
            reply = QMessageBox.question(
                self,
                "Confirm Import",
                "This will replace all current data. Continue?",
                QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No
            )
            
            if reply == QMessageBox.StandardButton.Yes:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                success = self.db.import_all_data(data)
                if success:
                    QMessageBox.information(self, "Import Complete", "Data imported successfully.")
                else:
                    QMessageBox.critical(self, "Import Failed", "Failed to import data.")
    
    def _reset_data(self):
        """Reset all data"""
        reply = QMessageBox.question(
            self,
            "Confirm Reset",
            "This will delete ALL your data. This cannot be undone. Continue?",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No
        )
        
        if reply == QMessageBox.StandardButton.Yes:
            # This would need to be implemented in database
            QMessageBox.information(self, "Reset", "Data reset functionality not yet implemented.")
