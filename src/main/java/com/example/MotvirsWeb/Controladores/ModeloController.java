package com.example.MotvirsWeb.Controladores;

import com.example.MotvirsWeb.Models.ModeloInfo;
import com.example.MotvirsWeb.Repositorios.ModeloInfoRepository;
import com.example.MotvirsWeb.Service.SatisfaccionClienteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

@RestController
@RequestMapping("/api/admin/ml")
public class ModeloController {

    @Autowired
    private SatisfaccionClienteService satisfaccionService;

    @Autowired
    private ModeloInfoRepository modeloInfoRepository;


    @GetMapping("/entrenar")
    public ResponseEntity<String> entrenarModelo() {
        try {
            String arbol = satisfaccionService.entrenarModelo();
            // Devolvemos el árbol en formato de texto <pre> para que respete los saltos de línea
            return ResponseEntity.ok("<pre>" + arbol + "</pre>");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error durante el entrenamiento: " + e.getMessage());
        }
    }


    @GetMapping("/resultado")
    public ResponseEntity<?> obtenerResultadoModelo() {
        // Busca el último modelo entrenado guardado en la BD
        Optional<ModeloInfo> info = modeloInfoRepository
                .findFirstByNombreModeloOrderByFechaEntrenamientoDesc("J48_Satisfaccion");

        if (info.isPresent()) {
            // Devuelve un objeto JSON con la fecha y el árbol
            return ResponseEntity.ok(info.get());
        } else {
            return ResponseEntity.status(404).body("No hay ningún modelo entrenado todavía. " +
                    "Por favor, llama a /api/ml/entrenar primero.");
        }
    }
}