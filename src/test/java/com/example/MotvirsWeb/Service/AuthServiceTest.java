package com.example.MotvirsWeb.Service;

import com.example.MotvirsWeb.Models.*;
import com.example.MotvirsWeb.Repositorios.UsuarioRepository;
import com.example.MotvirsWeb.Security.CustomUserDetailsService;
import com.example.MotvirsWeb.socket.WebSocketService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@SuppressWarnings("null")
@ExtendWith(MockitoExtension.class)
public class AuthServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private CustomUserDetailsService customUserDetailsService;
    @Mock
    private WebSocketService webSocketService;

    @InjectMocks
    private AuthService authService;

    private Pasajero testPasajero;
    private Conductor testConductor;

    @BeforeEach
    void setUp() {
        testPasajero = Pasajero.builder()
                .email("pasajero@test.com")
                .password("encoded_pass")
                .rol(Rol.PASAJERO)
                .estadoValidacion(EstadoValidacion.APROBADO)
                .build();

        testConductor = Conductor.builder()
                .email("conductor@test.com")
                .password("encoded_pass")
                .rol(Rol.CONDUCTOR)
                .estadoValidacion(EstadoValidacion.PENDIENTE)
                .build();
    }

    @Test
    void registrarPasajero_Success() {
        when(usuarioRepository.findByEmailAndRol(anyString(), eq(Rol.PASAJERO))).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("encoded_pass");
        when(usuarioRepository.save(any(Pasajero.class))).thenReturn(testPasajero);

        Pasajero result = authService.registrarPasajero("Test Name", "101010101", "pasajero@test.com", "123456", "password");

        assertNotNull(result);
        assertEquals("pasajero@test.com", result.getEmail());
        verify(usuarioRepository).save(any(Pasajero.class));
        verify(webSocketService).notificarNuevoRegistroAdmin(any());
    }

    @Test
    void registrarPasajero_DuplicateEmail_ThrowsException() {
        when(usuarioRepository.findByEmailAndRol("pasajero@test.com", Rol.PASAJERO))
                .thenReturn(Optional.of(testPasajero));

        assertThrows(IllegalStateException.class,
                () -> authService.registrarPasajero("Test Name", "101010101", "pasajero@test.com", "123456", "password"));
    }

    @Test
    void autenticarUsuario_Success() {
        UserDetails mockDetails = mock(UserDetails.class);
        when(mockDetails.getPassword()).thenReturn("encoded_pass");
        when(customUserDetailsService.loadUserByUsername("pasajero@test.com")).thenReturn(mockDetails);
        when(passwordEncoder.matches("password", "encoded_pass")).thenReturn(true);
        when(usuarioRepository.findByEmail("pasajero@test.com")).thenReturn(Optional.of(testPasajero));

        UserDetails result = authService.autenticarUsuario("pasajero@test.com", "password");

        assertNotNull(result);
        verify(passwordEncoder).matches("password", "encoded_pass");
    }

    @Test
    void autenticarUsuario_BadCredentials_ThrowsException() {
        UserDetails mockDetails = mock(UserDetails.class);
        when(mockDetails.getPassword()).thenReturn("encoded_pass");
        when(customUserDetailsService.loadUserByUsername("pasajero@test.com")).thenReturn(mockDetails);
        when(passwordEncoder.matches("wrong_pass", "encoded_pass")).thenReturn(false);

        assertThrows(BadCredentialsException.class,
                () -> authService.autenticarUsuario("pasajero@test.com", "wrong_pass"));
    }

    @Test
    void autenticarUsuario_ConductorNotApproved_ThrowsException() {
        UserDetails mockDetails = mock(UserDetails.class);
        when(mockDetails.getPassword()).thenReturn("encoded_pass");
        when(customUserDetailsService.loadUserByUsername("conductor@test.com")).thenReturn(mockDetails);
        when(passwordEncoder.matches("password", "encoded_pass")).thenReturn(true);
        when(usuarioRepository.findByEmail("conductor@test.com")).thenReturn(Optional.of(testConductor));

        assertThrows(DisabledException.class, () -> authService.autenticarUsuario("conductor@test.com", "password"));
    }
}
