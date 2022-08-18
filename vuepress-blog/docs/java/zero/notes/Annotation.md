---
title: 注解
date: 2022-08-10
sidebar: 'auto'
categories:
 - frontEnd
tags:
 - Annotation

---

# 注解

## 校验注解

@Valid 注解用于校验参数级联校验

 **级联校验:** 也叫嵌套检测.嵌套就是一个实体类包含另一个实体类

```java
@RestController
  public class ConsumerController {
 
    // @Autowired
    // RestTemplate restTemplate;
   @RequestMapping(value = "/consumer",method = RequestMethod.POST)
   public String helloConsumer(@Valid RequestParams requestParams){
       
       /*************不用注解时校验方式*****************/
       if (StringUtil.isNotBlank(requestParams.getName())){
           System.out.println("名称不能为空！");
       }
       if (StringUtil.isNotBlank(requestParams.getStocke())){
           System.out.println("股票简称不能为空！");
       }
       return  null;
     }
 }
```



实体类中我们要在属性上增加响应的 注解，如下：

```java
@Data
public class RequestParams {
 
    @NotNull(message = "请输入客户名称")
    @Length(message = "名称不能超过个 {max} 字符", max = 10)
    private String name;
 
    @NotNull(message = "请输入客户年龄")
    @Range(message = "年龄范围为 {min} 到 {max} 之间", min = 1, max = 100)
    private Integer age;
 
    @NotBlank(message = "请输入股票简称")
    private String stocke;
    private String mainType;
    private String idType;
    private String idCode;
}
```

## Lombok

Lombok插件的原理： 

方法1、在**编译阶段**利用annotation processor 对自定义的注解进行预处理后生成真正在jvm上面执行的class文件   **JSR269 插件化注解处理**

方法2、利用反射技术在**运行的时**候动态修改。

### 常用注解

```java

/**
 *   @RequiredArgsConstructor 会生成没有复制的final类型生产构造函数,且这个final必须
 *   被@nonNull 修饰，不能与无参构造的注解同时存在
 */
@Setter
@Getter
@NoArgsConstructor  // 生成无参的构造函数
@AllArgsConstructor // 生成带参构造函数
 
@ToString // 重写tostring方法
@EqualsAndHashCode // 表示重写equal和hashcode方法，默认是对所有的属性，用exclude参数来排除，of参数指明包含的
// @EqualsAndHashCode(of = {"name","id}) 表示只需要id和name一样，则两个对象就是一样的
/**
@ToString(exclude ={"phone"} )  排除哪些
@ToString(of = {"name"})  包含哪些
*/
public class User {
    /**
     * 注意细节点： 1、final属性只有get方法，不会有set方法
     *           2、 静态变量不会有get、set方法
     */
 
    @Setter(AccessLevel.PROTECTED) // 设置后编译的set方法是私有的
    private int id;
 
    private final  String name = "llp";
 
    private String email;
 
    private String phone;
 
    private String pwd;
 
    private Date createTime;
 
    private void login(@NonNull String pwd){
        // TODO    // 加入注解后可以省略后面的判断
 
//        if(pwd!=null){
//            // something to do
//        }else {
//            throw new NullPointerException();
//        }
 
 
    }
}
```

:::

关于boolean类型的属性字段

a.如果对应字段是is打头的话（如isXxx等），那么lombok生成的get、set方法会和想象中不同。isXxx生成的get方法将会是isXxx，set方法将会是setXxx。

b.如果对应的非包装类型布尔字段不是is打头的话，是没有问题的；

c.如果是包装类型的布尔字段的话，是没有问题的。

:::

### @Data

```
@Data = @ToString + @EqualsAndHashCode + @Getter + @setter + @RequiredArgsConstructor
```

对于POJO类非常实用

### @Builder

当一个bean类重载了多个构造方法的时候，并且参数随机使用的时候，考虑使用构造者模式

```java
@Builder  // 将这个注解加载类上
// 编译后生成这个方法 
 public static User.UserBuilder builder() {
        return new User.UserBuilder();
    }
```

//使用的时候,其中User是类名，通过类名调用builder方法，
//再调用属性给对应的属性复制，最后调用build方法

```java
User.builder.id(1).name("ll").phone("110").build()
```

使用@builder可能会导致默认值无效，可以在字段上加上@builder.Default

```java
@Data
@Builder
public class Test0 {
  private String aa ="zzzz";

  public static void main(String[] args) {
    Test0 test = Test0.builder().build();
    System.out.println(test);
  }
}

输出：Test0(aa=null)
    
    
@Data
@Builder
public class Test0 {
  @Builder.Default
  private String aa ="zzzz";

  public static void main(String[] args) {
    Test0 test = Test0.builder().build();
    System.out.println(test);
  }
}
  
输出：Test0(aa=zzzz)
```

一般情况下使用@Builder用上一下四个注解就行

```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Test0 {
  private String aa ="zzzz";

  public static void main(String[] args) {
    Test0 test = Test0.builder().build();
    System.out.println(test);
  }
}
输出：Test0(aa=null)
```



### @Slf4j

```java

@Slf4j
public class UserServiceImpl implements UserService {
     
// 加入注解后会生成这行代码
 private static final Logger log = LoggerFactory.getLogger(UserServiceImpl.class);
 
    @Override
    public void login(String pwd, String phone) {
        log.info("用于登录 ： {}" ,phone);  // 日志打印
    }
}
```

