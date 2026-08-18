package com.ocs.api.auth;

import com.ocs.api.users.Role;
import com.ocs.api.users.User;
import com.ocs.api.users.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseSeeder {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.env:PRD}")
    private String env;

    @Value("${app.admin.username:admin@ocs.com}")
    private String adminUsername;

    @Value("${app.admin.password:admin123}")
    private String adminPassword;

    @EventListener(ApplicationReadyEvent.class)
    public void seedAdminUser() {
        if ("DEV".equalsIgnoreCase(env)) {
            log.info("Running in DEV environment. Auth bypass is enabled.");
        }
        
        if (userRepository.findByEmail(adminUsername).isEmpty()) {
            User admin = User.builder()
                    .email(adminUsername)
                    .passwordHash(passwordEncoder.encode(adminPassword))
                    .fullName("System Administrator")
                    .role(Role.ADMIN)
                    .build();
            userRepository.save(admin);
            log.info("Seeded default admin user: {}", adminUsername);
        }
    }
}
