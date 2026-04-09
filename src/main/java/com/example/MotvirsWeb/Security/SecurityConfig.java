package com.example.MotvirsWeb.Security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;

import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

        private final AuthenticationSuccessHandler authenticationSuccessHandler;
        private final CustomUserDetailsService customUserDetailsService;
        private final SecurityExceptionHandler securityExceptionHandler;
        private final JwtAuthFilter jwtAuthFilter;

        @Bean
        public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
                http
                                .csrf(csrf -> csrf
                                                .ignoringRequestMatchers(SecurityConstants.WEBSOCKET_URLS)
                                                .ignoringRequestMatchers(SecurityConstants.API_URLS)
                                                .ignoringRequestMatchers("/public/chat"))
                                .authorizeHttpRequests(auth -> auth
                                                .requestMatchers(SecurityConstants.STATIC_RESOURCES).permitAll()
                                                .requestMatchers(SecurityConstants.PUBLIC_URLS).permitAll()
                                                // API Específicas (Roles)
                                                .requestMatchers(SecurityConstants.API_PASAJERO_URLS)
                                                .hasRole("PASAJERO")
                                                .requestMatchers(SecurityConstants.API_CONDUCTOR_URLS)
                                                .hasRole("CONDUCTOR")
                                                // Web Específicas (Roles)
                                                .requestMatchers(SecurityConstants.PASAJERO_URLS).hasRole("PASAJERO")
                                                .requestMatchers(SecurityConstants.CONDUCTOR_URLS).hasRole("CONDUCTOR")
                                                .requestMatchers(SecurityConstants.ADMIN_URLS).hasRole("ADMIN")
                                                // General API (debe ir después de las específicas)
                                                .requestMatchers(SecurityConstants.API_URLS).authenticated()
                                                .requestMatchers(SecurityConstants.SHARED_URLS)
                                                .hasAnyRole("CONDUCTOR", "PASAJERO", "ADMIN")
                                                .anyRequest().authenticated())
                                .formLogin(form -> form
                                                .loginPage("/auth/login")
                                                .loginProcessingUrl("/login")
                                                .successHandler(authenticationSuccessHandler)
                                                .failureUrl("/auth/login?error=true")
                                                .permitAll())
                                .logout(logout -> logout
                                                .logoutUrl("/auth/logout")
                                                .logoutSuccessUrl("/auth/login?logout=true")
                                                .invalidateHttpSession(true)
                                                .deleteCookies("JSESSIONID")
                                                .permitAll())
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)) // Cambiado
                                                                                                           // para
                                                                                                           // permitir
                                                                                                           // stateless
                                                                                                           // bajo
                                                                                                           // demanda
                                .exceptionHandling(ex -> ex
                                                .accessDeniedHandler(securityExceptionHandler)
                                                .authenticationEntryPoint(securityExceptionHandler))
                                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
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
