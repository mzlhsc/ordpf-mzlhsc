-- ============================================================
-- 03-dining-and-stock.sql
-- 苍穹外卖/order-platform：堂食完整场景 + 菜品库存 数据库迁移
-- 执行库：sky_take_out
-- 特点：可重复执行；已存在的列/索引会跳过
-- ============================================================

USE sky_take_out;

DROP PROCEDURE IF EXISTS ordpf_add_column;
DELIMITER $$
CREATE PROCEDURE ordpf_add_column(IN p_table VARCHAR(64), IN p_column VARCHAR(64), IN p_ddl TEXT)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = p_table AND COLUMN_NAME = p_column
    ) THEN
        SET @ddl = CONCAT('ALTER TABLE `', p_table, '` ADD COLUMN ', p_ddl);
        PREPARE stmt FROM @ddl;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$
DELIMITER ;

-- 菜品库存：限量菜品扣减/回补，新增菜品默认 100 份
CALL ordpf_add_column('dish', 'stock', '`stock` INT NOT NULL DEFAULT 100 COMMENT ''剩余库存''');

-- 堂食共享购物车：同一桌多人共享购物车
CALL ordpf_add_column('shopping_cart', 'dining_session_id', '`dining_session_id` BIGINT NULL COMMENT ''堂食会话id，堂食共享购物车使用''');

-- 桌台二维码与预约开关
CALL ordpf_add_column('dining_table', 'qr_token', '`qr_token` VARCHAR(64) NULL COMMENT ''扫码开台令牌''');
CALL ordpf_add_column('dining_table', 'reservation_enabled', '`reservation_enabled` TINYINT NOT NULL DEFAULT 1 COMMENT ''允许预约''');

-- 会话快照/AA/备注
CALL ordpf_add_column('dining_session', 'table_name', '`table_name` VARCHAR(64) NULL COMMENT ''主桌号快照''');
CALL ordpf_add_column('dining_session', 'aa_enabled', '`aa_enabled` TINYINT NOT NULL DEFAULT 0 COMMENT ''是否AA''');
CALL ordpf_add_column('dining_session', 'remark', '`remark` VARCHAR(255) NULL COMMENT ''备注''');

-- 成员 AA 支付
CALL ordpf_add_column('dining_session_member', 'paid_amount', '`paid_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT ''已支付金额''');
CALL ordpf_add_column('dining_session_member', 'pay_status', '`pay_status` TINYINT NOT NULL DEFAULT 0 COMMENT ''0未付 1已付''');

DROP PROCEDURE IF EXISTS ordpf_add_index;
DELIMITER $$
CREATE PROCEDURE ordpf_add_index(IN p_table VARCHAR(64), IN p_index VARCHAR(64), IN p_ddl TEXT)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = p_table AND INDEX_NAME = p_index
    ) THEN
        SET @ddl = CONCAT('ALTER TABLE `', p_table, '` ADD ', p_ddl);
        PREPARE stmt FROM @ddl;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$
DELIMITER ;

CALL ordpf_add_index('dining_table', 'uk_dining_table_qr', 'UNIQUE KEY `uk_dining_table_qr` (`qr_token`)');
CALL ordpf_add_index('shopping_cart', 'idx_shopping_cart_dining_session', 'KEY `idx_shopping_cart_dining_session` (`dining_session_id`)');

DROP PROCEDURE IF EXISTS ordpf_add_index;
DROP PROCEDURE IF EXISTS ordpf_add_column;

-- ============================================================
-- 新增表
-- ============================================================

CREATE TABLE IF NOT EXISTS `dining_reservation` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `table_id` BIGINT NOT NULL,
    `user_id` BIGINT NOT NULL,
    `contact_name` VARCHAR(32) NOT NULL,
    `contact_phone` VARCHAR(11) NOT NULL,
    `reserve_time` DATETIME NOT NULL,
    `guest_count` INT NOT NULL DEFAULT 1,
    `status` TINYINT NOT NULL DEFAULT 1 COMMENT '1待确认 2已确认 3已到店 4已取消 5已过期',
    `remark` VARCHAR(255) DEFAULT NULL,
    `create_time` DATETIME DEFAULT NULL,
    `update_time` DATETIME DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_reservation_table_time` (`table_id`, `reserve_time`),
    KEY `idx_reservation_user` (`user_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '堂食预约';

CREATE TABLE IF NOT EXISTS `dining_session_table` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `session_id` BIGINT NOT NULL,
    `table_id` BIGINT NOT NULL,
    `is_primary` TINYINT NOT NULL DEFAULT 0 COMMENT '1主桌 0并入桌',
    `create_time` DATETIME DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_session_table` (`session_id`, `table_id`),
    KEY `idx_session_table_table` (`table_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '堂食会话与桌台映射（并桌）';

CREATE TABLE IF NOT EXISTS `dining_payment` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `session_id` BIGINT NOT NULL,
    `user_id` BIGINT DEFAULT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `pay_method` INT NOT NULL DEFAULT 1 COMMENT '1微信 2支付宝 3现金 4AA',
    `pay_status` TINYINT NOT NULL DEFAULT 1 COMMENT '1已支付',
    `pay_time` DATETIME DEFAULT NULL,
    `remark` VARCHAR(255) DEFAULT NULL,
    `create_time` DATETIME DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_payment_session` (`session_id`),
    KEY `idx_payment_user` (`user_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '堂食支付/AA记录';

CREATE TABLE IF NOT EXISTS `dining_table_operation` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `session_id` BIGINT NOT NULL,
    `from_table_id` BIGINT DEFAULT NULL,
    `to_table_id` BIGINT DEFAULT NULL,
    `operation_type` TINYINT NOT NULL COMMENT '1转台 2并桌 3开台 4结账 5取消',
    `operator_id` BIGINT DEFAULT NULL,
    `operator_type` TINYINT NOT NULL DEFAULT 1 COMMENT '1员工 2用户 3系统',
    `remark` VARCHAR(255) DEFAULT NULL,
    `create_time` DATETIME DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_operation_session` (`session_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '堂食桌台操作流水';

-- 已有桌台补扫码令牌（UUID 去掉横线，唯一）
UPDATE `dining_table`
SET `qr_token` = REPLACE(UUID(), '-', '')
WHERE `qr_token` IS NULL OR `qr_token` = '';

-- 历史菜品补库存（默认 100）
UPDATE `dish` SET `stock` = 100 WHERE `stock` IS NULL;
