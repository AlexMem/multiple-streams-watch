import * as twitchApi from "./twitch-api.js";
import * as lastOpenedStreams from "./last-opened-streams.js";
import * as utils from "./utils.js";

const MODE_FREE = "MODE_FREE";
const MODE_FIRST_BIG = "MODE_FIRST_BIG";

const LAYOUT_MODE_KEY = "layout-mode";

const FOLLOWED_CHANNELS_MAP = new Map();

const SUB_TYPE_HANDLER_MAP = new Map([
    ["channel.update", handleChannelUpdateSubType],
    ["stream.online", handleStreamOnlineSubType],
    ["stream.offline", handleStreamOfflineSubType]
]);

let currentMode = MODE_FREE;
let emptyViewListPlaceholderVisible = true;

loadCurrentMode();
lastOpenedStreams.load().forEach(channelName => addView(channelName));

function loadCurrentMode() {
    let lastSavedMode = localStorage.getItem(LAYOUT_MODE_KEY);
    if (lastSavedMode === null) {
        localStorage.setItem(LAYOUT_MODE_KEY, MODE_FREE);
        lastSavedMode = MODE_FREE;
    }
    switchToMode(lastSavedMode);
}

function applyVersion(value) {
    let headerInfo = document.getElementById("header-info");
    headerInfo.innerHTML = headerInfo.innerHTML.replace("{version}", "v" + value);
}

function updateFollowedChannelsBar() {
    FOLLOWED_CHANNELS_MAP.forEach(channel => {
        let fChElem = document.getElementById(getFollowedChannelElId(channel.login));
        if (channel.live) {
            if (fChElem === null) {
                addFollowedChannel(channel);
            } else {
                updateFollowedChannel(channel);
            }
        } else {
            if (fChElem !== null) {
                fChElem.remove();
            }
        }
    });
}

function addFollowedChannel(channel) {
    let followedBar = document.getElementById("followed-bar");
    let followedChannel = document.createElement("div");
    followedChannel.id = getFollowedChannelElId(channel.login);
    followedChannel.classList.add("followed-channel");
    followedChannel.innerHTML = `<img id='${getFollowedChannelImgElId(channel.image)}' class='followed-channel-img' src='${channel.profileImageUrl}'>`;
    followedChannel.addEventListener("click", () => {
        addView(channel.login);
    });
    followedChannel.addEventListener("mouseleave", () => {
        resetChannelInfoTooltip();
    });
    followedChannel.addEventListener("mouseenter", () => {
        let cachedChannel = FOLLOWED_CHANNELS_MAP.get(channel.id);
        let tooltip = fillChannelInfoTooltip(cachedChannel);
        let tooltipCoords = tooltip.getBoundingClientRect();
        let fChCoords = followedChannel.getBoundingClientRect();
        let tooltipX = (fChCoords.left + fChCoords.right) / 2 + 50;
        let tooltipY = (fChCoords.top + fChCoords.bottom) / 2 - tooltipCoords.height / 2;
        tooltip.setAttribute("style", `top: ${tooltipY}px; left: ${tooltipX}px`);
    });
    followedBar.appendChild(followedChannel);
}

function updateFollowedChannel(channel) {
    let followedChannelImgEl = document.getElementById(getFollowedChannelImgElId(channel.login));
    if (followedChannelImgEl !== null) {
        let prevImgUrl = followedChannelImgEl.getAttribute("src");
        if (prevImgUrl !== channel.profileImageUrl) {
            followedChannelImgEl.setAttribute("src", channel.profileImageUrl);
        }
    }
}

function fillChannelInfoTooltip(channel) {
    let tooltip = document.getElementById("channel-info-tooltip");
    tooltip.removeAttribute("style");
    utils.replaceTextInInnerHTML("channel-info-tooltip-channel-name", "{channel-name}", channel.displayName);
    utils.replaceTextInInnerHTML("channel-info-tooltip-category", "{category}", channel.category);
    utils.replaceTextInInnerHTML("channel-info-tooltip-stream-name", "{stream-name}", channel.streamTitle);
    utils.replaceTextInInnerHTML("channel-info-tooltip-viewer-counter", "{viewer-counter}", channel.viewerCounter);
    return tooltip;
}

function resetChannelInfoTooltip() {
    let tooltip = document.getElementById("channel-info-tooltip");
    tooltip.setAttribute("style", "display: none");
    tooltip.innerHTML = "<span id='channel-info-tooltip-channel-name'>{channel-name} • <span id='channel-info-tooltip-category'>{category}</span></span>" +
        "<span id='channel-info-tooltip-stream-name'>{stream-name}</span>" +
        "<span id='channel-info-tooltip-viewer-counter'><span style='color: red'>⏺</span> {viewer-counter} viewers</span>";
}

function handleChannelUpdateSubType(payload) {
    let event = payload.event;
    let channel = FOLLOWED_CHANNELS_MAP.get(event.broadcaster_user_id);
    channel.title = event.title;
    channel.category = event.category_name;
}

function handleStreamOnlineSubType(payload) {
    let event = payload.event;
    let channel = FOLLOWED_CHANNELS_MAP.get(event.broadcaster_user_id);
    if (channel !== null) {
        twitchApi.requestUsersStreams([...[channel.id]], "live", response => {
            let stream = response.data[0];
            channel.live = true;
            channel.streamTitle = stream.title;
            channel.category = stream.game_name;
            channel.viewerCounter = stream.viewer_count;
        });
        updateFollowedChannelsBar();
    }
}

function handleStreamOfflineSubType(payload) {
    let channel = FOLLOWED_CHANNELS_MAP.get(payload.event.broadcaster_user_id);
    channel.live = false;
    updateFollowedChannelsBar();
}

function initSearchInputEventListeners() {
    let addViewInput = document.getElementById('add-view-input');
    addViewInput.addEventListener("keydown", event => {
        if (event.keyCode===13) {
            addView(addViewInput.value);
        }
    });
    let onSearchSucceed = response => {
        let searchResultList = document.getElementById("search-result-list");
        clearSearchResultList(searchResultList);
        [...response.data].forEach(item => {
            let searchItem = document.createElement("div");
            searchItem.classList.add("search-result-list-item");
            searchItem.innerHTML = (item.is_live ? "<span style='color: red'>⏺</span> " : "") + item.broadcaster_login;
            searchItem.addEventListener("click", () => {
                clearSearchResultList(searchResultList);
                addView(item.broadcaster_login);
            });
            searchResultList.appendChild(searchItem);
        });
    };
    addViewInput.addEventListener("focusin", event => {
        twitchApi.requestSearchChannels(addViewInput.value, 5, onSearchSucceed);
    });
    addViewInput.addEventListener("input", () => {
        if (addViewInput.value === "") {
            clearSearchResultList();
        }
        twitchApi.requestSearchChannels(addViewInput.value, 5, response => {
            if (addViewInput.value === "") {
                clearSearchResultList();
            } else {
                onSearchSucceed(response);
            }
        });
    });
}

function clearSearchResultList(searchResultList) {
    searchResultList = searchResultList ?? document.getElementById("search-result-list");
    while (searchResultList.hasChildNodes()) {
        searchResultList.removeChild(searchResultList.firstChild);
    }
}

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
        player.setQuality("480p");
        player.play();
    });
}

function getTwitchEmbedId(channelName) {
    return channelName + "-twitch-embed";
}

function getChatToggleCheckboxId(channelName) {
    return channelName + "-chat-toggle-checkbox";
}

function getFollowedChannelElId(channelName) {
    return channelName + "-fch";
}

function getFollowedChannelImgElId(channelName) {
    return channelName + "-fch-img";
}

function getViewId(channelName) {
    return channelName + "-view";
}

function getMakeFirstBigButtonId(channelName) {
    return channelName + "-make-first-big-btn";
}

function getViewCloseButtonId(channelName) {
    return channelName + "-view-close-btn";
}

function addView(channelName) {
    let twitchEmbedId = getTwitchEmbedId(channelName);
    if (channelName === "" || document.getElementById(twitchEmbedId)) {
        return;
    }

    lastOpenedStreams.add(channelName);

    let chatToggleCheckboxId = getChatToggleCheckboxId(channelName);
    let makeFirstBigButtonId = getMakeFirstBigButtonId(channelName);
    let viewCloseButtonId = getViewCloseButtonId(channelName);
    let viewList = document.getElementById("view-list");
    let view = document.createElement("div");
    view.id = getViewId(channelName);
    view.className = "view flex " + (currentMode === MODE_FREE ? "resizable" : "notresizable");
    view.innerHTML =
        "<div class='view-header flex'>" +
            "<h3 class='channel-nameplate'>" + channelName + "</h3>" +
            "<div class='view-header-buttons flex'>" +
                "<div id='" + makeFirstBigButtonId + "' class='btn btn-make-first-big flex " + (currentMode !== MODE_FIRST_BIG ? "display-none" : "") + " tooltiped'>" +
                    "<div class='tooltip tooltip-bot'>make big</div>" +
                    "<img class='btn-make-first-big-image' src='image/arrow-left.png'>" +
                "</div>" +
                "<div class='chat-toggler-box flex tooltiped'>" +
                    "<div class='tooltip tooltip-bot'>toggle chat</div>" +
                    "<label for='" + chatToggleCheckboxId + "' class='chat-toggler-label flex'>" +
                        "<img class='chat-toggler-label-image' src='image/chat.png'>" +
                    "</label>" +
                    "<input id='" + chatToggleCheckboxId + "' type='checkbox' class='chat-toggler visually-hidden'>" +
                "</div>" +
                "<div id='" + viewCloseButtonId + "' class='btn btn-close flex'>" +
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

    document.getElementById(makeFirstBigButtonId).addEventListener("click", () => makeViewFirstBig(channelName));
    let chatToggleCheckbox = document.getElementById(chatToggleCheckboxId);
    chatToggleCheckbox.addEventListener("click", () => toggleChat(channelName, chatToggleCheckbox.checked));
    document.getElementById(viewCloseButtonId).addEventListener("click", () => removeView(channelName));
    spawnTwitchEmbed(channelName, false);
    handlePlaceholder();
}

function removeView(channelName) {
    lastOpenedStreams.remove(channelName);

    let viewList = document.getElementById("view-list");
    let view = document.getElementById(getViewId(channelName));
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
            utils.setAttribute("empty-vl-placeholder", "style", "display: none");
            emptyViewListPlaceholderVisible = false;
        }
    } else {
        if (!emptyViewListPlaceholderVisible) {
            utils.removeAttribute("empty-vl-placeholder", "style");
            emptyViewListPlaceholderVisible = true;
        }
    }
}

function anyViewsExists() {
    let views = document.getElementsByClassName("view");
    return views.length !== 0;
}

function switchToMode(viewMode) {
    if (viewMode === "" || viewMode === currentMode) {
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
    } else {
        return;
    }
    localStorage.setItem(LAYOUT_MODE_KEY, currentMode);
}

function setModeFirstBig() {
    if (currentMode !== MODE_FREE) {
        return;
    }

    let viewLayout = document.getElementById("view-layout");
    utils.replaceClass(viewLayout, "view-layout-free", "view-layout-first-big");

    let viewList = document.getElementById("view-list");
    utils.replaceClass(viewList, "view-list-free", "view-list-first-big");
    makeFirstViewOfViewListABigOne(viewLayout, viewList);

    [...document.getElementsByClassName("view")].forEach(e => {
        utils.replaceClass(e, "resizable", "notresizable");
        e.style = "";
    });

    [...viewList.getElementsByClassName("btn-make-first-big")].forEach(e => e.classList.remove("display-none"));

    currentMode = MODE_FIRST_BIG;
}

function setModeFree() {
    if (currentMode !== MODE_FIRST_BIG) {
        return;
    }

    let viewLayout = document.getElementById("view-layout");
    utils.replaceClass(viewLayout, "view-layout-first-big", "view-layout-free");

    let viewList = document.getElementById("view-list");
    utils.replaceClass(viewList, "view-list-first-big", "view-list-free");

    let firstBigs = document.getElementsByClassName("view-first-big");
    if (firstBigs.length !== 0) {
        let firstBig = firstBigs.item(0);
        firstBig.classList.remove("view-first-big");
        viewList.prepend(firstBig);
    }

    [...document.getElementsByClassName("view")].forEach(e => utils.replaceClass(e, "notresizable", "resizable"));

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
    let newFirstBig = document.getElementById(getViewId(channelName));

    viewLayout.removeChild(oldFirstBig);
    oldFirstBig.classList.remove("view-first-big");
    viewList.replaceChild(oldFirstBig, newFirstBig);

    viewLayout.prepend(newFirstBig);
    newFirstBig.classList.add("view-first-big");

    [...oldFirstBig.getElementsByClassName("btn-make-first-big")].forEach(e => e.classList.remove("display-none"));
    [...newFirstBig.getElementsByClassName("btn-make-first-big")].forEach(e => e.classList.add("display-none"));
}

function logout() {
    twitchApi.requestRevokeUserAccessToken(() => {
        lastOpenedStreams.clear();
        localStorage.removeItem(LAYOUT_MODE_KEY);
        window.location.reload();
    });
}

export {
    MODE_FREE, MODE_FIRST_BIG, FOLLOWED_CHANNELS_MAP,
    applyVersion, updateFollowedChannelsBar, addFollowedChannel, addView,
    switchToMode, resetChannelInfoTooltip, initSearchInputEventListeners,
    logout
};
