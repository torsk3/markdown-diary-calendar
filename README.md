# Markdown Calendar for VS Code

A Visual Studio Code extension that provides a sidebar calendar for creating and managing daily markdown files.

## Features

- 📅 Sidebar calendar with easy date navigation
- 📝 Automatically creates and opens daily markdown files
- 🎯 Highlights today's date for quick reference
- 🎨 Integrates with VS Code's theme
- ⚡ Quick "Go to Today" navigation
- 🔧 Configurable file path patterns

![Calendar Preview](/resources/calendar-preview.png)

## Installation

1. Open VS Code
2. Press `Ctrl+P` / `Cmd+P`
3. Type `ext install markdown-calendar`

## Usage

1. Click the calendar icon in the activity bar (sidebar)
2. Navigate between months using the arrow buttons
3. Click any date to create/open a markdown file for that date
4. Use the "Go to Today" button to quickly return to the current date

### Creating Files

When you click a date, the extension will:
- Create a new markdown file if it doesn't exist
- Open an existing file if it already exists
- Follow your configured file path pattern
- Add a basic header with the date

### File Path Configuration

You can customize how the markdown files are organized using the following patterns:

- `YYYY` - Four digit year (e.g., 2024)
- `YY` - Two digit year (e.g., 24)
- `MM` - Two digit month (e.g., 01-12)
- `DD` - Two digit day (e.g., 01-31)

Default pattern: `YYYY/MM/DD.md`

Example patterns:
- `YYYY/MM/DD.md` → `2024/03/15.md`
- `diary/YYYY/MM/DD.md` → `diary/2024/03/15.md`
- `journal-YYYY-MM-DD.md` → `journal-2024-03-15.md`

## Extension Settings

This extension contributes the following settings:

* `markdownCalendar.filePathPattern`: Pattern for markdown file paths
  - Default: `YYYY/MM/DD.md`
  - Example: `diary/YYYY/MM/DD.md`

To change settings:
1. Open VS Code settings (`Ctrl+,` / `Cmd+,`)
2. Search for "Markdown Calendar"
3. Edit the "File Path Pattern" setting

Or add to your `settings.json`:
```json
{
    "markdownCalendar.filePathPattern": "YYYY/MM/DD.md"
}
