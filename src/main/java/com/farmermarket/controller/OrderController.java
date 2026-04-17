package com.farmermarket.controller;

import com.farmermarket.model.Order;
import com.farmermarket.model.OrderItem;
import com.farmermarket.model.Product;
import com.farmermarket.model.User;
import com.farmermarket.repository.OrderRepository;
import com.farmermarket.repository.ProductRepository;
import com.farmermarket.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*")
public class OrderController {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @GetMapping
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    @GetMapping("/user/{userId}")
    public List<Order> getOrdersByUserId(@PathVariable Long userId) {
        return orderRepository.findByBuyerId(userId);
    }

    @PostMapping
    public ResponseEntity<?> createOrder(@RequestBody Order order) {
        try {
            // 1. Validate Buyer
            if (order.getBuyer() == null) {
                return ResponseEntity.badRequest().body("Buyer is required");
            }
            Long buyerId = order.getBuyer().getId();
            if (buyerId == null) {
                return ResponseEntity.badRequest().body("Buyer ID is required");
            }
            
            User buyer = userRepository.findById(buyerId).orElse(null);
            if (buyer == null) {
                return ResponseEntity.status(401).body("User not found in database. Please Logout and Login again to refresh session.");
            }
            order.setBuyer(buyer);

            // 2. Validate and Attach Products in Items
            if (order.getItems() != null) {
                for (OrderItem item : order.getItems()) {
                    if (item.getProduct() == null) {
                        return ResponseEntity.badRequest().body("Product is required for items");
                    }
                    Long productId = item.getProduct().getId();
                    if (productId == null) {
                        return ResponseEntity.badRequest().body("Product ID is required for items");
                    }
                    Product product = productRepository.findById(productId).orElse(null);
                    if (product == null) {
                        return ResponseEntity.badRequest().body("Product not found ID: " + productId);
                    }
                    
                    item.setProduct(product);
                    // Update stock
                    if (product.getStock() < item.getQuantity()) {
                        return ResponseEntity.badRequest().body("Insufficient stock for product: " + product.getName());
                    }
                    product.setStock(product.getStock() - item.getQuantity());
                    productRepository.save(product);
                }
            }

            Order savedOrder = orderRepository.save(order);
            return ResponseEntity.ok(savedOrder);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Internal Server Error: " + e.getMessage());
        }
    }
}
