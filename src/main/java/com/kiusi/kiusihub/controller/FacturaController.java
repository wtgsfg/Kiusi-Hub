package com.kiusi.kiusihub.controller;

import com.kiusi.kiusihub.model.Factura;
import com.kiusi.kiusihub.model.ItemPedido;
import com.kiusi.kiusihub.service.FacturaService;
import com.kiusi.kiusihub.service.ItemPedidoService;
import com.kiusi.kiusihub.service.PdfService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
    public ResponseEntity<List<Factura>> getAll() {
        return ResponseEntity.ok(facturaService.findAll());
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