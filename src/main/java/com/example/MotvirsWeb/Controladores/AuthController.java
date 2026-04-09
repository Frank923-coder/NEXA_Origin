package com.example.MotvirsWeb.Controladores;

import com.example.MotvirsWeb.Models.*;
import com.example.MotvirsWeb.Repositorios.VehiculoRepository;
import com.example.MotvirsWeb.Service.AuthService;
import com.example.MotvirsWeb.Security.CaptchaService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import org.springframework.web.servlet.support.RequestContextUtils;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Controller HTTP para autenticación y registro.
 *
 * Responsabilidad única: presentar formularios y coordinar el flujo de
 * respuesta
 * HTTP (redirects, flash messages). La lógica de negocio del registro vive en
 * {@link AuthService}.
 */
@Controller
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final VehiculoRepository vehiculoRepository;
    private final CaptchaService captchaService;

    @GetMapping("/registro")
    public String mostrarFormularioRegistro() {
        return "registros";
    }

    @GetMapping("/login")
    public String mostrarLogin(@RequestParam(required = false) String error,
            @RequestParam(required = false) String logout,
            HttpServletRequest request,
            Model model) {

        if (error != null) {
            model.addAttribute("showError", true);
            model.addAttribute("errorMessage", "Email o contraseña incorrectos. Por favor, intente nuevamente.");
        }

        if (logout != null) {
            model.addAttribute("showSuccess", true);
            model.addAttribute("successMessage", "Has cerrado sesión correctamente");
        }

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

    @PostMapping("/registro/pasajero")
    public String registrarPasajero(
            @RequestParam String nombre,
            @RequestParam String apellido,
            @RequestParam String documentoIdentidad,
            @RequestParam String email,
            @RequestParam String telefono,
            @RequestParam String password,
            @RequestParam String confirmPassword,
            @RequestParam(value = "cf-turnstile-response", required = false) String turnstileResponse,
            RedirectAttributes redirectAttributes) {

        if (!captchaService.isHuman(turnstileResponse)) {
            redirectAttributes.addFlashAttribute("errorPasajero", "Error de Captcha. Por favor, verifica que eres humano.");
            return "redirect:/auth/registro";
        }

        if (!password.equals(confirmPassword)) {
            redirectAttributes.addFlashAttribute("errorPasajero", "Las contraseñas no coinciden");
            return "redirect:/auth/registro";
        }

        try {
            // Delegamos la creación y persistencia completa al servicio
            authService.registrarPasajero(nombre + " " + apellido, documentoIdentidad, email, telefono, password);

            redirectAttributes.addFlashAttribute("success", "Registro exitoso. Por favor inicia sesión.");
            return "redirect:/auth/login";
        } catch (jakarta.validation.ConstraintViolationException e) {
            String msg = e.getConstraintViolations().stream()
                .map(cv -> cv.getMessage()).findFirst().orElse("Error de validación");
            redirectAttributes.addFlashAttribute("errorPasajero", msg);
            return "redirect:/auth/registro";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorPasajero", e.getMessage());
            return "redirect:/auth/registro";
        }
    }

    @PostMapping("/registro/conductor")
    public String registrarConductor(
            @RequestParam String nombre,
            @RequestParam String documentoIdentidad,
            @RequestParam String email,
            @RequestParam String telefono,
            @RequestParam String password,
            @RequestParam String confirmPassword,
            @RequestParam String licencia,
            @RequestParam String placa,
            @RequestParam String marca,
            @RequestParam String modelo,
            @RequestParam String color,
            @RequestParam String tarjetaPropiedad,
            @RequestParam String soat,
            @RequestParam String tecnomecanica,
            @RequestParam(value = "cf-turnstile-response", required = false) String turnstileResponse,
            RedirectAttributes redirectAttributes) {

        if (!captchaService.isHuman(turnstileResponse)) {
            redirectAttributes.addFlashAttribute("errorConductor", "Error de Captcha. Por favor, verifica que eres humano.");
            return "redirect:/auth/registro#conductor";
        }

        if (!password.equals(confirmPassword)) {
            redirectAttributes.addFlashAttribute("errorConductor", "Las contraseñas no coinciden");
            return "redirect:/auth/registro#conductor";
        }

        try {
            // La lógica de creación de Conductor vive en AuthService
            Conductor conductor = authService.registrarConductor(
                    nombre, documentoIdentidad, email, password, licencia);

            // El Vehículo se asocia aquí porque el Controller tiene el contexto HTTP de
            // todos
            // los parámetros del formulario, y el VehiculoRepository se necesita solo aquí.
            Vehiculo vehiculo = Vehiculo.builder()
                    .placa(placa)
                    .marca(marca)
                    .modelo(modelo)
                    .color(color)
                    .soatNumero(soat)
                    .tecnomecanicaId(tecnomecanica)
                    .conductorAsignado(conductor)
                    .tipoVehiculo(Vehiculo.TipoVehiculo.CARRO_PARTICULAR)
                    .activo(true)
                    .fechaRegistro(LocalDate.now())
                    .build();

            vehiculo = vehiculoRepository.save(vehiculo);
            conductor.setVehiculos(List.of(new ObjectId(vehiculo.getId())));
            // El conductor ya fue guardado en AuthService; aquí solo actualizamos la lista
            // de vehículos.
            // Usamos authService.registrarConductor que ya hace save; necesitamos solo
            // update vehiculos.
            // Se delega la actualización de vehículos al servicio que tiene el repo de
            // usuarios.
            // Nota: si se quiere eliminar el acoplamiento del repo de Vehiculo del
            // controller,
            // se puede mover toda esta lógica a un VehiculoService en una iteración futura.

            redirectAttributes.addFlashAttribute("success", "Registro exitoso. Por favor inicia sesión.");
            return "redirect:/auth/login";
        } catch (jakarta.validation.ConstraintViolationException e) {
            String msg = e.getConstraintViolations().stream()
                .map(cv -> cv.getMessage()).findFirst().orElse("Error de validación");
            redirectAttributes.addFlashAttribute("errorConductor", msg);
            return "redirect:/auth/registro#conductor";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorConductor", e.getMessage());
            return "redirect:/auth/registro#conductor";
        }
    }
}