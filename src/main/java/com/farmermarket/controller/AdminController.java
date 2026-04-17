package com.farmermarket.controller;

import com.farmermarket.model.Order;
import com.farmermarket.model.Product;
import com.farmermarket.model.User;
import com.farmermarket.repository.OrderRepository;
import com.farmermarket.repository.ProductRepository;
import com.farmermarket.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        Map<String, Object> stats = new HashMap<>();
        
        List<Order> orders = orderRepository.findAll();
        stats.put("totalOrders", orders.size());
        
        BigDecimal totalRevenue = orders.stream()
                .filter(o -> {
                    String status = o.getStatus();
                    String payStatus = o.getPaymentStatus();
                    return (status != null && status.equalsIgnoreCase("CONFIRMED")) || 
                           (payStatus != null && payStatus.equalsIgnoreCase("PAID"));
                })
                .map(Order::getTotalAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
                
        stats.put("totalRevenue", totalRevenue);
        stats.put("totalProducts", productRepository.count());
        stats.put("totalUsers", userRepository.count());
        
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/orders")
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    @PostMapping("/orders/{id}/status")
    public ResponseEntity<Order> updateOrderStatus(@PathVariable Long id, @RequestBody Map<String, String> statusData) {
        if (id == null) return ResponseEntity.badRequest().build();
        return orderRepository.findById(id).map(order -> {
            order.setStatus(statusData.get("status"));
            return ResponseEntity.ok(orderRepository.save(order));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/users")
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // Image Upload Logic
    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> uploadImage(@RequestParam("file") MultipartFile file) {
        try {
            String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
            Path path = Paths.get("src/main/resources/static/uploads/" + fileName);
            Files.createDirectories(path.getParent());
            Files.copy(file.getInputStream(), path, StandardCopyOption.REPLACE_EXISTING);
            
            Map<String, String> response = new HashMap<>();
            response.put("url", "uploads/" + fileName);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // Product Management
    @GetMapping("/products")
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    @PostMapping("/products")
    public ResponseEntity<Product> createProduct(@RequestBody Product product) {
        if (product.getFarmer() == null) {
            User farmer = userRepository.findAll().stream()
                .filter(u -> "FARMER".equalsIgnoreCase(u.getRole()) || "ADMIN".equalsIgnoreCase(u.getRole()))
                .findFirst()
                .orElseGet(() -> {
                    User systemFarmer = new User();
                    systemFarmer.setName("System Farmer");
                    systemFarmer.setEmail("system@farmconnect.com");
                    systemFarmer.setPassword("system_protected");
                    systemFarmer.setRole("FARMER");
                    return userRepository.save(systemFarmer);
                });
            product.setFarmer(farmer);
        }
        return ResponseEntity.ok(productRepository.save(product));
    }

    @PutMapping("/products/{id}")
    public ResponseEntity<Product> updateProduct(@PathVariable Long id, @RequestBody Product productDetails) {
        if (id == null) return ResponseEntity.badRequest().build();
        return productRepository.findById(id).map(product -> {
            product.setName(productDetails.getName());
            product.setPrice(productDetails.getPrice());
            product.setCategory(productDetails.getCategory());
            product.setStock(productDetails.getStock());
            product.setImage(productDetails.getImage());
            product.setDescription(productDetails.getDescription());
            return ResponseEntity.ok(productRepository.save(product));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/products/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        if (id != null && productRepository.existsById(id)) {
            productRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
