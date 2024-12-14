import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {
    const provider = new CalendarViewProvider(context.extensionUri);
    
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            "markdown-calendar.calendarView",
            provider
        )
    );
}

class CalendarViewProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;

    constructor(
        private readonly _extensionUri: vscode.Uri,
    ) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(async message => {
            if (message.command === 'dateSelected') {
                await this.handleDateSelection(new Date(message.date));
            }
        });
    }

    private async handleDateSelection(selectedDate: Date) {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('Please open a workspace folder first');
            return;
        }

        const config = vscode.workspace.getConfiguration('markdownCalendar');
        const filePathPattern = config.get<string>('filePathPattern') || 'YYYY/MM/DD.md';

        const filePath = this.generateFilePath(workspaceFolders[0].uri.fsPath, selectedDate, filePathPattern);

        // Create directory if it doesn't exist
        const directory = path.dirname(filePath);
        if (!fs.existsSync(directory)) {
            fs.mkdirSync(directory, { recursive: true });
        }

        // Create file if it doesn't exist
        if (!fs.existsSync(filePath)) {
            const initialContent = this.generateInitialContent(selectedDate);
            fs.writeFileSync(filePath, initialContent);
        }

        // Open the file
        const document = await vscode.workspace.openTextDocument(filePath);
        await vscode.window.showTextDocument(document);
    }

    private generateFilePath(workspacePath: string, date: Date, pattern: string): string {
        const year = date.getFullYear().toString();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');

        let filePath = pattern
            .replace(/YYYY/g, year)
            .replace(/YY/g, year.slice(-2))
            .replace(/MM/g, month)
            .replace(/DD/g, day);

        if (!filePath.endsWith('.md')) {
            filePath += '.md';
        }

        return path.join(workspacePath, filePath);
    }

    private generateInitialContent(date: Date): string {
        return `# ${date.toLocaleDateString()}\n\n`;
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        font-family: var(--vscode-font-family);
                        color: var(--vscode-foreground);
                        background-color: var(--vscode-editor-background);
                        padding: 0;
                        margin: 0;
                    }
                    .calendar {
                        width: 100%;
                    }
                    .calendar-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 5px;
                        margin-bottom: 10px;
                    }
                    .calendar-header button {
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        padding: 4px 8px;
                        cursor: pointer;
                    }
                    .calendar-header button:hover {
                        background: var(--vscode-button-hoverBackground);
                    }
                    .calendar-grid {
                        display: grid;
                        grid-template-columns: repeat(7, 1fr);
                        gap: 2px;
                        padding: 5px;
                    }
                    .calendar-day {
                        padding: 5px;
                        text-align: center;
                        border: 1px solid var(--vscode-panel-border);
                        cursor: pointer;
                        font-size: 0.9em;
                        position: relative;
                    }
                    .calendar-day:hover {
                        background: var(--vscode-list-hoverBackground);
                    }
                    .day-header {
                        font-weight: bold;
                        background: var(--vscode-editor-background);
                        border: none;
                        cursor: default;
                    }
                    .empty-day {
                        border: none;
                        cursor: default;
                    }
                    .empty-day:hover {
                        background: none;
                    }
                    #currentMonth {
                        font-size: 0.9em;
                        margin: 0;
                    }
                    .today {
                        background-color: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        font-weight: bold;
                    }
                    .today:hover {
                        background-color: var(--vscode-button-hoverBackground);
                    }
                    .different-month {
                        opacity: 0.5;
                    }
                    .today::after {
                        content: '';
                        position: absolute;
                        bottom: 2px;
                        left: 50%;
                        transform: translateX(-50%);
                        width: 4px;
                        height: 4px;
                        border-radius: 50%;
                        background-color: var(--vscode-button-foreground);
                    }
                    .goto-today {
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        padding: 4px 8px;
                        cursor: pointer;
                        margin-top: 8px;
                        width: 100%;
                    }
                    .goto-today:hover {
                        background: var(--vscode-button-hoverBackground);
                    }
                </style>
            </head>
            <body>
                <div class="calendar">
                    <div class="calendar-header">
                        <button id="prevMonth">&lt;</button>
                        <h2 id="currentMonth"></h2>
                        <button id="nextMonth">&gt;</button>
                    </div>
                    <div class="calendar-grid" id="calendarGrid"></div>
                    <button class="goto-today" id="gotoToday">Go to Today</button>
                </div>

                <script>
                    (function() {
                        const vscode = acquireVsCodeApi();
                        let currentDate = new Date();

                        function isSameDay(date1, date2) {
                            return date1.getDate() === date2.getDate() &&
									date1.getMonth() === date2.getMonth() &&
									date1.getFullYear() === date2.getFullYear();
                        }

                        function renderCalendar() {
                            const today = new Date();
                            const year = currentDate.getFullYear();
                            const month = currentDate.getMonth();

                            const firstDay = new Date(year, month, 1);
                            const lastDay = new Date(year, month + 1, 0);
                            
                            document.getElementById('currentMonth').textContent = 
                                new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' });

                            const calendarGrid = document.getElementById('calendarGrid');
                            calendarGrid.innerHTML = '';

                            ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].forEach(day => {
                                const dayElement = document.createElement('div');
                                dayElement.className = 'calendar-day day-header';
                                dayElement.textContent = day;
                                calendarGrid.appendChild(dayElement);
                            });

                            // Previous month's days
                            for (let i = 0; i < firstDay.getDay(); i++) {
                                const lastMonthDate = new Date(year, month, -i);
                                const dayElement = document.createElement('div');
                                dayElement.className = 'calendar-day different-month';
                                dayElement.textContent = lastMonthDate.getDate();
                                calendarGrid.appendChild(dayElement);
                            }

                            // Current month's days
                            for (let day = 1; day <= lastDay.getDate(); day++) {
                                const dayElement = document.createElement('div');
                                const currentDay = new Date(year, month, day);
                                
                                dayElement.className = 'calendar-day';
                                if (isSameDay(currentDay, today)) {
                                    dayElement.classList.add('today');
                                }
                                
                                dayElement.textContent = day;
                                dayElement.addEventListener('click', () => {
                                    vscode.postMessage({
                                        command: 'dateSelected',
                                        date: new Date(year, month, day).toISOString()
                                    });
                                });
                                calendarGrid.appendChild(dayElement);
                            }

                            // Next month's days
                            const remainingCells = 42 - (firstDay.getDay() + lastDay.getDate());
                            for (let i = 1; i <= remainingCells; i++) {
                                const dayElement = document.createElement('div');
                                dayElement.className = 'calendar-day different-month';
                                dayElement.textContent = i;
                                calendarGrid.appendChild(dayElement);
                            }
                        }

                        document.getElementById('prevMonth').addEventListener('click', () => {
                            currentDate.setMonth(currentDate.getMonth() - 1);
                            renderCalendar();
                        });

                        document.getElementById('nextMonth').addEventListener('click', () => {
                            currentDate.setMonth(currentDate.getMonth() + 1);
                            renderCalendar();
                        });

                        document.getElementById('gotoToday').addEventListener('click', () => {
                            currentDate = new Date();
                            renderCalendar();
                        });

                        renderCalendar();
                    }())
                </script>
            </body>
            </html>
        `;
    }
}

export function deactivate() {}
