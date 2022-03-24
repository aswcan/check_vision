import * as tf from '@tensorflow/tfjs';

// 定义一个摄像头收集图片的数据集
export class ControllerDataset{
  // 定义数据集大小
  constructor(numClasses){
    this.numClasses = numClasses
  }

  /*
    向数据集中添加样本数据
  */ 
  addExample(example, label){
  // 创建一个oneHot张量
  const y = tf.tidy(
    () => tf.oneHot(tf.tensor1d([label]).toInt(), this.numClasses)
  );
  if(this.xs == null){
  this.xs = tf.keep(example)
  this.ys = tf.keep(y)
  }else{
      const oldX = this.xs
      this.xs = tf.keep(oldX.concat(example, 0));

      const oldY = this.ys;
      this.ys = tf.keep(oldY.concat(y, 0));

      // 将数据集保存在电脑中
      oldX.dispose()
      oldY.dispose()
      y.dispose()
    }
  }
}