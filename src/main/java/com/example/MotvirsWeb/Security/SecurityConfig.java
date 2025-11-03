package com.example.MotvirsWeb.Security;

import com.example.MotvirsWeb.Service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;


@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final AuthenticationSuccessHandler authenticationSuccessHandler;
    private final CustomUserDetailsService customUserDetailsService;
    private final JwtAuthFilter jwtAuthFilter;

    // 2. Crea un AuthenticationProvider (buena práctica que alimenta al AuthenticationManager)
    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(customUserDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder()); // Asumo que ya tienes el bean de PasswordEncoder
        return authProvider;
    }

    // 3. ESTE ES EL NUEVO FILTRO PARA TU API (Flutter)
    @Bean
    @Order(1) // Prioridad 1 (se revisa primero)
    public SecurityFilterChain apiSecurityFilterChain(HttpSecurity http) throws Exception {
        http
                .securityMatcher("/api/**") // Solo aplica esta configuración a /api/...
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/login", "/api/auth/registro/**").permitAll() // Login/Registro de API es público
                        .anyRequest().authenticated() // El resto de la API requiere autenticación
                )
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS) // IMPORTANTE: Sin estado
                )
                .authenticationProvider(authenticationProvider()) // Usa el provider
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class) // Añade tu filtro JWT
                .csrf(csrf -> csrf.disable()); // Deshabilita CSRF para la API

        return http.build();
    }

    // 4. ESTE ES TU FILTRO ANTIGUO PARA LA WEB (Dashboard, etc.)
    @Bean
    @Order(2) // Prioridad 2 (se revisa después)
    public SecurityFilterChain webSecurityFilterChain(HttpSecurity http) throws Exception {
        http
                .authorizeHttpRequests(auth -> auth
                        // Tus reglas web actuales
                        .requestMatchers(
                                "/", "/auth/**", "/login", "/registro/**",
                                "/css/**", "/icon/**", "/js/**", "/api/ml/**", "/img/**", "public/home/**", "/error/**"
                        ).permitAll()
                        .requestMatchers("/pasajero/panel**").hasRole("PASAJERO")
                        .requestMatchers("/conductor/panel**").hasRole("CONDUCTOR")
                        .requestMatchers("/rating").hasAnyRole("CONDUCTOR", "PASAJERO")
                        .requestMatchers("/admin/dashboard**").hasRole("ADMIN")
                        .anyRequest().authenticated()
                )
                .formLogin(form -> form // Usa el formLogin para la web
                        .loginPage("/auth/login")
                        .loginProcessingUrl("/login")
                        .successHandler(authenticationSuccessHandler)
                        .failureUrl("/auth/login?error=true")
                        .permitAll()
                )
                .logout(logout -> logout // Logout para la web
                        .logoutUrl("/auth/logout")
                        .logoutSuccessUrl("/auth/login?logout=true")
                        .invalidateHttpSession(true)
                        .deleteCookies("JSESSIONID")
                        .permitAll()
                )
                .sessionManagement(session -> session // Manejo de sesión para la web
                                .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                                .invalidSessionUrl("/auth/login?invalid-session=true")
                        // ... (el resto de tu config de sesión)
                )
                .authenticationProvider(authenticationProvider()) // Usa el mismo provider
                .userDetailsService(customUserDetailsService);
        // No añadimos el filtro JWT aquí

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