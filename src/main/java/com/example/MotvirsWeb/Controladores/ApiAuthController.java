package com.example.MotvirsWeb.Controladores;


import com.example.MotvirsWeb.Dto.LoginRequest;
import com.example.MotvirsWeb.Dto.LoginResponse;
import com.example.MotvirsWeb.Service.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus; // Importar
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map; // Importar

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class ApiAuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    @PostMapping("/login")
    // Cambiamos a ResponseEntity<?> para poder devolver OK o Error
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {

        // 1. Autenticar (verifica email y password)
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getEmail(),
                        loginRequest.getPassword()
                )
        );

        // 2. Obtener detalles del usuario
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();

        // 3. ¡AQUÍ ESTÁ LA VALIDACIÓN DE ROL!
        // Verificamos si el usuario tiene el rol de PASAJERO
        boolean esPasajero = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_PASAJERO"));

        if (!esPasajero) {
            // Si NO es pasajero, le negamos el login (aunque la clave sea correcta)
            return ResponseEntity.status(HttpStatus.FORBIDDEN) // HTTP 403 Prohibido
                    .body(Map.of("error", "Acceso denegado. Solo pasajeros pueden usar la app."));
        }

        // 4. Si es pasajero, generamos y devolvemos el token
        String token = jwtService.generateToken(userDetails);
        return ResponseEntity.ok(new LoginResponse(token));
    }
}