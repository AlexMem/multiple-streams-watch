const LAST_OPENED_STREAMS_NAME = "last-opened-streams";

function load() {
    let lastOpenedStreams = JSON.parse(localStorage.getItem(LAST_OPENED_STREAMS_NAME));
    if (lastOpenedStreams === null) {
        lastOpenedStreams = [];
        save(lastOpenedStreams);
    }
    return new Set([...lastOpenedStreams]);
}

function save(lastOpenedStreams) {
    localStorage.setItem(LAST_OPENED_STREAMS_NAME, JSON.stringify([...lastOpenedStreams]));
}

function add(channelName) {
    let lastOpenedStreams = load();
    lastOpenedStreams.add(channelName);
    save(lastOpenedStreams);
}

function remove(channelName) {
    let lastOpenedStreams = load();
    lastOpenedStreams.delete(channelName);
    save(lastOpenedStreams);
}

function clear() {
    localStorage.removeItem(LAST_OPENED_STREAMS_NAME);
}

export {
    load, add, remove, clear
}
