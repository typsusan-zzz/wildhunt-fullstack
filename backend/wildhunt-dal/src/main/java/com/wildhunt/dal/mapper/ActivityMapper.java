package com.wildhunt.dal.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.wildhunt.dal.entity.ActivityEntity;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface ActivityMapper extends BaseMapper<ActivityEntity> {
}
