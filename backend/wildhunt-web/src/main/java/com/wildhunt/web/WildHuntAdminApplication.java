package com.wildhunt.web;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@MapperScan("com.wildhunt.dal.mapper")
@SpringBootApplication(scanBasePackages = "com.wildhunt")
public class WildHuntAdminApplication {
    public static void main(String[] args) {
        SpringApplication.run(WildHuntAdminApplication.class, args);
    }
}
