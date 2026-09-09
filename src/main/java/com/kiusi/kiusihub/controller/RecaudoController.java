package com.kiusi.kiusihub.controller;

import com.kiusi.kiusihub.dto.RecaudoDetalle;
import com.kiusi.kiusihub.dto.RecaudoResumen;
import com.kiusi.kiusihub.model.Recaudo;
import com.kiusi.kiusihub.service.RecaudoService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.sql.Date;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/recaudos")
public class RecaudoController {

    private final RecaudoService recaudoService;

    public RecaudoController(RecaudoService recaudoService) {
        this.recaudoService = recaudoService;
    }

    private Date toSqlDate(LocalDate ld) {
        return ld != null ? Date.valueOf(ld) : null;
    }

    @GetMapping
    public ResponseEntity<List<RecaudoDetalle>> getAllFiltered(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaDesde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaHasta,
            @RequestParam(required = false) Long facturaId,
            @RequestParam(required = false) String cliente,
            @RequestParam(required = false) String metodoPago
    ) {
        List<RecaudoDetalle> lista = recaudoService.findAllFiltered(
                toSqlDate(fechaDesde),
                toSqlDate(fechaHasta),
                facturaId,
                cliente,
                metodoPago
        );
        return ResponseEntity.ok(lista);
    }

    @GetMapping("/resumen")
    public ResponseEntity<RecaudoResumen> getSummary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaDesde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaHasta,
            @RequestParam(required = false) Long facturaId,
            @RequestParam(required = false) String cliente,
            @RequestParam(required = false) String metodoPago
    ) {
        RecaudoResumen resumen = recaudoService.getSummary(
                toSqlDate(fechaDesde),
                toSqlDate(fechaHasta),
                facturaId,
                cliente,
                metodoPago
        );
        return ResponseEntity.ok(resumen);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Recaudo> getById(@PathVariable Long id) {
        return ResponseEntity.ok(recaudoService.findById(id));
    }

    @GetMapping("/factura/{facturaId}")
    public ResponseEntity<List<Recaudo>> getByFacturaId(@PathVariable Long facturaId) {
        return ResponseEntity.ok(recaudoService.findByFacturaId(facturaId));
    }

    @PostMapping
    public ResponseEntity<?> registerPayment(
            @RequestParam Long facturaId,
            @RequestParam double monto,
            @RequestParam(required = false) String metodoPago
    ) {
        try {
            Recaudo creado = recaudoService.registerPayment(facturaId, monto, metodoPago);
            return new ResponseEntity<>(creado, HttpStatus.CREATED);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", e.getMessage() != null ? e.getMessage() : "Error al registrar el pago"
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", e.getMessage() != null ? e.getMessage() : "Error al registrar el pago"
            ));
        }
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> handleIllegalState(IllegalStateException e) {
        return ResponseEntity.badRequest().body(Map.of(
                "error", e.getMessage() != null ? e.getMessage() : "Solicitud inválida"
        ));
    }
}
