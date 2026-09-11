# FocusFlow - Pomodoro Productivity Application

A complete, production-quality Pomodoro productivity application for Windows built with Python 3.12+ and PySide6.

## Features

### Core Pomodoro Timer
- Accurate timer using monotonic clock (survives system sleep, UI freezes)
- Focus sessions, short breaks, long breaks
- Automatic cycle management (4 pomodoros → long break)
- Custom timer durations
- Pause/resume with accurate time tracking
- Skip, reset, restart functionality

### Task Management
- Create, edit, delete, complete, archive tasks
- Priority levels (Low, Medium, High, Critical)
- Pomodoro estimation and tracking
- Due dates, tags, notes
- Project assignment
- Search and filtering

### Project Management
- Organize tasks into projects
- Track time and pomodoros per project
- Project goals and progress tracking
- Color-coded projects

### Statistics & Analytics
- Daily, weekly, monthly, all-time statistics
- Interactive charts (focus time, pomodoros, trends)
- Project distribution analysis
- Productivity insights
- Streak tracking

### Session History
- Complete session log with details
- Search and filter by date, task, project, status
- Export to CSV/JSON
- Manual session entry

### Goals & Streaks
- Daily pomodoro goals
- Daily focus time goals
- Task completion goals
- Weekly goals
- Streak tracking with visual feedback

### Data Management
- SQLite database with migrations
- Import/export (JSON, CSV)
- Backup and restore
- Automatic backups

### UI/UX
- Dark/light/system themes
- Focus mode (distraction-free)
- Mini timer window
- System tray integration
- Desktop notifications
- Sound effects
- Keyboard shortcuts
- Responsive design
- Accessibility features

## Installation

### Prerequisites
- Python 3.12 or higher
- Windows 10/11

### Setup

1. Clone or download the project:
```bash
cd pomodoro_app
```

2. Create virtual environment:
```bash
python -m venv venv
venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running the Application

```bash
python main.py
```

## Running Tests

```bash
pytest
```

## Building Windows Executable

```bash
pyinstaller build.spec
```

The executable will be in `dist/FocusFlow/FocusFlow.exe`

## Architecture

```
pomodoro_app/
├── main.py                 # Application entry point
├── app/
│   ├── core/              # Business logic
│   │   ├── timer_engine.py
│   │   ├── session_manager.py
│   │   ├── cycle_manager.py
│   │   ├── task_manager.py
│   │   ├── project_manager.py
│   │   ├── statistics_engine.py
│   │   ├── goal_manager.py
│   │   └── recovery_manager.py
│   ├── models/            # Data models
│   │   └── __init__.py
│   ├── database/          # Persistence layer
│   │   ├── database.py
│   │   ├── migrations.py
│   │   └── repositories.py
│   ├── ui/                # User interface
│   │   ├── main_window.py
│   │   ├── dashboard.py
│   │   ├── timer_view.py
│   │   ├── tasks_view.py
│   │   ├── projects_view.py
│   │   ├── statistics_view.py
│   │   ├── history_view.py
│   │   ├── goals_view.py
│   │   ├── settings_view.py
│   │   └── dialogs.py
│   ├── services/          # Application services
│   │   ├── notification_service.py
│   │   ├── sound_service.py
│   │   ├── export_service.py
│   │   ├── backup_service.py
│   │   └── theme_service.py
│   └── utils/             # Utilities
│       └── __init__.py
├── tests/                 # Test suite
└── docs/                  # Documentation
```

## Database Schema

The application uses SQLite with the following tables:
- `projects` - Project definitions
- `tasks` - Task records
- `sessions` - Pomodoro session history
- `session_events` - Detailed session events
- `goals` - User goals
- `tags` - Tag definitions
- `task_tags` - Task-tag relationships
- `settings` - Application settings
- `application_state` - Timer state for recovery

## Keyboard Shortcuts

- `Space` - Start/Pause timer
- `R` - Reset timer
- `S` - Skip to next phase
- `N` - New task
- `Ctrl+1` - Dashboard
- `Ctrl+2` - Tasks
- `Ctrl+3` - Statistics
- `Ctrl+,` - Settings
- `Esc` - Exit focus mode

## Data Privacy

- 100% offline - no internet connection required
- All data stored locally in SQLite database
- No analytics or tracking
- No cloud synchronization
- Your data never leaves your computer

## License

MIT License

## Support

For issues and questions, please refer to the documentation in the `docs/` folder.
