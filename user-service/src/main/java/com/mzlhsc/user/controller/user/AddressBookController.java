package com.mzlhsc.user.controller.user;

import com.mzlhsc.common.result.R;
import com.mzlhsc.common.context.UserContext;
import com.mzlhsc.user.domain.po.AddressBook;
import com.mzlhsc.user.service.IAddressBookService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * <p>
 * 地址簿 前端控制器
 * </p>
 *
 * @author mzlhsc
 * @since 2026-11-13
 */
@RestController
@RequestMapping("/addressBook")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "地址簿接口",description = "地址簿的增删改查接口")
public class AddressBookController {
    private final IAddressBookService addressBookService;

    /**
     * 查询当前登录用户的所有地址信息
     *
     * @return
     */
    @GetMapping("/list")
    @Operation(description = "查询当前登录用户的所有地址信息")
    public R<List<AddressBook>> list() {
        log.info("查询当前登录用户的所有地址信息: {}", UserContext.getCurrentId());
        AddressBook addressBook = new AddressBook();
        addressBook.setUserId(UserContext.getCurrentId());
        List<AddressBook> list = addressBookService.lambdaQuery()
                .eq(AddressBook::getUserId, UserContext.getCurrentId())
                .list();
        return R.ok(list);
    }


    /**
     * 新增地址
     *
     * @param addressBook
     * @return
     */
    @PostMapping
    @Operation(description = "新增地址")
    public R save(@RequestBody AddressBook addressBook) {
        log.info("新增地址: {}", addressBook);
        // 前端设置传入默认地址 默认为 0
        addressBookService.save(addressBook);
        return R.ok();
    }


    /**
     * 根据id查询地址
     * @param id
     * @return
     */
    @GetMapping("/{id}")
    @Operation(description = "根据id查询地址")
    public R<AddressBook> getById(@PathVariable Long id) {
        log.info("根据id查询地址: {}", id);
        AddressBook addressBook = addressBookService.getById(id);
        return R.ok(addressBook);
    }

    /**
     * 根据id修改地址
     *
     * @param addressBook
     * @return
     */
    @PutMapping
    @Operation(description = "根据id修改地址")
    public R update(@RequestBody AddressBook addressBook) {
        log.info("根据id修改地址: {}", addressBook);
        addressBookService.updateById(addressBook);
        return R.ok();
    }

    /**
     * 设置默认地址
     *
     * @param addressBook
     * @return
     */
    @PutMapping("/default")
    @Operation(description = "设置默认地址")
    public R setDefault(@RequestBody AddressBook addressBook) {
        log.info("设置默认地址: {}", addressBook.getId());
        addressBookService.lambdaUpdate()
                .set(AddressBook::getIsDefault,1)
                .eq(AddressBook::getId,addressBook.getId())
                .update();
        addressBookService.lambdaUpdate()
                .set(AddressBook::getIsDefault,0)
                .eq(AddressBook::getUserId, UserContext.getCurrentId())
                .update();
    return R.ok();
    }

    /**
     * 根据id删除地址
     *
     * @param id
     * @return
     */
    @DeleteMapping
    @Operation(description = "根据id删除地址")
    public R deleteById(Long id) {
        log.info("根据id删除地址: {}", id);
        addressBookService.removeById(id);
        return R.ok();
    }

    /**
     * 查询默认地址
     */
    @GetMapping("/default")
    @Operation(description = "查询默认地址")
    public R<AddressBook> getDefault() {
        //SQL:select * from address_book where user_id = ? and is_default = 1

        List<AddressBook> list = addressBookService.lambdaQuery()
                .eq(AddressBook::getUserId, UserContext.getCurrentId())
                .eq(AddressBook::getIsDefault,1)
                .list();

        if (list != null && list.size() == 1) {
            return R.ok(list.get(0));
        }

        return R.error("没有查询到默认地址");
    }
}
