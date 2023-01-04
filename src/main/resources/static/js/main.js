function spawnTwitchEmbed(channelName, enableChat) {
    let layout = enableChat ? "video-with-chat" : "video";
    let twitchEmbedId = getTwitchEmbedId(channelName);
    new Twitch.Embed(twitchEmbedId, {
        width: "100%",
        height: "550",
        channel: channelName,
        layout: layout
        // Only needed if this page is going to be embedded on other websites
        // parent: ["twitch.tv"]
    });
}

function getTwitchEmbedId(channelName) {
    return channelName + "-twitch-embed";
}

function getChatToggleCheckboxId(channelName) {
    return channelName + "-chat-toggle-checkbox";
}

function getView(channelName) {
    return channelName + "-view";
}

function addView(channelName) {
    let twitchEmbedId = getTwitchEmbedId(channelName);
    if (channelName==="" || document.getElementById(twitchEmbedId)) {
        return;
    }

    let chatToggleCheckboxId = getChatToggleCheckboxId(channelName);
    let viewList = document.getElementById("view-list");
    let view = document.createElement("div");
    view.id = getView(channelName);
    view.className = "view"
    viewList.append(view);
    view.innerHTML =
        "<div>" +
            "<a class='channel-nameplate'>" + channelName + "</a>" +
            " <a class='azure-text'>Chat</a><input id='" + chatToggleCheckboxId + "' type='checkbox' onclick='toggleChat(\"" + channelName + "\", document.getElementById(\"" + chatToggleCheckboxId + "\").checked)'>" +
            " <button onclick='removeView(\"" + channelName + "\")'>Close</button>" +
        "</div>" +
        "<div id='" + twitchEmbedId + "'></div>";
    spawnTwitchEmbed(channelName, false);
}

function removeView(channelName) {
    let viewList = document.getElementById("view-list");
    let view = document.getElementById(getView(channelName));
    viewList.removeChild(view);
}

function toggleChat(channelName, enabled) {
    let twitchEmbedId = getTwitchEmbedId(channelName);
    let elementById = document.getElementById(twitchEmbedId);
    elementById.innerHTML = "";
    spawnTwitchEmbed(channelName, enabled);
}
