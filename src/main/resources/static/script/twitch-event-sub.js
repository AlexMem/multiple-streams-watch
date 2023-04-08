// Not using because Twitch EventSub have a limit of 100 subscriptions per user token (as of 2023.03.26):
//                  https://dev.twitch.tv/docs/eventsub/handling-websocket-events/#subscription-limits

const TWITCH_EVENT_SUB_ENTRY_URL = "wss://eventsub-beta.wss.twitch.tv/ws";
const MESSAGE_HANDLER_MAP = new Map([
    ["session_welcome", welcomeMessageHandler],
    ["session_keepalive", keepaliveMessageHandler],
    ["notification", notificationMessageHandler],
    ["session_reconnect", reconnectMessageHandler],
    ["revocation", revocationMessageHandler]
]);
const EMPTY_HANDLER = () => {};

let eventSubWebSocket;

function initWebSocket(onSessionIdObtained, subTypeHandlerMap, reconnectUrl) {
    let wsMetadata = {
        onSessionIdObtained: (onSessionIdObtained ?? EMPTY_HANDLER),
        subTypeHandlerMap: (subTypeHandlerMap ?? new Map())
    }

    let url = reconnectUrl ?? TWITCH_EVENT_SUB_ENTRY_URL;
    const webSocket = new WebSocket(url);
    wsMetadata.webSocket = webSocket;
    webSocket.onopen = (e) => {
        console.debug(`WS EventSub connected`);
    }
    webSocket.onmessage = (e) => {
        console.debug(`WS EventSub received message: ${e.data}`);
        let message = JSON.parse(e.data);
        wsMetadata.message = message;
        (MESSAGE_HANDLER_MAP.get(message.metadata.message_type) ?? EMPTY_HANDLER)(wsMetadata);
    }
    webSocket.onclose = (e) => {
        if (e.wasClean) {
            console.debug(`WS EventSub connection closed cleanly, code=${e.code} reason=${e.reason}`);
        } else {
            console.debug(`WS EventSub connection died`);
        }
    }
    webSocket.onerror = (e) => {
        console.debug(`WS EventSub error ${e}`);
    }
}

function welcomeMessageHandler(wsMetadata) {
    eventSubWebSocket = wsMetadata.webSocket;
    wsMetadata.onSessionIdObtained(wsMetadata.message);
    wsMetadata.keepaliveTimeoutMs = wsMetadata.message.payload.session.keepalive_timeout_seconds * 1000;
    updateKeepaliveTimer(wsMetadata);
}

function keepaliveMessageHandler(wsMetadata) {
    updateKeepaliveTimer(wsMetadata);
}

function notificationMessageHandler(wsMetadata) {
    updateKeepaliveTimer(wsMetadata);
    let payload = wsMetadata.message.payload;
    (wsMetadata.subTypeHandlerMap.get(payload.subscription.type) ?? EMPTY_HANDLER)(payload);
}

function reconnectMessageHandler(wsMetadata) {
    reconnect(wsMetadata, 99, "reconnection", wsMetadata.message.payload.session.reconnect_url);
}

function revocationMessageHandler(wsMetadata) {
    console.warn(`WS EventSub revocation message received ${wsMetadata.message}`);
}

function updateKeepaliveTimer(wsMetadata) {
    clearTimeout(wsMetadata.keepaliveTimerId);
    wsMetadata.keepaliveTimerId = setTimeout(() => {
        reconnect(wsMetadata, 98, "keepalive timeout");
    }, wsMetadata.keepaliveTimeoutMs);
}

function reconnect(wsMetadata, code, reason, reconnectUrl) {
    const oldWebSocket = wsMetadata.webSocket;
    initWebSocket(message => {
        oldWebSocket.close(code, reason);
        wsMetadata.onSessionIdObtained(message);
    }, wsMetadata.subTypeHandlerMap, reconnectUrl);
}

export {
    eventSubWebSocket, initWebSocket
};
