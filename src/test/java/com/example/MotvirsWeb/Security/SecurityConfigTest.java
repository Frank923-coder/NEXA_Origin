package com.example.MotvirsWeb.Security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrl;

@SpringBootTest
@AutoConfigureMockMvc
public class SecurityConfigTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    public void publicEndpointsShouldBeAccessible() throws Exception {
        mockMvc.perform(get("/"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/auth/login"))
                .andExpect(status().isOk());
    }

    @Test
    public void adminEndpointsShouldRequireAuthentication() throws Exception {
        mockMvc.perform(get("/admin/dashboard"))
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("/auth/login?error=unauthorized"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    public void adminEndpointsShouldBeAccessibleByAdmin() throws Exception {
        // Note: This assumes /admin/dashboard exists and returns something 2xx or 3xx
        // (not 403)
        mockMvc.perform(get("/admin/dashboard"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "PASAJERO")
    public void adminEndpointsShouldBeForbiddenForPasajero() throws Exception {
        mockMvc.perform(get("/admin/dashboard"))
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("/error/403"));
    }

    @Test
    @WithMockUser(roles = "PASAJERO")
    public void pasajeroEndpointsShouldBeAccessibleByPasajero() throws Exception {
        mockMvc.perform(get("/pasajero/panel"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "CONDUCTOR")
    public void conductorEndpointsShouldBeAccessibleByConductor() throws Exception {
        mockMvc.perform(get("/conductor/panel"))
                .andExpect(status().isOk());
    }

    @Test
    public void apiEndpointsShouldReturn401WhenUnauthorized() throws Exception {
        mockMvc.perform(get("/api/any-protected-resource"))
                .andExpect(status().isUnauthorized());
    }
}
