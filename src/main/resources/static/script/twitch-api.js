import * as ui from "./ui.js";
import * as utils from "./utils.js";

const TWITCH_AUTH_URL = "https://id.twitch.tv/oauth2/authorize";
const TWITCH_AUTH_SCOPE = "user:read:follows";
const TWITCH_VALIDATE_USER_ACCESS_TOKEN_URL = "https://id.twitch.tv/oauth2/validate";
const TWITCH_GET_USERS_URL = "https://api.twitch.tv/helix/users";
const TWITCH_GET_STREAMS_URL = "https://api.twitch.tv/helix/streams";
const TWITCH_GET_FOLLOWED_LIVE_STREAMS_URL = "https://api.twitch.tv/helix/streams/followed";
const TWITCH_GET_FOLLOWED_CHANNELS_URL = "https://api.twitch.tv/helix/channels/followed";
const TWITCH_SEARCH_CHANNELS_URL = "https://api.twitch.tv/helix/search/channels";
const TWITCH_CREATE_EVENT_SUB_SUBSCRIPTION_URL = "https://api.twitch.tv/helix/eventsub/subscriptions";
const TWITCH_REVOKE_USER_ACCESS_TOKEN_URL = "https://id.twitch.tv/oauth2/revoke";

const USER_ACCESS_TOKEN_KEY = "user-access-token";
const FCH_INFOS_POLLING_INTERVAL_MS = 60000;

let twitchClientId;
let twitchAuthParametrizedUrl;
let userAccessToken;
let fChInfosPollingTimerId;

function applyTwitchClientId(value) {
    twitchClientId = value;
    twitchAuthParametrizedUrl = TWITCH_AUTH_URL +
        "?client_id=" + twitchClientId +
        "&redirect_uri=" + window.location.origin +
        "&response_type=token" +
        "&scope=" + TWITCH_AUTH_SCOPE +
        "&state=" + crypto.randomUUID();
    document.getElementById("twitch-login-btn")
            .setAttribute("href", twitchAuthParametrizedUrl);
}

function checkAndApplyUserAccessToken(newUserAccessToken) {
    if (newUserAccessToken !== undefined) {
        localStorage.setItem(USER_ACCESS_TOKEN_KEY, newUserAccessToken);
    }

    userAccessToken = localStorage.getItem(USER_ACCESS_TOKEN_KEY);
    if (userAccessToken !== null) {
        validateUserAccessToken(userAccessToken, response => {
            utils.setAttribute("twitch-login-btn", "style", "display: none");
            requestAuthorizedUserInfo(response => {
                let loggedUser = response.data[0];
                utils.removeAttribute("profile", "style");
                document.getElementById("nickname").innerHTML = loggedUser.display_name;
                utils.setAttribute("profile-img", "src", loggedUser.profile_image_url);
                updateFChInfosPollingTimer(loggedUser);
            });
        }, reason => {
            utils.removeAttribute("twitch-login-btn", "style");
        });
    } else {
        utils.removeAttribute("twitch-login-btn", "style");
    }
}

function updateFChInfosPollingTimer(loggedUser) {
    clearInterval(fChInfosPollingTimerId);
    getFollowedChannelsInfos(loggedUser);
    fChInfosPollingTimerId = setInterval(() => getFollowedChannelsInfos(loggedUser), FCH_INFOS_POLLING_INTERVAL_MS);
}

function getFollowedChannelsInfos(loggedUser) {
    requestFollowedChannels(loggedUser.id, response => {
        let userIds = [...response.data].map(stream => stream.broadcaster_id);
        requestUsersInfo(userIds, response => {
            [...response.data].forEach(user => {
                ui.FOLLOWED_CHANNELS_MAP.set(user.id, {
                    id: user.id,
                    login: user.login,
                    displayName: user.display_name,
                    profileImageUrl: user.profile_image_url,
                    live: false
                })
            });
            requestUsersStreams(userIds, "live", response => {
                [...response.data].forEach(stream => {
                    let followedChannel = ui.FOLLOWED_CHANNELS_MAP.get(stream.user_id);
                    if (followedChannel !== undefined) {
                        followedChannel.live = true;
                        followedChannel.streamTitle = stream.title;
                        followedChannel.category = stream.game_name;
                        followedChannel.viewerCounter = stream.viewer_count;
                        followedChannel.thumbnailUrl = stream.thumbnail_url.replace("{width}x{height}", "640x360");
                    }
                });
                ui.updateFollowedChannelsBar();
            });
        });
    });
}

function validateUserAccessToken(_userAccessToken, onSuccess, onError) {
    fetch(TWITCH_VALIDATE_USER_ACCESS_TOKEN_URL, {
        method: "GET",
        headers: {
            "Authorization": "OAuth " + _userAccessToken
        }
    }).then(value => value.json())
      .then(response => {
          if (response.client_id === undefined) {
              throw response;
          }
          onSuccess(response);
      })
      .catch(reason => {
          console.error("Failed to validate user access token: " + reason.message);
          onError(reason);
      });
}

function requestAuthorizedUserInfo(onSuccess) {
    fetch(TWITCH_GET_USERS_URL, {
        method: "GET",
        headers: {
            "Authorization": "Bearer " + userAccessToken,
            "Client-Id": twitchClientId
        }
    }).then(value => value.json())
      .then(response => {
          // console.debug("Authorized user info: " + JSON.stringify(response));
          onSuccess(response);
      })
      .catch(reason => console.error("Failed to get user info: " + reason.message));
}

function requestFollowedLiveStreams(userId, onSuccess, cursor) {
    fetch(TWITCH_GET_FOLLOWED_LIVE_STREAMS_URL + "/?user_id=" + userId + (cursor !== undefined ? "&after=" + cursor : ""), {
        method: "GET",
        headers: {
            "Authorization": "Bearer " + userAccessToken,
            "Client-Id": twitchClientId
        }
    }).then(value => value.json())
      .then(response => {
          // console.debug("Followed live streams: " + JSON.stringify(response));
          onSuccess(response);
          if (response.pagination.cursor !== undefined) {
              requestFollowedLiveStreams(userId, onSuccess, response.pagination.cursor);
          }
      })
      .catch(reason => console.error("Failed to get followed live streams of authorized user: " + reason.message));
}

function requestFollowedChannels(userId, onSuccess, cursor) {
    fetch(TWITCH_GET_FOLLOWED_CHANNELS_URL + "/?user_id=" + userId + "&first=100" + (cursor !== undefined ? "&after=" + cursor : ""), {
        method: "GET",
        headers: {
            "Authorization": "Bearer " + userAccessToken,
            "Client-Id": twitchClientId
        }
    }).then(value => value.json())
      .then(response => {
          // console.debug("Followed channels: " + JSON.stringify(response));
          onSuccess(response);
          if (response.pagination.cursor !== undefined) {
              requestFollowedChannels(userId, onSuccess, response.pagination.cursor);
          }
      })
      .catch(reason => console.error("Failed to get followed channels of authorized user: " + reason.message));
}

function requestUsersInfo(userIds, onSuccess) {
    fetch(TWITCH_GET_USERS_URL + "/?" + userIds.map(userId => "id=" + userId).join("&"), {
        method: "GET",
        headers: {
            "Authorization": "Bearer " + userAccessToken,
            "Client-Id": twitchClientId
        }
    }).then(value => value.json())
      .then(response => {
          // console.debug("Users info: " + JSON.stringify(response));
          onSuccess(response);
      })
      .catch(reason => console.error("Failed to get user info: " + reason.message));
}

function requestUsersStreams(userIds, type, onSuccess) {
    if (userIds === undefined) {
        return;
    }

    fetch(TWITCH_GET_STREAMS_URL + "/?" + userIds.map(userId => "user_id=" + userId).join("&") + ("&type=" + type ?? "all") + "&first=100", {
        method: "GET",
        headers: {
            "Authorization": "Bearer " + userAccessToken,
            "Client-Id": twitchClientId
        }
    }).then(value => value.json())
      .then(response => {
          // console.debug("Stream info: " + JSON.stringify(response));
          onSuccess(response);
      })
      .catch(reason => console.error("Failed to get stream info: " + reason.message));
}

function requestSearchChannels(query, first, onSuccess) {
    if (query === "" || userAccessToken === undefined) {
        return;
    }

    fetch(TWITCH_SEARCH_CHANNELS_URL + "/?query=" + query + "&first=" + first, {
        method: "GET",
        headers: {
            "Authorization": "Bearer " + userAccessToken,
            "Client-Id": twitchClientId
        }
    }).then(value => value.json())
      .then(response => {
          // console.debug("Stream info: " + JSON.stringify(response));
          onSuccess(response);
      })
      .catch(reason => console.error("Failed to search channels: " + reason.message));
}

function requestCreateEventSub(type, version, condition, sessionId) {
    if (type === "" || version === "") {
        return;
    }

    fetch(TWITCH_CREATE_EVENT_SUB_SUBSCRIPTION_URL, {
        method: "POST",
        headers: {
            "Authorization": "Bearer " + userAccessToken,
            "Client-Id": twitchClientId,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            type: type,
            version: version,
            condition: condition,
            transport: {
                method: "websocket",
                session_id: sessionId
            }
        })
    }).then(value => value.json())
      .then(response => {
          // console.debug("Event sub created: " + JSON.stringify(response));
      })
      .catch(reason => console.error("Failed to create event sub: " + reason.message));
}

function requestRevokeUserAccessToken(onSuccess) {
    fetch(TWITCH_REVOKE_USER_ACCESS_TOKEN_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: `client_id=${twitchClientId}&token=${userAccessToken}`
    }).then(value => value.status === 200 ? {status: 200} : value.json())
      .then(response => {
          // console.debug("User access token revocation response: " + JSON.stringify(response));
          localStorage.removeItem(USER_ACCESS_TOKEN_KEY);
          onSuccess(response);
      })
      .catch(reason => console.error("Failed to revoke user access token: " + reason.message));
}

export {
    applyTwitchClientId, checkAndApplyUserAccessToken, validateUserAccessToken,
    requestAuthorizedUserInfo, requestUsersInfo, requestFollowedLiveStreams,
    requestUsersStreams, requestSearchChannels, requestCreateEventSub, requestRevokeUserAccessToken
};
