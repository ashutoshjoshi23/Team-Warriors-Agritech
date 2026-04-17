package com.farmermarket.controller;

import com.farmermarket.model.Product;
import com.farmermarket.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "*")
public class ProductController {

    @Autowired
    private ProductRepository productRepository;

    @GetMapping
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    @GetMapping("/farmer/{farmerId}")
    public List<Product> getProductsByFarmerId(@PathVariable Long farmerId) {
        return productRepository.findByFarmerId(farmerId);
    }

    @PostMapping
    public ResponseEntity<?> createProduct(@RequestBody Product product) {
        if (product == null) {
            return ResponseEntity.badRequest().body("Product cannot be null");
        }
        Product savedProduct = productRepository.save(product);
        return ResponseEntity.ok(savedProduct);
    }
}
