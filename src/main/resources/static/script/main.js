import * as ui from "./ui.js";
import * as twitchApi from "./twitch-api.js";
import * as utils from "./utils.js";

const SERVER_METADATA_URL = window.location.origin + "/rest/metadata";

fetch(SERVER_METADATA_URL)
    .then(value => value.json())
    .then(metadata => {
        // console.debug("Obtained metadata " + JSON.stringify(metadata));
        ui.applyVersion(metadata["version"]);
        const metadataTwitchClientId = metadata["twitch-client-id"];
        if (metadataTwitchClientId === undefined || metadataTwitchClientId === "") {
            return;
        }
        twitchApi.applyTwitchClientId(metadataTwitchClientId);
        twitchApi.checkAndApplyUserAccessToken();
    })
    .catch(reason => console.error("Failed to obtain metadata: " + JSON.stringify(reason)));

window.addEventListener("load", () => {
    ui.resetChannelInfoTooltip();
    ui.initSearchInputEventListeners();
    document.getElementById("add-view-btn").addEventListener("click", () => ui.addView(document.getElementById("add-view-input").value));
    document.getElementById("mode-free-btn").addEventListener("click", () => ui.switchToMode(ui.MODE_FREE));
    document.getElementById("mode-first-big-btn").addEventListener("click", () => ui.switchToMode(ui.MODE_FIRST_BIG));
    document.getElementById("logout-btn").addEventListener("click", () => ui.logout());
})

let hashParams = utils.parseHashParams(window.location.hash);
if (hashParams.access_token !== undefined) {
    console.debug("Authentication hash url " + window.location.hash);
    window.location.hash = "";
    twitchApi.checkAndApplyUserAccessToken(hashParams.access_token);
}
