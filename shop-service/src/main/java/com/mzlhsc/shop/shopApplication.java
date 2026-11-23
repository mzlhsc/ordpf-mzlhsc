package com.mzlhsc.shop;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * 店铺服务启动类。
 * <p>
 * 营业状态存放在 Redis，本服务没有数据库 Mapper，因此不需要 @MapperScan。
 */
@SpringBootApplication
public class shopApplication {

    public static void main(String[] args) {
        SpringApplication.run(shopApplication.class, args);
    }

}
