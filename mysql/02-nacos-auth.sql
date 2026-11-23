-- Nacos 3.1.1 开启鉴权后的最小初始化
-- 账号：nacos / nacos（BCrypt 哈希如下，生产环境请替换）
-- 执行前请确认已用官方 mysql-schema.sql 初始化 nacos 库
USE `nacos`;

INSERT INTO `users` (`username`, `password`, `enabled`)
VALUES ('nacos', '$2a$10$cCFfyiE9YcRWJA7b9ZKnfu7oGa1Tu9gVOBCOREo2lrB4oO4virjJe', 1)
ON DUPLICATE KEY UPDATE `password` = VALUES(`password`), `enabled` = 1;

INSERT INTO `roles` (`username`, `role`)
VALUES ('nacos', 'ROLE_ADMIN')
ON DUPLICATE KEY UPDATE `role` = VALUES(`role`);
