import {
    app,
    BrowserWindow,
    globalShortcut,
    Notification,
    ipcMain,
    Tray,
    Menu,
} from 'electron';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.APP_ROOT = path.join(__dirname, '..');

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
    ? path.join(process.env.APP_ROOT, 'public')
    : RENDERER_DIST;

let win: BrowserWindow | null;
let tray: Tray | null;
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    console.log('already running');
    app.quit();
    process.exit(0);
}

// 첫 번째 인스턴스인 경우
app.on('second-instance', (event, commandLine, workingDirectory) => {
    console.log('second instance detected');
    if (win) {
        if (win.isMinimized()) {
            win.restore();
        }
        win.show();
        win.focus();
    }
});
function createWindow() {
    win = new BrowserWindow({
        icon: path.join(process.env.VITE_PUBLIC, 'holysymbol.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.mjs'),
            devTools: true,
        },
        alwaysOnTop: false,
        skipTaskbar: false,
        width: 500,
        minWidth: 500,
        height: 1000,
        minHeight: 1000,
    });

    // Test active push message to Renderer-process.
    win.webContents.on('did-finish-load', () => {
        win?.webContents.send('main-process-message', new Date().toLocaleString());
    });

    win.on('close', (event) => {
        event.preventDefault();
        win?.hide();
    });

    // if (VITE_DEV_SERVER_URL) {
    //     win.loadURL(VITE_DEV_SERVER_URL);
    // } else {
    //     // win.loadFile('dist/index.html')
    //     win.loadFile(path.join(RENDERER_DIST, 'index.html'));
    // }
    win.loadURL('https://holy-symbol-timer.vercel.app');
}

function createTray() {
    // 트레이 아이콘 생성
    tray = new Tray(path.join(process.env.VITE_PUBLIC, 'holysymbol.png'));

    // 트레이 메뉴 생성
    const contextMenu = Menu.buildFromTemplate([
        {
            label: '창 보이기',
            click: () => {
                if (win) {
                    win.show();
                    win.focus();
                }
            },
        },
        {
            label: '리셋',
            click: () => {
                if (win) {
                    win.webContents.send('keyboard-shortcut', 'reset');
                }
            },
        },
        { type: 'separator' },
        {
            label: '종료',
            click: () => {
                app.quit();
            },
        },
    ]);

    tray.setContextMenu(contextMenu);
    tray.setToolTip('HolySymbol');

    // 트레이 아이콘 클릭 시 창 토글
    tray.on('click', () => {
        if (win) {
            if (win.isVisible()) {
                win.hide();
            } else {
                win.show();
                win.focus();
            }
        }
    });
}

function registerGlobalShortcuts() {
    // Ctrl+Space로 재개
    globalShortcut.register('CommandOrControl+Space', () => {
        if (win) {
            win.webContents.send('keyboard-shortcut', 'reset');
        }
    });
}

function showToastNotification(title: string, body: string) {
    if (Notification.isSupported()) {
        const notification = new Notification({
            title: title,
            body: body,
            icon: path.join(process.env.VITE_PUBLIC, 'holysymbol.png'),
            silent: false,
        });

        notification.show();

        // 3초 후 자동으로 닫기
        setTimeout(() => {
            notification.close();
        }, 3000);
    }
}

ipcMain.handle('show-toast', async (_event, title: string, body: string) => {
    showToastNotification(title, body);
    return true;
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
        win = null;
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (process.platform === 'darwin' && BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

app.on('before-quit', () => {
    if (tray) {
        tray.destroy();
        tray = null;
    }

    if (win) {
        win.destroy();
        win = null;
    }
});

app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    createWindow();
    createTray();
    registerGlobalShortcuts();
});
