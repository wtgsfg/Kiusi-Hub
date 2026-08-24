package com.kiusi.kiusihub.controller;

import com.kiusi.kiusihub.service.CurrencyService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/currency")
public class CurrencyController {

    private final CurrencyService currencyService;

    public CurrencyController(CurrencyService currencyService) {
        this.currencyService = currencyService;
    }

    @GetMapping("/rate")
    public ResponseEntity<Double> getExchangeRate(@RequestParam String from, @RequestParam String to) {
        Double rate = currencyService.getExchangeRate(from, to);
        return ResponseEntity.ok(rate);
    }

    @GetMapping("/convert")
    public ResponseEntity<Double> convertCopToUsd(@RequestParam Double amount) {
        Double converted = currencyService.convertCopToUsd(amount);
        return ResponseEntity.ok(converted);
    }
}
