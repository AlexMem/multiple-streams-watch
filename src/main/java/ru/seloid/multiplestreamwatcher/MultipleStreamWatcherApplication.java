package ru.seloid.multiplestreamwatcher;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@EnableConfigurationProperties
@ConfigurationPropertiesScan
@SpringBootApplication(exclude = {UserDetailsServiceAutoConfiguration.class})
public class MultipleStreamWatcherApplication {
    public static void main(final String[] args) {
        SpringApplication.run(MultipleStreamWatcherApplication.class, args);
    }
}
