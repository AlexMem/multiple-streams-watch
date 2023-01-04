package ru.seloid.multiplestreamwatcher;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Import;
import ru.seloid.multiplestreamwatcher.config.ApplicationConfig;

@SpringBootApplication
@Import(ApplicationConfig.class)
public class MultipleStreamWatcherApplication {
    public static void main(final String[] args) {
        SpringApplication.run(MultipleStreamWatcherApplication.class, args);
    }
}
