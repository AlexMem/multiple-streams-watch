package ru.seloid.multiplestreamwatcher.controller;

import org.springframework.boot.info.BuildProperties;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.Map;

@RestController
@RequestMapping("/rest")
public class MetadataRestController {
    private final Map<String, Object> metadata;

    public MetadataRestController(final BuildProperties buildProperties) {
        metadata = collectMetadata(buildProperties);
    }

    @GetMapping("/metadata")
    public Map<String, Object> getMetadata() {
        return metadata;
    }

    private Map<String, Object> collectMetadata(final BuildProperties buildProperties) {
        return Collections.singletonMap("version", buildProperties.getVersion());
    }
}
