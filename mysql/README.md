# mysql

本目录保存项目运行需要的数据库初始化脚本。

| 文件 | 说明 |
| --- | --- |
| `01-undo_log.sql` | Seata AT 模式回滚日志表，需在 `sky_take_out` 库执行 |
| `02-nacos-auth.sql` | Nacos 开启鉴权后的管理员账号与角色初始化 |

执行示例：

```bash
mysql -uroot -proot sky_take_out < mysql/01-undo_log.sql
mysql -uroot -proot nacos < mysql/02-nacos-auth.sql
```

Nacos / Seata 的建库建表脚本分别来自：

- `middleware/nacos/conf/mysql-schema.sql`
- `middleware/seata/seata-server/script/server/db/mysql.sql`
