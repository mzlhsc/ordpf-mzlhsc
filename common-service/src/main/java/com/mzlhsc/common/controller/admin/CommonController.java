package com.mzlhsc.common.controller.admin;

import com.mzlhsc.common.result.R;
import com.mzlhsc.common.utils.AliyunOSSOperator;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * 通用接口：文件上传
 */
@RequestMapping("/admin/common")
@RestController
@RequiredArgsConstructor
@Tag(name = "通用接口", description = "文件上传")
@Slf4j
public class CommonController {

    private final AliyunOSSOperator aliyunOSSOperator;

    /**
     * 上传文件到阿里云 OSS
     *
     * @return 可直接访问的图片 URL
     */
    @PostMapping("/upload")
    @Operation(summary = "文件上传", description = "上传到阿里云 OSS，返回可访问的 URL")
    public R<String> upload(MultipartFile file) throws Exception {
        if (file == null || file.isEmpty()) {
            return R.error("上传文件不能为空");
        }
        log.info("文件上传: {}, 大小 {} 字节", file.getOriginalFilename(), file.getSize());
        String url = aliyunOSSOperator.upload(file.getBytes(), file.getOriginalFilename());
        return R.ok(url);
    }
}
