package com.example.MotvirsWeb.Service;

import com.example.MotvirsWeb.Models.*;
import com.example.MotvirsWeb.Repositorios.ServicioRepository;
import com.example.MotvirsWeb.socket.WebSocketService;
import com.example.MotvirsWeb.Security.IllegalStateTransitionException;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@SuppressWarnings("null")
@ExtendWith(MockitoExtension.class)
public class ServicioServiceImplTest {

    @Mock
    private ServicioRepository servicioRepository;
    @Mock
    private WebSocketService webSocketService;
    @Mock
    private ServicioStateMachine stateMachine;

    @InjectMocks
    private ServicioServiceImpl servicioService;

    private Pasajero testPasajero;
    private Conductor testConductor;
    private Servicio testServicio;
    private ObjectId testPasajeroId;
    private ObjectId testConductorId;

    @BeforeEach
    void setUp() {
        testPasajeroId = new ObjectId();
        testConductorId = new ObjectId();

        testPasajero = Pasajero.builder()
                .id(testPasajeroId)
                .nombreCompleto("Pasajero Test")
                .email("pasajero@test.com")
                .build();

        testConductor = Conductor.builder()
                .id(testConductorId)
                .nombre_y_Apellido("Conductor Test")
                .email("conductor@test.com")
                .build();

        testServicio = new Servicio();
        testServicio.setId("s1");
        testServicio.setPasajero(new Servicio.PasajeroEmbedded(testPasajeroId, "Pasajero Test", "pasajero@test.com"));
        testServicio.setEstado(EstadoServicio.SOLICITADO);
    }

    @Test
    void solicitarViaje_Success() {
        Map<String, Object> solicitud = new HashMap<>();
        solicitud.put("origen", "Calle 1");
        solicitud.put("destino", "Calle 2");
        solicitud.put("tarifa", 10.0);
        solicitud.put("distanciaKM", 5.0);
        solicitud.put("ubicacionOrigen", Map.of("latitud", 4.0, "longitud", -74.0));
        solicitud.put("ubicacionDestino", Map.of("latitud", 4.1, "longitud", -74.1));
        solicitud.put("tipoPago", "EFECTIVO");

        when(servicioRepository.save(any(Servicio.class))).thenReturn(testServicio);

        Map<String, Object> result = servicioService.solicitarViaje(solicitud, testPasajero);

        assertNotNull(result);
        assertTrue(result.containsKey("mensaje"));
        verify(servicioRepository).save(any(Servicio.class));
        verify(webSocketService).notificarNuevoServicioDisponible(any());
    }

    @Test
    void solicitarViaje_MissingFields_ThrowsException() {
        Map<String, Object> solicitud = new HashMap<>();
        solicitud.put("origen", "Calle 1");
        // Missing destino

        assertThrows(ResponseStatusException.class, () -> servicioService.solicitarViaje(solicitud, testPasajero));
    }

    @Test
    void aceptarServicio_Success() {
        when(servicioRepository.findById("s1")).thenReturn(Optional.of(testServicio));
        when(servicioRepository.save(any(Servicio.class))).thenReturn(testServicio);

        Map<String, Object> result = servicioService.aceptarServicio("s1", testConductor);

        assertNotNull(result);
        assertEquals(EstadoServicio.ACEPTADO, testServicio.getEstado());
        assertNotNull(testServicio.getConductor());
        assertEquals(testConductorId, testServicio.getConductor().getId());
        verify(webSocketService).notificarCambioEstadoServicio(any());
    }

    @Test
    void aceptarServicio_AlreadyAccepted_ThrowsException() {
        testServicio.setEstado(EstadoServicio.ACEPTADO);
        when(servicioRepository.findById("s1")).thenReturn(Optional.of(testServicio));
        
        // Simular que la maquina de estados lanza la excepcion correspondiente
        doThrow(new IllegalStateTransitionException("Transición no válida de ACEPTADO a ACEPTADO"))
            .when(stateMachine).transition(EstadoServicio.ACEPTADO, EstadoServicio.ACEPTADO);

        assertThrows(ResponseStatusException.class, () -> servicioService.aceptarServicio("s1", testConductor));
    }

    @Test
    void finalizarServicio_Success() {
        testServicio.setEstado(EstadoServicio.EN_CURSO);
        testServicio.setConductor(new Servicio.ConductorEmbedded(testConductor));
        when(servicioRepository.findById("s1")).thenReturn(Optional.of(testServicio));
        when(servicioRepository.save(any(Servicio.class))).thenReturn(testServicio);

        Map<String, Object> result = servicioService.finalizarServicio("s1", testConductor);

        assertNotNull(result);
        assertEquals(EstadoServicio.FINALIZADO, testServicio.getEstado());
        verify(stateMachine).transition(EstadoServicio.EN_CURSO, EstadoServicio.FINALIZADO);
        verify(webSocketService).notificarCambioEstadoServicio(any());
    }

    @Test
    void finalizarServicio_WrongConductor_ThrowsException() {
        testServicio.setEstado(EstadoServicio.EN_CURSO);
        Conductor otroConductor = Conductor.builder().id(new ObjectId()).build();
        testServicio.setConductor(new Servicio.ConductorEmbedded(otroConductor));

        when(servicioRepository.findById("s1")).thenReturn(Optional.of(testServicio));

        assertThrows(ResponseStatusException.class, () -> servicioService.finalizarServicio("s1", testConductor));
    }
}
