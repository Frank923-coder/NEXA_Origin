package com.example.MotvirsWeb.Controladores;

import com.example.MotvirsWeb.Models.*;
import com.example.MotvirsWeb.Repositorios.UsuarioRepository;
import com.example.MotvirsWeb.Repositorios.VehiculoRepository;
import com.example.MotvirsWeb.Service.AuthService;
import com.example.MotvirsWeb.socket.WebSocketService;
import jakarta.servlet.http.HttpServletRequest;

import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import org.springframework.web.servlet.support.RequestContextUtils;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Controller
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final VehiculoRepository vehiculoRepository;
    private final WebSocketService webSocketService; // <--- 2. DECLARACIÓN DEL SERVICIO

    // 3. ACTUALIZACIÓN DEL CONSTRUCTOR (Inyectamos webSocketService)
    @Autowired
    public AuthController(AuthService authService,
                          UsuarioRepository usuarioRepository,
                          VehiculoRepository vehiculoRepository,
                          PasswordEncoder passwordEncoder,
                          WebSocketService webSocketService) {
        this.authService = authService;
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.vehiculoRepository = vehiculoRepository;
        this.webSocketService = webSocketService; // <--- ASIGNACIÓN
    }

    // Muestra formulario de registro
    @GetMapping("/registro")
    public String mostrarFormularioRegistro() {
        return "registros";
    }

    // Muestra formulario de login
    @GetMapping("/login")
    public String mostrarLogin(@RequestParam(required = false) String error,
                               @RequestParam(required = false) String logout,
                               HttpServletRequest request,
                               Model model) {

        // Manejar errores de Spring Security
        if (error != null) {
            model.addAttribute("showError", true);
            model.addAttribute("errorMessage", "Email o contraseña incorrectos. Por favor, intente nuevamente.");
        }

        if (logout != null) {
            model.addAttribute("showSuccess", true);
            model.addAttribute("successMessage", "Has cerrado sesión correctamente");
        }

        // Manejar mensajes flash de redirects
        Map<String, ?> flashMap = RequestContextUtils.getInputFlashMap(request);
        if (flashMap != null) {
            if (flashMap.containsKey("errorPasajero")) {
                model.addAttribute("showError", true);
                model.addAttribute("errorMessage", flashMap.get("errorPasajero"));
            }
            if (flashMap.containsKey("errorConductor")) {
                model.addAttribute("showError", true);
                model.addAttribute("errorMessage", flashMap.get("errorConductor"));
            }
            if (flashMap.containsKey("success")) {
                model.addAttribute("showSuccess", true);
                model.addAttribute("successMessage", flashMap.get("success"));
            }
        }

        return "inicio";
    }


    // Procesa registro de pasajero
    @PostMapping("/registro/pasajero")
    public String registrarPasajero(
            @RequestParam String nombre,
            @RequestParam String apellido,
            @RequestParam String email,
            @RequestParam String telefono,
            @RequestParam String password,
            @RequestParam String confirmPassword,
            RedirectAttributes redirectAttributes) {

        if (!password.equals(confirmPassword)) {
            redirectAttributes.addFlashAttribute("errorPasajero", "Las contraseñas no coinciden");
            return "redirect:/auth/registro";
        }

        try {
            if (usuarioRepository.findByEmail(email).isPresent()) {
                redirectAttributes.addFlashAttribute("errorPasajero", "El correo electrónico ya está registrado.");
                return "redirect:/auth/registro";
            }

            Pasajero pasajero = new Pasajero();
            pasajero.setNombreCompleto(nombre + " " + apellido);
            pasajero.setEmail(email);
            pasajero.setTelefono(telefono);
            pasajero.setPassword(passwordEncoder.encode(password));
            pasajero.setRol(Rol.PASAJERO);
            pasajero.setEstadoValidacion(EstadoValidacion.APROBADO);

            usuarioRepository.save(pasajero);

            // 4. <--- NOTIFICACIÓN AL ADMIN (PASAJERO)
            try {
                webSocketService.notificarNuevoRegistroAdmin(email, "PASAJERO");
            } catch (Exception e) {
                System.out.println("Error enviando notificación socket: " + e.getMessage());
                // No detenemos el registro si falla la notificación
            }

            redirectAttributes.addFlashAttribute("success", "Registro exitoso. Por favor inicia sesión.");
            return "redirect:/auth/login";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorPasajero", e.getMessage());
            return "redirect:/auth/registro";
        }
    }

    // Procesa registro de conductor
    @PostMapping("/registro/conductor")
    public String registrarConductor(
            @RequestParam String nombre,
            @RequestParam String email,
            @RequestParam String telefono,
            @RequestParam String password,
            @RequestParam String confirmPassword,
            @RequestParam String licencia,
            // Datos del vehículo
            @RequestParam String placa,
            @RequestParam String marca,
            @RequestParam String modelo,
            @RequestParam String color,
            @RequestParam String tarjetaPropiedad,
            @RequestParam String soat,
            @RequestParam String tecnomecanica,
            RedirectAttributes redirectAttributes) {

        if (!password.equals(confirmPassword)) {
            redirectAttributes.addFlashAttribute("errorConductor", "Las contraseñas no coinciden");
            return "redirect:/auth/registro#conductor";
        }

        try {
            // Crear conductor
            Conductor conductor = Conductor.builder()
                    .nombre_y_Apellido(nombre)
                    .email(email)
                    .ntelefono(Long.parseLong(telefono))
                    .password(passwordEncoder.encode(password))
                    .licencia(Integer.parseInt(licencia))
                    .soat(Long.parseLong(soat))
                    .tarjeta_de_propiedad(Long.parseLong(tarjetaPropiedad))
                    .rol(Rol.CONDUCTOR)
                    .estadoValidacion(EstadoValidacion.PENDIENTE)
                    .build();

            // Crear vehículo
            Vehiculo vehiculo = Vehiculo.builder()
                    .placa(placa)
                    .marca(marca)
                    .modelo(modelo)
                    .color(color)
                    .tecnomecanicaId(Integer.parseInt(tecnomecanica))
                    .conductorAsignado(conductor)
                    .activo(true)
                    .fechaRegistro(LocalDate.now())
                    .build();

            // Guardar en base de datos
            conductor = usuarioRepository.save(conductor);
            vehiculo.setConductorAsignado(conductor);
            vehiculo= vehiculoRepository.save(vehiculo);
            conductor.setVehiculos(List.of(new ObjectId(vehiculo.getId())));
            usuarioRepository.save(conductor);

            // 4. <--- NOTIFICACIÓN AL ADMIN (CONDUCTOR)
            try {
                webSocketService.notificarNuevoRegistroAdmin(email, "CONDUCTOR");
            } catch (Exception e) {
                System.out.println("Error enviando notificación socket: " + e.getMessage());
            }

            redirectAttributes.addFlashAttribute("success", "Registro exitoso. Por favor inicia sesión.");
            return "redirect:/auth/login";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorConductor", e.getMessage());
            return "redirect:/auth/registro#conductor";
        }
    }
}