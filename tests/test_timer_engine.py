"""
Tests for Timer Engine
"""
import pytest
import time
from app.core.timer_engine import TimerEngine, Clock
from app.models import TimerSettings, TimerState, TimerMode, TimerData


class FakeClock(Clock):
    """Fake clock for testing"""
    
    def __init__(self):
        self._monotonic = 0.0
        self._now = None
    
    def monotonic(self) -> float:
        return self._monotonic
    
    def now(self):
        from datetime import datetime
        return self._now or datetime.now()
    
    def advance(self, seconds: float):
        """Advance time by seconds"""
        self._monotonic += seconds


class TestTimerEngine:
    """Test timer engine functionality"""
    
    def test_initial_state(self):
        """Test initial timer state"""
        settings = TimerSettings()
        engine = TimerEngine(settings)
        
        assert engine.state == TimerState.IDLE
        assert engine.mode == TimerMode.FOCUS
        assert engine.remaining_seconds == 25 * 60
    
    def test_start_timer(self):
        """Test starting timer"""
        settings = TimerSettings()
        engine = TimerEngine(settings)
        
        engine.start()
        
        assert engine.state == TimerState.RUNNING
        assert engine.remaining_seconds == 25 * 60
    
    def test_pause_timer(self):
        """Test pausing timer"""
        settings = TimerSettings()
        engine = TimerEngine(settings)
        
        engine.start()
        engine.pause()
        
        assert engine.state == TimerState.PAUSED
    
    def test_resume_timer(self):
        """Test resuming timer"""
        settings = TimerSettings()
        engine = TimerEngine(settings)
        
        engine.start()
        engine.pause()
        engine.resume()
        
        assert engine.state == TimerState.RUNNING
    
    def test_reset_timer(self):
        """Test resetting timer"""
        settings = TimerSettings()
        engine = TimerEngine(settings)
        
        engine.start()
        engine.reset()
        
        assert engine.state == TimerState.IDLE
        assert engine.remaining_seconds == 25 * 60
    
    def test_tick_updates_remaining(self):
        """Test that tick updates remaining time"""
        settings = TimerSettings()
        clock = FakeClock()
        engine = TimerEngine(settings, clock)
        
        engine.start()
        
        # Advance time by 10 seconds
        clock.advance(10)
        engine.tick()
        
        assert engine.remaining_seconds == 25 * 60 - 10
    
    def test_timer_completion(self):
        """Test timer completion"""
        settings = TimerSettings()
        clock = FakeClock()
        engine = TimerEngine(settings, clock)
        
        engine.start()
        
        # Advance time past completion
        clock.advance(25 * 60 + 1)
        session = engine.tick()
        
        assert session is not None
        assert session.status.value == "completed"
    
    def test_mode_change(self):
        """Test changing timer mode"""
        settings = TimerSettings()
        engine = TimerEngine(settings)
        
        engine.set_mode(TimerMode.SHORT_BREAK)
        
        assert engine.mode == TimerMode.SHORT_BREAK
        assert engine.remaining_seconds == 5 * 60
    
    def test_skip_timer(self):
        """Test skipping timer"""
        settings = TimerSettings()
        engine = TimerEngine(settings)
        
        engine.start()
        session = engine.skip()
        
        assert session is not None
        assert session.status.value == "skipped"
        assert engine.mode == TimerMode.SHORT_BREAK
    
    def test_cycle_progression(self):
        """Test cycle progression through pomodoros"""
        settings = TimerSettings(long_break_interval=2)
        clock = FakeClock()
        engine = TimerEngine(settings, clock)
        
        # First pomodoro
        engine.start()
        clock.advance(25 * 60 + 1)
        engine.tick()
        
        assert engine.mode == TimerMode.SHORT_BREAK
        
        # Short break
        engine.start()
        clock.advance(5 * 60 + 1)
        engine.tick()
        
        assert engine.mode == TimerMode.FOCUS
        
        # Second pomodoro
        engine.start()
        clock.advance(25 * 60 + 1)
        engine.tick()
        
        # Should go to long break after 2 pomodoros
        assert engine.mode == TimerMode.LONG_BREAK
    
    def test_recovery_from_running_state(self):
        """Test recovering timer from running state"""
        settings = TimerSettings()
        clock = FakeClock()
        engine = TimerEngine(settings, clock)
        
        # Start timer
        engine.start()
        
        # Simulate time passing
        clock.advance(10 * 60)  # 10 minutes
        
        # Get state for persistence
        state = engine.get_state_for_persistence()
        
        # Create new engine and recover
        clock2 = FakeClock()
        clock2._monotonic = clock.monotonic()  # Same time
        engine2 = TimerEngine(settings, clock2)
        engine2.recover_from_state(state)
        
        assert engine2.state == TimerState.RUNNING
        assert engine2.remaining_seconds == 15 * 60
    
    def test_recovery_completed_during_absence(self):
        """Test recovery when timer completed during absence"""
        settings = TimerSettings()
        clock = FakeClock()
        engine = TimerEngine(settings, clock)
        
        # Start timer
        engine.start()
        
        # Get state
        state = engine.get_state_for_persistence()
        
        # Simulate time passing (more than timer duration)
        clock.advance(30 * 60)  # 30 minutes
        
        # Create new engine and recover
        engine2 = TimerEngine(settings, clock)
        engine2.recover_from_state(state)
        
        # Timer should have completed
        assert engine2.state == TimerState.IDLE
    
    def test_add_time(self):
        """Test adding time to timer"""
        settings = TimerSettings()
        engine = TimerEngine(settings)
        
        engine.start()
        initial = engine.remaining_seconds
        
        engine.add_time(60)  # Add 1 minute
        
        assert engine.remaining_seconds == initial + 60
    
    def test_remove_time(self):
        """Test removing time from timer"""
        settings = TimerSettings()
        engine = TimerEngine(settings)
        
        engine.start()
        initial = engine.remaining_seconds
        
        engine.remove_time(60)  # Remove 1 minute
        
        assert engine.remaining_seconds == initial - 60
    
    def test_progress_percentage(self):
        """Test progress percentage calculation"""
        settings = TimerSettings()
        clock = FakeClock()
        engine = TimerEngine(settings, clock)
        
        engine.start()
        
        # 50% through
        clock.advance(25 * 60 / 2)
        engine.tick()
        
        progress = engine.progress_percentage
        assert 49 <= progress <= 51  # Allow small floating point error


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
