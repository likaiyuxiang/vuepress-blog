---
title: log
date: 2022-06-30
sidebar: 'auto'
categories:
 - frontEnd
tags:
 - springboot
 - 日志
---

# Log

## 日志系统(技术)和日志门脸

- 日志系统(技术)：实现记录日志的技术，有的用的自己的规范接口，有的是用的公共的规范接口

  常用：log4j,log4j2,logback，jul。

- 日志门脸： 又日志的规范，可以近似的认为是所有日志技术需要实现的公共接口

  常用：common-logging， slf4j。

通常对于简单的项目，我们会使用单独的日志门面进行实现日志相关操作，随着开发的进行，会更新迭代使用不同的日志框架，此时若是一开始使用单个日志实现框架，再使用其他日志框架时难以统一与管理，造成日志体系的混乱。此时我们需要借鉴JDBC的思想，为日志系统提供一套门面，通过面向接口规范来进行开发，避免了直接依赖具体的日志框架，可轻松切换不同的日志实现框架并且不需要改动代码，这就是日志门面存在的意义。

## 日志系统(技术)

### java.util.logging (JUL)

JDK1.4 开始，通过 java.util.logging 提供日志功能。虽然是官方自带的log lib，JUL的使用确不广泛。主要原因:

- JUL从JDK1.4 才开始加入(2002年)，当时各种第三方log lib已经被广泛使用了
- JUL早期存在性能问题，到JDK1.5上才有了不错的进步，但现在和Logback/Log4j2相比还是有所不如
- JUL的功能不如Logback/Log4j2等完善，比如Output Handler就没有Logback/Log4j2的丰富，有时候需要自己来继承定制，又比如默认没有从ClassPath里加载配置文件的功能

### Log4j

Log4j 是 apache 的一个开源项目，创始人 Ceki Gulcu。Log4j 应该说是 Java 领域资格最老，应用最广的日志工具。Log4j 是高度可配置的，并可通过在运行时的外部文件配置。它根据记录的优先级别，并提供机制，以指示记录信息到许多的目的地，诸如：数据库，文件，控制台，UNIX 系统日志等。

Log4j 中有三个主要组成部分：

- loggers - 负责捕获记录信息。
- appenders - 负责发布日志信息，以不同的首选目的地。
- layouts - 负责格式化不同风格的日志信息。

Log4j 的短板在于性能，在Logback 和 Log4j2 出来之后，Log4j的使用也减少了。

### Logback

Logback 是由 log4j 创始人 Ceki Gulcu 设计的又一个开源日志组件，是作为 Log4j 的继承者来开发的，提供了性能更好的实现，异步 logger，Filter等更多的特性。

logback 当前分成三个模块：logback-core、logback-classic 和 logback-access。

- logback-core - 是其它两个模块的基础模块。
- logback-classic - 是 log4j 的一个 改良版本。此外 logback-classic 完整实现 SLF4J API 使你可以很方便地更换成其它日志系统如 log4j 或 JDK14 Logging。
- logback-access - 访问模块与 Servlet 容器集成提供通过 Http 来访问日志的功能。

官网地址: [http://logback.qos.ch/  (opens new window)](http://logback.qos.ch/)

### Log4j2

维护 Log4j 的人为了性能又搞出了 Log4j2。

Log4j2 和 Log4j1.x 并不兼容，设计上很大程度上模仿了 SLF4J/Logback，性能上也获得了很大的提升。

Log4j2 也做了 Facade/Implementation 分离的设计，分成了 log4j-api 和 log4j-core。

官网地址: [http://logging.apache.org/log4j/2.x/  (opens new window)](http://logging.apache.org/log4j/2.x/)

### Log4j vs Logback vs Log4j2

> 从性能上Log4J2要强，但从生态上Logback+SLF4J优先。



## 日志门面

### common-logging

> common-logging 是 apache 的一个开源项目。也称Jakarta Commons Logging，缩写 JCL。

common-logging 的功能是提供日志功能的 API 接口，本身并不提供日志的具体实现（当然，common-logging 内部有一个 Simple logger 的简单实现，但是功能很弱，直接忽略），而是在运行时动态的绑定日志实现组件来工作（如 log4j、java.util.loggin）。

官网地址: [http://commons.apache.org/proper/commons-logging/  (opens new window)](http://commons.apache.org/proper/commons-logging/)

### slf4j

> 全称为 Simple Logging Facade for Java，即 java 简单日志门面。

什么，作者又是 Ceki Gulcu！这位大神写了 Log4j、Logback 和 slf4j，专注日志组件开发五百年，一直只能超越自己。

类似于 Common-Logging，slf4j 是对不同日志框架提供的一个 API 封装，可以在部署的时候不修改任何配置即可接入一种日志实现方案。但是，slf4j 在编译时静态绑定真正的 Log 库。使用 SLF4J 时，如果你需要使用某一种日志实现，那么你必须选择正确的 SLF4J 的 jar 包的集合（各种桥接包）。

![image](../../../.vuepress/public/image/log-1.png)

官网地址: [http://www.slf4j.org/  (opens new window)](http://www.slf4j.org/)

### common-logging vs slf4j

> slf4j 库类似于 Apache Common-Logging。但是，他在编译时静态绑定真正的日志库。这点似乎很麻烦，其实也不过是导入桥接 jar 包而已。

slf4j 一大亮点是提供了更方便的日志记录方式：

不需要使用logger.isDebugEnabled()来解决日志因为字符拼接产生的性能问题。slf4j 的方式是使用{}作为字符串替换符，形式如下：

```java
logger.debug("id: {}, name: {} ", id, name);
```

## 日志库使用方案

使用日志解决方案基本可分为三步：

- 引入 jar 包
- 配置
- 使用 API

常见的各种日志解决方案的第 2 步和第 3 步基本一样，实施上的差别主要在第 1 步，也就是使用不同的库。

### 日志库jar包

这里首选推荐使用 slf4j + logback 的组合。

如果你习惯了 common-logging，可以选择 common-logging+log4j。

强烈建议不要直接使用日志实现组件(logback、log4j、java.util.logging)，理由前面也说过，就是无法灵活替换日志库。

还有一种情况：你的老项目使用了 common-logging，或是直接使用日志实现组件。如果修改老的代码，工作量太大，需要兼容处理。在下文，都将看到各种应对方法。

注：据我所知，当前仍没有方法可以将 slf4j 桥接到 common-logging。如果我孤陋寡闻了，请不吝赐教。

#### slf4j 直接绑定日志组件

- slf4j + logback

添加依赖到 pom.xml 中即可。

logback-classic-1.0.13.jar 会自动将 slf4j-api-1.7.21.jar 和 logback-core-1.0.13.jar 也添加到你的项目中。

```xml
<dependency>
  <groupId>ch.qos.logback</groupId>
  <artifactId>logback-classic</artifactId>
  <version>1.0.13</version>
</dependency> 
```

- slf4j + log4j

添加依赖到 pom.xml 中即可。

slf4j-log4j12-1.7.21.jar 会自动将 slf4j-api-1.7.21.jar 和 log4j-1.2.17.jar 也添加到你的项目中。

```xml
<dependency>
  <groupId>org.slf4j</groupId>
  <artifactId>slf4j-log4j12</artifactId>
  <version>1.7.21</version>
</dependency>  
```

- slf4j + java.util.logging

添加依赖到 pom.xml 中即可。

slf4j-jdk14-1.7.21.jar 会自动将 slf4j-api-1.7.21.jar 也添加到你的项目中。

```xml
<dependency>
  <groupId>org.slf4j</groupId>
  <artifactId>slf4j-jdk14</artifactId>
  <version>1.7.21</version>
</dependency>
```
