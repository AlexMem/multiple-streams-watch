# Multiple stream watcher
Web application to watch several twitch.tv streams simultaneously

[Docker hub repository](https://hub.docker.com/r/peacefulpinkwhale/multiple-stream-watcher)

Twitch client id [required](https://dev.twitch.tv/docs/api/get-started/#register-an-application) to access TwitchApi though usable without it.
Client id can be set via environment variable TWITCH_CLIENT_ID

SSL turned off by default. Project uses twitch embed approach and it [requires](https://dev.twitch.tv/docs/embed/#embedded-experiences-requirements) host to support SSL. For localhost access it's not necessary, but when deploying on external host you might need to turn SSL on.
You can do it via environment variables. For details check [application.yaml](/src/main/resources/application.yaml)
