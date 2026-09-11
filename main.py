"""
Pomodoro Application - Main Entry Point
"""
import sys
import logging
from pathlib import Path

from PySide6.QtWidgets import QApplication
from PySide6.QtCore import Qt

from app.database import Database
from app.ui.main_window import MainWindow
from app.utils import setup_logging, APP_NAME


def main():
    """Main application entry point"""
    
    # Setup logging
    logger = setup_logging()
    logger.info(f"Starting {APP_NAME}")
    
    try:
        # Create Qt application
        app = QApplication(sys.argv)
        app.setApplicationName(APP_NAME)
        app.setApplicationVersion("1.0.0")
        
        # Initialize database
        db = Database()
        logger.info("Database initialized")
        
        # Create and show main window
        window = MainWindow(db)
        window.show()
        logger.info("Main window displayed")
        
        # Run application
        exit_code = app.exec()
        
        # Cleanup
        db.close()
        logger.info("Application closed")
        
        sys.exit(exit_code)
        
    except Exception as e:
        logger.critical(f"Application error: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
