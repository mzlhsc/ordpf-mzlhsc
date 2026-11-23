package com.mzlhsc.order.config;

import com.alibaba.csp.sentinel.slots.block.RuleConstant;
import com.alibaba.csp.sentinel.slots.block.degrade.DegradeRule;
import com.alibaba.csp.sentinel.slots.block.degrade.DegradeRuleManager;
import com.alibaba.csp.sentinel.slots.block.flow.FlowRule;
import com.alibaba.csp.sentinel.slots.block.flow.FlowRuleManager;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;

import java.util.ArrayList;
import java.util.List;

/**
 * 下单链路的 Sentinel 规则。
 * <p>
 * 规则同时会注册到 Sentinel Dashboard（服务启动后可在控制台看到并动态调整），
 * 即使 Dashboard 暂时没启动，本地规则仍然生效，避免高峰点餐把订单库打穿。
 */
@Configuration
@Slf4j
public class SentinelRuleConfiguration {

    @PostConstruct
    public void initRules() {
        List<FlowRule> flowRules = new ArrayList<>();
        flowRules.add(flowRule("submitOrder", 10));
        flowRules.add(flowRule("submitDiningOrder", 10));
        FlowRuleManager.loadRules(flowRules);

        List<DegradeRule> degradeRules = new ArrayList<>();
        degradeRules.add(degradeRule("submitOrder"));
        degradeRules.add(degradeRule("submitDiningOrder"));
        DegradeRuleManager.loadRules(degradeRules);
        log.info("Sentinel 本地规则已加载: 下单 QPS<=10，慢调用比例熔断");
    }

    private FlowRule flowRule(String resource, double count) {
        FlowRule rule = new FlowRule();
        rule.setResource(resource);
        rule.setGrade(RuleConstant.FLOW_GRADE_QPS);
        rule.setCount(count);
        rule.setControlBehavior(RuleConstant.CONTROL_BEHAVIOR_DEFAULT);
        return rule;
    }

    private DegradeRule degradeRule(String resource) {
        DegradeRule rule = new DegradeRule();
        rule.setResource(resource);
        rule.setGrade(RuleConstant.DEGRADE_GRADE_RT);
        rule.setCount(500);
        rule.setTimeWindow(10);
        rule.setMinRequestAmount(10);
        rule.setStatIntervalMs(1000);
        rule.setSlowRatioThreshold(0.5);
        return rule;
    }
}
