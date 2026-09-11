"""
Pomodoro Application - Sound Service
Uses Qt's multimedia for sound playback.
"""
import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger("pomodoro_app.sounds")


class SoundService:
    """Sound service using Qt Multimedia"""
    
    def __init__(self, enabled: bool = True, volume: float = 0.5):
        self.enabled = enabled
        self.volume = volume
        
        # Qt multimedia player
        self._player = None
        self._audio_output = None
        
        logger.info(f"Sound service initialized (enabled={enabled}, volume={volume})")
    
    def _ensure_player(self):
        """Ensure Qt multimedia player is initialized"""
        if self._player is None:
            try:
                from PySide6.QtMultimedia import QMediaPlayer, QAudioOutput
                from PySide6.QtCore import QUrl
                
                self._player = QMediaPlayer()
                self._audio_output = QAudioOutput()
                self._player.setAudioOutput(self._audio_output)
                self._audio_output.setVolume(self.volume)
            except Exception as e:
                logger.error(f"Failed to initialize audio player: {e}")
                return False
        return True
    
    def play_completion_sound(self):
        """Play completion sound"""
        if not self.enabled:
            return
        
        try:
            if self._ensure_player():
                # Generate a pleasant chime using tone
                self._play_tone_sequence([523.25, 659.25, 783.99])  # C5, E5, G5
                logger.debug("Completion sound played")
        except Exception as e:
            logger.error(f"Failed to play completion sound: {e}")
    
    def play_break_sound(self):
        """Play break complete sound"""
        if not self.enabled:
            return
        
        try:
            if self._ensure_player():
                # Gentle descending tone
                self._play_tone_sequence([783.99, 523.25])  # G5 to C5
                logger.debug("Break sound played")
        except Exception as e:
            logger.error(f"Failed to play break sound: {e}")
    
    def play_warning_sound(self):
        """Play warning sound"""
        if not self.enabled:
            return
        
        try:
            if self._ensure_player():
                # Two short beeps
                self._play_tone_sequence([880, 880], duration=0.15, gap=0.2)
                logger.debug("Warning sound played")
        except Exception as e:
            logger.error(f"Failed to play warning sound: {e}")
    
    def _play_tone_sequence(self, frequencies: list[float], duration: float = 0.3, gap: float = 0.15):
        """Play a sequence of tones"""
        try:
            import numpy as np
            from PySide6.QtMultimedia import QMediaPlayer, QAudioOutput
            from PySide6.QtCore import QUrl, QByteArray, QBuffer, QIODevice
            import io
            
            # Generate audio data
            sample_rate = 44100
            total_samples = int(sample_rate * (duration * len(frequencies) + gap * (len(frequencies) - 1)))
            
            # Create WAV data in memory
            audio_data = bytearray()
            
            for i, freq in enumerate(frequencies):
                # Generate sine wave
                t = np.linspace(0, duration, int(sample_rate * duration), False)
                tone = np.sin(2 * np.pi * freq * t) * 0.3
                
                # Apply envelope (fade in/out)
                envelope = np.ones_like(tone)
                fade_samples = int(sample_rate * 0.05)
                envelope[:fade_samples] = np.linspace(0, 1, fade_samples)
                envelope[-fade_samples:] = np.linspace(1, 0, fade_samples)
                tone *= envelope
                
                # Convert to 16-bit PCM
                samples = (tone * 32767).astype(np.int16)
                audio_data.extend(samples.tobytes())
                
                # Add gap
                if i < len(frequencies) - 1:
                    silence = np.zeros(int(sample_rate * gap), dtype=np.int16)
                    audio_data.extend(silence.tobytes())
            
            # Create WAV header
            wav_data = self._create_wav_header(len(audio_data), sample_rate) + audio_data
            
            # Play using QMediaPlayer
            buffer = QBuffer()
            buffer.setData(QByteArray(bytes(wav_data)))
            buffer.open(QIODevice.OpenModeFlag.ReadOnly)
            
            self._player.setSourceDevice(buffer)
            self._player.play()
            
        except ImportError:
            logger.debug("numpy not available for sound generation")
        except Exception as e:
            logger.error(f"Failed to play tone sequence: {e}")
    
    def _create_wav_header(self, data_size: int, sample_rate: int) -> bytes:
        """Create WAV file header"""
        import struct
        
        channels = 1
        bits_per_sample = 16
        byte_rate = sample_rate * channels * bits_per_sample // 8
        block_align = channels * bits_per_sample // 8
        
        header = struct.pack('<4sI4s', b'RIFF', 36 + data_size, b'WAVE')
        header += struct.pack('<4sIHHIIHH', 
            b'fmt ',
            16,  # chunk size
            1,   # PCM format
            channels,
            sample_rate,
            byte_rate,
            block_align,
            bits_per_sample
        )
        header += struct.pack('<4sI', b'data', data_size)
        
        return header
    
    def set_enabled(self, enabled: bool):
        """Enable or disable sounds"""
        self.enabled = enabled
        logger.info(f"Sounds {'enabled' if enabled else 'disabled'}")
    
    def set_volume(self, volume: float):
        """Set volume (0.0 to 1.0)"""
        self.volume = max(0.0, min(1.0, volume))
        if self._audio_output:
            self._audio_output.setVolume(self.volume)
        logger.info(f"Volume set to {self.volume}")
    
    def preview_sound(self, sound_type: str):
        """Preview a sound"""
        if sound_type == "completion":
            self.play_completion_sound()
        elif sound_type == "break":
            self.play_break_sound()
        elif sound_type == "warning":
            self.play_warning_sound()
