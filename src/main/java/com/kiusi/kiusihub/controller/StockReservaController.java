package com.kiusi.kiusihub.controller;

import com.kiusi.kiusihub.service.StockReservaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/productos/stock")
public class StockReservaController {

    private final StockReservaService stockReservaService;

    public StockReservaController(StockReservaService stockReservaService) {
        this.stockReservaService = stockReservaService;
    }

    public record AjusteRequest(
            Long productoId,
            String vendedorUsername,
            Integer delta,
            Integer cantidadFinal
    ) {}

    private Map<String, Object> resultToMap(StockReservaService.AjusteResult r) {
        Map<String, Object> m = new HashMap<>();
        m.put("ok", r.ok());
        if (r.error() != null) m.put("error", r.error());
        m.put("stockFisico", r.stockFisico());
        m.put("reservadoOtrosVendedores", r.reservadoOtros());
        m.put("reservadoTotal", r.reservadoTotal());
        m.put("reservadoPorMi", r.nuevaCantidadReservadaPorEsteVendedor());
        m.put("stockDisponibleRestante", r.stockDisponibleRestante());
        return m;
    }

    /**
     * Ajustar reserva de un producto para un vendedor:
     * - Enviar delta (+/-) para agregar/quitar
     * - O enviar cantidadFinal para establecer valor exacto (prefiere este valor si viene)
     */
    @PostMapping("/reservas/ajustar")
    public ResponseEntity<Map<String, Object>> ajustar(@RequestBody AjusteRequest req) {
        if (req == null || req.productoId() == null ||
                req.vendedorUsername() == null || req.vendedorUsername().isBlank()) {
            Map<String, Object> m = new HashMap<>();
            m.put("ok", false);
            m.put("error", "Faltan datos obligatorios: productoId, vendedorUsername");
            return ResponseEntity.badRequest().body(m);
        }
        StockReservaService.AjusteResult r;
        if (req.cantidadFinal() != null) {
            r = stockReservaService.establecer(req.productoId(), req.vendedorUsername(), req.cantidadFinal());
        } else if (req.delta() != null) {
            r = stockReservaService.ajustar(req.productoId(), req.vendedorUsername(), req.delta());
        } else {
            Map<String, Object> m = new HashMap<>();
            m.put("ok", false);
            m.put("error", "Enviar delta o cantidadFinal");
            return ResponseEntity.badRequest().body(m);
        }
        return ResponseEntity.ok(resultToMap(r));
    }

    /**
     * Aplicar múltiples ajustes de un solo golpe (mejor rendimiento para refrescar carrito completo).
     */
    public record AjusteBatchRequest(
            String vendedorUsername,
            List<AjusteRequest> ajustes
    ) {}

    @PostMapping("/reservas/ajustar/batch")
    public ResponseEntity<List<Map<String, Object>>> ajustarBatch(@RequestBody AjusteBatchRequest req) {
        if (req == null || req.vendedorUsername() == null || req.vendedorUsername().isBlank()) {
            return ResponseEntity.badRequest().body(List.of());
        }
        List<Map<String, Object>> resp = new java.util.ArrayList<>();
        if (req.ajustes() != null) {
            for (AjusteRequest a : req.ajustes()) {
                StockReservaService.AjusteRequest req2 = new StockReservaController.AjusteRequest(
                        a.productoId(), req.vendedorUsername(), a.delta(), a.cantidadFinal());
                StockReservaService.AjusteResult r;
                if (req2.cantidadFinal() != null) {
                    r = stockReservaService.establecer(req2.productoId(), req2.vendedorUsername(), req2.cantidadFinal());
                } else if (req2.delta() != null) {
                    r = stockReservaService.ajustar(req2.productoId(), req2.vendedorUsername(), req2.delta());
                } else continue;
                resp.add(resultToMap(r));
            }
        }
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/reservas/mis-reservas/{vendedorUsername}")
    public ResponseEntity<Map<Long, Integer>> misReservas(@PathVariable String vendedorUsername) {
        return ResponseEntity.ok(stockReservaService.misReservas(vendedorUsername));
    }

    @DeleteMapping("/reservas/liberar-vendedor/{vendedorUsername}")
    public ResponseEntity<Map<String, Object>> liberarTodoPorVendedor(@PathVariable String vendedorUsername) {
        stockReservaService.liberarTodoPorVendedor(vendedorUsername);
        Map<String, Object> m = new HashMap<>();
        m.put("ok", true);
        return ResponseEntity.ok(m);
    }

    @DeleteMapping("/reservas/liberar/{vendedorUsername}/{productoId}")
    public ResponseEntity<Map<String, Object>> liberarProducto(
            @PathVariable String vendedorUsername,
            @PathVariable Long productoId) {
        stockReservaService.liberarProductoPorVendedor(productoId, vendedorUsername);
        Map<String, Object> m = new HashMap<>();
        m.put("ok", true);
        return ResponseEntity.ok(m);
    }
}
