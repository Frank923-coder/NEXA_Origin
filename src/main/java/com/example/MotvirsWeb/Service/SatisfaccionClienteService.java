package com.example.MotvirsWeb.Service;

import com.example.MotvirsWeb.Models.EstadoServicio;
import com.example.MotvirsWeb.Models.ModeloInfo;
import com.example.MotvirsWeb.Models.Servicio;
import com.example.MotvirsWeb.Repositorios.ModeloInfoRepository;
import com.example.MotvirsWeb.Repositorios.ServicioRepository;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import weka.classifiers.trees.J48;
import weka.core.*;

import java.io.File;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
public class SatisfaccionClienteService {

    @Autowired
    private ServicioRepository servicioRepository;

    @Autowired
    private ModeloInfoRepository modeloInfoRepository;

    @Value("${motvirs.model.path}")
    private String modelFilePath;

    // --- ESTADO DEL MODELO EN MEMORIA ---
    private J48 j48Model;       // El modelo J48 entrenado
    private Instances dataHeader; // La "plantilla" de los datos (atributos)

    /**
     * Se ejecuta al iniciar la app. Carga el modelo binario desde el disco.
     */
    @PostConstruct
    public void init() {
        log.info("Iniciando servicio de predicción de satisfacción...");
        try {
            cargarModelo();
        } catch (Exception e) {
            log.warn("No se pudo cargar el modelo desde {}. Se entrenará uno nuevo en la primera predicción. Causa: {}",
                    modelFilePath, e.getMessage());
        }
    }

    /**
     * Carga el modelo binario (J48) y la cabecera (dataHeader) desde el archivo.
     */
    public void cargarModelo() throws Exception {
        File modelFile = new File(modelFilePath);
        if (modelFile.exists()) {
            log.info("Cargando modelo J48 existente desde: {}", modelFilePath);
            Object[] loadedObjects = SerializationHelper.readAll(modelFilePath);
            this.j48Model = (J48) loadedObjects[0];
            this.dataHeader = (Instances) loadedObjects[1];
            log.info("Modelo J48 cargado exitosamente.");
        } else {
            log.info("El archivo de modelo {} no existe. Se debe entrenar.", modelFilePath);
        }
    }

    /**
     * Define la estructura (atributos) que Weka espera.
     */
    private ArrayList<Attribute> definirAtributos() {
        ArrayList<Attribute> attributes = new ArrayList<>();

        // Atributo 1: Duración del viaje en minutos
        attributes.add(new Attribute("duracion"));

        // Atributo 2: Distancia del viaje en KM
        attributes.add(new Attribute("distancia"));

        // Atributo 3: Tarifa del viaje
        attributes.add(new Attribute("tarifa"));

        // Atributo 4: Clase Objetivo (lo que queremos predecir)
        List<String> valoresClase = List.of("si", "no");
        attributes.add(new Attribute("satisfaccion", valoresClase));

        return attributes;
    }

    /**
     * Proceso principal: Carga datos, calcula estadísticas, transforma y entrena el J48.
     * Guarda el modelo binario en disco Y el resultado de texto + stats en MongoDB.
     */
    public String entrenarModelo() throws Exception {
        log.info("Iniciando re-entrenamiento del modelo J48...");

        // 1. Definir la estructura de los datos
        ArrayList<Attribute> attributes = definirAtributos();
        Instances data = new Instances("satisfaccion_dataset", attributes, 0);
        data.setClassIndex(attributes.size() - 1);

        // Guardamos la cabecera para futuras predicciones
        this.dataHeader = new Instances(data, 0);

        // 2. Cargar TODOS los servicios FINALIZADOS de MongoDB
        List<Servicio> serviciosCompletados = servicioRepository.findByEstado(EstadoServicio.FINALIZADO);
        log.info("Obtenidos {} servicios finalizados de la BD.", serviciosCompletados.size());

        // --- VARIABLES PARA ESTADÍSTICAS ---
        int countSi = 0;
        int countNo = 0;
        double sumaTarifaSi = 0;
        double sumaTarifaNo = 0;
        double sumaDistSi = 0;
        double sumaDistNo = 0;

        // 3. Proceso ETL y Cálculo de Estadísticas
        for (Servicio s : serviciosCompletados) {

            // Feature 1: Duración
            double duracion = 0;
            if (s.getFechaInicio() != null && s.getFechaFinalizacion() != null) {
                duracion = ChronoUnit.MINUTES.between(s.getFechaInicio(), s.getFechaFinalizacion());
            }

            // Feature 2: Distancia
            double distancia = s.getDistanciaKM();

            // Feature 3: Tarifa
            double tarifa = s.getTarifa();

            // Variable Objetivo (Target)
            Double promedio = s.getCalificacionPromedio();
            String satisfaccion;

            if (promedio == null) {
                continue; // Ignorar registros sin calificación
            } else {
                // Regla de negocio: >= 4.0 es "si"
                boolean isSatisfied = promedio >= 4.0;
                satisfaccion = isSatisfied ? "si" : "no";

                // --- ACUMULAR ESTADÍSTICAS ---
                if (isSatisfied) {
                    countSi++;
                    sumaTarifaSi += tarifa;
                    sumaDistSi += distancia;
                } else {
                    countNo++;
                    sumaTarifaNo += tarifa;
                    sumaDistNo += distancia;
                }
            }

            // Crear Instance Weka
            Instance inst = new DenseInstance(attributes.size());
            inst.setDataset(this.dataHeader);
            inst.setValue(attributes.get(0), duracion);
            inst.setValue(this.dataHeader.attribute("distancia"), distancia);
            inst.setValue(attributes.get(2), tarifa);
            inst.setValue(attributes.get(3), satisfaccion);

            data.add(inst);
        }

        if (data.numInstances() == 0) {
            log.warn("No hay datos suficientes para entrenar. El entrenamiento se cancela.");
            return "Entrenamiento cancelado: no hay datos.";
        }

        log.info("Datos transformados. {} instancias listas para entrenar.", data.numInstances());

        // 4. Entrenar el clasificador J48
        this.j48Model = new J48();
        this.j48Model.buildClassifier(data);
        log.info("Modelo J48 entrenado exitosamente.");

        // 5. Guardar el modelo BINARIO en el disco
        log.info("Guardando modelo binario en: {}", modelFilePath);
        Object[] toSave = new Object[2];
        toSave[0] = this.j48Model;
        toSave[1] = this.dataHeader;
        SerializationHelper.writeAll(modelFilePath, toSave);

        // 6. Guardar el resultado de TEXTO y ESTADÍSTICAS en MongoDB
        String arbolString = this.j48Model.toString();

        ModeloInfo info = new ModeloInfo();
        info.setNombreModelo("J48_Satisfaccion");
        info.setFechaEntrenamiento(LocalDateTime.now());
        info.setArbolDecisionTexto(arbolString);
        info.setInstanciasUsadas(data.numInstances());

        // Asignar Totales
        info.setTotalSatisfactorios(countSi);
        info.setTotalInsatisfactorios(countNo);

        // Asignar Promedios (Evitando división por cero)
        info.setPromedioTarifaSi(countSi > 0 ? sumaTarifaSi / countSi : 0);
        info.setPromedioDistanciaSi(countSi > 0 ? sumaDistSi / countSi : 0);

        info.setPromedioTarifaNo(countNo > 0 ? sumaTarifaNo / countNo : 0);
        info.setPromedioDistanciaNo(countNo > 0 ? sumaDistNo / countNo : 0);

        modeloInfoRepository.save(info);
        log.info("Resultado del entrenamiento y estadísticas guardados en MongoDB.");

        return arbolString;
    }

    /**
     * Predice la satisfacción de un nuevo servicio.
     */
    public String predecirSatisfaccion(Servicio nuevoServicio) throws Exception {
        if (this.j48Model == null) {
            log.warn("El modelo no está cargado. Se iniciará el entrenamiento ahora.");
            entrenarModelo();
            if (this.j48Model == null) {
                log.error("Fallo en el entrenamiento, no se puede predecir.");
                return "Error: Modelo no disponible";
            }
        }

        // 1. Crear una instancia Weka vacía CON LA CABECERA
        Instance inst = new DenseInstance(this.dataHeader.numAttributes());
        inst.setDataset(this.dataHeader);

        // 2. Calcular los mismos features que en el entrenamiento
        double duracion = ChronoUnit.MINUTES.between(nuevoServicio.getFechaInicio(), nuevoServicio.getFechaFinalizacion());
        double distancia = nuevoServicio.getDistanciaKM();
        double tarifa = nuevoServicio.getTarifa();

        // 3. Poblar la instancia
        inst.setValue(this.dataHeader.attribute("duracion"), duracion);
        inst.setValue(this.dataHeader.attribute("distancia"), distancia);
        inst.setValue(this.dataHeader.attribute("tarifa"), tarifa);
        inst.setClassMissing();

        // 4. Clasificar la instancia
        double predictionIndex = this.j48Model.classifyInstance(inst);

        // 5. Devolver el resultado
        return this.dataHeader.classAttribute().value((int) predictionIndex);
    }
}