package com.example.MotvirsWeb.Controladores;

import com.example.MotvirsWeb.Dto.ContactForm;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import com.example.MotvirsWeb.Service.EmailService;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/public")
public class ControllerPublic {
    @Autowired
    private EmailService emailService;
    @GetMapping("/home/pasajero")
    public String apartadodelHome() {
        return "index";
    }

    @GetMapping("/home/conductor")
    public String aparatadoconductor(){
        return "home_conductor";
    }

    @PostMapping("/contact")
    public String procesarContacto(@ModelAttribute ContactForm form, RedirectAttributes redirectAttributes) {
        // Llamamos al servicio
        emailService.enviarMensajeContacto(form);

        // Agregamos un mensaje flash para mostrar en el HTML después de recargar
        redirectAttributes.addFlashAttribute("mensajeExito", "¡Gracias por escribirnos! Nos pondremos en contacto pronto.");

        // Redirigimos al fragmento #contact para que el usuario no pierda el foco
        return "redirect:/public/home/pasajero#contact";
    }
}


