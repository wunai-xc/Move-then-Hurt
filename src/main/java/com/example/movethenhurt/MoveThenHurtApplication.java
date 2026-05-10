package com.example.movethenhurt;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class MoveThenHurtApplication {
    public static void main(String[] args) {
        SpringApplication.run(MoveThenHurtApplication.class, args);
        System.out.println("Move then Hurt 游戏服务已启动，访问 http://localhost:8080");
    }
}