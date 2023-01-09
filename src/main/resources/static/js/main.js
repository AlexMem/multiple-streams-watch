const MODE_FREE = "MODE_FREE";
const MODE_FIRST_BIG = "MODE_FIRST_BIG";

var currentMode = MODE_FREE;
var emptyViewListPlaceholderVisible = true;

function spawnTwitchEmbed(channelName, enableChat) {
    let layout = enableChat ? "video-with-chat" : "video";
    let twitchEmbedId = getTwitchEmbedId(channelName);
    let embed = new Twitch.Embed(twitchEmbedId, {
        width: "100%",
        height: "100%",
        channel: channelName,
        layout: layout
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
    view.className = "view flex " + (currentMode === MODE_FREE ? "resizable" : "notresizable");
    view.innerHTML =
        "<div class='view-header flex'>" +
            "<h3 class='channel-nameplate'>" + channelName + "</h3>" +
            "<div class='view-header-buttons flex'>" +
                "<div class='btn btn-make-first-big flex " + (currentMode !== MODE_FIRST_BIG ? "display-none" : "") + "' onclick='makeViewFirstBig(\"" + channelName + "\")'>" +
                    "<img class='btn-make-first-big-image' src='image/arrow-left.png'>" +
                "</div>" +
                "<div class='chat-toggler-box flex'>" +
                    "<label for='" + chatToggleCheckboxId + "' class='chat-toggler-label flex'>" +
                    "<img class='chat-toggler-label-image' src='image/chat.png'>" +
                    "</label>" +
                    "<input id='" + chatToggleCheckboxId + "' type='checkbox' class='chat-toggler visually-hidden' onclick='toggleChat(\"" + channelName + "\", document.getElementById(\"" + chatToggleCheckboxId + "\").checked)'>" +
                "</div>" +
                "<div class='btn btn-close flex' onclick='removeView(\"" + channelName + "\")'>" +
                    "<img class='btn-close-image' src='image/close.png'>" +
                "</div>" +
            "</div>" +
        "</div>" +
        "<div id='" + twitchEmbedId + "' class='twitch-embed-container'></div>";
    if (currentMode === MODE_FIRST_BIG && !anyViewsExists()) {
        view.classList.add("view-first-big");
        [...view.getElementsByClassName("btn-make-first-big")].forEach(e => e.classList.add("display-none"));
        document.getElementById("view-layout").prepend(view);
    } else {
        viewList.append(view);
    }
    spawnTwitchEmbed(channelName, false);
    handlePlaceholder();
}

function removeView(channelName) {
    let viewList = document.getElementById("view-list");
    let view = document.getElementById(getView(channelName));
    if (view.classList.contains("view-first-big")) {
        let viewLayout = document.getElementById("view-layout");
        viewLayout.removeChild(view);
        makeFirstViewOfViewListABigOne(viewLayout, viewList);
    } else {
        viewList.removeChild(view);
    }
    handlePlaceholder();
}

function toggleChat(channelName, enabled) {
    let twitchEmbedId = getTwitchEmbedId(channelName);
    let elementById = document.getElementById(twitchEmbedId);
    elementById.innerHTML = "";
    spawnTwitchEmbed(channelName, enabled);
}

function handlePlaceholder() {
    if (anyViewsExists()) {
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

function anyViewsExists() {
    let views = document.getElementsByClassName("view");
    return views.length !== 0;
}

function setAttribute(elementId, attribute, value) {
    document.getElementById(elementId).setAttribute(attribute, value);
}

function removeAttribute(elementId, attribute) {
    document.getElementById(elementId).removeAttribute(attribute);
}

function switchToMode(viewMode) {
    if (viewMode==="" || viewMode===currentMode) {
        return;
    }

    if (viewMode === MODE_FIRST_BIG) {
        setModeFirstBig();
        [...document.getElementsByClassName("layout-btn-chosen")].forEach(e => e.classList.remove("layout-btn-chosen"));
        document.getElementById("mode-first-big-btn").classList.add("layout-btn-chosen");
    } else if (viewMode === MODE_FREE) {
        setModeFree();
        [...document.getElementsByClassName("layout-btn-chosen")].forEach(e => e.classList.remove("layout-btn-chosen"));
        document.getElementById("mode-free-btn").classList.add("layout-btn-chosen");
    }
}

function setModeFirstBig() {
    if (currentMode !== MODE_FREE) {
        return;
    }

    let viewLayout = document.getElementById("view-layout");
    replaceClass(viewLayout, "view-layout-free", "view-layout-first-big");

    let viewList = document.getElementById("view-list");
    replaceClass(viewList, "view-list-free", "view-list-first-big");
    makeFirstViewOfViewListABigOne(viewLayout, viewList);

    [...document.getElementsByClassName("view")].forEach(e => {
        replaceClass(e, "resizable", "notresizable");
        e.style = "";
    });

    [...viewList.getElementsByClassName("btn-make-first-big")].forEach(e => e.classList.remove("display-none"));

    document.getElementById("root").setAttribute("style", "overflow: hidden;");

    currentMode = MODE_FIRST_BIG;
}

function setModeFree() {
    if (currentMode !== MODE_FIRST_BIG) {
        return;
    }

    let viewLayout = document.getElementById("view-layout");
    replaceClass(viewLayout, "view-layout-first-big", "view-layout-free");

    let viewList = document.getElementById("view-list");
    replaceClass(viewList, "view-list-first-big", "view-list-free");

    let firstBigs = document.getElementsByClassName("view-first-big");
    if (firstBigs.length !== 0) {
        let firstBig = firstBigs.item(0);
        firstBig.classList.remove("view-first-big");
        viewList.prepend(firstBig);
    }

    [...document.getElementsByClassName("view")].forEach(e => replaceClass(e, "notresizable", "resizable"));

    [...viewList.getElementsByClassName("btn-make-first-big")].forEach(e => e.classList.add("display-none"));

    document.getElementById("root").removeAttribute("style");

    currentMode = MODE_FREE;
}

function makeFirstViewOfViewListABigOne(viewLayout, viewList) {
    let first = viewList.childNodes.item(0);
    if (first) {
        viewList.removeChild(first);
        first.classList.add("view-first-big");
        [...first.getElementsByClassName("btn-make-first-big")].forEach(e => e.classList.add("display-none"));
        viewLayout.prepend(first);
    }
}

function makeViewFirstBig(channelName) {
    if (currentMode !== MODE_FIRST_BIG) {
        return;
    }

    let viewLayout = document.getElementById("view-layout");
    let viewList = document.getElementById("view-list");
    let oldFirstBig = viewLayout.firstChild;
    let newFirstBig = document.getElementById(getView(channelName));

    viewLayout.removeChild(oldFirstBig);
    oldFirstBig.classList.remove("view-first-big");
    viewList.replaceChild(oldFirstBig, newFirstBig);

    viewLayout.prepend(newFirstBig);
    newFirstBig.classList.add("view-first-big");

    [...oldFirstBig.getElementsByClassName("btn-make-first-big")].forEach(e => e.classList.remove("display-none"));
    [...newFirstBig.getElementsByClassName("btn-make-first-big")].forEach(e => e.classList.add("display-none"));
}

function replaceClass(element, oldClass, newClass) {
    element.classList.replace(oldClass, newClass);
}
