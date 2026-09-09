package com.kiusi.kiusihub.controller;

import com.kiusi.kiusihub.model.Factura;
import com.kiusi.kiusihub.model.ItemPedido;
import com.kiusi.kiusihub.service.FacturaService;
import com.kiusi.kiusihub.service.ItemPedidoService;
import com.kiusi.kiusihub.service.PdfService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/facturas")
public class FacturaController {

    private final FacturaService facturaService;
    private final ItemPedidoService itemPedidoService;
    private final PdfService pdfService;

    public FacturaController(FacturaService facturaService, ItemPedidoService itemPedidoService, PdfService pdfService) {
        this.facturaService = facturaService;
        this.itemPedidoService = itemPedidoService;
        this.pdfService = pdfService;
    }

    @GetMapping
    public ResponseEntity<List<Factura>> getAll(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaDesde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaHasta,
            @RequestParam(required = false) String cliente,
            @RequestParam(required = false) String vendedor,
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) Double minTotal,
            @RequestParam(required = false) Double maxTotal,
            @RequestParam(required = false) Long nroFactura) {
        return ResponseEntity.ok(facturaService.findAllFiltered(fechaDesde, fechaHasta, cliente, vendedor, estado, minTotal, maxTotal, nroFactura));
    }

    @GetMapping("/resumen")
    public ResponseEntity<Map<String, Object>> getResumen(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaDesde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaHasta,
            @RequestParam(required = false) String cliente,
            @RequestParam(required = false) String vendedor,
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) Double minTotal,
            @RequestParam(required = false) Double maxTotal,
            @RequestParam(required = false) Long nroFactura) {
        Map<String, Object> res = facturaService.resumenFiltrado(fechaDesde, fechaHasta, cliente, vendedor, estado, minTotal, maxTotal, nroFactura);
        Map<String, Object> normalized = new HashMap<>();
        normalized.put("cantidad", res.getOrDefault("cantidad", 0));
        normalized.put("totalFacturado", ((Number) res.getOrDefault("totalFacturado", 0.0)).doubleValue());
        normalized.put("totalPagado", ((Number) res.getOrDefault("totalPagado", 0.0)).doubleValue());
        normalized.put("totalPendiente", ((Number) res.getOrDefault("totalPendiente", 0.0)).doubleValue());
        normalized.put("cantidadPagadas", res.getOrDefault("cantidadPagadas", 0));
        normalized.put("cantidadPendientes", res.getOrDefault("cantidadPendientes", 0));
        normalized.put("promedioFactura", ((Number) res.getOrDefault("promedioFactura", 0.0)).doubleValue());
        return ResponseEntity.ok(normalized);
    }

    @GetMapping("/clientes-lista")
    public ResponseEntity<List<String>> getClientesLista() {
        return ResponseEntity.ok(facturaService.findAllClientesExistentes());
    }

    @GetMapping("/vendedores-lista")
    public ResponseEntity<List<String>> getVendedoresLista() {
        return ResponseEntity.ok(facturaService.findAllVendedoresExistentes());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Factura> getById(@PathVariable Long id) {
        return ResponseEntity.ok(facturaService.findById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Factura> update(@PathVariable Long id, @RequestBody Factura factura) {
        return ResponseEntity.ok(facturaService.update(id, factura));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        facturaService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> downloadFacturaPdf(@PathVariable Long id) {
        try {
            Factura factura = facturaService.findById(id);
            List<ItemPedido> items = itemPedidoService.findByPedidoId(factura.getPedidoId());
            byte[] pdfBytes = pdfService.generateFacturaPdf(factura, items);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "Factura-" + id + ".pdf");

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(pdfBytes);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
