package com.kiusi.kiusihub.controller;

import com.kiusi.kiusihub.model.Recaudo;
import com.kiusi.kiusihub.service.RecaudoService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recaudos")
public class RecaudoController {

    private final RecaudoService recaudoService;

    public RecaudoController(RecaudoService recaudoService) {
        this.recaudoService = recaudoService;
    }

    @GetMapping
    public ResponseEntity<List<Recaudo>> getAll() {
        return ResponseEntity.ok(recaudoService.findAll());
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
    public ResponseEntity<Recaudo> registerPayment(
            @RequestParam Long facturaId,
            @RequestParam double monto
    ) {
        return new ResponseEntity<>(recaudoService.registerPayment(facturaId, monto), HttpStatus.CREATED);
    }
}