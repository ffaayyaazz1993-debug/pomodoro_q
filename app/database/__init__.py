"""
Pomodoro Application - Database Layer
"""
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Optional

from sqlalchemy import create_engine, Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, Index
from sqlalchemy.orm import sessionmaker, declarative_base, relationship, Session as SASession
from sqlalchemy.exc import SQLAlchemyError

from app.models import (
    Task, Project, Session as SessionModel, Goal, TimerSettings, TimerData,
    TaskStatus, TaskPriority, ProjectStatus, TimerMode, SessionStatus, TimerState
)
from app.utils import DATABASE_FILE, DATABASE_VERSION

logger = logging.getLogger("pomodoro_app.database")
Base = declarative_base()


# ===== SQLAlchemy Models =====

class DBProject(Base):
    __tablename__ = "projects"
    
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(Text, default="")
    color = Column(String, default="#6366f1")
    icon = Column(String, default="📁")
    status = Column(String, default="active")
    created_at = Column(DateTime, default=datetime.now)
    goal_pomodoros = Column(Integer, default=0)
    
    tasks = relationship("DBTask", back_populates="project")
    
    def to_model(self) -> Project:
        return Project(
            id=self.id,
            name=self.name,
            description=self.description,
            color=self.color,
            icon=self.icon,
            status=ProjectStatus(self.status),
            created_at=self.created_at,
            goal_pomodoros=self.goal_pomodoros,
        )
    
    @classmethod
    def from_model(cls, project: Project) -> "DBProject":
        return cls(
            id=project.id,
            name=project.name,
            description=project.description,
            color=project.color,
            icon=project.icon,
            status=project.status.value,
            created_at=project.created_at,
            goal_pomodoros=project.goal_pomodoros,
        )


class DBTask(Base):
    __tablename__ = "tasks"
    
    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    description = Column(Text, default="")
    project_id = Column(String, ForeignKey("projects.id"), nullable=True)
    priority = Column(String, default="medium")
    status = Column(String, default="not_started")
    estimated_pomodoros = Column(Integer, default=1)
    completed_pomodoros = Column(Integer, default=0)
    due_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.now)
    completed_at = Column(DateTime, nullable=True)
    tags = Column(Text, default="[]")  # JSON array
    notes = Column(Text, default="")
    archived = Column(Boolean, default=False)
    
    project = relationship("DBProject", back_populates="tasks")
    sessions = relationship("DBSession", back_populates="task")
    
    __table_args__ = (
        Index("idx_tasks_status", "status"),
        Index("idx_tasks_project", "project_id"),
        Index("idx_tasks_priority", "priority"),
    )
    
    def to_model(self) -> Task:
        tags = json.loads(self.tags) if self.tags else []
        return Task(
            id=self.id,
            title=self.title,
            description=self.description,
            project_id=self.project_id,
            priority=TaskPriority(self.priority),
            status=TaskStatus(self.status),
            estimated_pomodoros=self.estimated_pomodoros,
            completed_pomodoros=self.completed_pomodoros,
            due_date=self.due_date,
            created_at=self.created_at,
            completed_at=self.completed_at,
            tags=tags,
            notes=self.notes,
            archived=self.archived,
        )
    
    @classmethod
    def from_model(cls, task: Task) -> "DBTask":
        return cls(
            id=task.id,
            title=task.title,
            description=task.description,
            project_id=task.project_id,
            priority=task.priority.value,
            status=task.status.value,
            estimated_pomodoros=task.estimated_pomodoros,
            completed_pomodoros=task.completed_pomodoros,
            due_date=task.due_date,
            created_at=task.created_at,
            completed_at=task.completed_at,
            tags=json.dumps(task.tags),
            notes=task.notes,
            archived=task.archived,
        )


class DBSession(Base):
    __tablename__ = "sessions"
    
    id = Column(String, primary_key=True)
    mode = Column(String, nullable=False)
    status = Column(String, nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=True)
    planned_duration = Column(Integer, default=0)
    actual_duration = Column(Integer, default=0)
    paused_duration = Column(Integer, default=0)
    task_id = Column(String, ForeignKey("tasks.id"), nullable=True)
    project_id = Column(String, nullable=True)
    interruptions = Column(Integer, default=0)
    notes = Column(Text, default="")
    cycle_number = Column(Integer, default=1)
    
    task = relationship("DBTask", back_populates="sessions")
    
    __table_args__ = (
        Index("idx_sessions_start", "start_time"),
        Index("idx_sessions_mode", "mode"),
        Index("idx_sessions_status", "status"),
        Index("idx_sessions_task", "task_id"),
    )
    
    def to_model(self) -> SessionModel:
        return SessionModel(
            id=self.id,
            mode=TimerMode(self.mode),
            status=SessionStatus(self.status),
            start_time=self.start_time,
            end_time=self.end_time,
            planned_duration=self.planned_duration,
            actual_duration=self.actual_duration,
            paused_duration=self.paused_duration,
            task_id=self.task_id,
            project_id=self.project_id,
            interruptions=self.interruptions,
            notes=self.notes,
            cycle_number=self.cycle_number,
        )
    
    @classmethod
    def from_model(cls, session: SessionModel) -> "DBSession":
        return cls(
            id=session.id,
            mode=session.mode.value,
            status=session.status.value,
            start_time=session.start_time,
            end_time=session.end_time,
            planned_duration=session.planned_duration,
            actual_duration=session.actual_duration,
            paused_duration=session.paused_duration,
            task_id=session.task_id,
            project_id=session.project_id,
            interruptions=session.interruptions,
            notes=session.notes,
            cycle_number=session.cycle_number,
        )


class DBGoal(Base):
    __tablename__ = "goals"
    
    id = Column(String, primary_key=True)
    type = Column(String, nullable=False)
    target_value = Column(Integer, nullable=False)
    enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.now)
    
    def to_model(self) -> Goal:
        return Goal(
            id=self.id,
            type=self.type,
            target_value=self.target_value,
            enabled=self.enabled,
            created_at=self.created_at,
        )
    
    @classmethod
    def from_model(cls, goal: Goal) -> "DBGoal":
        return cls(
            id=goal.id,
            type=goal.type,
            target_value=goal.target_value,
            enabled=goal.enabled,
            created_at=goal.created_at,
        )


class DBSettings(Base):
    __tablename__ = "settings"
    
    key = Column(String, primary_key=True)
    value = Column(Text, nullable=False)


class DBApplicationState(Base):
    __tablename__ = "application_state"
    
    key = Column(String, primary_key=True)
    value = Column(Text, nullable=False)


# ===== DATABASE MANAGER =====

class Database:
    """Database manager for the Pomodoro application"""
    
    def __init__(self, db_path: Optional[Path] = None):
        if db_path is None:
            data_dir = Path.home() / ".pomodoro_app"
            data_dir.mkdir(parents=True, exist_ok=True)
            db_path = data_dir / DATABASE_FILE
        
        self.db_path = db_path
        self.engine = create_engine(f"sqlite:///{db_path}", echo=False)
        self.SessionLocal = sessionmaker(bind=self.engine)
        
        # Create tables
        Base.metadata.create_all(self.engine)
        
        # Run migrations
        self._run_migrations()
        
        logger.info(f"Database initialized at {db_path}")
    
    def _run_migrations(self):
        """Run database migrations"""
        session = self.SessionLocal()
        try:
            # Check current version
            version_setting = session.query(DBSettings).filter_by(key="db_version").first()
            current_version = int(version_setting.value) if version_setting else 0
            
            if current_version < DATABASE_VERSION:
                # Run migrations here as needed
                # For now, just set version
                if version_setting:
                    version_setting.value = str(DATABASE_VERSION)
                else:
                    session.add(DBSettings(key="db_version", value=str(DATABASE_VERSION)))
                session.commit()
                logger.info(f"Database migrated to version {DATABASE_VERSION}")
        except SQLAlchemyError as e:
            session.rollback()
            logger.error(f"Migration error: {e}")
        finally:
            session.close()
    
    def get_session(self) -> SASession:
        """Get a new database session"""
        return self.SessionLocal()
    
    # ===== PROJECT OPERATIONS =====
    
    def get_all_projects(self) -> list[Project]:
        session = self.get_session()
        try:
            projects = session.query(DBProject).all()
            return [p.to_model() for p in projects]
        finally:
            session.close()
    
    def get_project(self, project_id: str) -> Optional[Project]:
        session = self.get_session()
        try:
            project = session.query(DBProject).filter_by(id=project_id).first()
            return project.to_model() if project else None
        finally:
            session.close()
    
    def save_project(self, project: Project) -> None:
        session = self.get_session()
        try:
            existing = session.query(DBProject).filter_by(id=project.id).first()
            if existing:
                existing.name = project.name
                existing.description = project.description
                existing.color = project.color
                existing.icon = project.icon
                existing.status = project.status.value
                existing.goal_pomodoros = project.goal_pomodoros
            else:
                session.add(DBProject.from_model(project))
            session.commit()
        except SQLAlchemyError as e:
            session.rollback()
            logger.error(f"Error saving project: {e}")
            raise
        finally:
            session.close()
    
    def delete_project(self, project_id: str) -> None:
        session = self.get_session()
        try:
            # Remove project reference from tasks
            session.query(DBTask).filter_by(project_id=project_id).update({"project_id": None})
            session.query(DBProject).filter_by(id=project_id).delete()
            session.commit()
        except SQLAlchemyError as e:
            session.rollback()
            logger.error(f"Error deleting project: {e}")
            raise
        finally:
            session.close()
    
    # ===== TASK OPERATIONS =====
    
    def get_all_tasks(self, include_archived: bool = False) -> list[Task]:
        session = self.get_session()
        try:
            query = session.query(DBTask)
            if not include_archived:
                query = query.filter_by(archived=False)
            tasks = query.all()
            return [t.to_model() for t in tasks]
        finally:
            session.close()
    
    def get_task(self, task_id: str) -> Optional[Task]:
        session = self.get_session()
        try:
            task = session.query(DBTask).filter_by(id=task_id).first()
            return task.to_model() if task else None
        finally:
            session.close()
    
    def save_task(self, task: Task) -> None:
        session = self.get_session()
        try:
            existing = session.query(DBTask).filter_by(id=task.id).first()
            if existing:
                for key, value in task.to_dict().items():
                    if key == "tags":
                        setattr(existing, key, json.dumps(value))
                    elif key in ("priority", "status"):
                        setattr(existing, key, value)
                    elif hasattr(existing, key):
                        setattr(existing, key, value)
            else:
                session.add(DBTask.from_model(task))
            session.commit()
        except SQLAlchemyError as e:
            session.rollback()
            logger.error(f"Error saving task: {e}")
            raise
        finally:
            session.close()
    
    def delete_task(self, task_id: str) -> None:
        session = self.get_session()
        try:
            session.query(DBSession).filter_by(task_id=task_id).update({"task_id": None})
            session.query(DBTask).filter_by(id=task_id).delete()
            session.commit()
        except SQLAlchemyError as e:
            session.rollback()
            logger.error(f"Error deleting task: {e}")
            raise
        finally:
            session.close()
    
    # ===== SESSION OPERATIONS =====
    
    def get_all_sessions(self, limit: Optional[int] = None) -> list[SessionModel]:
        session = self.get_session()
        try:
            query = session.query(DBSession).order_by(DBSession.start_time.desc())
            if limit:
                query = query.limit(limit)
            sessions = query.all()
            return [s.to_model() for s in sessions]
        finally:
            session.close()
    
    def get_sessions_by_date(self, date_str: str) -> list[SessionModel]:
        session = self.get_session()
        try:
            start = datetime.strptime(date_str, "%Y-%m-%d")
            end = start.replace(hour=23, minute=59, second=59)
            sessions = session.query(DBSession).filter(
                DBSession.start_time >= start,
                DBSession.start_time <= end
            ).all()
            return [s.to_model() for s in sessions]
        finally:
            session.close()
    
    def save_session(self, session_model: SessionModel) -> None:
        session = self.get_session()
        try:
            existing = session.query(DBSession).filter_by(id=session_model.id).first()
            if existing:
                for key, value in session_model.to_dict().items():
                    if hasattr(existing, key):
                        setattr(existing, key, value)
            else:
                session.add(DBSession.from_model(session_model))
            session.commit()
        except SQLAlchemyError as e:
            session.rollback()
            logger.error(f"Error saving session: {e}")
            raise
        finally:
            session.close()
    
    def delete_session(self, session_id: str) -> None:
        session = self.get_session()
        try:
            session.query(DBSession).filter_by(id=session_id).delete()
            session.commit()
        except SQLAlchemyError as e:
            session.rollback()
            logger.error(f"Error deleting session: {e}")
            raise
        finally:
            session.close()
    
    # ===== GOAL OPERATIONS =====
    
    def get_all_goals(self) -> list[Goal]:
        session = self.get_session()
        try:
            goals = session.query(DBGoal).all()
            return [g.to_model() for g in goals]
        finally:
            session.close()
    
    def save_goal(self, goal: Goal) -> None:
        session = self.get_session()
        try:
            existing = session.query(DBGoal).filter_by(id=goal.id).first()
            if existing:
                existing.type = goal.type
                existing.target_value = goal.target_value
                existing.enabled = goal.enabled
            else:
                session.add(DBGoal.from_model(goal))
            session.commit()
        except SQLAlchemyError as e:
            session.rollback()
            logger.error(f"Error saving goal: {e}")
            raise
        finally:
            session.close()
    
    def delete_goal(self, goal_id: str) -> None:
        session = self.get_session()
        try:
            session.query(DBGoal).filter_by(id=goal_id).delete()
            session.commit()
        except SQLAlchemyError as e:
            session.rollback()
            logger.error(f"Error deleting goal: {e}")
            raise
        finally:
            session.close()
    
    # ===== SETTINGS OPERATIONS =====
    
    def get_settings(self) -> TimerSettings:
        session = self.get_session()
        try:
            settings_data = {}
            for setting in session.query(DBSettings).all():
                try:
                    settings_data[setting.key] = json.loads(setting.value)
                except json.JSONDecodeError:
                    settings_data[setting.key] = setting.value
            return TimerSettings.from_dict(settings_data) if settings_data else TimerSettings()
        finally:
            session.close()
    
    def save_settings(self, settings: TimerSettings) -> None:
        session = self.get_session()
        try:
            for key, value in settings.to_dict().items():
                existing = session.query(DBSettings).filter_by(key=key).first()
                json_value = json.dumps(value)
                if existing:
                    existing.value = json_value
                else:
                    session.add(DBSettings(key=key, value=json_value))
            session.commit()
        except SQLAlchemyError as e:
            session.rollback()
            logger.error(f"Error saving settings: {e}")
            raise
        finally:
            session.close()
    
    # ===== APPLICATION STATE =====
    
    def get_timer_data(self) -> TimerData:
        session = self.get_session()
        try:
            state = session.query(DBApplicationState).filter_by(key="timer_data").first()
            if state:
                try:
                    data = json.loads(state.value)
                    return TimerData.from_dict(data)
                except (json.JSONDecodeError, KeyError):
                    pass
            return TimerData()
        finally:
            session.close()
    
    def save_timer_data(self, timer_data: TimerData) -> None:
        session = self.get_session()
        try:
            json_value = json.dumps(timer_data.to_dict())
            existing = session.query(DBApplicationState).filter_by(key="timer_data").first()
            if existing:
                existing.value = json_value
            else:
                session.add(DBApplicationState(key="timer_data", value=json_value))
            session.commit()
        except SQLAlchemyError as e:
            session.rollback()
            logger.error(f"Error saving timer data: {e}")
            raise
        finally:
            session.close()
    
    def get_app_state(self, key: str, default: str = "") -> str:
        session = self.get_session()
        try:
            state = session.query(DBApplicationState).filter_by(key=key).first()
            return state.value if state else default
        finally:
            session.close()
    
    def save_app_state(self, key: str, value: str) -> None:
        session = self.get_session()
        try:
            existing = session.query(DBApplicationState).filter_by(key=key).first()
            if existing:
                existing.value = value
            else:
                session.add(DBApplicationState(key=key, value=value))
            session.commit()
        except SQLAlchemyError as e:
            session.rollback()
            logger.error(f"Error saving app state: {e}")
            raise
        finally:
            session.close()
    
    # ===== BACKUP / RESTORE =====
    
    def export_all_data(self) -> dict:
        """Export all data as a dictionary"""
        return {
            "projects": [p.to_dict() for p in self.get_all_projects()],
            "tasks": [t.to_dict() for t in self.get_all_tasks(include_archived=True)],
            "sessions": [s.to_dict() for s in self.get_all_sessions()],
            "goals": [g.to_dict() for g in self.get_all_goals()],
            "settings": self.get_settings().to_dict(),
            "timer_data": self.get_timer_data().to_dict(),
        }
    
    def import_all_data(self, data: dict) -> bool:
        """Import all data from a dictionary"""
        try:
            # Import projects
            for p_data in data.get("projects", []):
                project = Project.from_dict(p_data)
                self.save_project(project)
            
            # Import tasks
            for t_data in data.get("tasks", []):
                task = Task.from_dict(t_data)
                self.save_task(task)
            
            # Import sessions
            for s_data in data.get("sessions", []):
                session = SessionModel.from_dict(s_data)
                self.save_session(session)
            
            # Import goals
            for g_data in data.get("goals", []):
                goal = Goal.from_dict(g_data)
                self.save_goal(goal)
            
            # Import settings
            if "settings" in data:
                settings = TimerSettings.from_dict(data["settings"])
                self.save_settings(settings)
            
            # Import timer data
            if "timer_data" in data:
                timer_data = TimerData.from_dict(data["timer_data"])
                self.save_timer_data(timer_data)
            
            return True
        except Exception as e:
            logger.error(f"Error importing data: {e}")
            return False
    
    def close(self):
        """Close database connections"""
        self.engine.dispose()
        logger.info("Database closed")
