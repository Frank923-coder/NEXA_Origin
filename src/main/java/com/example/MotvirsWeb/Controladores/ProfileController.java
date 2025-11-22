package com.example.MotvirsWeb.Controladores;

import com.example.MotvirsWeb.Service.PasswordResetService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/profile") // Ruta base protegida
public class ProfileController {

    @Autowired
    private PasswordResetService passwordService;

    // Muestra el formulario reutilizando tu diseño
    @GetMapping("/change-password")
    public String showChangePasswordForm(Model model) {
        return "private/change-password";
    }

    @PostMapping("/change-password")
    public String processChangePassword(
            @RequestParam String currentPassword,
            @RequestParam String newPassword,
            @RequestParam String confirmPassword,
            Authentication authentication,
            RedirectAttributes redirectAttributes) {

        // 1. Validación básica de coincidencia
        if (!newPassword.equals(confirmPassword)) {
            redirectAttributes.addFlashAttribute("error", "Las nuevas contraseñas no coinciden.");
            return "redirect:/profile/change-password";
        }

        try {
            String email = authentication.getName();


            passwordService.changePassword(email, currentPassword, newPassword);

            // 3. Mensaje de éxito
            redirectAttributes.addFlashAttribute("success", "¡Contraseña actualizada correctamente!");

            // 4. Redirección según Rol
            var authorities = authentication.getAuthorities();
            if (authorities.stream().anyMatch(a -> a.getAuthority().equals("ROLE_PASAJERO"))) {
                return "redirect:/pasajero/panel";
            } else if (authorities.stream().anyMatch(a -> a.getAuthority().equals("ROLE_CONDUCTOR"))) {
                return "redirect:/conductor/panel";
            } else if (authorities.stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
                return "redirect:/admin/dashboard";
            }
            return "redirect:/";

        } catch (Exception e) {
            // AQUÍ ES DONDE SE CAPTURA EL ERROR "Contraseña Incorrecta"
            // y se manda de vuelta al HTML para que salga la alerta roja.
            redirectAttributes.addFlashAttribute("error", e.getMessage());
            return "redirect:/profile/change-password";
        }
    }
}