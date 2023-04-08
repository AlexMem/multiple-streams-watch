package ru.seloid.multiplestreamwatcher.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("app")
public class ApplicationProperties {
    private String twitchClientId;

    public String getTwitchClientId() {
        return twitchClientId;
    }

    public void setTwitchClientId(final String twitchClientId) {
        this.twitchClientId = twitchClientId;
    }
}
