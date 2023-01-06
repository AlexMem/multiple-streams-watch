var emptyViewListPlaceholderVisible = true;

function spawnTwitchEmbed(channelName, enableChat) {
    let layout = enableChat ? "video-with-chat" : "video";
    let twitchEmbedId = getTwitchEmbedId(channelName);
    let embed = new Twitch.Embed(twitchEmbedId, {
        width: "100%",
        height: "100%",
        channel: channelName,
        layout: layout
        // parent: ["twitch.tv"]
    });
    embed.addEventListener(Twitch.Embed.VIDEO_READY, () => {
        let player = embed.getPlayer();
        player.setQuality("360p");
        player.play();
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
    checkIfViewListEmpty();
}

function removeView(channelName) {
    let viewList = document.getElementById("view-list");
    let view = document.getElementById(getView(channelName));
    viewList.removeChild(view);
    checkIfViewListEmpty();
}

function toggleChat(channelName, enabled) {
    let twitchEmbedId = getTwitchEmbedId(channelName);
    let elementById = document.getElementById(twitchEmbedId);
    elementById.innerHTML = "";
    spawnTwitchEmbed(channelName, enabled);
}

function checkIfViewListEmpty() {
    let viewList = document.getElementById("view-list");
    if (viewList.hasChildNodes()) {
        if (emptyViewListPlaceholderVisible) {
            setAttribute("empty-vl-placeholder", "style", "display: none");
            emptyViewListPlaceholderVisible = false;
        }
    } else {
        if (!emptyViewListPlaceholderVisible) {
            removeAttribute("empty-vl-placeholder", "style");
            emptyViewListPlaceholderVisible = true;
        }
    }
}

function setAttribute(elementId, attribute, value) {
    document.getElementById(elementId).setAttribute(attribute, value);
}

function removeAttribute(elementId, attribute) {
    document.getElementById(elementId).removeAttribute(attribute);
}
