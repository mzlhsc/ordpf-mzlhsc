package com.mzlhsc.common.utils;

import cn.hutool.core.util.StrUtil;
import com.aliyun.oss.ClientBuilderConfiguration;
import com.aliyun.oss.OSS;
import com.aliyun.oss.OSSClientBuilder;
import com.aliyun.oss.common.auth.CredentialsProviderFactory;
import com.aliyun.oss.common.auth.DefaultCredentialProvider;
import com.aliyun.oss.common.comm.SignVersion;
import com.mzlhsc.common.properties.AliyunOSSProperties;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.ByteArrayInputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

/**
 * 阿里云 OSS 上传工具。
 * <p>
 * OSS 客户端是线程安全的，这里只创建一次、随应用关闭而释放，
 * 不要每次上传都 OSSClientBuilder.create() 再 shutdown()（那样每次都要重新握手）。
 */
@Slf4j
@Component
public class AliyunOSSOperator {

    private final AliyunOSSProperties properties;

    /** 全局复用的 OSS 客户端 */
    private final OSS ossClient;

    public AliyunOSSOperator(AliyunOSSProperties properties) {
        this.properties = properties;

        ClientBuilderConfiguration conf = new ClientBuilderConfiguration();
        // V4 签名（2024 年后新建 Bucket 强制要求）
        conf.setSignatureVersion(SignVersion.V4);

        // 3.18.x 起 create() 返回的是内部构建器类型，用 var 接收
        var builder = OSSClientBuilder.create()
                .endpoint(properties.getEndpoint())
                .clientConfiguration(conf)
                .region(properties.getRegion());

        // 凭证优先级：配置文件 > 环境变量
        if (StrUtil.isNotBlank(properties.getAccessKeyId())) {
            builder.credentialsProvider(new DefaultCredentialProvider(
                    properties.getAccessKeyId(), properties.getAccessKeySecret()));
        } else {
            // 3.18.x 里 newEnvironmentVariableCredentialsProvider() 会抛受检异常
            try {
                builder.credentialsProvider(
                        CredentialsProviderFactory.newEnvironmentVariableCredentialsProvider());
            } catch (Exception e) {
                throw new IllegalStateException(
                        "未配置 AccessKey：请在 mzlhsc.aliyun.access-key-id 填写，或设置环境变量 OSS_ACCESS_KEY_ID / OSS_ACCESS_KEY_SECRET", e);
            }
        }

        this.ossClient = builder.build();
        log.info("OSS 客户端初始化完成: endpoint={}, bucket={}",
                properties.getEndpoint(), properties.getBucketName());
    }

    /**
     * 上传文件
     *
     * @param content          文件字节
     * @param originalFilename 原始文件名（只用来取后缀）
     * @return 可访问的 URL
     */
    public String upload(byte[] content, String originalFilename) {
        String objectName = buildObjectName(originalFilename);
        ossClient.putObject(properties.getBucketName(), objectName, new ByteArrayInputStream(content));
        String url = buildUrl(objectName);
        log.info("文件上传成功: {}", url);
        return url;
    }

    /**
     * 按日期分目录 + UUID 重命名，例如 2026/11/2f1c....png
     */
    private String buildObjectName(String originalFilename) {
        String dir = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM"));
        String extension = "";
        int dot = originalFilename == null ? -1 : originalFilename.lastIndexOf('.');
        if (dot >= 0) {
            extension = originalFilename.substring(dot);
        }
        return dir + "/" + UUID.randomUUID() + extension;
    }

    /**
     * 拼出外网访问地址：https://{bucket}.{host}/{objectName}
     */
    private String buildUrl(String objectName) {
        String endpoint = properties.getEndpoint();
        String host = endpoint.substring(endpoint.indexOf("//") + 2);
        return "https://" + properties.getBucketName() + "." + host + "/" + objectName;
    }

    @PreDestroy
    public void shutdown() {
        if (ossClient != null) {
            ossClient.shutdown();
            log.info("OSS 客户端已关闭");
        }
    }
}
