"""
Pomodoro Application - Data Models and Enums
"""
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional


# ===== ENUMS =====

class TimerState(Enum):
    IDLE = "idle"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"


class TimerMode(Enum):
    FOCUS = "focus"
    SHORT_BREAK = "short_break"
    LONG_BREAK = "long_break"
    CUSTOM = "custom"


class TaskStatus(Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    ARCHIVED = "archived"


class TaskPriority(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ProjectStatus(Enum):
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class SessionStatus(Enum):
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    SKIPPED = "skipped"
    INTERRUPTED = "interrupted"
    ABANDONED = "abandoned"


# ===== DATA MODELS =====

@dataclass
class Task:
    id: str
    title: str
    description: str = ""
    project_id: Optional[str] = None
    priority: TaskPriority = TaskPriority.MEDIUM
    status: TaskStatus = TaskStatus.NOT_STARTED
    estimated_pomodoros: int = 1
    completed_pomodoros: int = 0
    due_date: Optional[datetime] = None
    created_at: datetime = field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None
    tags: list[str] = field(default_factory=list)
    notes: str = ""
    archived: bool = False

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "project_id": self.project_id,
            "priority": self.priority.value,
            "status": self.status.value,
            "estimated_pomodoros": self.estimated_pomodoros,
            "completed_pomodoros": self.completed_pomodoros,
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "created_at": self.created_at.isoformat(),
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "tags": self.tags,
            "notes": self.notes,
            "archived": self.archived,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "Task":
        return cls(
            id=data["id"],
            title=data["title"],
            description=data.get("description", ""),
            project_id=data.get("project_id"),
            priority=TaskPriority(data.get("priority", "medium")),
            status=TaskStatus(data.get("status", "not_started")),
            estimated_pomodoros=data.get("estimated_pomodoros", 1),
            completed_pomodoros=data.get("completed_pomodoros", 0),
            due_date=datetime.fromisoformat(data["due_date"]) if data.get("due_date") else None,
            created_at=datetime.fromisoformat(data["created_at"]) if data.get("created_at") else datetime.now(),
            completed_at=datetime.fromisoformat(data["completed_at"]) if data.get("completed_at") else None,
            tags=data.get("tags", []),
            notes=data.get("notes", ""),
            archived=data.get("archived", False),
        )


@dataclass
class Project:
    id: str
    name: str
    description: str = ""
    color: str = "#6366f1"
    icon: str = "📁"
    status: ProjectStatus = ProjectStatus.ACTIVE
    created_at: datetime = field(default_factory=datetime.now)
    goal_pomodoros: int = 0

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "color": self.color,
            "icon": self.icon,
            "status": self.status.value,
            "created_at": self.created_at.isoformat(),
            "goal_pomodoros": self.goal_pomodoros,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "Project":
        return cls(
            id=data["id"],
            name=data["name"],
            description=data.get("description", ""),
            color=data.get("color", "#6366f1"),
            icon=data.get("icon", "📁"),
            status=ProjectStatus(data.get("status", "active")),
            created_at=datetime.fromisoformat(data["created_at"]) if data.get("created_at") else datetime.now(),
            goal_pomodoros=data.get("goal_pomodoros", 0),
        )


@dataclass
class Session:
    id: str
    mode: TimerMode
    status: SessionStatus
    start_time: datetime
    end_time: Optional[datetime] = None
    planned_duration: int = 0  # seconds
    actual_duration: int = 0  # seconds
    paused_duration: int = 0  # seconds
    task_id: Optional[str] = None
    project_id: Optional[str] = None
    interruptions: int = 0
    notes: str = ""
    cycle_number: int = 1

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "mode": self.mode.value,
            "status": self.status.value,
            "start_time": self.start_time.isoformat(),
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "planned_duration": self.planned_duration,
            "actual_duration": self.actual_duration,
            "paused_duration": self.paused_duration,
            "task_id": self.task_id,
            "project_id": self.project_id,
            "interruptions": self.interruptions,
            "notes": self.notes,
            "cycle_number": self.cycle_number,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "Session":
        return cls(
            id=data["id"],
            mode=TimerMode(data["mode"]),
            status=SessionStatus(data["status"]),
            start_time=datetime.fromisoformat(data["start_time"]),
            end_time=datetime.fromisoformat(data["end_time"]) if data.get("end_time") else None,
            planned_duration=data.get("planned_duration", 0),
            actual_duration=data.get("actual_duration", 0),
            paused_duration=data.get("paused_duration", 0),
            task_id=data.get("task_id"),
            project_id=data.get("project_id"),
            interruptions=data.get("interruptions", 0),
            notes=data.get("notes", ""),
            cycle_number=data.get("cycle_number", 1),
        )


@dataclass
class Goal:
    id: str
    type: str  # daily_pomodoros, daily_focus_minutes, daily_tasks, weekly_pomodoros, weekly_focus_minutes
    target_value: int
    enabled: bool = True
    created_at: datetime = field(default_factory=datetime.now)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "type": self.type,
            "target_value": self.target_value,
            "enabled": self.enabled,
            "created_at": self.created_at.isoformat(),
        }

    @classmethod
    def from_dict(cls, data: dict) -> "Goal":
        return cls(
            id=data["id"],
            type=data["type"],
            target_value=data["target_value"],
            enabled=data.get("enabled", True),
            created_at=datetime.fromisoformat(data["created_at"]) if data.get("created_at") else datetime.now(),
        )


@dataclass
class TimerSettings:
    focus_duration: int = 25  # minutes
    short_break_duration: int = 5
    long_break_duration: int = 15
    long_break_interval: int = 4  # pomodoros until long break
    auto_start_short_break: bool = False
    auto_start_long_break: bool = False
    auto_start_focus: bool = False
    warning_enabled: bool = True
    warning_minutes: int = 1
    sound_enabled: bool = True
    sound_volume: float = 0.5
    notifications_enabled: bool = True
    theme: str = "system"  # light, dark, system
    always_on_top: bool = False
    minimize_to_tray: bool = True
    confirm_close: bool = True
    count_skipped_as_completed: bool = False

    def to_dict(self) -> dict:
        return {
            "focus_duration": self.focus_duration,
            "short_break_duration": self.short_break_duration,
            "long_break_duration": self.long_break_duration,
            "long_break_interval": self.long_break_interval,
            "auto_start_short_break": self.auto_start_short_break,
            "auto_start_long_break": self.auto_start_long_break,
            "auto_start_focus": self.auto_start_focus,
            "warning_enabled": self.warning_enabled,
            "warning_minutes": self.warning_minutes,
            "sound_enabled": self.sound_enabled,
            "sound_volume": self.sound_volume,
            "notifications_enabled": self.notifications_enabled,
            "theme": self.theme,
            "always_on_top": self.always_on_top,
            "minimize_to_tray": self.minimize_to_tray,
            "confirm_close": self.confirm_close,
            "count_skipped_as_completed": self.count_skipped_as_completed,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "TimerSettings":
        return cls(**{k: data[k] for k in data.keys() if k in cls.__dataclass_fields__})


@dataclass
class TimerData:
    state: TimerState = TimerState.IDLE
    mode: TimerMode = TimerMode.FOCUS
    remaining_seconds: int = 25 * 60
    total_seconds: int = 25 * 60
    start_timestamp: Optional[float] = None  # monotonic
    wall_clock_start: Optional[datetime] = None
    paused_duration: int = 0
    pause_start_timestamp: Optional[float] = None
    session_id: Optional[str] = None
    cycle_number: int = 1
    pomodoros_completed: int = 0
    task_id: Optional[str] = None
    project_id: Optional[str] = None
    interruptions: int = 0

    def to_dict(self) -> dict:
        return {
            "state": self.state.value,
            "mode": self.mode.value,
            "remaining_seconds": self.remaining_seconds,
            "total_seconds": self.total_seconds,
            "start_timestamp": self.start_timestamp,
            "wall_clock_start": self.wall_clock_start.isoformat() if self.wall_clock_start else None,
            "paused_duration": self.paused_duration,
            "pause_start_timestamp": self.pause_start_timestamp,
            "session_id": self.session_id,
            "cycle_number": self.cycle_number,
            "pomodoros_completed": self.pomodoros_completed,
            "task_id": self.task_id,
            "project_id": self.project_id,
            "interruptions": self.interruptions,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "TimerData":
        return cls(
            state=TimerState(data.get("state", "idle")),
            mode=TimerMode(data.get("mode", "focus")),
            remaining_seconds=data.get("remaining_seconds", 25 * 60),
            total_seconds=data.get("total_seconds", 25 * 60),
            start_timestamp=data.get("start_timestamp"),
            wall_clock_start=datetime.fromisoformat(data["wall_clock_start"]) if data.get("wall_clock_start") else None,
            paused_duration=data.get("paused_duration", 0),
            pause_start_timestamp=data.get("pause_start_timestamp"),
            session_id=data.get("session_id"),
            cycle_number=data.get("cycle_number", 1),
            pomodoros_completed=data.get("pomodoros_completed", 0),
            task_id=data.get("task_id"),
            project_id=data.get("project_id"),
            interruptions=data.get("interruptions", 0),
        )
