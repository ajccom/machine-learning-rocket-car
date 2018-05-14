# rocket-car
基于神经网络进化的机器学习游戏例子

## [DEMO](!https://ajccom.github.io/rocket-car/)



游戏使用的机器学习框架为 [Neuroevolution.js](!https://github.com/xviniette/FlappyLearning/blob/gh-pages/Neuroevolution.js)

游戏使用 3 层神经网络结构：
  - 第一层：输入层，含 2 个神经元
  - 第二层：隐藏层，含 2 个神经元
  - 第三层：输出层，含 2 个神经元
  
```javascript
Neuvol = new Neuroevolution({
  population: 100, 
  network:[2, [2], 2]
})
```
