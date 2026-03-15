package com.example.MotvirsWeb.Service;

import com.example.MotvirsWeb.Models.EstadoServicio;
import com.example.MotvirsWeb.Security.IllegalStateTransitionException;
import org.springframework.stereotype.Component;

import java.util.EnumSet;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

@Component
public class ServicioStateMachine {

    // Mapa de transiciones permitidas: Estado Actual -> Set de Estados Siguientes Válidos
    private final Map<EstadoServicio, Set<EstadoServicio>> validTransitions = new HashMap<>();

    public ServicioStateMachine() {
        // Inicializar reglas de transición de la máquina de estados
        validTransitions.put(EstadoServicio.SOLICITADO, EnumSet.of(EstadoServicio.ACEPTADO, EstadoServicio.CANCELADO));
        validTransitions.put(EstadoServicio.ACEPTADO, EnumSet.of(EstadoServicio.EN_CURSO, EstadoServicio.CANCELADO));
        validTransitions.put(EstadoServicio.EN_CURSO, EnumSet.of(EstadoServicio.FINALIZADO));
        validTransitions.put(EstadoServicio.FINALIZADO, EnumSet.noneOf(EstadoServicio.class)); // Estado terminal
        validTransitions.put(EstadoServicio.CANCELADO, EnumSet.noneOf(EstadoServicio.class));  // Estado terminal
    }

    /**
     * Valida y ejecuta la transición de estado.
     * @param currentState El estado actual del servicio.
     * @param nextState El estado al que se desea transicionar.
     * @return true si la transición fue exitosa (por compatibilidad o uso futuro).
     * @throws IllegalStateTransitionException si la transición no está permitida.
     */
    public boolean transition(EstadoServicio currentState, EstadoServicio nextState) {
        if (currentState == nextState) {
            // Ya está en ese estado, no hacer nada o lanzar excepción de que no hubo cambio
            return true;
        }

        Set<EstadoServicio> validNextStates = validTransitions.get(currentState);
        
        if (validNextStates == null || !validNextStates.contains(nextState)) {
            throw new IllegalStateTransitionException(
                String.format("Transición de estado no permitida desde '%s' a '%s'.", 
                              currentState, nextState)
            );
        }

        return true;
    }
}
