function spawnTwitchEmbed(channelName, enableChat) {
    let layout = enableChat ? "video-with-chat" : "video";
    let twitchEmbedId = getTwitchEmbedId(channelName);
    new Twitch.Embed(twitchEmbedId, {
        width: "100%",
        height: "100%",
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
    view.className = "view flex"
    viewList.append(view);
    view.innerHTML =
        "<div class='view-header flex'>" +
            "<h3 class='channel-nameplate'>" + channelName + "</h3>" +
            "<div class='chat-toggler-box flex'>" +
                "<label for='" + chatToggleCheckboxId + "' class='chat-toggler-label'>" +
                "<img class='chat-toggler-label-image' src='image/chat.png'>" +
                "</label>" +
                "<input id='" + chatToggleCheckboxId + "' type='checkbox' class='chat-toggler visually-hidden' onclick='toggleChat(\"" + channelName + "\", document.getElementById(\"" + chatToggleCheckboxId + "\").checked)'>" +
            "</div>" +
            "<div class='btn btn-close' onclick='removeView(\"" + channelName + "\")'>" +
                "<img class='btn-close-image' src='image/close.png'>" +
            "</div>" +
        "</div>" +
        "<div id='" + twitchEmbedId + "' class='twitch-embed-container'></div>";
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
