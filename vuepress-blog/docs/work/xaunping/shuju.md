---
title: 适配器模式
date: 2024-03-24
sidebar: 'auto'
categories:
 - frontEnd
tags:
 - java
 - 业务
---

# 智能派单

## 使用的中间件

es 单索引最大1T左右，40多亿文档，40分片

40数据节点 3主节点  32C/64G/800G(数据节点) 32C/64G/100G(主节点)

 

cellar
22个节点 28C/180GB/2900GB

较大的几个area 300亿数据 2.8TB  一天平均qps： 70w tp999： 32ms  峰值qms：700w

