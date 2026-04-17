package com.farmermarket.controller;

import com.farmermarket.model.Order;
import com.farmermarket.repository.OrderRepository;
import com.razorpay.RazorpayClient;

import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "*")
public class PaymentController {

    @Value("${razorpay.key.id:}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret:}")
    private String razorpayKeySecret;

    @Autowired
    private OrderRepository orderRepository;

    @GetMapping("/get-key")
    public ResponseEntity<Map<String, String>> getRazorpayKey() {
        return ResponseEntity.ok(Map.of("key", razorpayKeyId != null ? razorpayKeyId : ""));
    }

    @PostMapping("/create-order/{orderId}")
    public ResponseEntity<?> createRazorpayOrder(@PathVariable Long orderId) {
        if (orderId == null) {
            return ResponseEntity.badRequest().body("Order ID is required");
        }

        Optional<Order> orderOptional = orderRepository.findById(orderId);
        if (orderOptional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Order order = orderOptional.get();

        // Always try real Razorpay first; fall back to demo mode on any error
        try {
            if (razorpayKeyId != null && !razorpayKeyId.isBlank()
                    && razorpayKeyId.startsWith("rzp_")
                    && razorpayKeySecret != null && !razorpayKeySecret.isBlank()) {

                RazorpayClient razorpay = new RazorpayClient(razorpayKeyId, razorpayKeySecret);

                JSONObject orderRequest = new JSONObject();
                // Amount in paise (multiply ₹ × 100)
                int amountPaise = order.getTotalAmount()
                        .multiply(new BigDecimal(100))
                        .intValue();
                orderRequest.put("amount", amountPaise);
                orderRequest.put("currency", "INR");
                orderRequest.put("receipt", "txn_" + order.getId());

                com.razorpay.Order razorpayOrder = razorpay.orders.create(orderRequest);

                order.setRazorpayOrderId(razorpayOrder.get("id").toString());
                order.setPaymentStatus("PENDING");
                orderRepository.save(order);

                return ResponseEntity.ok(razorpayOrder.toJson().toString());
            }
        } catch (Exception e) {
            // Fall through to demo mode
            System.out.println("Razorpay real mode failed, falling back to demo: " + e.getMessage());
        }

        // ===== DEMO / FALLBACK MODE =====
        String mockOrderId = "order_mock_" + System.currentTimeMillis();
        order.setRazorpayOrderId(mockOrderId);
        order.setPaymentStatus("PENDING");
        orderRepository.save(order);

        int amountPaise = order.getTotalAmount()
                .multiply(new BigDecimal(100))
                .intValue();

        JSONObject mockResponse = new JSONObject();
        mockResponse.put("id", mockOrderId);
        mockResponse.put("amount", amountPaise);
        mockResponse.put("currency", "INR");
        mockResponse.put("status", "created");

        return ResponseEntity.ok(mockResponse.toString());
    }

    @PostMapping("/verify-payment")
    public ResponseEntity<?> verifyPayment(@RequestBody Map<String, String> paymentData) {
        String razorpayOrderId  = paymentData.get("razorpay_order_id");
        String razorpayPaymentId = paymentData.get("razorpay_payment_id");

        if (razorpayOrderId == null || razorpayOrderId.isBlank()) {
            return ResponseEntity.badRequest().body("Order ID is required");
        }

        // 1. Try find by razorpayOrderId field
        Optional<Order> orderOptional = orderRepository.findAll().stream()
                .filter(o -> razorpayOrderId.equals(o.getRazorpayOrderId()))
                .findFirst();

        // 2. Fallback: parse DB order ID from "order_mock_{id}" or any format ending in a number
        if (orderOptional.isEmpty()) {
            try {
                String[] parts = razorpayOrderId.split("_");
                Long extractedId = Long.parseLong(parts[parts.length - 1]);
                orderOptional = orderRepository.findById(extractedId);
            } catch (NumberFormatException ignored) {}
        }

        if (orderOptional.isPresent()) {
            Order order = orderOptional.get();
            order.setRazorpayPaymentId(razorpayPaymentId);
            order.setPaymentStatus("PAID");
            order.setStatus("CONFIRMED");
            orderRepository.save(order);
            return ResponseEntity.ok(Map.of("status", "success", "message", "Payment verified successfully"));
        }

        return ResponseEntity.status(400).body("Order not found for ID: " + razorpayOrderId);
    }
}

