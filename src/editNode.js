const { remote, ipcRenderer, ipcMain } = require("electron");
const dialog = remote.dialog;
const WIN = remote.getCurrentWindow();
const os = require("os");
const fs = require("fs");
const path = require("path");

const typeRadios = document.querySelectorAll("input[name='node-types'");
const nodeText = document.querySelector("#node-text");
const updateBtn = document.querySelector("#update-node");
let nodeData;

flattenText = (nodeText) => {
    let text = "";
    nodeText.forEach(t => {
        if (text === "") {
            text = t.text;
        } else {
            text = text + " " + t.text;
        }
    });
    return text;
}

ipcRenderer.on("node:data", (e, data) => {
    nodeData = data;
    for (let t of typeRadios) {
        if (t.value === data.type) {
            t.checked = true;
        } else {
            t.checked = false;
        }
    }
    nodeText.value = flattenText(data.text);
});

updateBtn.addEventListener("click", (e) => {
    ipcRenderer.send("update:node", {
        id: nodeData.id,
        type: Array.from(typeRadios).filter(t => t.checked)[0].value,
        text: nodeText.value,
        parent: nodeData.parent
    })
});