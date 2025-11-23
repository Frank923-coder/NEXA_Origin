package com.example.MotvirsWeb.Service;

import com.example.MotvirsWeb.Dto.ContactForm;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${app.base-url:}") // El valor puede estar vacío
    private String configuredBaseUrl;

    // Inyectamos el correo configurado para saber a dónde enviar las notificaciones
    @Value("${spring.mail.username}")
    private String myEmail;

    public void enviarMensajeContacto(ContactForm form) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();

            // Quien lo envía (protocolo SMTP requiere que sea tu mismo correo autenticado)
            message.setFrom(myEmail);

            // A quien le llega (A ti mismo, o al departamento de soporte)
            message.setTo(myEmail);

            message.setSubject("NEXA - Nuevo mensaje de: " + form.getNombre());

            message.setText("Has recibido un nuevo mensaje desde la web de NEXA:\n\n" +
                    "Nombre: " + form.getNombre() + "\n" +
                    "Correo del usuario: " + form.getEmail() + "\n\n" +
                    "Mensaje:\n" + form.getMensaje());

            mailSender.send(message);
            System.out.println("Correo enviado exitosamente.");

        } catch (Exception e) {
            System.err.println("Error enviando correo: " + e.getMessage());
            // Aquí podrías lanzar una excepción personalizada si quisieras manejarlo en el controller
        }
    }
    private String getBaseUrl() {
        // 1. Si baseUrl está configurado explícitamente, úsalo
        if (StringUtils.hasText(configuredBaseUrl)) {
            return configuredBaseUrl;
        }

        // 2. Detectar si estamos en Azure App Service
        String azureWebsiteHostname = System.getenv("WEBSITE_HOSTNAME");
        if (azureWebsiteHostname != null && !azureWebsiteHostname.isEmpty()) {
            // Ya estás en Azure, usa HTTPS
            return "https://" + azureWebsiteHostname;
        }

        // 3. Por defecto para desarrollo local
        return "http://localhost:8080/";
    }
    public void enviarCorreoRecuperacion(String emailDestino, String token) {
        try {
            // 1. Aquí usamos tu método getBaseUrl() para asegurar que sea HTTPS en Azure
            String baseUrl = getBaseUrl();

            // 2. Construimos el link completo
            String urlReset = baseUrl + "/auth/reset-password?token=" + token;

            SimpleMailMessage message = new SimpleMailMessage();

            // From: Tu sistema
            message.setFrom(myEmail);

            // To: El usuario que perdió la contraseña (NO tú)
            message.setTo(emailDestino);

            message.setSubject("NEXA - Restablecer Contraseña");

            message.setText("Hola,\n\n" +
                    "Para restablecer tu contraseña en NEXA, haz clic en el siguiente enlace:\n\n" +
                    urlReset + "\n\n" +  // <--- ¡AQUÍ ESTÁ LA SOLUCIÓN!
                    "Este enlace expira en 30 minutos.\n" +
                    "Si no solicitaste esto, ignora este mensaje.");

            mailSender.send(message);
            System.out.println("Correo de recuperación enviado a: " + emailDestino);

        } catch (Exception e) {
            System.err.println("Error enviando recuperación: " + e.getMessage());
            // Opcional: lanzar excepción para que el Controller se entere
        }
    }


    // Lógica para cambiar la contraseña final
    public void resetPassword(String token, String newPassword) {
        // Lógica para buscar el usuario por token y actualizar password
    }

}
