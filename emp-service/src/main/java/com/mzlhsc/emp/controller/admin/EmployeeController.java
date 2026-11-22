package com.mzlhsc.emp.controller.admin;


import cn.hutool.core.bean.BeanUtil;

import cn.hutool.db.Page;
import com.mzlhsc.common.result.PageDTO;
import com.mzlhsc.emp.constant.PasswordConstant;
import com.mzlhsc.emp.constant.StatusConstant;
import com.mzlhsc.emp.domain.dto.EditPasswordDTO;
import com.mzlhsc.emp.domain.dto.EmployeeDTO;
import com.mzlhsc.emp.domain.dto.EmployeeLoginDTO;
import com.mzlhsc.emp.domain.dto.EmployeePageQueryDTO;
import com.mzlhsc.emp.domain.po.Employee;
import com.mzlhsc.emp.domain.vo.EmployeeLoginVO;
import com.mzlhsc.emp.service.IEmployeeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.util.DigestUtils;
import org.springframework.web.bind.annotation.*;

/**
 * <p>
 * 员工信息 前端控制器
 * </p>
 *
 * @author mzlhsc
 * @since 2026-11-07
 */
@RestController
@RequestMapping("/admin/employee")
@RequiredArgsConstructor
@Tag(name = "员工接口" ,description = "")
@Slf4j
public class EmployeeController {



    private final IEmployeeService employeeService;



    /**
     * 登录接口
     * @param employeeLoginDTO
     * @return
     */
    @PostMapping("/login")
    @Operation(summary = "登录接口",description = "账户密码")
    public EmployeeLoginVO login(@RequestBody EmployeeLoginDTO employeeLoginDTO) {
        log.info("用户登录: {}" ,employeeLoginDTO);

        return employeeService.login(employeeLoginDTO);

    }

    /**
     * 退出
     * @return
     */
    @PostMapping("/logout")
    @Operation(summary = "员工退出")
    public String logout() {
        return null;
    }


    /**
     * 添加员工
     * @param employeeDTO
     * @return
     */
    @PostMapping
    @Operation(summary = "添加员工")
    public void save(@RequestBody EmployeeDTO employeeDTO){
        log.info("添加员工: {}" ,employeeDTO);

        Employee employee = BeanUtil.copyProperties(employeeDTO, Employee.class)
                .setPassword(DigestUtils.md5DigestAsHex(PasswordConstant.DEFAULT_PASSWORD.getBytes()))
                .setStatus(StatusConstant.ENABLE);

        employeeService.save(employee);



    }


    /**
     * 分页查询
     * @param employeePageQueryDTO
     * @return
     */
    @GetMapping("/page")
    @Operation(summary = "分页查询")
    public PageDTO page(EmployeePageQueryDTO employeePageQueryDTO){
        log.info("分页查询 {}" , employeePageQueryDTO);
        PageDTO page = employeeService.PageQuery(employeePageQueryDTO);
        return page;

    }


    /**
     * 根据id查询员工
     * @param id
     * @return
     */
    @GetMapping("{id}")
    @Operation(summary = "根据id查询员工")
    public Employee getById(@PathVariable Long id){
        log.info("根据id查询员工 {}" , id);
        return employeeService.getById(id);
    }


    /**
     * 修改员工信息
     * @param employeeDTO
     * @return
     */
    @PutMapping
    @Operation(summary = "修改员工信息")
    public void update(@RequestBody EmployeeDTO employeeDTO){
        log.info("修改员工信息: {}",employeeDTO);
        // 编辑员工只更新文档中列出的字段，不能顺带改密码和状态
        Employee employee = BeanUtil.copyProperties(employeeDTO,Employee.class);

        employeeService.updateById(employee);
    }

    /**
     * 修改员工密码
     * @param editPasswordDTO
     * @return
     */
    @PutMapping("/editPassword")
    @Operation(summary = "修改员工密码")
    public void editPassword(@RequestBody EditPasswordDTO editPasswordDTO){
        log.info("修改员工密码: {}",editPasswordDTO);
        employeeService.editPassword(editPasswordDTO);

    }


    /**
     * 员工启禁用
     * @param status
     * @param id
     * @return
     */
    @PostMapping("/status/{status}")
    @Operation(summary = "员工启禁用")
    public void status(@PathVariable Integer status , Long id){
        log.info("员工启禁用: {}",status);

        employeeService.
                lambdaUpdate().set(Employee::getStatus,status)
                .eq(Employee::getId,id)
                .update();

    }


}
