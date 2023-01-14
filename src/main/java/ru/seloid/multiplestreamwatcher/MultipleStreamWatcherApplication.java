package ru.seloid.multiplestreamwatcher;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;

@SpringBootApplication(exclude = {UserDetailsServiceAutoConfiguration.class})
public class MultipleStreamWatcherApplication {
    public static void main(final String[] args) {
        SpringApplication.run(MultipleStreamWatcherApplication.class, args);
    }
}
