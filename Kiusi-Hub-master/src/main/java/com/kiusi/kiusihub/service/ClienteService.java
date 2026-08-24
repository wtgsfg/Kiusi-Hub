package com.kiusi.kiusihub.service;

import com.kiusi.kiusihub.dto.ClienteDTO;
import com.kiusi.kiusihub.exception.ResourceNotFoundException;
import com.kiusi.kiusihub.model.Cliente;
import com.kiusi.kiusihub.repository.ClienteRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ClienteService {

    private final ClienteRepository clienteRepository;

    public ClienteService(ClienteRepository clienteRepository) {
        this.clienteRepository = clienteRepository;
    }

    public List<Cliente> findAll() {
        return clienteRepository.findAll();
    }

    public Cliente findById(Long id) {
        return clienteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado"));
    }

    public Cliente create(ClienteDTO dto) {
        Cliente cliente = new Cliente();
        cliente.setNombre(dto.getNombre());
        cliente.setCiudad(dto.getCiudad());
        cliente.setDireccion(dto.getDireccion());
        cliente.setNit(dto.getNit());
        cliente.setVendedor(dto.getVendedor());
        cliente.setNumero(dto.getNumero());
        return clienteRepository.save(cliente);
    }

    public Cliente update(Long id, ClienteDTO dto) {
        Cliente existingCliente = findById(id);
        existingCliente.setNombre(dto.getNombre());
        existingCliente.setCiudad(dto.getCiudad());
        existingCliente.setDireccion(dto.getDireccion());
        existingCliente.setNit(dto.getNit());
        existingCliente.setVendedor(dto.getVendedor());
        existingCliente.setNumero(dto.getNumero());
        return clienteRepository.save(existingCliente);
    }

    public void delete(Long id) {
        clienteRepository.deleteById(id);
    }
}