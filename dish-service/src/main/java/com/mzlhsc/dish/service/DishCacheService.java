package com.mzlhsc.dish.service;

import com.mzlhsc.dish.domain.vo.DishVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;
import java.util.concurrent.TimeUnit;

/**
 * 热点菜品缓存。
 * <p>
 * key 前缀统一为 {@code dish:cache:}，菜品/库存任何写操作都调用 {@link #evictAll()}，
 * 保证缓存不会比数据库旧。
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DishCacheService {

    private static final String PREFIX = "dish:cache:";
    private static final String DETAIL_KEY = PREFIX + "detail:";
    private static final String LIST_KEY = PREFIX + "list:";
    private static final long DETAIL_TTL_MINUTES = 10;
    private static final long LIST_TTL_MINUTES = 5;

    private final RedisTemplate<String, Object> redisTemplate;

    @SuppressWarnings("unchecked")
    public DishVO getDetail(Long dishId) {
        try {
            Object value = redisTemplate.opsForValue().get(DETAIL_KEY + dishId);
            return value instanceof DishVO ? (DishVO) value : null;
        } catch (Exception e) {
            log.warn("读取菜品详情缓存失败，降级查数据库: {}", e.getMessage());
            return null;
        }
    }

    public void putDetail(DishVO dishVO) {
        try {
            redisTemplate.opsForValue().set(DETAIL_KEY + dishVO.getId(), dishVO,
                    DETAIL_TTL_MINUTES, TimeUnit.MINUTES);
        } catch (Exception e) {
            log.warn("写入菜品详情缓存失败: {}", e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    public List<DishVO> getList(Long categoryId) {
        try {
            Object value = redisTemplate.opsForValue().get(LIST_KEY + categoryId);
            return value instanceof List<?> ? (List<DishVO>) value : null;
        } catch (Exception e) {
            log.warn("读取菜品列表缓存失败，降级查数据库: {}", e.getMessage());
            return null;
        }
    }

    public void putList(Long categoryId, List<DishVO> list) {
        try {
            redisTemplate.opsForValue().set(LIST_KEY + categoryId, list,
                    LIST_TTL_MINUTES, TimeUnit.MINUTES);
        } catch (Exception e) {
            log.warn("写入菜品列表缓存失败: {}", e.getMessage());
        }
    }

    /**
     * 清空全部菜品缓存。菜品数量不多，直接按前缀删除，逻辑简单且不会漏 key。
     */
    public void evictAll() {
        try {
            Set<String> keys = redisTemplate.keys(PREFIX + "*");
            if (keys != null && !keys.isEmpty()) {
                redisTemplate.delete(keys);
            }
        } catch (Exception e) {
            log.warn("清理菜品缓存失败: {}", e.getMessage());
        }
    }
}
