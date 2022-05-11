---
title: MyBatis
date: 2022-05-06
sidebar: 'auto'
categories:
 - frontEnd
tags:
 - springboot
 - 数据库
---

# MyBatis

## 架构图

![1](../../../.vuepress/public/image/mybatis1.png)

### 接口层-和数据库交互的方式

MyBatis和数据库的交互有两种方式：

- 使用传统的MyBatis提供的API；
- 使用Mapper接口；

#### 使用传统的MyBatis提供的API

这是传统的传递Statement Id 和查询参数给 SqlSession 对象，使用 SqlSession对象完成和数据库的交互；MyBatis 提供了非常方便和简单的API，供用户实现对数据库的增删改查数据操作，以及对数据库连接信息和MyBatis 自身配置信息的维护操作。

![2](../../../.vuepress/public/image/mybatis2.png)

上述使用MyBatis 的方法，是创建一个和数据库打交道的SqlSession对象，然后根据Statement Id 和参数来操作数据库，这种方式固然很简单和实用，但是它不符合面向对象语言的概念和面向接口编程的编程习惯。由于面向接口的编程是面向对象的大趋势，MyBatis 为了适应这一趋势，增加了第二种使用MyBatis 支持接口（Interface）调用方式。

#### 使用Mapper接口

MyBatis 将配置文件中的每一个`<mapper>` 节点抽象为一个 Mapper 接口，而这个接口中声明的方法和跟`<mapper>` 节点中的`<select|update|delete|insert>` 节点项对应，即`<select|update|delete|insert>` 节点的id值为Mapper 接口中的方法名称，parameterType 值表示Mapper 对应方法的入参类型，而resultMap 值则对应了Mapper 接口表示的返回值类型或者返回结果集的元素类型。

![3](../../../.vuepress/public/image/mybatis3.png)

根据MyBatis 的配置规范配置好后，通过SqlSession.getMapper(XXXMapper.class)方法，MyBatis 会根据相应的接口声明的方法信息，通过动态代理机制生成一个Mapper 实例，我们使用Mapper 接口的某一个方法时，MyBatis 会根据这个方法的方法名和参数类型，确定Statement Id，底层还是通过SqlSession.select("statementId",parameterObject);或者SqlSession.update("statementId",parameterObject); 等等来实现对数据库的操作， MyBatis 引用Mapper 接口这种调用方式，纯粹是为了满足面向接口编程的需要。（其实还有一个原因是在于，面向接口的编程，使得用户在接口上可以使用注解来配置SQL语句，这样就可以脱离XML配置文件，实现“0配置”）。

### 数据处理层

数据处理层可以说是MyBatis 的核心，从大的方面上讲，它要完成两个功能：

- 通过传入参数构建动态SQL语句；
- SQL语句的执行以及封装查询结果集成`List<E>`

#### 参数映射和动态SQL语句生成

动态语句生成可以说是MyBatis框架非常优雅的一个设计，MyBatis 通过传入的参数值，使用 Ognl 来动态地构造SQL语句，使得MyBatis 有很强的灵活性和扩展性。

参数映射指的是对于java 数据类型和jdbc数据类型之间的转换：这里有包括两个过程：查询阶段，我们要将java类型的数据，转换成jdbc类型的数据，通过 preparedStatement.setXXX() 来设值；另一个就是对resultset查询结果集的jdbcType 数据转换成java 数据类型。

#### SQL语句的执行以及封装查询结果集成List

动态SQL语句生成之后，MyBatis 将执行SQL语句，并将可能返回的结果集转换成`List<E>` 列表。MyBatis 在对结果集的处理中，支持结果集关系一对多和多对一的转换，并且有两种支持方式，一种为嵌套查询语句的查询，还有一种是嵌套结果集的查询。

## 主要构件及其相互关系

从MyBatis代码实现的角度来看，主体构件和关系如下：

![4](../../../.vuepress/public/image/mybatis4.png)

主要的核心部件解释如下：

- `SqlSession` 作为MyBatis工作的主要顶层API，表示和数据库交互的会话，完成必要数据库增删改查功能
- `Executor` MyBatis执行器，是MyBatis 调度的核心，负责SQL语句的生成和查询缓存的维护
- `StatementHandler` 封装了JDBC Statement操作，负责对JDBC statement 的操作，如设置参数、将Statement结果集转换成List集合。
- `ParameterHandler` 负责对用户传递的参数转换成JDBC Statement 所需要的参数，
- `ResultSetHandler` 负责将JDBC返回的ResultSet结果集对象转换成List类型的集合；
- `TypeHandler` 负责java数据类型和jdbc数据类型之间的映射和转换
- `MappedStatement` MappedStatement维护了一条`<select|update|delete|insert>`节点的封装，
- `SqlSource` 负责根据用户传递的parameterObject，动态地生成SQL语句，将信息封装到BoundSql对象中，并返回
- `BoundSql` 表示动态生成的SQL语句以及相应的参数信息
- `Configuration` MyBatis所有的配置信息都维持在Configuration对象之中。



