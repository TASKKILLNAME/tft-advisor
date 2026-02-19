const { ipcRenderer } = require('electron');

window.ipc = {
  send: (channel, data) => ipcRenderer.send(channel, data),
  on: (channel, callback) => ipcRenderer.on(channel, (event, ...args) => callback(...args)),
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args)
};
