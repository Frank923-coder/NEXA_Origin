package com.example.MotvirsWeb.Security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.Map;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

    // Límite de peticiones por minuto para endpoints de autenticación (fuerza bruta)
    private static final int MAX_AUTH_REQUESTS_PER_MINUTE = 5;
    
    // Límite de peticiones por minuto para el resto de la API
    private static final int MAX_API_REQUESTS_PER_MINUTE = 60;

    // Almacena conteos de IPs
    private final Map<String, Integer> requestCounts = new ConcurrentHashMap<>();

    public RateLimitFilter() {
        // Ejecutar limpieza cada minuto
        ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);
        scheduler.scheduleAtFixedRate(requestCounts::clear, 1, 1, TimeUnit.MINUTES);
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, 
                                    @NonNull HttpServletResponse response, 
                                    @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        String uri = request.getRequestURI();
        
        // Solo aplicar rate limiting a /auth/ y /api/
        if (uri.startsWith("/auth/") || uri.startsWith("/api/")) {
            String clientIp = getClientIP(request);
            
            // Determinar el límite basado en el endpoint
            int limit = uri.contains("/login") ? MAX_AUTH_REQUESTS_PER_MINUTE : MAX_API_REQUESTS_PER_MINUTE;

            // Incrementar contador
            int currentRequests = requestCounts.getOrDefault(clientIp, 0);
            
            if (currentRequests >= limit) {
                // Generar error 429 Too Many Requests
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setContentType("application/json");
                response.getWriter().write("{\"error\": \"Too Many Requests\", \"message\": \"Has excedido el límite de peticiones. Inténtalo más tarde.\"}");
                return;
            }

            requestCounts.put(clientIp, currentRequests + 1);
        }

        // Continuar con el filtro
        filterChain.doFilter(request, response);
    }

    private String getClientIP(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isEmpty()) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0];
    }
}
