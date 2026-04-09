package com.example.MotvirsWeb.Controladores;

import com.example.MotvirsWeb.Models.Pasajero;
import com.example.MotvirsWeb.Models.Rol;
import com.example.MotvirsWeb.Repositorios.UsuarioRepository;
import com.example.MotvirsWeb.Service.JwtService;
import com.example.MotvirsWeb.Service.ServicioService;
import com.example.MotvirsWeb.Service.ServicioServiceImpl;
import com.example.MotvirsWeb.util.UsuarioContextHelper;
import com.example.MotvirsWeb.Security.CustomUserDetailsService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.test.web.servlet.MockMvc;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = ApiPasajeroController.class)
@Import({ApiPasajeroControllerTest.TestSecurityConfig.class, ApiPasajeroController.class})
public class ApiPasajeroControllerTest {

    @Configuration
    static class TestSecurityConfig {
        @Bean
        public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
            http.csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                    .requestMatchers("/api/pasajero/**").hasRole("PASAJERO")
                    .anyRequest().authenticated());
            return http.build();
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ServicioService servicioService;

    @MockBean
    private UsuarioRepository usuarioRepository;

    @MockBean
    private UsuarioContextHelper usuarioContextHelper;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @Autowired
    private ObjectMapper objectMapper;

    private Pasajero testPasajero;

    @BeforeEach
    void setUp() {
        testPasajero = Pasajero.builder()
                .id(new ObjectId())
                .email("pasajero@test.com")
                .nombreCompleto("Pasajero Test")
                .build();
        
        try {
            when(usuarioContextHelper.getPasajeroAutenticado()).thenReturn(testPasajero);
        } catch(Exception e) {}
    }

    @Test
    @WithMockUser(username = "pasajero@test.com", roles = "PASAJERO")
    void solicitarViaje_ReturnsOk() throws Exception {
        Map<String, Object> solicitud = new HashMap<>();
        solicitud.put("origen", "A");
        solicitud.put("destino", "B");
        solicitud.put("ubicacionOrigen", Map.of("latitud", 4.0, "longitud", -74.0));
        solicitud.put("ubicacionDestino", Map.of("latitud", 4.1, "longitud", -74.1));
        solicitud.put("distanciaKM", 5.0);
        solicitud.put("tarifa", 15.0);
        solicitud.put("metodoPago", "EFECTIVO");

        when(usuarioRepository.findByEmail("pasajero@test.com")).thenReturn(Optional.of(testPasajero));
        when(servicioService.solicitarViaje(any(), any())).thenReturn(Map.of("mensaje", "Viaje solicitado", "servicioId", "s1"));

        mockMvc.perform(post("/api/pasajero/solicitar-viaje")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(solicitud)))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "usurio@test.com", roles = "CONDUCTOR")
    void solicitarViaje_WrongRole_ReturnsForbidden() throws Exception {
        mockMvc.perform(post("/api/pasajero/solicitar-viaje")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "PASAJERO")
    public void obtenerPerfil_ShouldReturnPassengerData() throws Exception {
        Pasajero mockPasajero = Pasajero.builder()
                .nombreCompleto("Juan Perez")
                .email("juan@test.com")
                .rol(Rol.PASAJERO)
                .build();

        when(usuarioContextHelper.getPasajeroAutenticado()).thenReturn(mockPasajero);

        mockMvc.perform(get("/api/pasajero/perfil"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombreCompleto").value("Juan Perez"))
                .andExpect(jsonPath("$.email").value("juan@test.com"));
    }

    @Test
    public void unauthorizedAccess_ShouldReturnForbidden() throws Exception {
        mockMvc.perform(get("/api/pasajero/perfil"))
                .andExpect(status().isForbidden());
    }
}
