package com.kiusi.kiusihub.service;

import com.kiusi.kiusihub.exception.ResourceNotFoundException;
import com.kiusi.kiusihub.model.Factura;
import com.kiusi.kiusihub.model.Recaudo;
import com.kiusi.kiusihub.repository.FacturaRepository;
import com.kiusi.kiusihub.repository.RecaudoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Date;
import java.util.List;

@Service
public class RecaudoService {

    private final RecaudoRepository recaudoRepository;
    private final FacturaRepository facturaRepository;

    public RecaudoService(RecaudoRepository recaudoRepository, FacturaRepository facturaRepository) {
        this.recaudoRepository = recaudoRepository;
        this.facturaRepository = facturaRepository;
    }

    public List<Recaudo> findAll() {
        return recaudoRepository.findAll();
    }

    public Recaudo findById(Long id) {
        return recaudoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Recaudo no encontrado"));
    }

    public List<Recaudo> findByFacturaId(Long facturaId) {
        return recaudoRepository.findByFacturaId(facturaId);
    }

    @Transactional
    public Recaudo registerPayment(Long facturaId, double monto) {
        Factura factura = facturaRepository.findById(facturaId)
                .orElseThrow(() -> new ResourceNotFoundException("Factura no encontrada"));

        if (monto > factura.getSaldo()) {
            throw new RuntimeException("El pago supera el saldo pendiente");
        }

        Recaudo recaudo = new Recaudo();
        recaudo.setFacturaId(facturaId);
        recaudo.setMonto(monto);
        recaudo.setFecha(new Date(System.currentTimeMillis()));

        factura.setPagado(factura.getPagado() + monto);

        if (factura.getSaldo() <= 0) {
            factura.setEstado("PAGADO");
        }

        facturaRepository.save(factura);
        return recaudoRepository.save(recaudo);
    }
}
