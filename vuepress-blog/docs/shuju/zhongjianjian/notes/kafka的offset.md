---
title: Kafka的offsets
date: 2022-09-09
sidebar: 'auto'
categories:
 - frontEnd
tags:
 - 中间件
 - Kafka
---

# Kafka的offsets

## 位移主题

__consumer_offsets在Kafka源码中有个更为正式的名字，叫**位移主题**，即Offsets Topic。为了方便今天的讨论，我将统一使用位移主题来指代__consumer_offsets。需要注意的是，它有两个下划线哦。

好了，我们开始今天的内容吧。首先，我们有必要探究一下位移主题被引入的背景及原因，即位移主题的前世今生。

在上一期中，我说过老版本Consumer的位移管理是依托于Apache ZooKeeper的，它会自动或手动地将位移数据提交到ZooKeeper中保存。当Consumer重启后，它能自动从ZooKeeper中读取位移数据，从而在上次消费截止的地方继续消费。这种设计使得Kafka Broker不需要保存位移数据，减少了Broker端需要持有的状态空间，因而有利于实现高伸缩性。

但是，ZooKeeper其实并不适用于这种高频的写操作，因此，Kafka社区自0.8.2.x版本开始，就在酝酿修改这种设计，并最终在新版本Consumer中正式推出了全新的位移管理机制，自然也包括这个新的位移主题。

新版本Consumer的位移管理机制其实也很简单，就是**将Consumer的位移数据作为一条条普通的Kafka消息，提交到__consumer_offsets中。可以这么说，__consumer_offsets的主要作用是保存Kafka消费者的位移信息。**它要求这个提交过程不仅要实现高持久性，还要支持高频的写操作。显然，Kafka的主题设计天然就满足这两个条件，因此，使用Kafka主题来保存位移这件事情，实际上就是一个水到渠成的想法了。

这里我想再次强调一下，和你创建的其他主题一样，位移主题就是普通的Kafka主题。你可以手动地创建它、修改它，甚至是删除它。只不过，它同时也是一个内部主题，大部分情况下，你其实并不需要“搭理”它，也不用花心思去管理它，把它丢给Kafka就完事了。

虽说位移主题是一个普通的Kafka主题，但**它的消息格式却是Kafka自己定义的**，用户不能修改，也就是说你不能随意地向这个主题写消息，因为一旦你写入的消息不满足Kafka规定的格式，那么Kafka内部无法成功解析，就会造成Broker的崩溃。事实上，Kafka Consumer有API帮你提交位移，也就是向位移主题写消息。你千万不要自己写个Producer随意向该主题发送消息。

你可能会好奇，这个主题存的到底是什么格式的消息呢？所谓的消息格式，你可以简单地理解为是一个KV对。Key和Value分别表示消息的键值和消息体，在Kafka中它们就是字节数组而已。想象一下，如果让你来设计这个主题，你觉得消息格式应该长什么样子呢？我先不说社区的设计方案，我们自己先来设计一下。

首先从Key说起。一个Kafka集群中的Consumer数量会有很多，既然这个主题保存的是Consumer的位移数据，那么消息格式中必须要有字段来标识这个位移数据是哪个Consumer的。这种数据放在哪个字段比较合适呢？显然放在Key中比较合适。

现在我们知道该主题消息的Key中应该保存标识Consumer的字段，那么，当前Kafka中什么字段能够标识Consumer呢？还记得之前我们说Consumer Group时提到的Group ID吗？没错，就是这个字段，它能够标识唯一的Consumer Group。

说到这里，我再多说几句。除了Consumer Group，Kafka还支持独立Consumer，也称Standalone Consumer。它的运行机制与Consumer Group完全不同，但是位移管理的机制却是相同的。因此，即使是Standalone Consumer，也有自己的Group ID来标识它自己，所以也适用于这套消息格式。

Okay，我们现在知道Key中保存了Group ID，但是只保存Group ID就可以了吗？别忘了，Consumer提交位移是在分区层面上进行的，即它提交的是某个或某些分区的位移，那么很显然，Key中还应该保存Consumer要提交位移的分区。

好了，我们来总结一下我们的结论。**位移主题的Key中应该保存3部分内容：<Group ID，主题名，分区号>**。如果你认同这样的结论，那么恭喜你，社区就是这么设计的！

接下来，我们再来看看消息体的设计。也许你会觉得消息体应该很简单，保存一个位移值就可以了。实际上，社区的方案要复杂得多，比如消息体还保存了位移提交的一些其他元数据，诸如时间戳和用户自定义的数据等。保存这些元数据是为了帮助Kafka执行各种各样后续的操作，比如删除过期位移消息等。但总体来说，我们还是可以简单地认为消息体就是保存了位移值。

当然了，位移主题的消息格式可不是只有这一种。事实上，它有3种消息格式。除了刚刚我们说的这种格式，还有2种格式：

1. 用于保存Consumer Group信息的消息。
2. 用于删除Group过期位移甚至是删除Group的消息。

第1种格式非常神秘，以至于你几乎无法在搜索引擎中搜到它的身影。不过，你只需要记住它是用来注册Consumer Group的就可以了。

第2种格式相对更加有名一些。它有个专属的名字：tombstone消息，即墓碑消息，也称delete mark。下次你在Google或百度中见到这些词，不用感到惊讶，它们指的是一个东西。这些消息只出现在源码中而不暴露给你。它的主要特点是它的消息体是null，即空消息体。

那么，何时会写入这类消息呢？一旦某个Consumer Group下的所有Consumer实例都停止了，而且它们的位移数据都已被删除时，Kafka会向位移主题的对应分区写入tombstone消息，表明要彻底删除这个Group的信息。

好了，消息格式就说这么多，下面我们来说说位移主题是怎么被创建的。通常来说，**当Kafka集群中的第一个Consumer程序启动时，Kafka会自动创建位移主题**。我们说过，位移主题就是普通的Kafka主题，那么它自然也有对应的分区数。但如果是Kafka自动创建的，分区数是怎么设置的呢？这就要看Broker端参数offsets.topic.num.partitions的取值了。它的默认值是50，因此Kafka会自动创建一个50分区的位移主题。如果你曾经惊讶于Kafka日志路径下冒出很多__consumer_offsets-xxx这样的目录，那么现在应该明白了吧，这就是Kafka自动帮你创建的位移主题啊。

你可能会问，除了分区数，副本数或备份因子是怎么控制的呢？答案也很简单，这就是Broker端另一个参数offsets.topic.replication.factor要做的事情了。它的默认值是3。

总结一下，**如果位移主题是Kafka自动创建的，那么该主题的分区数是50，副本数是3**。

当然，你也可以选择手动创建位移主题，具体方法就是，在Kafka集群尚未启动任何Consumer之前，使用Kafka API创建它。手动创建的好处在于，你可以创建满足你实际场景需要的位移主题。比如很多人说50个分区对我来讲太多了，我不想要这么多分区，那么你可以自己创建它，不用理会offsets.topic.num.partitions的值。

不过我给你的建议是，还是让Kafka自动创建比较好。目前Kafka源码中有一些地方硬编码了50分区数，因此如果你自行创建了一个不同于默认分区数的位移主题，可能会碰到各种各种奇怪的问题。这是社区的一个bug，目前代码已经修复了，但依然在审核中。

创建位移主题当然是为了用的，那么什么地方会用到位移主题呢？我们前面一直在说Kafka Consumer提交位移时会写入该主题，那Consumer是怎么提交位移的呢？目前Kafka Consumer提交位移的方式有两种：**自动提交位移和手动提交位移。**

Consumer端有个参数叫enable.auto.commit，如果值是true，则Consumer在后台默默地为你定期提交位移，提交间隔由一个专属的参数auto.commit.interval.ms来控制。自动提交位移有一个显著的优点，就是省事，你不用操心位移提交的事情，就能保证消息消费不会丢失。但这一点同时也是缺点。因为它太省事了，以至于丧失了很大的灵活性和可控性，你完全没法把控Consumer端的位移管理。

事实上，很多与Kafka集成的大数据框架都是禁用自动提交位移的，如Spark、Flink等。这就引出了另一种位移提交方式：**手动提交位移**，即设置enable.auto.commit = false。一旦设置了false，作为Consumer应用开发的你就要承担起位移提交的责任。Kafka Consumer API为你提供了位移提交的方法，如consumer.commitSync等。当调用这些方法时，Kafka会向位移主题写入相应的消息。

如果你选择的是自动提交位移，那么就可能存在一个问题：只要Consumer一直启动着，它就会无限期地向位移主题写入消息。

我们来举个极端一点的例子。假设Consumer当前消费到了某个主题的最新一条消息，位移是100，之后该主题没有任何新消息产生，故Consumer无消息可消费了，所以位移永远保持在100。由于是自动提交位移，位移主题中会不停地写入位移=100的消息。显然Kafka只需要保留这类消息中的最新一条就可以了，之前的消息都是可以删除的。这就要求Kafka必须要有针对位移主题消息特点的消息删除策略，否则这种消息会越来越多，最终撑爆整个磁盘。

Kafka是怎么删除位移主题中的过期消息的呢？答案就是Compaction。国内很多文献都将其翻译成压缩，我个人是有一点保留意见的。在英语中，压缩的专有术语是Compression，它的原理和Compaction很不相同，我更倾向于翻译成压实，或干脆采用JVM垃圾回收中的术语：整理。

不管怎么翻译，Kafka使用**Compact策略**来删除位移主题中的过期消息，避免该主题无限期膨胀。那么应该如何定义Compact策略中的过期呢？对于同一个Key的两条消息M1和M2，如果M1的发送时间早于M2，那么M1就是过期消息。Compact的过程就是扫描日志的所有消息，剔除那些过期的消息，然后把剩下的消息整理在一起。我在这里贴一张来自官网的图片，来说明Compact过程。

![adp](../../../.vuepress/public/image/Kafka7-1.jpeg)

图中位移为0、2和3的消息的Key都是K1。Compact之后，分区只需要保存位移为3的消息，因为它是最新发送的。

**Kafka提供了专门的后台线程定期地巡检待Compact的主题，看看是否存在满足条件的可删除数据**。这个后台线程叫Log Cleaner。很多实际生产环境中都出现过位移主题无限膨胀占用过多磁盘空间的问题，如果你的环境中也有这个问题，我建议你去检查一下Log Cleaner线程的状态，通常都是这个线程挂掉了导致的。

## 小结

总结一下，今天我跟你分享了Kafka神秘的位移主题__consumer_offsets，包括引入它的契机与原因、它的作用、消息格式、写入的时机以及管理策略等，这对我们了解Kafka特别是Kafka Consumer的位移管理是大有帮助的。实际上，将很多元数据以消息的方式存入Kafka内部主题的做法越来越流行。除了Consumer位移管理，Kafka事务也是利用了这个方法，当然那是另外的一个内部主题了。

社区的想法很简单：既然Kafka天然实现了高持久性和高吞吐量，那么任何有这两个需求的子服务自然也就不必求助于外部系统，用Kafka自己实现就好了。



## **提交位移**

Kafka Consumer**提交位移**时会写入**位移主题**，提交位移的方式包括：**自动提交和手动提交位移**



这次要聊的位移是Consumer的消费位移，它记录了Consumer要消费的下一条消息的位移。这可能和你以前了解的有些出入，不过切记是下一条消息的位移，而不是目前最新消费消息的位移。

我来举个例子说明一下。假设一个分区中有10条消息，位移分别是0到9。某个Consumer应用已消费了5条消息，这就说明该Consumer消费了位移为0到4的5条消息，此时Consumer的位移是5，指向了下一条消息的位移。

**Consumer需要向Kafka汇报自己的位移数据，这个汇报过程被称为提交位移**（Committing Offsets）。因为Consumer能够同时消费多个分区的数据，所以位移的提交实际上是在分区粒度上进行的，即**Consumer需要为分配给它的每个分区提交各自的位移数据**。

提交位移主要是为了表征Consumer的消费进度，这样当Consumer发生故障重启之后，就能够从Kafka中读取之前提交的位移值，然后从相应的位移处继续消费，从而避免整个消费过程重来一遍。换句话说，位移提交是Kafka提供给你的一个工具或语义保障，你负责维持这个语义保障，即如果你提交了位移X，那么Kafka会认为所有位移值小于X的消息你都已经成功消费了。

这一点特别关键。因为位移提交非常灵活，你完全可以提交任何位移值，但由此产生的后果你也要一并承担。假设你的Consumer消费了10条消息，你提交的位移值却是20，那么从理论上讲，位移介于11～19之间的消息是有可能丢失的；相反地，如果你提交的位移值是5，那么位移介于5～9之间的消息就有可能被重复消费。所以，我想再强调一下，**位移提交的语义保障是由你来负责的，Kafka只会“无脑”地接受你提交的位移**。你对位移提交的管理直接影响了你的Consumer所能提供的消息语义保障。

鉴于位移提交甚至是位移管理对Consumer端的巨大影响，Kafka，特别是KafkaConsumer API，提供了多种提交位移的方法。**从用户的角度来说，位移提交分为自动提交和手动提交；从Consumer端的角度来说，位移提交分为同步提交和异步提交**。

我们先来说说自动提交和手动提交。所谓自动提交，就是指Kafka Consumer在后台默默地为你提交位移，作为用户的你完全不必操心这些事；而手动提交，则是指你要自己提交位移，Kafka Consumer压根不管。

开启自动提交位移的方法很简单。Consumer端有个参数enable.auto.commit，把它设置为true或者压根不设置它就可以了。因为它的默认值就是true，即Java Consumer默认就是自动提交位移的。如果启用了自动提交，Consumer端还有个参数就派上用场了：auto.commit.interval.ms。它的默认值是5秒，表明Kafka每5秒会为你自动提交一次位移。

为了把这个问题说清楚，我给出了完整的Java代码。这段代码展示了设置自动提交位移的方法。有了这段代码做基础，今天后面的讲解我就不再展示完整的代码了。

```java
Properties props = new Properties();
     props.put("bootstrap.servers", "localhost:9092");
     props.put("group.id", "test");
     props.put("enable.auto.commit", "true");
     props.put("auto.commit.interval.ms", "2000");
     props.put("key.deserializer", "org.apache.kafka.common.serialization.StringDeserializer");
     props.put("value.deserializer", "org.apache.kafka.common.serialization.StringDeserializer");
     KafkaConsumer consumer = new KafkaConsumer<>(props);
     consumer.subscribe(Arrays.asList("foo", "bar"));
     while (true) {
         ConsumerRecords records = consumer.poll(100);
         for (ConsumerRecord record : records)
             System.out.printf("offset = %d, key = %s, value = %s%n", record.offset(), record.key(), record.value());
     }
```

上面的第3、第4行代码，就是开启自动提交位移的方法。总体来说，还是很简单的吧。

和自动提交相反的，就是手动提交了。开启手动提交位移的方法就是设置enable.auto.commit为false。但是，仅仅设置它为false还不够，因为你只是告诉Kafka Consumer不要自动提交位移而已，你还需要调用相应的API手动提交位移。

最简单的API就是**KafkaConsumer#commitSync()**。该方法会提交KafkaConsumer#poll()返回的最新位移。从名字上来看，它是一个同步操作，即该方法会一直等待，直到位移被成功提交才会返回。如果提交过程中出现异常，该方法会将异常信息抛出。下面这段代码展示了commitSync()的使用方法：

```java
while (true) {
            ConsumerRecords records =
                        consumer.poll(Duration.ofSeconds(1));
            process(records); // 处理消息
            try {
                        consumer.commitSync();
            } catch (CommitFailedException e) {
                        handle(e); // 处理提交失败异常
            }
}
```

可见，调用consumer.commitSync()方法的时机，是在你处理完了poll()方法返回的所有消息之后。如果你莽撞地过早提交了位移，就可能会出现消费数据丢失的情况。那么你可能会问，自动提交位移就不会出现消费数据丢失的情况了吗？它能恰到好处地把握时机进行位移提交吗？为了搞清楚这个问题，我们必须要深入地了解一下自动提交位移的顺序。

一旦设置了enable.auto.commit为true，Kafka会保证在开始调用poll方法时，提交上次poll返回的所有消息。从顺序上来说，poll方法的逻辑是先提交上一批消息的位移，再处理下一批消息，因此它能保证不出现消费丢失的情况。但自动提交位移的一个问题在于，**它可能会出现重复消费**。

在默认情况下，Consumer每5秒自动提交一次位移。现在，我们假设提交位移之后的3秒发生了Rebalance操作。在Rebalance之后，所有Consumer从上一次提交的位移处继续消费，但该位移已经是3秒前的位移数据了，故在Rebalance发生前3秒消费的所有数据都要重新再消费一次。虽然你能够通过减少auto.commit.interval.ms的值来提高提交频率，但这么做只能缩小重复消费的时间窗口，不可能完全消除它。这是自动提交机制的一个缺陷。

反观手动提交位移，它的好处就在于更加灵活，你完全能够把控位移提交的时机和频率。但是，它也有一个缺陷，就是在调用commitSync()时，Consumer程序会处于阻塞状态，直到远端的Broker返回提交结果，这个状态才会结束。在任何系统中，因为程序而非资源限制而导致的阻塞都可能是系统的瓶颈，会影响整个应用程序的TPS。当然，你可以选择拉长提交间隔，但这样做的后果是Consumer的提交频率下降，在下次Consumer重启回来后，会有更多的消息被重新消费。

鉴于这个问题，Kafka社区为手动提交位移提供了另一个API方法：**KafkaConsumer#commitAsync()**。从名字上来看它就不是同步的，而是一个异步操作。调用commitAsync()之后，它会立即返回，不会阻塞，因此不会影响Consumer应用的TPS。由于它是异步的，Kafka提供了回调函数（callback），供你实现提交之后的逻辑，比如记录日志或处理异常等。下面这段代码展示了调用commitAsync()的方法：

```java
while (true) {
            ConsumerRecords records = 
	consumer.poll(Duration.ofSeconds(1));
            process(records); // 处理消息
            consumer.commitAsync((offsets, exception) -> {
	if (exception != null)
	handle(exception);
	});
}
```

commitAsync是否能够替代commitSync呢？答案是不能。commitAsync的问题在于，出现问题时它不会自动重试。因为它是异步操作，倘若提交失败后自动重试，那么它重试时提交的位移值可能早已经“过期”或不是最新值了。因此，异步提交的重试其实没有意义，所以commitAsync是不会重试的。

显然，如果是手动提交，我们需要将commitSync和commitAsync组合使用才能到达最理想的效果，原因有两个：

1. 我们可以利用commitSync的自动重试来规避那些瞬时错误，比如网络的瞬时抖动，Broker端GC等。因为这些问题都是短暂的，自动重试通常都会成功，因此，我们不想自己重试，而是希望Kafka Consumer帮我们做这件事。
2. 我们不希望程序总处于阻塞状态，影响TPS。

我们来看一下下面这段代码，它展示的是如何将两个API方法结合使用进行手动提交。

```java
   try {
           while(true) {
                        ConsumerRecords records = 
                                    consumer.poll(Duration.ofSeconds(1));
                        process(records); // 处理消息
                        commitAysnc(); // 使用异步提交规避阻塞
            }
} catch(Exception e) {
            handle(e); // 处理异常
} finally {
            try {
                        consumer.commitSync(); // 最后一次提交使用同步阻塞式提交
	} finally {
	     consumer.close();
}
}
```

这段代码同时使用了commitSync()和commitAsync()。对于常规性、阶段性的手动提交，我们调用commitAsync()避免程序阻塞，而在Consumer要关闭前，我们调用commitSync()方法执行同步阻塞式的位移提交，以确保Consumer关闭前能够保存正确的位移数据。将两者结合后，我们既实现了异步无阻塞式的位移管理，也确保了Consumer位移的正确性，所以，如果你需要自行编写代码开发一套Kafka Consumer应用，那么我推荐你使用上面的代码范例来实现手动的位移提交。

我们说了自动提交和手动提交，也说了同步提交和异步提交，这些就是Kafka位移提交的全部了吗？其实，我们还差一部分。

实际上，Kafka Consumer API还提供了一组更为方便的方法，可以帮助你实现更精细化的位移管理功能。刚刚我们聊到的所有位移提交，都是提交poll方法返回的所有消息的位移，比如poll方法一次返回了500条消息，当你处理完这500条消息之后，前面我们提到的各种方法会一次性地将这500条消息的位移一并处理。简单来说，就是**直接提交最新一条消息的位移**。但如果我想更加细粒度化地提交位移，该怎么办呢？

设想这样一个场景：你的poll方法返回的不是500条消息，而是5000条。那么，你肯定不想把这5000条消息都处理完之后再提交位移，因为一旦中间出现差错，之前处理的全部都要重来一遍。这类似于我们数据库中的事务处理。很多时候，我们希望将一个大事务分割成若干个小事务分别提交，这能够有效减少错误恢复的时间。

在Kafka中也是相同的道理。对于一次要处理很多消息的Consumer而言，它会关心社区有没有方法允许它在消费的中间进行位移提交。比如前面这个5000条消息的例子，你可能希望每处理完100条消息就提交一次位移，这样能够避免大批量的消息重新消费。

庆幸的是，Kafka Consumer API为手动提交提供了这样的方法：commitSync(Map)和commitAsync(Map)。它们的参数是一个Map对象，键就是TopicPartition，即消费的分区，而值是一个OffsetAndMetadata对象，保存的主要是位移数据。

就拿刚刚提过的那个例子来说，如何每处理100条消息就提交一次位移呢？在这里，我以commitAsync为例，展示一段代码，实际上，commitSync的调用方法和它是一模一样的。

```java
private Map offsets = new HashMap<>();
int count = 0;
……
while (true) {
            ConsumerRecords records = 
	consumer.poll(Duration.ofSeconds(1));
            for (ConsumerRecord record: records) {
                        process(record);  // 处理消息
                        offsets.put(new TopicPartition(record.topic(), record.partition()),
                                   new OffsetAndMetadata(record.offset() + 1)；
                       if（count % 100 == 0）
                                    consumer.commitAsync(offsets, null); // 回调处理逻辑是null
                        count++;
	}
}
```

简单解释一下这段代码。程序先是创建了一个Map对象，用于保存Consumer消费处理过程中要提交的分区位移，之后开始逐条处理消息，并构造要提交的位移值。还记得之前我说过要提交下一条消息的位移吗？这就是这里构造OffsetAndMetadata对象时，使用当前消息位移加1的原因。代码的最后部分是做位移的提交。我在这里设置了一个计数器，每累计100条消息就统一提交一次位移。与调用无参的commitAsync不同，这里调用了带Map对象参数的commitAsync进行细粒度的位移提交。这样，这段代码就能够实现每处理100条消息就提交一次位移，不用再受poll方法返回的消息总数的限制了。

## 小结

好了，我们来总结一下今天的内容。Kafka Consumer的位移提交，是实现Consumer端语义保障的重要手段。位移提交分为自动提交和手动提交，而手动提交又分为同步提交和异步提交。在实际使用过程中，推荐你使用手动提交机制，因为它更加可控，也更加灵活。另外，建议你同时采用同步提交和异步提交两种方式，这样既不影响TPS，又支持自动重试，改善Consumer应用的高可用性。总之，Kafka Consumer API提供了多种灵活的提交方法，方便你根据自己的业务场景定制你的提交策略。
