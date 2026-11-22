package com.mzlhsc.user.service.impl;

import com.baomidou.mybatisplus.spring.service.impl.ServiceImpl;
import com.mzlhsc.user.domain.po.AddressBook;
import com.mzlhsc.user.mapper.AddressBookMapper;
import com.mzlhsc.user.service.IAddressBookService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * <p>
 * 地址簿 服务实现类
 * </p>
 *
 * @author mzlhsc
 * @since 2026-11-13
 */
@Service
@RequiredArgsConstructor
public class AddressBookServiceImpl extends ServiceImpl<AddressBookMapper, AddressBook> implements IAddressBookService {

}
