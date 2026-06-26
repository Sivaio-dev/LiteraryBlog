package com.blog.literary_blog.config;

import com.blog.literary_blog.models.Admin;
import com.blog.literary_blog.repositories.AdminRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AdminInitializer implements CommandLineRunner {

    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (adminRepository.count() == 0) {
            Admin admin = Admin.builder()
                    .name("Author Name")
                    .email("admin@blog.com")
                    .password(passwordEncoder.encode("admin123"))
                    .build();
            adminRepository.save(admin);
        }
    }
}
