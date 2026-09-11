"""
Pomodoro Application - Utility Functions
"""
import logging
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional


# ===== TIME UTILITIES =====

def format_time(seconds: int) -> str:
    """Format seconds as MM:SS"""
    mins = seconds // 60
    secs = seconds % 60
    return f"{mins:02d}:{secs:02d}"


def format_duration(seconds: int) -> str:
    """Format seconds as human-readable duration"""
    hours = seconds // 3600
    mins = (seconds % 3600) // 60
    if hours > 0:
        return f"{hours}h {mins}m"
    return f"{mins}m"


def format_duration_long(seconds: int) -> str:
    """Format seconds as full duration with seconds"""
    hours = seconds // 3600
    mins = (seconds % 3600) // 60
    secs = seconds % 60
    if hours > 0:
        return f"{hours}h {mins}m {secs}s"
    if mins > 0:
        return f"{mins}m {secs}s"
    return f"{secs}s"


def get_today_key() -> str:
    """Get today's date as YYYY-MM-DD string"""
    return datetime.now().strftime("%Y-%m-%d")


def get_days_ago(days: int) -> str:
    """Get date N days ago as YYYY-MM-DD string"""
    date = datetime.now() - timedelta(days=days)
    return date.strftime("%Y-%m-%d")


def get_date_range(days: int) -> tuple[str, str]:
    """Get start and end dates for a range"""
    end = get_today_key()
    start = get_days_ago(days - 1)
    return start, end


def get_streak_days(dates: list[str]) -> int:
    """Calculate current streak from list of date strings"""
    if not dates:
        return 0
    
    sorted_dates = sorted(set(dates), reverse=True)
    today = get_today_key()
    yesterday = get_days_ago(1)
    
    # Streak must include today or yesterday
    if sorted_dates[0] != today and sorted_dates[0] != yesterday:
        return 0
    
    streak = 1
    for i in range(1, len(sorted_dates)):
        prev_date = datetime.strptime(sorted_dates[i - 1], "%Y-%m-%d")
        curr_date = datetime.strptime(sorted_dates[i], "%Y-%m-%d")
        diff = (prev_date - curr_date).days
        if diff == 1:
            streak += 1
        else:
            break
    
    return streak


def minutes_to_seconds(minutes: int) -> int:
    """Convert minutes to seconds"""
    return minutes * 60


def seconds_to_minutes(seconds: int) -> int:
    """Convert seconds to minutes"""
    return seconds // 60


def get_progress_percentage(elapsed: int, total: int) -> float:
    """Calculate progress percentage"""
    if total == 0:
        return 0.0
    return min(100.0, max(0.0, (elapsed / total) * 100))


def get_relative_time(dt: datetime) -> str:
    """Get relative time string (e.g., '5m ago', '2h ago')"""
    now = datetime.now()
    diff = now - dt
    diff_mins = int(diff.total_seconds() / 60)
    diff_hours = int(diff.total_seconds() / 3600)
    diff_days = int(diff.total_seconds() / 86400)
    
    if diff_mins < 1:
        return "Just now"
    if diff_mins < 60:
        return f"{diff_mins}m ago"
    if diff_hours < 24:
        return f"{diff_hours}h ago"
    if diff_days < 7:
        return f"{diff_days}d ago"
    return dt.strftime("%b %d")


# ===== VALIDATION =====

def validate_duration(minutes: int, min_val: int = 1, max_val: int = 120) -> bool:
    """Validate timer duration"""
    return min_val <= minutes <= max_val


def validate_title(title: str) -> bool:
    """Validate task/project title"""
    return bool(title and title.strip())


def validate_date(date_str: Optional[str]) -> bool:
    """Validate date string format"""
    if not date_str:
        return True
    try:
        datetime.strptime(date_str, "%Y-%m-%d")
        return True
    except ValueError:
        return False


# ===== LOGGING CONFIGURATION =====

def setup_logging(log_dir: Optional[Path] = None, level: int = logging.INFO) -> logging.Logger:
    """Setup application logging"""
    if log_dir is None:
        log_dir = Path.home() / ".pomodoro_app" / "logs"
    
    log_dir.mkdir(parents=True, exist_ok=True)
    log_file = log_dir / "app.log"
    
    # Create logger
    logger = logging.getLogger("pomodoro_app")
    logger.setLevel(level)
    
    # Remove existing handlers
    logger.handlers.clear()
    
    # File handler with rotation
    from logging.handlers import RotatingFileHandler
    file_handler = RotatingFileHandler(
        log_file,
        maxBytes=5 * 1024 * 1024,  # 5MB
        backupCount=3,
        encoding="utf-8"
    )
    file_handler.setLevel(level)
    file_formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    file_handler.setFormatter(file_formatter)
    logger.addHandler(file_handler)
    
    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.WARNING)
    console_formatter = logging.Formatter("%(levelname)s: %(message)s")
    console_handler.setFormatter(console_formatter)
    logger.addHandler(console_handler)
    
    return logger


# ===== CONSTANTS =====

APP_NAME = "FocusFlow"
APP_VERSION = "1.0.0"
APP_AUTHOR = "Pomodoro App"

DEFAULT_FOCUS_DURATION = 25
DEFAULT_SHORT_BREAK = 5
DEFAULT_LONG_BREAK = 15
DEFAULT_LONG_BREAK_INTERVAL = 4

DATABASE_VERSION = 1
DATABASE_FILE = "pomodoro.db"

# Priority order for sorting
PRIORITY_ORDER = {
    "critical": 0,
    "high": 1,
    "medium": 2,
    "low": 3,
}

# Timer update interval in milliseconds
TIMER_UPDATE_INTERVAL = 200

# Project colors
PROJECT_COLORS = [
    "#6366f1",  # Indigo
    "#10b981",  # Emerald
    "#f59e0b",  # Amber
    "#ef4444",  # Red
    "#8b5cf6",  # Violet
    "#06b6d4",  # Cyan
    "#ec4899",  # Pink
    "#84cc16",  # Lime
]

# Project icons
PROJECT_ICONS = ["📁", "💻", "📝", "🎨", "📊", "🔬", "📚", "🎯", "🏗️", "🚀"]
