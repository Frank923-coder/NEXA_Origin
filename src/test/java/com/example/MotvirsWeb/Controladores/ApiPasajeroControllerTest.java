package com.example.MotvirsWeb.Controladores;

import com.example.MotvirsWeb.Models.Pasajero;
import com.example.MotvirsWeb.Models.Rol;
import com.example.MotvirsWeb.Service.JwtService;
import com.example.MotvirsWeb.Service.ServicioService;
import com.example.MotvirsWeb.util.UsuarioContextHelper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class ApiPasajeroControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ServicioService servicioService;

    @MockBean
    private UsuarioContextHelper usuarioContext;

    @MockBean
    private JwtService jwtService; // Mocked to avoid filter issues

    @Test
    @WithMockUser(roles = "PASAJERO")
    public void obtenerPerfil_ShouldReturnPassengerData() throws Exception {
        Pasajero mockPasajero = Pasajero.builder()
                .nombreCompleto("Juan Perez")
                .email("juan@test.com")
                .rol(Rol.PASAJERO)
                .build();

        when(usuarioContext.getPasajeroAutenticado()).thenReturn(mockPasajero);

        mockMvc.perform(get("/api/pasajero/perfil"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombreCompleto").value("Juan Perez"))
                .andExpect(jsonPath("$.email").value("juan@test.com"));
    }

    @Test
    public void unauthorizedAccess_ShouldReturn401() throws Exception {
        mockMvc.perform(get("/api/pasajero/perfil"))
                .andExpect(status().isUnauthorized());
    }
}
