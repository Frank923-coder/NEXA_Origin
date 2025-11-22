package com.example.MotvirsWeb.Models;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "info_modelos_ml")
@Data
@NoArgsConstructor

public class ModeloInfo {
    @Id
    private String id;
    private String nombreModelo;
    private LocalDateTime fechaEntrenamiento;
    private String arbolDecisionTexto; //  String del árbol J48
    private int instanciasUsadas;

    private int totalSatisfactorios;
    private int totalInsatisfactorios;
    private double promedioTarifaSi;      // Cuánto cuesta en promedio un viaje "bueno"
    private double promedioTarifaNo;      // Cuánto cuesta en promedio un viaje "malo"
    private double promedioDistanciaSi;
    private double promedioDistanciaNo;

    public ModeloInfo(String nombreModelo, LocalDateTime fecha, String arbol, int instancias,int totalSatisfactorios,int totalInsatisfactorios,double promedioTarifaSi, double promedioTarifaNo, double promedioDistanciaSi, double promedioDistanciaNo ) {
        this.nombreModelo = nombreModelo;
        this.fechaEntrenamiento = fecha;
        this.arbolDecisionTexto = arbol;
        this.instanciasUsadas = instancias;
        this.totalSatisfactorios= totalSatisfactorios;
        this.totalInsatisfactorios =totalInsatisfactorios;
        this.promedioTarifaSi =promedioTarifaSi;
        this.promedioTarifaNo =promedioTarifaNo;
        this.promedioDistanciaSi =promedioDistanciaSi;
        this.promedioDistanciaNo =promedioDistanciaNo;


    }

}