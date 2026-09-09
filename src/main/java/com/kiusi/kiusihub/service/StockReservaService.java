package com.kiusi.kiusihub.service;

import com.kiusi.kiusihub.model.Producto;
import com.kiusi.kiusihub.model.ReservaStock;
import com.kiusi.kiusihub.repository.ProductoRepository;
import com.kiusi.kiusihub.repository.ReservaStockRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class StockReservaService {

    public static final int TIEMPO_EXPIRACION_MINUTOS = 30;

    private final ReservaStockRepository reservaStockRepository;
    private final ProductoRepository productoRepository;

    public StockReservaService(ReservaStockRepository reservaStockRepository,
                               ProductoRepository productoRepository) {
        this.reservaStockRepository = reservaStockRepository;
        this.productoRepository = productoRepository;
    }

    public record AjusteResult(
            boolean ok,
            String error,
            int stockFisico,
            int reservadoOtros,
            int reservadoTotal,
            int reservadoAhoraMismo,
            int stockDisponibleRestante,
            int nuevaCantidadReservadaPorEsteVendedor
    ) {
        public static AjusteResult fail(String error) {
            return new AjusteResult(false, error, 0, 0, 0, 0, 0, 0);
        }
    }

    private LocalDateTime proximaExpiracion() {
        return LocalDateTime.now().plusMinutes(TIEMPO_EXPIRACION_MINUTOS);
    }

    /**
     * Ajusta la reserva de un vendedor para un producto.
     * delta positivo = reservar más; delta negativo = liberar.
     * Valida que el stock disponible (físico - reservado por OTROS vendedores) alcance para la nueva cantidad total.
     */
    @Transactional
    public AjusteResult ajustar(Long productoId, String vendedorUsername, int delta) {
        if (productoId == null || vendedorUsername == null || vendedorUsername.isBlank()) {
            return AjusteResult.fail("Faltan datos (productoId/vendedor)");
        }
        Optional<Producto> optP = productoRepository.findById(productoId);
        if (optP.isEmpty()) {
            return AjusteResult.fail("Producto no encontrado");
        }
        Producto p = optP.get();
        int stockFisico = p.getStock();

        int reservadoTotal = reservaStockRepository.sumReservasActivasProducto(productoId);
        ReservaStock actual = reservaStockRepository.findPorProductoYVendedor(productoId, vendedorUsername);
        int reservadoPorEste = actual == null ? 0 : actual.getCantidad();
        int reservadoPorOtros = Math.max(0, reservadoTotal - reservadoPorEste);

        int nuevaCantidadPorEste = reservadoPorEste + delta;
        if (nuevaCantidadPorEste < 0) nuevaCantidadPorEste = 0;

        int disponibleParaEste = Math.max(0, stockFisico - reservadoPorOtros);
        if (nuevaCantidadPorEste > disponibleParaEste) {
            return new AjusteResult(false,
                    "Stock insuficiente. Disponible para ti ahora: " + disponibleParaEste +
                            " (el otro vendedor tiene apartado: " + reservadoPorOtros + ")",
                    stockFisico, reservadoPorOtros, reservadoTotal, 0, disponibleParaEste, reservadoPorEste);
        }

        reservaStockRepository.upsertCantidadFinal(productoId, vendedorUsername, nuevaCantidadPorEste, proximaExpiracion());

        // Recalcular estado real post-ajuste
        int reservadoTotalNuevo = reservaStockRepository.sumReservasActivasProducto(productoId);
        int disponible = Math.max(0, stockFisico - reservadoTotalNuevo);
        ReservaStock nuevoEstado = reservaStockRepository.findPorProductoYVendedor(productoId, vendedorUsername);
        int reservadoAhora = nuevoEstado == null ? 0 : nuevoEstado.getCantidad();

        return new AjusteResult(true, null,
                stockFisico, reservadoPorOtros, reservadoTotalNuevo,
                reservadoAhora, disponible, reservadoAhora);
    }

    /**
     * Establece una cantidad final sin delta (usado desde el frontend cuando recalcula a mano el total).
     */
    @Transactional
    public AjusteResult establecer(Long productoId, String vendedorUsername, int cantidadFinalSolicitada) {
        if (productoId == null || vendedorUsername == null || vendedorUsername.isBlank()) {
            return AjusteResult.fail("Faltan datos (productoId/vendedor)");
        }
        ReservaStock actual = reservaStockRepository.findPorProductoYVendedor(productoId, vendedorUsername);
        int actualEste = actual == null ? 0 : actual.getCantidad();
        int delta = Math.max(-actualEste, cantidadFinalSolicitada - actualEste);
        return ajustar(productoId, vendedorUsername, delta);
    }

    public void liberarTodoPorVendedor(String vendedorUsername) {
        if (vendedorUsername == null || vendedorUsername.isBlank()) return;
        reservaStockRepository.borrarTodoPorVendedor(vendedorUsername);
    }

    public void liberarProductoPorVendedor(Long productoId, String vendedorUsername) {
        if (productoId == null || vendedorUsername == null) return;
        reservaStockRepository.borrarPorProductoYVendedor(productoId, vendedorUsername);
    }

    public Map<Long, Integer> misReservas(String vendedorUsername) {
        Map<Long, Integer> m = new HashMap<>();
        if (vendedorUsername == null || vendedorUsername.isBlank()) return m;
        List<ReservaStock> list = reservaStockRepository.findPorVendedor(vendedorUsername);
        for (ReservaStock r : list) {
            if (r.getProductoId() != null && r.getCantidad() > 0) {
                m.merge(r.getProductoId(), r.getCantidad(), Integer::sum);
            }
        }
        return m;
    }

    /**
     * Confirmar que el pedido salió: las reservas de ese vendedor para esos productos se consumen.
     * Se llama después de restar el stock real.
     */
    public void confirmarPedido(String vendedorUsername, Map<Long, Integer> cantidadesPorProducto) {
        if (vendedorUsername == null || vendedorUsername.isBlank()) return;
        if (cantidadesPorProducto == null || cantidadesPorProducto.isEmpty()) return;
        for (Map.Entry<Long, Integer> e : cantidadesPorProducto.entrySet()) {
            if (e.getKey() == null) continue;
            reservaStockRepository.borrarPorProductoYVendedor(e.getKey(), vendedorUsername);
        }
    }

    /**
     * Job: cada 60 segundos limpia reservas expiradas.
     */
    @Scheduled(fixedDelay = 60_000L, initialDelay = 120_000L)
    public void limpiarExpiradasScheduled() {
        int n = reservaStockRepository.limpiarExpiradas();
        if (n > 0) {
            System.out.println("[StockReserva] Limpieza programada: " + n + " reserva(s) expiradas liberadas");
        }
    }
}
