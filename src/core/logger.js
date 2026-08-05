export class Logger {
    static _uiManager = null;
    static setUIManager(ui) {
        this._uiManager = ui;
    }
    static _log(level, msg) {
        const time = new Date().toLocaleTimeString();
        const formatted = `[${time}] [${level}] ${msg}`;
        if (this._uiManager) {
            this._uiManager.addLog(formatted, level.toLowerCase());
        }
    }
    static info(msg) {
        this._log('INFO', msg);
    }
    static error(msg) {
        this._log('ERROR', msg);
    }
    static warn(msg) {
        this._log('WARN', msg);
    }
}
