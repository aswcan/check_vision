<template>
  <div class="training_panel">
    <!-- 左侧视频 -->
    <div class="training_left_panel">
      <el-button type="primary" class="trainStart" @click="training()">训练模型</el-button>
      <div class="loss_block"><span :class="{ 'training': isTraining, 'trained': isTrained}">LOSS:    {{ loss }}</span></div>
      <div class="video_panel">
        <video ref="cam" autoplay playsinline muted id="webcam" width="224" height="224"></video>
      </div>
    </div>

    <!-- 分割 -->
    <img src="../assets/line.png" style="width: 2px; height: 300px ;margin: 0 10px" alt="分割">

    <!-- 右侧收集图片 -->
    <div class="training_right_panel">
      <div class="collection_panel collection_top_panel">
        <div class="fill_grow"></div>
        <div class="collection up_collection" :class="[classId == 0?'is_active':'']" @mousedown="capturePic(0)" @mouseup="mouseChange()">
          <canvas class="img_collection_canv" ref="upside"></canvas>
          <span class="count">👆 {{ upcnt }} 样本</span>
        </div>
        <div class="fill_grow"></div>
      </div>

      <div class="collection_panel collection_middle_panel">
        <div class="collection left_collection" :class="[classId == 3?'is_active':'']" @mousedown="capturePic(3) " @mouseup="mouseChange()">
          <canvas class="img_collection_canv" ref="leftside"></canvas>
          <span class="count">👈 {{ leftcnt }} 样本</span>
        </div>
        <div class="">
          <img src="../assets/center.png" alt="中心" style="width: 7rem; height: 6rem; margin: 10px" />
        </div>
        <div class="collection right_collection" :class="[classId == 1?'is_active':'']" @mousedown="capturePic(1) " @mouseup="mouseChange()">
          <canvas class="img_collection_canv" ref="rightside"></canvas>
          <span class="count">👉 {{ rightcnt }} 样本</span>
        </div>
      </div>


      <div class="collection_panel collection_bottom_panel">
        <div class="fill_grow"></div>
        <div class="collection down_collection" :class="[classId == 2?'is_active':'']" @mousedown="capturePic(2)" @mouseup="mouseChange()">
          <canvas class="img_collection_canv" ref="downside"></canvas>
          <span class="count">👇 {{ downcnt }} 样本</span>
        </div>
        <div class="fill_grow"></div>
      </div>
    </div>
  </div>
</template>

<script>
import * as tf from '@tensorflow/tfjs';
import * as tfd from '@tensorflow/tfjs-data';

import {ControllerDataset} from './controller_dataset';

export default {
  name: "Webcam",
  data() {
    return {
      webcam: '',
      controllerDataset: '',
      loss: '0.00000',
      truncatedMobileNet: '',
      upcnt: '0',
      leftcnt: '0',
      rightcnt: '0',
      downcnt: '0',
      mousedown: '',
      addExampleHandler: '',
      model: '',
      isTraining: false,
      isTrained: false,
      isPredicting: false, 
      classId: '4'
    };
  },
  methods: {
    async loadTruncatedMobileNet() {
      const mobilenet = await tf.loadLayersModel(
          'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json');

      // Return a model that outputs an internal activation.
      const layer = mobilenet.getLayer('conv_pw_13_relu');
      return tf.model({inputs: mobilenet.inputs, outputs: layer.output});
    },

    // When the UI buttons are pressed, read a frame from the webcam and associate
    // it with the class label given by the button. up, down, left, right are
    // labels 0, 1, 2, 3 respectively.
    setExampleHandler(handler) {
      this.addExampleHandler = handler
    },
    async capturePic(label) {
      this.mousedown = true
      while (this.mousedown) {
        this.addExampleHandler(label);
        this.darwImg(label)
        await tf.nextFrame();
      }
    },
    darwImg(label) {
      let ctx
      if(label == 0){
        ctx = this.$refs.upside.getContext("2d")
        this.upcnt++
      }else if(label == 3){
        ctx = this.$refs.leftside.getContext("2d")
        this.leftcnt++
      }else if(label == 1){
        ctx = this.$refs.rightside.getContext("2d")
        this.rightcnt++
      }else if(label == 2){
        ctx = this.$refs.downside.getContext("2d")
        this.downcnt++
      }
      ctx.drawImage(this.$refs.cam, 0, 0, 300, 150)
    },
    /**
     * Sets up and trains the classifier.
     */
    async training(){
      this.isTrained = false
      this.isTraining = true
      await tf.nextFrame()
      await tf.nextFrame()
      this.isPredicting = false
      this.train()
      this.isTraining = false
      this.isTrained = true
      setTimeout(() => {
        this.isTrained = false
      }, 3000);
    },
    async train() {
      if (this.controllerDataset.xs == null) {
        throw new Error('Add some examples before training!');
      }
      
      // Creates a 2-layer fully connected model. By creating a separate model,
      // rather than adding layers to the mobilenet model, we "freeze" the weights
      // of the mobilenet model, and only train weights from the new model.
      this.model = tf.sequential({
        layers: [
          // Flattens the input to a vector so we can use it in a dense layer. While
          // technically a layer, this only performs a reshape (and has no training
          // parameters).
          tf.layers.flatten(
              {inputShape: this.truncatedMobileNet.outputs[0].shape.slice(1)}),
          // Layer 1.
          tf.layers.dense({
            units: 100,
            activation: 'relu',
            kernelInitializer: 'varianceScaling',
            useBias: true
          }),
          // Layer 2. The number of units of the last layer should correspond
          // to the number of classes we want to predict.
          tf.layers.dense({
            units: 4,
            kernelInitializer: 'varianceScaling',
            useBias: false,
            activation: 'softmax'
          })
        ]
      });

      // Creates the optimizers which drives training of the model.
      const optimizer = tf.train.adam(0.0005);
      // We use categoricalCrossentropy which is the loss function we use for
      // categorical classification which measures the error between our predicted
      // probability distribution over classes (probability that an input is of each
      // class), versus the label (100% probability in the true class)>
      this.model.compile({optimizer: optimizer, loss: 'categoricalCrossentropy'});

      // We parameterize batch size as a fraction of the entire dataset because the
      // number of examples that are collected depends on how many examples the user
      // collects. This allows us to have a flexible batch size.
      const batchSize =
          Math.floor(this.controllerDataset.xs.shape[0] * 0.4);
      if (!(batchSize > 0)) {
        throw new Error(
            `Batch size is 0 or NaN. Please choose a non-zero fraction.`);
      }

      // Train the model! Model.fit() will shuffle xs & ys so we don't have to.
      this.model.fit(this.controllerDataset.xs, this.controllerDataset.ys, {
        batchSize,
        epochs: 20,
        callbacks: {
          onBatchEnd: async (batch, logs) => {
            this.loss = logs.loss.toFixed(5)
          }
        }
      });
    },

    async predict() {
      // ui.isPredicting();
      this.isPredicting = true
      while (this.isPredicting) {
        // Capture the frame from the webcam.
        const img = await this.getImage();

        // Make a prediction through mobilenet, getting the internal activation of
        // the mobilenet model, i.e., "embeddings" of the input images.
        const embeddings = this.truncatedMobileNet.predict(img);

        // Make a prediction through our newly-trained model using the embeddings
        // from mobilenet as input.
        const predictions = this.model.predict(embeddings);

        // Returns the index with the maximum probability. This number corresponds
        // to the class the model thinks is the most probable given the input.
        const predictedClass = predictions.as1D().argMax();
        const classId = (await predictedClass.data())[0];
        img.dispose();

        this.classId = classId
        this.$emit('dirctChange', classId)
        // console.log(this.classId);
        await tf.nextFrame();
      }
      // ui.donePredicting();
    },

/**
 * Captures a frame from the webcam and normalizes it between -1 and 1.
 * Returns a batched image (1-element batch) of shape [1, w, h, c].
 */
    async getImage() {
      const img = await this.webcam.capture();
      const processedImg =
          tf.tidy(() => img.expandDims(0).toFloat().div(127).sub(1));
      img.dispose();
      return processedImg;
    },
    mouseChange(){
      this.mousedown = false
    },
    async init() {
      try {
        this.webcam = await tfd.webcam(this.$refs.cam);
      } catch (e) {
        console.log(e);
      }
      this.truncatedMobileNet = await this.loadTruncatedMobileNet();

      // Warm up the model. This uploads weights to the GPU and compiles the WebGL
      // programs so the first time we collect data from the webcam it will be
      // quick.
      const screenShot = await this.webcam.capture();
      this.truncatedMobileNet.predict(screenShot.expandDims(0));
      screenShot.dispose();
    }


  },
  mounted() {
    
    // new一个数据集
    this.controllerDataset = new ControllerDataset(4)
    this.setExampleHandler(async label => {
      let img = await this.getImage();
      this.controllerDataset.addExample(this.truncatedMobileNet.predict(img), label);
      img.dispose();
    })
    this.init()

  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.training_panel {
  display: flex;
  align-items: center;
  justify-content: center;
}
.loss_block{
  display: flex;
  align-items: center;
  text-align: center;
  justify-content: center;
  height: 30px;
}
.loss_block span{
  /* margin: 15px; */
  padding: 2px 8px;
  border-radius: 4px;
}
.video_panel{
  height: 224px;
  padding: 8px;
  background: #000000;
  border-radius: 6px;
  transform: rotateY(180deg);
}
.training{
  box-shadow: 0 0 4px 4px #ff0000;
}
.trained{
  box-shadow: 0 0 4px 4px #00ff62;
}
.training_right_panel{
  display: flex;
  flex-direction: column;
}
.collection {
  display: flex;
  flex-direction: column;
  width: 6rem;
  height: 6.4rem;
  padding: 5px 0 10px;
  background: rgb(0,0,0);
  align-items: center;
  justify-content: baseline;
  border-radius: 6px;
  border: 1px solid #777777;
}
.is_active{
  box-shadow: 0 0 4px 4px #00ff62;
}
.collection_panel{
  display: flex;
  align-items: center;
  justify-content: center;
}
.img_collection_canv{
  width: 5rem;
  height: 5rem;
  transform: rotateY(180deg);
}
.count{
  position: relative;
}
.count::after{
  position: absolute;
  left: -10%;
  top: -20px;
  font: 6px sans-serif;
  content: 'click to add';
  width: 120%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
}
.fill_grow{
  flex-grow: 1;
}
</style>
