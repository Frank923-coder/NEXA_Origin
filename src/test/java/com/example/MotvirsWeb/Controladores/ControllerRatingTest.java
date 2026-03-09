package com.example.MotvirsWeb.Controladores;

import com.example.MotvirsWeb.Models.Servicio;
import com.example.MotvirsWeb.Repositorios.ServicioRepository;
import com.example.MotvirsWeb.Service.ServicioService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrl;

@SpringBootTest
@AutoConfigureMockMvc
public class ControllerRatingTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ServicioRepository servicioRepository;

    @MockBean
    private ServicioService servicioService;

    @Test
    @WithMockUser(roles = "PASAJERO")
    public void mostrarRating_Pasajero_Success() throws Exception {
        Servicio mockServicio = new Servicio();
        mockServicio.setId("123");

        when(servicioRepository.findById("123")).thenReturn(Optional.of(mockServicio));

        mockMvc.perform(get("/rating")
                .param("servicioId", "123")
                .param("rol", "pasajero"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "CONDUCTOR")
    public void mostrarRating_Conductor_Success() throws Exception {
        Servicio mockServicio = new Servicio();
        mockServicio.setId("123");

        when(servicioRepository.findById("123")).thenReturn(Optional.of(mockServicio));

        mockMvc.perform(get("/rating")
                .param("servicioId", "123")
                .param("rol", "conductor"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "PASAJERO")
    public void mostrarRating_ForbiddenRole() throws Exception {
        // El usuario es PASAJERO pero el parámetro dice conductor
        mockMvc.perform(get("/rating")
                .param("servicioId", "123")
                .param("rol", "conductor"))
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("/error/403"));
    }
}
