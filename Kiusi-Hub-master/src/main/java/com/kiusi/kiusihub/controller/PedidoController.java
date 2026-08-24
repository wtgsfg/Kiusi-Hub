package com.kiusi.kiusihub.controller;

import com.kiusi.kiusihub.dto.PedidoDTO;
import com.kiusi.kiusihub.model.EstadoPedido;
import com.kiusi.kiusihub.model.ItemPedido;
import com.kiusi.kiusihub.model.Pedido;
import com.kiusi.kiusihub.service.ItemPedidoService;
import com.kiusi.kiusihub.service.PdfService;
import com.kiusi.kiusihub.service.PedidoService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pedidos")
public class PedidoController {

    private final PedidoService pedidoService;
    private final ItemPedidoService itemPedidoService;
    private final PdfService pdfService;

    public PedidoController(PedidoService pedidoService, ItemPedidoService itemPedidoService, PdfService pdfService) {
        this.pedidoService = pedidoService;
        this.itemPedidoService = itemPedidoService;
        this.pdfService = pdfService;
    }

    @GetMapping
    public ResponseEntity<List<Pedido>> getAll() {
        return ResponseEntity.ok(pedidoService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Pedido> getById(@PathVariable Long id) {
        return ResponseEntity.ok(pedidoService.findById(id));
    }

    @PostMapping
    public ResponseEntity<Pedido> create(@RequestBody PedidoDTO dto) {
        return new ResponseEntity<>(pedidoService.create(dto), HttpStatus.CREATED);
    }

    @PatchMapping("/{id}/estado")
    public ResponseEntity<Pedido> updateEstado(@PathVariable Long id, @RequestParam EstadoPedido nuevoEstado) {
        return ResponseEntity.ok(pedidoService.updateEstado(id, nuevoEstado));
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> downloadOrdenVentaPdf(@PathVariable Long id) {
        try {
            Pedido pedido = pedidoService.findById(id);
            List<ItemPedido> items = itemPedidoService.findByPedidoId(id);
            byte[] pdfBytes = pdfService.generateOrdenVentaPdf(pedido, items);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "Orden-Venta-" + id + ".pdf");

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(pdfBytes);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PatchMapping("/{id}/observaciones")
    public ResponseEntity<Pedido> updateObservaciones(
            @PathVariable Long id,
            @RequestBody String observaciones
    ) {
        return ResponseEntity.ok(pedidoService.updateObservaciones(id, observaciones));
    }

    @PatchMapping("/{id}/sacado")
    public ResponseEntity<Pedido> updateSacado(
            @PathVariable Long id,
            @RequestParam Boolean sacado
    ) {
        return ResponseEntity.ok(pedidoService.updateSacado(id, sacado));
    }
}
