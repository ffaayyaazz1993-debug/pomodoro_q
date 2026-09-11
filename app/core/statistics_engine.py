"""
Pomodoro Application - Statistics Engine
"""
import logging
from datetime import datetime, timedelta
from typing import Optional

from app.models import Session, SessionStatus, TimerMode, Task, Project
from app.utils import get_today_key, get_days_ago, get_streak_days, format_duration

logger = logging.getLogger("pomodoro_app.statistics")


class StatisticsEngine:
    """Calculate statistics from session data"""
    
    def __init__(self, sessions: list[Session], tasks: list[Task], projects: list[Project]):
        self.sessions = sessions
        self.tasks = tasks
        self.projects = projects
    
    def get_today_sessions(self) -> list[Session]:
        """Get today's sessions"""
        today = get_today_key()
        return [s for s in self.sessions if s.start_time.strftime("%Y-%m-%d") == today]
    
    def get_today_pomodoros(self) -> int:
        """Get today's completed pomodoros"""
        today_sessions = self.get_today_sessions()
        return len([s for s in today_sessions 
                   if s.mode == TimerMode.FOCUS and s.status == SessionStatus.COMPLETED])
    
    def get_today_focus_minutes(self) -> int:
        """Get today's focus time in minutes"""
        today_sessions = self.get_today_sessions()
        total_seconds = sum(s.actual_duration for s in today_sessions 
                          if s.mode == TimerMode.FOCUS and s.status == SessionStatus.COMPLETED)
        return total_seconds // 60
    
    def get_today_completed_tasks(self) -> int:
        """Get today's completed tasks"""
        today = get_today_key()
        return len([t for t in self.tasks 
                   if t.completed_at and t.completed_at.strftime("%Y-%m-%d") == today])
    
    def get_streak(self) -> int:
        """Get current streak in days"""
        dates = [s.start_time.strftime("%Y-%m-%d") for s in self.sessions 
                if s.mode == TimerMode.FOCUS and s.status == SessionStatus.COMPLETED]
        return get_streak_days(dates)
    
    def get_daily_stats(self, days: int = 7) -> list[dict]:
        """Get daily statistics for the past N days"""
        stats = []
        
        for i in range(days - 1, -1, -1):
            date_key = get_days_ago(i)
            day_sessions = [s for s in self.sessions 
                          if s.start_time.strftime("%Y-%m-%d") == date_key]
            
            pomodoros = len([s for s in day_sessions 
                           if s.mode == TimerMode.FOCUS and s.status == SessionStatus.COMPLETED])
            focus_seconds = sum(s.actual_duration for s in day_sessions 
                              if s.mode == TimerMode.FOCUS and s.status == SessionStatus.COMPLETED)
            breaks = len([s for s in day_sessions 
                         if s.mode != TimerMode.FOCUS and s.status == SessionStatus.COMPLETED])
            skipped = len([s for s in day_sessions if s.status == SessionStatus.SKIPPED])
            
            stats.append({
                "date": date_key,
                "pomodoros": pomodoros,
                "focus_minutes": focus_seconds // 60,
                "breaks": breaks,
                "skipped_sessions": skipped,
            })
        
        return stats
    
    def get_weekly_stats(self) -> dict:
        """Get weekly statistics"""
        daily_stats = self.get_daily_stats(7)
        
        total_focus_minutes = sum(d["focus_minutes"] for d in daily_stats)
        total_pomodoros = sum(d["pomodoros"] for d in daily_stats)
        active_days = len([d for d in daily_stats if d["pomodoros"] > 0])
        avg_daily_focus = total_focus_minutes // max(1, active_days)
        
        return {
            "total_focus_minutes": total_focus_minutes,
            "total_pomodoros": total_pomodoros,
            "avg_daily_focus": avg_daily_focus,
            "active_days": active_days,
        }
    
    def get_all_time_stats(self) -> dict:
        """Get all-time statistics"""
        completed_focus = [s for s in self.sessions 
                          if s.mode == TimerMode.FOCUS and s.status == SessionStatus.COMPLETED]
        
        total_focus_seconds = sum(s.actual_duration for s in completed_focus)
        total_focus_hours = round(total_focus_seconds / 3600, 1)
        
        # Calculate longest streak
        dates = sorted(set(s.start_time.strftime("%Y-%m-%d") for s in completed_focus))
        longest_streak = 0
        current_streak = 0
        
        for i, date in enumerate(dates):
            if i == 0:
                current_streak = 1
            else:
                prev_date = datetime.strptime(dates[i - 1], "%Y-%m-%d")
                curr_date = datetime.strptime(date, "%Y-%m-%d")
                diff = (curr_date - prev_date).days
                current_streak = current_streak + 1 if diff == 1 else 1
            longest_streak = max(longest_streak, current_streak)
        
        return {
            "total_pomodoros": len(completed_focus),
            "total_focus_hours": total_focus_hours,
            "longest_streak": longest_streak,
            "completed_tasks": len([t for t in self.tasks if t.status.value == "completed"]),
            "projects_completed": len([p for p in self.projects if p.status.value == "completed"]),
        }
    
    def get_project_stats(self, project_id: str) -> dict:
        """Get statistics for a specific project"""
        project_sessions = [s for s in self.sessions 
                          if s.project_id == project_id and s.status == SessionStatus.COMPLETED]
        project_tasks = [t for t in self.tasks if t.project_id == project_id]
        completed_tasks = len([t for t in project_tasks if t.status.value == "completed"])
        
        focus_sessions = [s for s in project_sessions if s.mode == TimerMode.FOCUS]
        focus_minutes = sum(s.actual_duration for s in focus_sessions) // 60
        
        return {
            "pomodoros": len(focus_sessions),
            "focus_minutes": focus_minutes,
            "tasks": len(project_tasks),
            "completion": round((completed_tasks / len(project_tasks) * 100) if project_tasks else 0),
        }
    
    def get_insights(self) -> list[str]:
        """Generate productivity insights"""
        insights = []
        
        completed_focus = [s for s in self.sessions 
                          if s.mode == TimerMode.FOCUS and s.status == SessionStatus.COMPLETED]
        
        if not completed_focus:
            return insights
        
        # Average pomodoros per day
        weekly_stats = self.get_weekly_stats()
        if weekly_stats["active_days"] > 0:
            avg = round(weekly_stats["total_pomodoros"] / weekly_stats["active_days"], 1)
            insights.append(f"You average {avg} Pomodoros per active day.")
        
        # Most productive day of week
        day_counts = {}
        for s in completed_focus:
            day_name = s.start_time.strftime("%A")
            day_counts[day_name] = day_counts.get(day_name, 0) + 1
        
        if day_counts:
            best_day = max(day_counts.items(), key=lambda x: x[1])
            insights.append(f"Your most productive day is {best_day[0]} ({best_day[1]} sessions).")
        
        # Top project
        project_time = {}
        for s in completed_focus:
            if s.project_id:
                project_time[s.project_id] = project_time.get(s.project_id, 0) + s.actual_duration
        
        if project_time:
            total_time = sum(project_time.values())
            top_project_id = max(project_time.items(), key=lambda x: x[1])[0]
            top_project = next((p for p in self.projects if p.id == top_project_id), None)
            if top_project:
                pct = round(project_time[top_project_id] / total_time * 100)
                insights.append(f'Your "{top_project.name}" project consumed {pct}% of your total focus time.')
        
        return insights
