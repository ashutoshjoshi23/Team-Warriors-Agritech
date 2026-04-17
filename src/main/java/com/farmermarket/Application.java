package com.farmermarket;

import com.farmermarket.model.Product;
import com.farmermarket.model.User;
import com.farmermarket.repository.ProductRepository;
import com.farmermarket.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import java.math.BigDecimal;
import java.util.List;

@SpringBootApplication
public class Application {

    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }

    @Bean
    public CommandLineRunner demo(UserRepository userRepo, ProductRepository prodRepo) {
        return args -> {
            if (userRepo.count() == 0) {
                // Seed Admin
                User admin = new User();
                admin.setName("System Admin");
                admin.setEmail("admin@farmconnect.com");
                admin.setPassword("admin123");
                admin.setRole("ADMIN");
                userRepo.save(admin);

                // Seed Farmer
                User farmer = new User();
                farmer.setName("Kisan Bhai");
                farmer.setEmail("farmer@farmconnect.com");
                farmer.setPassword("farmer123");
                farmer.setRole("FARMER");
                userRepo.save(farmer);

                // Seed High-Quality Products
                Product p1 = new Product();
                p1.setName("Organic Alphonso Mangoes");
                p1.setCategory("Fruits");
                p1.setPrice(new BigDecimal("450.00"));
                p1.setStock(50);
                p1.setDescription("Premium quality hand-picked Alphonso mangoes directly from Ratnagiri farms.");
                p1.setImage("https://images.unsplash.com/photo-1553279768-865429fa0078?q=80&w=1000&auto=format&fit=crop");
                p1.setFarmer(farmer);
                
                Product p2 = new Product();
                p2.setName("Fresh Cherry Tomatoes");
                p2.setCategory("Vegetables");
                p2.setPrice(new BigDecimal("120.00"));
                p2.setStock(100);
                p2.setDescription("Sweet and juicy organic cherry tomatoes grown without any pesticides.");
                p2.setImage("https://images.unsplash.com/photo-1592484944180-11c393796ffb?q=80&w=1000&auto=format&fit=crop");
                p2.setFarmer(farmer);

                Product p3 = new Product();
                p3.setName("Pure Farm Honey");
                p3.setCategory("Others");
                p3.setPrice(new BigDecimal("350.00"));
                p3.setStock(30);
                p3.setDescription("100% natural and unprocessed forest honey, rich in nutrients.");
                p3.setImage("https://images.unsplash.com/photo-1587049352846-4a222e784d38?q=80&w=1000&auto=format&fit=crop");
                p3.setFarmer(farmer);

                prodRepo.saveAll(List.of(p1, p2, p3));
                System.out.println(">>> Database Seeded with Premium Content! <<<");
            }
        };
    }
}
