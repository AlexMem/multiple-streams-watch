package ru.seloid.multiplestreamwatcher.controller;

import org.springframework.boot.info.BuildProperties;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ru.seloid.multiplestreamwatcher.properties.ApplicationProperties;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/rest")
public class MetadataRestController {
    private final Map<String, Object> metadata = new HashMap<>();

    public MetadataRestController(final ApplicationProperties applicationProperties,
                                  final BuildProperties buildProperties) {
        metadata.putAll(collectMetadata(applicationProperties));
        metadata.putAll(collectMetadata(buildProperties));
    }

    @GetMapping("/metadata")
    public Map<String, Object> getMetadata() {
        return metadata;
    }

    private Map<String, Object> collectMetadata(final ApplicationProperties applicationProperties) {
        return Collections.singletonMap("twitch-client-id", applicationProperties.getTwitchClientId());
    }

    private Map<String, Object> collectMetadata(final BuildProperties buildProperties) {
        return Collections.singletonMap("version", buildProperties.getVersion());
    }
}
