<template>
  <div :class="['game', gameStarted?'gameBegin':'']">
    <div id='pixi' @click="reStart()"></div>
  </div>
</template>

<script>
import * as PIXI from 'pixi.js'
let app = new PIXI.Application({
        width: 512,
        height: 256,
        backgroundColor:0xffffff,
        antialias:true,
      });
import mainE from '@/assets/E.png'
import mainGO from '@/assets/GO.png'
import num0 from '@/assets/0.png'
import num1 from '@/assets/1.png'
import num2 from '@/assets/2.png'
import num3 from '@/assets/3.png'
import num4 from '@/assets/4.png'
let E = new PIXI.Texture.from(mainE)
let go = new PIXI.Texture.from(mainGO)
let num1s = new PIXI.Texture.from(num1)
let num2s = new PIXI.Texture.from(num2)
let num3s = new PIXI.Texture.from(num3)
let num4s = new PIXI.Texture.from(num4)
let num0s = new PIXI.Texture.from(num0)
export default {
  name: 'canv',
  data() {
    return {
      container: '',
      container1: '',
      isPlaying: false,
      cntNum:[],
      lastAngle: 0,
      pointDirct: 0,
      score: 0
    }
  },
  props:[
    'gameStarted'
  ],
  methods: {
    initPixiState() {
      this.cntNum = [num0s, num1s, num2s, num3s, num4s]
      // console.log(app);  
      document.querySelector('#pixi').appendChild(app.view)
      this.container = new PIXI.Container();
      this.container1 = new PIXI.Container()
      // container.anchor.set(0.5)
      this.container.x = app.screen.width / 2;
      this.container.y = app.screen.height / 2;
      app.stage.addChild(this.container)

      this.container1.x = app.screen.width / 10 * 9;
      this.container1.y = app.screen.height / 10 * 9;
      app.stage.addChild(this.container1)

      this.reStart()
    },
    // 游戏正式开始
    gameStart(){
        let i = 5
        this.appendEpic()
        let timer2 = setInterval(() => {
          i--
          
          let numPic = PIXI.Sprite.from(this.cntNum[i]);
          this.container1.removeChildren()
          numPic.anchor.set(0.5)
          numPic.width = 20
          numPic.height = 20
          this.container1.addChild(numPic)
          if(i==0) {
            clearInterval(timer2)
            // 判断当前E的方向与识别所指方向是否相同
            if(this.lastAngle == this.pointDirct&&this.score<=9){
              this.score++
              let style = new PIXI.TextStyle({
                fontFamily: "Arial",
                fontSize: 36,
                fill: "white",
                stroke: '#008e59',
                strokeThickness: 4,
                dropShadow: true,
                dropShadowColor: "#006e5f",
                dropShadowBlur: 4,
                dropShadowAngle: Math.PI / 6,
                dropShadowDistance: 3,
              });
              let loser = new PIXI.Text('Bingo!',style)
              loser.anchor.set(0.5)
              this.container.removeChildren()
              this.container1.removeChildren()
              this.container.addChild(loser)
              setTimeout(() => {
                this.gameStart()
              }, 1000);
            }else if(this.lastAngle == this.pointDirct&&this.score==10){
              this.youWin()
            }else{
              this.youLose()
            }
          }
          
        }, 1000);
    },
    // 添加随即方向随即大小的E
    appendEpic(){
      let container = this.container
      container.removeChildren()
      let Epic = PIXI.Sprite.from(E);
      let agl = Math.floor(Math.random()*10/3+1)
      let agl2 = Math.floor(Math.random()*10/3+1)
      while(agl == this.lastAngle){
        agl = Math.floor(Math.random()*10/3+1)
      }
      Epic.width = 200 * agl2 * 0.25
      Epic.height =280 * agl2 * 0.25
      Epic.anchor.set(0.5)
      
      Epic.rotation = Math.PI/2*agl
      container.addChild(Epic)
      console.log(Epic.rotation);
      this.lastAngle = agl
      console.log(agl);
    },
    changeDirct(dirct){
      if(dirct == 1){
        this.pointDirct = 4
      }else if((dirct == 2)){
        this.pointDirct = 1
      }else if((dirct == 3)){
        this.pointDirct = 2
      }else if((dirct == 0)){
        this.pointDirct = 3
      }
    },
    youLose(){
      this.container.removeChildren()
      this.container1.removeChildren()
      let style = new PIXI.TextStyle({
        fontFamily: "Arial",
        fontSize: 72,
        fill: "white",
        stroke: '#de7ab1',
        strokeThickness: 4,
        dropShadow: true,
        dropShadowColor: "#000000",
        dropShadowBlur: 4,
        dropShadowAngle: Math.PI / 6,
        dropShadowDistance: 3,
      });
      let loser = new PIXI.Text('You Failed!',style)
      loser.anchor.set(0.5)
      this.container.addChild(loser)
    },
    youWin(){
      this.container.removeChildren()
      this.container1.removeChildren()
      let style = new PIXI.TextStyle({
        fontFamily: "Arial",
        fontSize: 72,
        fill: "white",
        stroke: '#de7ab1',
        strokeThickness: 4,
        dropShadow: true,
        dropShadowColor: "#000000",
        dropShadowBlur: 4,
        dropShadowAngle: Math.PI / 6,
        dropShadowDistance: 3,
      });
      let winer = new PIXI.Text('You Win!',style)
      winer.anchor.set(0.5)
      this.container.addChild(winer)
    },
    reStart(){
      this.score = 0
      let i = 4
      let style = new PIXI.TextStyle({
        fontFamily: "Arial",
        fontSize: 108,
        fill: "white",
        stroke: '#de7ab1',
        strokeThickness: 4,
        dropShadow: true,
        dropShadowColor: "#000000",
        dropShadowBlur: 4,
        dropShadowAngle: Math.PI / 6,
        dropShadowDistance: 3,
      });
      // this.container.removeChildren()
      // this.container1.removeChildren()
      // 游戏开始倒计时
      let timer1 = setInterval(() => {
        if(i<4){
          this.container.removeChildren()
          let time = new PIXI.Text(i,style)
          time.anchor.set(0.5)
          this.container.addChild(time)
        }
        if(i == 0) {
          clearInterval(timer1)
          this.container.removeChildren()
          
          let gopic = PIXI.Sprite.from(go);
          gopic.anchor.set(0.5)
          this.container.addChild(gopic)
          setTimeout(() => {
            // 调用游戏开始程序
            this.gameStart()
          }, 1000);
        }
        i--
      }, 1000);
    }
  },
  mounted() {
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.game{
  width: 32rem;
  height: 0rem;
  margin: 0 auto;
  margin-bottom: 1.5rem;
  overflow: hidden;
  transition: all 0.5s ease-in-out;
}
.gameBegin{
  height: 16rem;
}
#pixi{
  width: 100%;
  height: 100%;
}
</style>
