"""
Tests for Database Operations
"""
import pytest
import tempfile
from pathlib import Path
from datetime import datetime

from app.database import Database
from app.models import Task, Project, Session, Goal, TimerSettings, TimerMode, SessionStatus, TaskStatus, TaskPriority


class TestDatabase:
    """Test database operations"""
    
    @pytest.fixture
    def db(self):
        """Create temporary database"""
        with tempfile.TemporaryDirectory() as tmpdir:
            db_path = Path(tmpdir) / "test.db"
            db = Database(db_path)
            yield db
            db.close()
    
    def test_create_task(self, db):
        """Test creating a task"""
        task = Task(
            id="test-1",
            title="Test Task",
            description="Test description",
            priority=TaskPriority.HIGH,
            status=TaskStatus.NOT_STARTED,
        )
        
        db.save_task(task)
        retrieved = db.get_task("test-1")
        
        assert retrieved is not None
        assert retrieved.title == "Test Task"
        assert retrieved.priority == TaskPriority.HIGH
    
    def test_update_task(self, db):
        """Test updating a task"""
        task = Task(id="test-2", title="Original")
        db.save_task(task)
        
        task.title = "Updated"
        task.status = TaskStatus.COMPLETED
        db.save_task(task)
        
        retrieved = db.get_task("test-2")
        assert retrieved.title == "Updated"
        assert retrieved.status == TaskStatus.COMPLETED
    
    def test_delete_task(self, db):
        """Test deleting a task"""
        task = Task(id="test-3", title="To Delete")
        db.save_task(task)
        
        db.delete_task("test-3")
        retrieved = db.get_task("test-3")
        
        assert retrieved is None
    
    def test_get_all_tasks(self, db):
        """Test getting all tasks"""
        for i in range(5):
            task = Task(id=f"task-{i}", title=f"Task {i}")
            db.save_task(task)
        
        tasks = db.get_all_tasks()
        assert len(tasks) == 5
    
    def test_create_project(self, db):
        """Test creating a project"""
        project = Project(
            id="proj-1",
            name="Test Project",
            description="Test description",
            color="#ff0000",
        )
        
        db.save_project(project)
        retrieved = db.get_project("proj-1")
        
        assert retrieved is not None
        assert retrieved.name == "Test Project"
        assert retrieved.color == "#ff0000"
    
    def test_create_session(self, db):
        """Test creating a session"""
        session = Session(
            id="session-1",
            mode=TimerMode.FOCUS,
            status=SessionStatus.COMPLETED,
            start_time=datetime.now(),
            end_time=datetime.now(),
            planned_duration=25 * 60,
            actual_duration=25 * 60,
        )
        
        db.save_session(session)
        sessions = db.get_all_sessions()
        
        assert len(sessions) == 1
        assert sessions[0].mode == TimerMode.FOCUS
    
    def test_save_settings(self, db):
        """Test saving settings"""
        settings = TimerSettings(
            focus_duration=30,
            short_break_duration=10,
        )
        
        db.save_settings(settings)
        retrieved = db.get_settings()
        
        assert retrieved.focus_duration == 30
        assert retrieved.short_break_duration == 10
    
    def test_create_goal(self, db):
        """Test creating a goal"""
        goal = Goal(
            id="goal-1",
            type="daily_pomodoros",
            target_value=8,
        )
        
        db.save_goal(goal)
        goals = db.get_all_goals()
        
        assert len(goals) == 1
        assert goals[0].target_value == 8
    
    def test_export_import_data(self, db):
        """Test exporting and importing data"""
        # Create some data
        task = Task(id="task-1", title="Test Task")
        db.save_task(task)
        
        project = Project(id="proj-1", name="Test Project")
        db.save_project(project)
        
        # Export
        data = db.export_all_data()
        
        assert "tasks" in data
        assert "projects" in data
        assert len(data["tasks"]) == 1
        assert len(data["projects"]) == 1
        
        # Create new database and import
        with tempfile.TemporaryDirectory() as tmpdir:
            db_path2 = Path(tmpdir) / "test2.db"
            db2 = Database(db_path2)
            
            success = db2.import_all_data(data)
            assert success
            
            tasks = db2.get_all_tasks()
            assert len(tasks) == 1
            assert tasks[0].title == "Test Task"
            
            db2.close()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
