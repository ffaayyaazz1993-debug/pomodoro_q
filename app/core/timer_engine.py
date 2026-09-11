"""
Pomodoro Application - Timer Engine
Uses monotonic clock for accurate timing that survives system sleep and UI freezes.
"""
import logging
import time
import uuid
from datetime import datetime
from typing import Optional, Callable

from app.models import TimerState, TimerMode, TimerData, TimerSettings, Session, SessionStatus
from app.utils import minutes_to_seconds

logger = logging.getLogger("pomodoro_app.timer_engine")


class Clock:
    """Clock abstraction for testing - can be replaced with fake clock"""
    
    def monotonic(self) -> float:
        return time.monotonic()
    
    def now(self) -> datetime:
        return datetime.now()


class TimerEngine:
    """
    Core timer engine using monotonic clock for accuracy.
    
    The timer calculates elapsed time based on monotonic timestamps rather than
    decrementing a counter, making it resilient to:
    - System sleep/wake
    - UI thread blocking
    - Computer being busy
    - Window being moved/resized
    """
    
    def __init__(self, settings: TimerSettings, clock: Optional[Clock] = None):
        self.settings = settings
        self.clock = clock or Clock()
        
        # Timer state
        self._data = TimerData()
        
        # Callbacks
        self._on_state_change: Optional[Callable[[TimerState], None]] = None
        self._on_tick: Optional[Callable[[int], None]] = None
        self._on_complete: Optional[Callable[[TimerMode], None]] = None
        self._on_warning: Optional[Callable[[int], None]] = None
        
        # Warning tracking
        self._warning_fired = False
        
        logger.info("Timer engine initialized")
    
    @property
    def data(self) -> TimerData:
        return self._data
    
    @property
    def state(self) -> TimerState:
        return self._data.state
    
    @property
    def mode(self) -> TimerMode:
        return self._data.mode
    
    @property
    def remaining_seconds(self) -> int:
        return self._data.remaining_seconds
    
    @property
    def total_seconds(self) -> int:
        return self._data.total_seconds
    
    @property
    def is_running(self) -> bool:
        return self._data.state == TimerState.RUNNING
    
    @property
    def is_paused(self) -> bool:
        return self._data.state == TimerState.PAUSED
    
    @property
    def is_idle(self) -> bool:
        return self._data.state == TimerState.IDLE
    
    @property
    def progress_percentage(self) -> float:
        if self._data.total_seconds == 0:
            return 0.0
        elapsed = self._data.total_seconds - self._data.remaining_seconds
        return min(100.0, max(0.0, (elapsed / self._data.total_seconds) * 100))
    
    # ===== CALLBACKS =====
    
    def set_on_state_change(self, callback: Callable[[TimerState], None]):
        self._on_state_change = callback
    
    def set_on_tick(self, callback: Callable[[int], None]):
        self._on_tick = callback
    
    def set_on_complete(self, callback: Callable[[TimerMode], None]):
        self._on_complete = callback
    
    def set_on_warning(self, callback: Callable[[int], None]):
        self._on_warning = callback
    
    # ===== TIMER CONTROL =====
    
    def start(self, task_id: Optional[str] = None, project_id: Optional[str] = None):
        """Start a new timer session"""
        if self._data.state == TimerState.RUNNING:
            logger.warning("Timer already running")
            return
        
        # Calculate duration based on mode
        duration = self._get_duration_for_mode(self._data.mode)
        
        # Create new session
        session_id = str(uuid.uuid4())
        now = self.clock.now()
        monotonic_now = self.clock.monotonic()
        
        self._data = TimerData(
            state=TimerState.RUNNING,
            mode=self._data.mode,
            remaining_seconds=duration,
            total_seconds=duration,
            start_timestamp=monotonic_now,
            wall_clock_start=now,
            paused_duration=0,
            pause_start_timestamp=None,
            session_id=session_id,
            cycle_number=self._data.cycle_number,
            pomodoros_completed=self._data.pomodoros_completed,
            task_id=task_id or self._data.task_id,
            project_id=project_id or self._data.project_id,
            interruptions=0,
        )
        
        self._warning_fired = False
        self._notify_state_change()
        logger.info(f"Timer started: mode={self._data.mode.value}, duration={duration}s, session={session_id}")
    
    def pause(self):
        """Pause the running timer"""
        if self._data.state != TimerState.RUNNING:
            logger.warning("Cannot pause: timer not running")
            return
        
        self._data.state = TimerState.PAUSED
        self._data.pause_start_timestamp = self.clock.monotonic()
        self._data.interruptions += 1
        
        self._notify_state_change()
        logger.info("Timer paused")
    
    def resume(self):
        """Resume the paused timer"""
        if self._data.state != TimerState.PAUSED:
            logger.warning("Cannot resume: timer not paused")
            return
        
        # Calculate how long we were paused
        paused_duration = self.clock.monotonic() - self._data.pause_start_timestamp
        
        # Adjust start timestamp to account for pause
        self._data.start_timestamp += paused_duration
        self._data.paused_duration += int(paused_duration)
        self._data.pause_start_timestamp = None
        self._data.state = TimerState.RUNNING
        
        self._notify_state_change()
        logger.info(f"Timer resumed (paused for {int(paused_duration)}s)")
    
    def stop(self) -> Optional[Session]:
        """Stop the timer and return the session record"""
        if self._data.state == TimerState.IDLE:
            return None
        
        # Calculate actual duration
        if self._data.state == TimerState.RUNNING and self._data.start_timestamp:
            elapsed = int(self.clock.monotonic() - self._data.start_timestamp)
        else:
            elapsed = self._data.total_seconds - self._data.remaining_seconds
        
        # Create session record
        session = Session(
            id=self._data.session_id or str(uuid.uuid4()),
            mode=self._data.mode,
            status=SessionStatus.ABANDONED,
            start_time=self._data.wall_clock_start or self.clock.now(),
            end_time=self.clock.now(),
            planned_duration=self._data.total_seconds,
            actual_duration=elapsed,
            paused_duration=self._data.paused_duration,
            task_id=self._data.task_id,
            project_id=self._data.project_id,
            interruptions=self._data.interruptions,
            cycle_number=self._data.cycle_number,
        )
        
        # Reset timer
        self._data.state = TimerState.IDLE
        self._data.session_id = None
        self._data.start_timestamp = None
        self._data.wall_clock_start = None
        self._data.paused_duration = 0
        self._data.pause_start_timestamp = None
        self._data.interruptions = 0
        
        self._notify_state_change()
        logger.info("Timer stopped")
        return session
    
    def reset(self):
        """Reset timer to initial state for current mode"""
        duration = self._get_duration_for_mode(self._data.mode)
        
        self._data.state = TimerState.IDLE
        self._data.remaining_seconds = duration
        self._data.total_seconds = duration
        self._data.start_timestamp = None
        self._data.wall_clock_start = None
        self._data.paused_duration = 0
        self._data.pause_start_timestamp = None
        self._data.session_id = None
        self._data.interruptions = 0
        self._warning_fired = False
        
        self._notify_state_change()
        logger.info("Timer reset")
    
    def skip(self) -> Optional[Session]:
        """Skip current phase and move to next"""
        if self._data.state == TimerState.IDLE:
            return None
        
        # Record skipped session
        elapsed = self._data.total_seconds - self._data.remaining_seconds
        session = Session(
            id=self._data.session_id or str(uuid.uuid4()),
            mode=self._data.mode,
            status=SessionStatus.SKIPPED,
            start_time=self._data.wall_clock_start or self.clock.now(),
            end_time=self.clock.now(),
            planned_duration=self._data.total_seconds,
            actual_duration=elapsed,
            paused_duration=self._data.paused_duration,
            task_id=self._data.task_id,
            project_id=self._data.project_id,
            interruptions=self._data.interruptions,
            cycle_number=self._data.cycle_number,
        )
        
        # Move to next phase
        self._advance_to_next_phase()
        
        self._notify_state_change()
        logger.info(f"Timer skipped to {self._data.mode.value}")
        return session
    
    def set_mode(self, mode: TimerMode):
        """Set timer mode (only when idle)"""
        if self._data.state == TimerState.RUNNING:
            logger.warning("Cannot change mode while timer is running")
            return
        
        self._data.mode = mode
        duration = self._get_duration_for_mode(mode)
        self._data.remaining_seconds = duration
        self._data.total_seconds = duration
        self._data.state = TimerState.IDLE
        
        self._notify_state_change()
        logger.info(f"Timer mode set to {mode.value}")
    
    def add_time(self, seconds: int):
        """Add time to the timer"""
        self._data.remaining_seconds += seconds
        self._data.total_seconds += seconds
        self._notify_tick()
    
    def remove_time(self, seconds: int):
        """Remove time from the timer"""
        self._data.remaining_seconds = max(0, self._data.remaining_seconds - seconds)
        self._data.total_seconds = max(self._data.remaining_seconds, self._data.total_seconds - seconds)
        self._notify_tick()
    
    # ===== TICK UPDATE =====
    
    def tick(self) -> Optional[Session]:
        """
        Update timer state. Called periodically (e.g., every 200ms).
        Returns a Session if timer completed, None otherwise.
        """
        if self._data.state != TimerState.RUNNING:
            return None
        
        if not self._data.start_timestamp:
            return None
        
        # Calculate elapsed time using monotonic clock
        elapsed = int(self.clock.monotonic() - self._data.start_timestamp)
        remaining = max(0, self._data.total_seconds - elapsed)
        
        # Check for warning
        if self.settings.warning_enabled and not self._warning_fired:
            warning_seconds = self.settings.warning_minutes * 60
            if self._data.remaining_seconds > warning_seconds and remaining <= warning_seconds:
                self._warning_fired = True
                if self._on_warning:
                    self._on_warning(remaining)
        
        # Update remaining time
        self._data.remaining_seconds = remaining
        
        # Notify tick
        self._notify_tick()
        
        # Check completion
        if remaining <= 0:
            return self._handle_completion()
        
        return None
    
    def _handle_completion(self) -> Session:
        """Handle timer completion"""
        # Create completed session
        session = Session(
            id=self._data.session_id or str(uuid.uuid4()),
            mode=self._data.mode,
            status=SessionStatus.COMPLETED,
            start_time=self._data.wall_clock_start or self.clock.now(),
            end_time=self.clock.now(),
            planned_duration=self._data.total_seconds,
            actual_duration=self._data.total_seconds,
            paused_duration=self._data.paused_duration,
            task_id=self._data.task_id,
            project_id=self._data.project_id,
            interruptions=self._data.interruptions,
            cycle_number=self._data.cycle_number,
        )
        
        # Update pomodoro count if focus session
        if self._data.mode == TimerMode.FOCUS:
            self._data.pomodoros_completed += 1
        
        # Notify completion
        if self._on_complete:
            self._on_complete(self._data.mode)
        
        # Advance to next phase
        self._advance_to_next_phase()
        
        logger.info(f"Timer completed: mode={session.mode.value}, session={session.id}")
        return session
    
    def _advance_to_next_phase(self):
        """Advance to the next phase in the cycle"""
        if self._data.mode == TimerMode.FOCUS:
            # After focus, go to break
            if self._data.pomodoros_completed % self.settings.long_break_interval == 0:
                self._data.mode = TimerMode.LONG_BREAK
            else:
                self._data.mode = TimerMode.SHORT_BREAK
        else:
            # After break, go to focus
            self._data.mode = TimerMode.FOCUS
            if self._data.mode == TimerMode.LONG_BREAK:
                self._data.cycle_number += 1
                self._data.pomodoros_completed = 0
        
        # Set duration for new mode
        duration = self._get_duration_for_mode(self._data.mode)
        self._data.remaining_seconds = duration
        self._data.total_seconds = duration
        self._data.state = TimerState.IDLE
        self._data.start_timestamp = None
        self._data.wall_clock_start = None
        self._data.paused_duration = 0
        self._data.pause_start_timestamp = None
        self._data.session_id = None
        self._data.interruptions = 0
        self._warning_fired = False
    
    def _get_duration_for_mode(self, mode: TimerMode) -> int:
        """Get duration in seconds for a timer mode"""
        if mode == TimerMode.FOCUS:
            return minutes_to_seconds(self.settings.focus_duration)
        elif mode == TimerMode.SHORT_BREAK:
            return minutes_to_seconds(self.settings.short_break_duration)
        elif mode == TimerMode.LONG_BREAK:
            return minutes_to_seconds(self.settings.long_break_duration)
        else:
            return minutes_to_seconds(self.settings.focus_duration)
    
    # ===== RECOVERY =====
    
    def recover_from_state(self, data: TimerData):
        """Recover timer state from persisted data"""
        self._data = data
        
        # If timer was running, check if it should have completed
        if data.state == TimerState.RUNNING and data.start_timestamp:
            elapsed = int(self.clock.monotonic() - data.start_timestamp)
            remaining = max(0, data.total_seconds - elapsed)
            
            if remaining <= 0:
                # Timer should have completed while we were away
                logger.info("Timer completed during absence - handling completion")
                self._data.remaining_seconds = 0
                self._handle_completion()
            else:
                # Timer is still running
                self._data.remaining_seconds = remaining
                logger.info(f"Timer recovered with {remaining}s remaining")
        
        # If timer was paused, calculate paused duration
        elif data.state == TimerState.PAUSED and data.pause_start_timestamp:
            paused_duration = int(self.clock.monotonic() - data.pause_start_timestamp)
            self._data.paused_duration += paused_duration
            logger.info(f"Timer recovered in paused state (paused for {paused_duration}s)")
        
        self._notify_state_change()
    
    def get_state_for_persistence(self) -> TimerData:
        """Get current state for persistence"""
        return self._data
    
    # ===== NOTIFICATIONS =====
    
    def _notify_state_change(self):
        if self._on_state_change:
            self._on_state_change(self._data.state)
    
    def _notify_tick(self):
        if self._on_tick:
            self._on_tick(self._data.remaining_seconds)
    
    # ===== SETTINGS =====
    
    def update_settings(self, settings: TimerSettings):
        """Update timer settings"""
        self.settings = settings
        
        # If idle, update duration for current mode
        if self._data.state == TimerState.IDLE:
            duration = self._get_duration_for_mode(self._data.mode)
            self._data.remaining_seconds = duration
            self._data.total_seconds = duration
            self._notify_tick()
        
        logger.info("Timer settings updated")
