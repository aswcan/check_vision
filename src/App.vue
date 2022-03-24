<template>
  <div id="app">
    <Canv ref="gameCanv" :gameStarted='begin' />
    <Webcam ref="kid" @dirctChange='dirctChange' />
    <el-button type="primary" class="gameStart" @click="gameBegin()" v-if="!begin">开始游戏</el-button>
    <el-button type="primary" v-if="begin" disabled>游戏开始</el-button>
  </div>
</template>

<script>
import Canv from '@/components/canvas.vue'
import Webcam from '@/components/webcam.vue'
export default {
  name: 'App',
  data() {
    return {
      begin: false
    }
  },
  components: {
    Canv,
    Webcam
  },
  methods: {
    gameBegin(){
      this.begin = true
      this.$refs.gameCanv.initPixiState()
      this.$refs.kid.predict()
    },
    dirctChange(id){
      this.$refs.gameCanv.changeDirct(id)
    }
  },
}
</script>

<style>
html,body{-moz-user-select: none; -khtml-user-select: none; user-select: none;}
body{
  background: rgb(42,42,42);
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #ffffff;
  margin-top: 60px;
}
button{
  margin: 10px !important;
}
</style>
