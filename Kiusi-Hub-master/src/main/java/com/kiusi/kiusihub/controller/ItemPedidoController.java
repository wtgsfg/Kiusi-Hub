package com.kiusi.kiusihub.controller;

import com.kiusi.kiusihub.model.ItemPedido;
import com.kiusi.kiusihub.service.ItemPedidoService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/items")
public class ItemPedidoController {

    private final ItemPedidoService itemPedidoService;

    public ItemPedidoController(ItemPedidoService itemPedidoService) {
        this.itemPedidoService = itemPedidoService;
    }

    @GetMapping("/pedido/{pedidoId}")
    public ResponseEntity<List<ItemPedido>> getByPedidoId(@PathVariable Long pedidoId) {
        return ResponseEntity.ok(itemPedidoService.findByPedidoId(pedidoId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ItemPedido> getById(@PathVariable Long id) {
        return ResponseEntity.ok(itemPedidoService.findById(id));
    }

    @PostMapping
    public ResponseEntity<ItemPedido> addItem(
            @RequestParam Long pedidoId,
            @RequestParam Long productoId,
            @RequestParam int cantidad
    ) {
        return new ResponseEntity<>(itemPedidoService.addItem(pedidoId, productoId, cantidad), HttpStatus.CREATED);
    }

    @PostMapping("/with-price")
    public ResponseEntity<ItemPedido> addItemWithPrice(
            @RequestParam Long pedidoId,
            @RequestParam Long productoId,
            @RequestParam int cantidad,
            @RequestParam double precio
    ) {
        return new ResponseEntity<>(itemPedidoService.addItemWithPrice(pedidoId, productoId, cantidad, precio), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ItemPedido> update(
            @PathVariable Long id,
            @RequestParam int cantidad
    ) {
        return ResponseEntity.ok(itemPedidoService.update(id, cantidad));
    }

    @PutMapping("/{id}/price")
    public ResponseEntity<ItemPedido> updateWithPrice(
            @PathVariable Long id,
            @RequestParam int cantidad,
            @RequestParam double precio
    ) {
        return ResponseEntity.ok(itemPedidoService.updateWithPrice(id, cantidad, precio));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        itemPedidoService.delete(id);
        return ResponseEntity.noContent().build();
    }
}