package com.example.MotvirsWeb.Security;

import com.example.MotvirsWeb.Service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;


@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final AuthenticationSuccessHandler authenticationSuccessHandler;
    private final CustomUserDetailsService customUserDetailsService;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/", "/auth/**", "/login", "/registro/**",
                                "/css/**","/icon/**", "/js/**","/img/**", "public/**", "/error/**"
                        ).permitAll()
                        .requestMatchers("/profile/**").authenticated()
                        .requestMatchers("/pasajero/panel**").hasRole("PASAJERO")
                        .requestMatchers("/conductor/panel**").hasRole("CONDUCTOR")
                        .requestMatchers("/rating").hasAnyRole("CONDUCTOR", "PASAJERO")
                        .requestMatchers("/admin/dashboard**","/api/admin/ml").hasRole("ADMIN")
                        .anyRequest().authenticated()
                )
                .formLogin(form -> form
                        .loginPage("/auth/login")
                        .loginProcessingUrl("/login")
                        .successHandler(authenticationSuccessHandler)
                        .failureUrl("/auth/login?error=true")
                        .permitAll()
                )
                .logout(logout -> logout
                        .logoutUrl("/auth/logout")
                        .logoutSuccessUrl("/auth/login?logout=true")
                        .invalidateHttpSession(true)
                        .deleteCookies("JSESSIONID")
                        .permitAll()
                )
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                        .invalidSessionUrl("/auth/login?invalid-session=true")
                        .maximumSessions(1)
                        .expiredUrl("/auth/login?session-expired=true")
                )
                .exceptionHandling(ex -> ex
                        .accessDeniedPage("/error/403")
                )
                .csrf(csrf -> csrf
                        .ignoringRequestMatchers("/ws/**", "/topic/**")
                )
                .userDetailsService(customUserDetailsService);

        return http.build();
    }
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}