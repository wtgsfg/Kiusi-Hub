package com.kiusi.kiusihub.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class CurrencyService {

    @Value("${exchange.api.key:YOUR_API_KEY}")
    private String apiKey;

    private static final String API_URL = "https://v6.exchangerate-api.com/v6/%s/latest/USD";

    private final RestTemplate restTemplate;

    public CurrencyService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public Double getExchangeRate(String fromCurrency, String toCurrency) {
        String url = String.format(API_URL, apiKey);

        try {
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);

            if (response != null && response.get("conversion_rates") != null) {
                Map<String, Object> rates = (Map<String, Object>) response.get("conversion_rates");
                Double usdToCop = ((Number) rates.get("COP")).doubleValue();

                if ("COP".equals(fromCurrency) && "USD".equals(toCurrency)) {
                    return 1.0 / usdToCop;
                } else if ("USD".equals(fromCurrency) && "COP".equals(toCurrency)) {
                    return usdToCop;
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            return "COP".equals(fromCurrency) && "USD".equals(toCurrency) ? 0.00025 : 4000.0;
        }

        return 1.0;
    }

    public Double convertCopToUsd(Double amountCop) {
        Double rate = getExchangeRate("COP", "USD");
        return amountCop * rate;
    }
}
