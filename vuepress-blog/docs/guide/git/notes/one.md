
# git常用操作

好用的在线学习git网址https://learngitbranching.js.org/?locale=zh_CN

## git的分区

可以分为4个区域

![image-20220407200908129](..\..\..\.vuepress\public\image\git四个区域.png)

- workspace : 工作区
- staging area：暂存区/缓存区
- local repository：版本库或本地仓库

- remote repository：远程仓库

## git基础命令

### 本地的操作



**基础操作**

```
git init //初始化仓库
git clone //拷贝一个远程仓库，也就是下载一个仓库
git add // 将文件添加到暂存区
git status // 查看当前仓库的状态，显示有变更的文件
git diff //比较文件的不同，即比较暂存区和工作区的差异
git commit // 提交暂存区到本地仓库 git commit -m "你的提交注释"
git reset // 退回版本
git rm // 删除工作区文件
git mv // 移动或重命名工作区文件
git restore  //使得在工作空间但是不在暂存区的文件撤销更改(内容恢复到没修改之前的状态)
```



**操作分支**

```
git branch (branchname) // 创建分支
git checkout (branchname) // 切换分支
当你切换分支的时候，Git 会用该分支的最后提交的快照替换你的工作目录的内容， 所以多个分支不需要多个目录。

git merge // 合并分支

```


### 远程相关的操作

```
git remote // 远程仓库操作
git fetch // 从远程获取代码库
git pull // 下载远程代码并合并
git push // 上传远程代码并合并
```