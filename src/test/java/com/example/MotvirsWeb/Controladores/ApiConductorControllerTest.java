package com.example.MotvirsWeb.Controladores;

import com.example.MotvirsWeb.Models.Conductor;
import com.example.MotvirsWeb.Repositorios.UsuarioRepository;
import com.example.MotvirsWeb.Service.ServicioServiceImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;

import com.example.MotvirsWeb.util.UsuarioContextHelper;
import com.example.MotvirsWeb.Service.JwtService;
import com.example.MotvirsWeb.Security.CustomUserDetailsService;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;

@WebMvcTest(controllers = ApiConductorController.class)
@Import({ApiConductorControllerTest.TestSecurityConfig.class, ApiConductorController.class})
public class ApiConductorControllerTest {

    @Configuration
    static class TestSecurityConfig {
        @Bean
        public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
            http.csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                    .requestMatchers("/api/conductor/**").hasRole("CONDUCTOR")
                    .anyRequest().authenticated());
            return http.build();
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ServicioServiceImpl servicioService;

    @MockBean
    private UsuarioRepository usuarioRepository;

    @MockBean
    private UsuarioContextHelper usuarioContextHelper;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    private Conductor testConductor;

    @BeforeEach
    void setUp() {
        testConductor = Conductor.builder()
                .id(new ObjectId())
                .email("conductor@test.com")
                .nombre_y_Apellido("Conductor Test")
                .build();
        
        // Simular que el Helper extrae correctamente al conductor del contexto
        try {
            when(usuarioContextHelper.getConductorAutenticado()).thenReturn(testConductor);
        } catch(Exception e) {}
    }

    @Test
    @WithMockUser(username = "conductor@test.com", roles = "CONDUCTOR")
    void aceptarViaje_ReturnsOk() throws Exception {
        when(usuarioRepository.findByEmail("conductor@test.com")).thenReturn(Optional.of(testConductor));
        when(servicioService.aceptarServicio(eq("s1"), any(Conductor.class))).thenReturn(Map.of("mensaje", "Servicio aceptado"));

        mockMvc.perform(post("/api/conductor/aceptar-servicio/{servicioId}", "s1")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "conductor@test.com", roles = "CONDUCTOR")
    void finalizarViaje_ReturnsOk() throws Exception {
        when(usuarioRepository.findByEmail("conductor@test.com")).thenReturn(Optional.of(testConductor));
        when(servicioService.finalizarServicio(eq("s1"), any(Conductor.class))).thenReturn(Map.of("mensaje", "Servicio finalizado"));

        mockMvc.perform(post("/api/conductor/finalizar-servicio/s1")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "pasajero@test.com", roles = "PASAJERO")
    void aceptarViaje_WrongRole_ReturnsForbidden() throws Exception {
        mockMvc.perform(post("/api/conductor/aceptar-servicio/s1")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }
}
