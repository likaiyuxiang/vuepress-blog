---
title: ES
date: 2022-08-23
sidebar: 'auto'
categories:
 - frontEnd
tags:
 - 数据库
 - es
---

# ES缓存策略

## Shard Request Cache

分片级别的缓存，缓存的key是整个客户端的请求，缓存内容为单个分片的查询结果 。

主要是对聚合的缓存，聚合过程是实时计算，通常会消耗非常多资源。

### 缓存策略

不是所有的查询都会被缓存，Scroll、设置了profile属性，查询类型不是Query_Then_FETCH等不会被缓存。

缓存主要为aggregations（聚合结果）、hits.count等

Request Cache是分片级别缓存，当有新的segment写入到分片之后，缓存就会失效。所以每次refresh缓存就会刷新。

## Node Query Cache(Filter Cache)

Node Query Cache缓存的是某一个filter子查询语句，在一个segment上的查询结果。如果一个segment缓存了某个子查询的结果，下次可以直接从缓存中获取，无需对segment进行查询，其只对Filter查询进行缓存。

Query Cache是在lucence层面实现的，缓存的key是filter子查询，缓存的值是文档id的位图FixedBitSet。

因为是段上的缓存，在段merge的时候会失效。
