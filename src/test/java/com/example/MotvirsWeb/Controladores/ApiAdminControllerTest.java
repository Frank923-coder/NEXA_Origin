package com.example.MotvirsWeb.Controladores;

import com.example.MotvirsWeb.Models.EstadoValidacion;
import com.example.MotvirsWeb.Service.AdminService;
import com.example.MotvirsWeb.Service.DashboardService;
import com.example.MotvirsWeb.Service.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class ApiAdminControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AdminService adminService;

    @MockBean
    private DashboardService dashboardService;

    @MockBean
    private JwtService jwtService;

    @Test
    @WithMockUser(roles = "ADMIN")
    public void obtenerDashboardStats_ShouldReturnData() throws Exception {
        Map<String, Object> mockStats = Map.of("totalPasajeros", 10, "totalConductores", 5);
        when(adminService.obtenerResumenDashboard()).thenReturn(mockStats);

        mockMvc.perform(get("/api/admin/dashboard-stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalPasajeros").value(10));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    public void aprobarConductor_ShouldReturnSuccess() throws Exception {
        doNothing().when(adminService).aprobarConductor("test@test.com");

        mockMvc.perform(post("/api/admin/aprobar-conductor")
                .param("email", "test@test.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    @WithMockUser(roles = "PASAJERO")
    public void adminEndpoint_ShouldBeForbiddenForPasajero() throws Exception {
        mockMvc.perform(get("/api/admin/dashboard-stats"))
                .andExpect(status().isForbidden());
    }
}
