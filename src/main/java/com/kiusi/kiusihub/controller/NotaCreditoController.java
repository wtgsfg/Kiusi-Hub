
package com.kiusi.kiusihub.controller;

import com.kiusi.kiusihub.model.NotaCredito;
import com.kiusi.kiusihub.service.NotaCreditoService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notas-credito")
public class NotaCreditoController {

    private final NotaCreditoService notaCreditoService;

    public NotaCreditoController(NotaCreditoService notaCreditoService) {
        this.notaCreditoService = notaCreditoService;
    }

    @GetMapping
    public ResponseEntity<List<NotaCredito>> getAll() {
        return ResponseEntity.ok(notaCreditoService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<NotaCredito> getById(@PathVariable Long id) {
        return ResponseEntity.ok(notaCreditoService.findById(id));
    }

    @GetMapping("/factura/{facturaId}")
    public ResponseEntity<List<NotaCredito>> getByFacturaId(@PathVariable Long facturaId) {
        return ResponseEntity.ok(notaCreditoService.findByFacturaId(facturaId));
    }

    @PostMapping
    public ResponseEntity<NotaCredito> create(@RequestBody NotaCredito notaCredito) {
        return new ResponseEntity<>(notaCreditoService.create(notaCredito), HttpStatus.CREATED);
    }

    @PutMapping("/{id}/anular")
    public ResponseEntity<NotaCredito> anular(@PathVariable Long id) {
        return ResponseEntity.ok(notaCreditoService.anular(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        notaCreditoService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
