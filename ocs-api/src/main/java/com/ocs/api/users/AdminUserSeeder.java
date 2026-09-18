package com.ocs.api.users;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Bootstraps a superadmin account on startup so a fresh database isn't locked out
 * (there is no public registration endpoint — user creation requires ROLE_ADMIN).
 * Only acts if no user with the configured email exists yet; safe to run on every boot.
 * Credentials come from APP_ADMIN_USERNAME / APP_ADMIN_PASSWORD (see .env.example);
 * the values below are dev-only fallbacks.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AdminUserSeeder implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.username:admin@ocs.com}")
    private String adminUsername;

    @Value("${app.admin.password:admin123}")
    private String adminPassword;

    @Override
    public void run(ApplicationArguments args) {
        if (userRepository.findByEmail(adminUsername).isPresent()) {
            return;
        }

        User admin = User.builder()
                .email(adminUsername)
                .fullName("Administrator")
                .role(Role.ADMIN)
                .passwordHash(passwordEncoder.encode(adminPassword))
                .build();
        userRepository.save(admin);

        log.warn("Seeded superadmin account — email: {} | password: {} " +
                        "(set APP_ADMIN_USERNAME/APP_ADMIN_PASSWORD to change this; log in and rotate the password).",
                adminUsername, adminPassword);
    }
}
