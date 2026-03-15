package com.example.MotvirsWeb.Service;

import com.example.MotvirsWeb.Models.EstadoServicio;
import com.example.MotvirsWeb.Models.Servicio;
import com.example.MotvirsWeb.Security.IllegalStateTransitionException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class ServicioStateMachineTest {

    private ServicioStateMachine stateMachine;

    @BeforeEach
    void setUp() {
        stateMachine = new ServicioStateMachine();
    }

    @Test
    void testTransicionExitosaSolicitadoAAceptado() {
        Servicio servicio = new Servicio();
        servicio.setEstado(EstadoServicio.SOLICITADO);

        assertDoesNotThrow(() -> {
            stateMachine.transition(servicio.getEstado(), EstadoServicio.ACEPTADO);
            servicio.setEstado(EstadoServicio.ACEPTADO);
        });
        assertEquals(EstadoServicio.ACEPTADO, servicio.getEstado());
    }

    @Test
    void testTransicionExitosaAceptadoAEnCurso() {
        Servicio servicio = new Servicio();
        servicio.setEstado(EstadoServicio.ACEPTADO);

        assertDoesNotThrow(() -> {
            stateMachine.transition(servicio.getEstado(), EstadoServicio.EN_CURSO);
            servicio.setEstado(EstadoServicio.EN_CURSO);
        });
        assertEquals(EstadoServicio.EN_CURSO, servicio.getEstado());
    }

    @Test
    void testTransicionExitosaEnCursoAFinalizado() {
        Servicio servicio = new Servicio();
        servicio.setEstado(EstadoServicio.EN_CURSO);

        assertDoesNotThrow(() -> {
            stateMachine.transition(servicio.getEstado(), EstadoServicio.FINALIZADO);
            servicio.setEstado(EstadoServicio.FINALIZADO);
        });
        assertEquals(EstadoServicio.FINALIZADO, servicio.getEstado());
    }

    @Test
    void testFallaTransicionSolicitadoAEnCurso() {
        Servicio servicio = new Servicio();
        servicio.setEstado(EstadoServicio.SOLICITADO);

        assertThrows(IllegalStateTransitionException.class, 
            () -> stateMachine.transition(servicio.getEstado(), EstadoServicio.EN_CURSO));
    }

    @Test
    void testFallaTransicionFinalizadoAAceptado() {
        Servicio servicio = new Servicio();
        servicio.setEstado(EstadoServicio.FINALIZADO);

        assertThrows(IllegalStateTransitionException.class, 
            () -> stateMachine.transition(servicio.getEstado(), EstadoServicio.ACEPTADO));
    }
}
