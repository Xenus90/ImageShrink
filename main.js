const path = require("path");
const { BrowserWindow, app, Menu, ipcMain, shell } = require("electron");
const imagemin = require("imagemin");
const imageminPngquant = require("imagemin-pngquant");
const log = require("electron-log");
const imageminMozjpeg = require("imagemin-mozjpeg");
const slash = require("slash");

process.env.NODE_ENV = "production";
const isDev = process.env.NODE_ENV !== "production" ? true : false;
const isMac = process.platform === "darwin" ? true : false;

let mainWindow;
let aboutWindow;

function createMainWindow() {
    mainWindow = new BrowserWindow({
        icon: "./assets/icons/Icon_256x256.png",
        title: "Image Shrink",
        width: 500,
        height: 600,
        resizable: isDev ? true : false,
        webPreferences: { nodeIntegration: true },
    });

    mainWindow.loadFile("./app/index.html");
}

function createAboutWindow() {
    aboutWindow = new BrowserWindow({
        icon: "./assets/icons/Icon_256x256.png",
        title: "About",
        width: 300,
        height: 300,
        resizable: false,
        webPreferences: { nodeIntegration: true },
    });

    aboutWindow.loadFile("./app/about.html");
}

app.on("ready", () => {
    createMainWindow();
    const mainMenu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(mainMenu);

    mainWindow.on("ready", () => mainWindow = null);
});

app.on("window-all-closed", () => {
    if (!isMac) {
        app.quit();
    }
});

app.on("activate", () => {
    if (BrowserWindow.getAllWindows.length === 0) {
        createMainWindow();
    }
});

ipcMain.on("image:minimize", (e, data) => {
    data.dest = path.join(__dirname, "output");
    shrinkImage(data);
});

const menuTemplate = [
    ...(isMac ? [
        {
            label: app.name,
            submenu: [
                {
                    label: "About",
                    click: () => createAboutWindow(),
                }
            ]
        }
    ] : []),
    {
        role: "fileMenu"
    },
    ...(!isMac ? [
        {
            label: "About",
            click: () => createAboutWindow(),
        }
    ] : []),
    ...(isDev ? [
        {
            label: "Developer",
            submenu: [
                { role: "reload" },
                { role: "forcereload" },
                { type: "separator" },
                { role: "toggledevtools" },
            ],
        }
    ] : []),
];

async function shrinkImage({ imgPath, quality, dest }) {
    try {
        const pngQuality = quality / 100;

        await imagemin([slash(imgPath)], {
            destination: dest,
            plugins: [
                imageminMozjpeg({ quality }),
                imageminPngquant({ quality: [ pngQuality, pngQuality ] })
            ]
        });

        shell.openPath(dest);
        mainWindow.webContents.send("image:done");
    } catch (error) {
        log.error(error);
    }
}
