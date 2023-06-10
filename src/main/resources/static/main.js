// Modules to control application life and create native browser window
const { app, BrowserWindow, session } = require('electron');
const path = require('path');

const createWindow = () => {
    sslFixTrick();

    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    });

    // and load the index.html of the app.
    mainWindow.loadFile('index.html');

    // Open the DevTools.
    mainWindow.webContents.openDevTools();
}

const sslFixTrick = () => {
    session.defaultSession.webRequest.onBeforeRequest({
        urls: [
            'https://embed.twitch.tv/*channel=*'
        ]
    }, (details, cb) => {
        var redirectURL = details.url;

        var params = new URLSearchParams(redirectURL.replace('https://embed.twitch.tv/',''));
        if (params.get('parent') !== '') {
            cb({});
            return;
        }
        params.set('parent', 'localhost');
        params.set('referrer', 'https://localhost/');

        var redirectURL = 'https://embed.twitch.tv/?' + params.toString();
        console.log('Adjust to', redirectURL);

        cb({
            cancel: false,
            redirectURL
        });
    });

    // works for dumb iFrames
    session.defaultSession.webRequest.onHeadersReceived({
        urls: [
            'https://www.twitch.tv/*',
            'https://player.twitch.tv/*',
            'https://embed.twitch.tv/*'
        ]
    }, (details, cb) => {
        var responseHeaders = details.responseHeaders;

        console.log('headers', details.url, responseHeaders);

        delete responseHeaders['Content-Security-Policy'];
        //console.log(responseHeaders);

        cb({
            cancel: false,
            responseHeaders
        });
    });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.