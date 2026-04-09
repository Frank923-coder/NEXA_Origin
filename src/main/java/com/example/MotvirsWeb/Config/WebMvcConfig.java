package com.example.MotvirsWeb.Config;

import com.example.MotvirsWeb.Security.RateLimitInterceptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Autowired
    private RateLimitInterceptor rateLimitInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // Interceptar rutas críticas que puedan sufrir abusos o DDoS
        registry.addInterceptor(rateLimitInterceptor)
                .addPathPatterns("/api/**")
                .addPathPatterns("/auth/login")
                .addPathPatterns("/auth/registro/**")
                .addPathPatterns("/auth/recuperar-password/**")
                .addPathPatterns("/ai/**"); // Proteger el bot de IA del abuso
    }
}
