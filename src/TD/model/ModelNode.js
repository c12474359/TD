import { TDMotion } from "../utils/constant"
import { Utils } from "../utils/strings"
import * as THREE from 'three'

export class ModelNode {
  constructor(options){
    this.options = {
      id:Utils.randomName(),
      parentName:undefined,
      model:new THREE.Group(),
      children:[]
    }
    this.params = {}
    this.animation = null
    this.motions = []
    if(options){
      this.options = Utils.merger(this.options,options)
      if(options.model){
        this.model = options.model
      }
    }
  }
  _render(){
    this.animation = window.requestAnimationFrame(()=>{this._render()})
    this.motions.filter(ele => !ele.over).forEach(ele => {
      let { manners, type,speed, startPos, pos, start, time,direction } = ele
      let mpos,aimPos
      const axisName = ['x','y','z']
      const speedFilter = speed.map((ele,index) => {return {name:axisName[index],index,speed:ele}}).filter(ele => ele.speed !== 0)
      switch(type){
        case TDMotion.ONECE:
          if (time > 0) { // 根据时间计算结束
            if(!start) ele.start = Date.now()
            if((Date.now() - ele.start) > time) {
              ele.over = true
              Utils.info(this.name + '-->' + manners + ' over')
            }
            this.model[manners+'X'](speed[0])
            this.model[manners+'Y'](speed[1])
            this.model[manners+'Z'](speed[2])
          } else { //时间不存在，根据pos计算结束为止
            if(manners === 'rotate'){
              mpos = this.model.rotation
            } else {
              mpos = this.model.position
            }
            aimPos = pos
            speedFilter.forEach(ele => {
            if (((mpos[ele.name] + speed[ele.index]) >= aimPos[ele.index] && speed[ele.index] > 0)
              || ((mpos[ele.name] + speed[ele.index]) <= aimPos[ele.index] && speed[ele.index] < 0))
              {
                mpos[ele.name] = aimPos[ele.index]
              } else if(speed[ele.index] !== 0) {
                this.model[manners+ele.name.toUpperCase()](speed[ele.index])
              }
            })
            if(speedFilter.every(ele => mpos[ele.name] === aimPos[ele.index])){
              Utils.info('isOver')
              ele.over = true
            }
          }
          break
        case TDMotion.ROUND:
          this.model[manners+'X'](speed[0])
          this.model[manners+'Y'](speed[1])
          this.model[manners+'Z'](speed[2])
          break
        case TDMotion.PINGPANG:
          if (!direction){
            aimPos = pos
          } else {
            aimPos = startPos
          }
          if(manners === 'rotate'){
            mpos = this.model.rotation
          } else {
            mpos = this.model.position
          }
          speedFilter.forEach(ele => {
            if (((mpos[ele.name] + speed[ele.index]) >= aimPos[ele.index] && speed[ele.index] > 0)
            || ((mpos[ele.name] + speed[ele.index]) <= aimPos[ele.index] && speed[ele.index] < 0))
            {
              mpos[ele.name] = aimPos[ele.index]
            } else if(speed[ele.index] !== 0) {
              this.model[manners+ele.name.toUpperCase()](speed[ele.index])
            }
          })
          if(speedFilter.every(ele => mpos[ele.name] === aimPos[ele.index])){
            ele.speed = ele.speed.map(ele => ele * -1)
            ele.direction = (direction+1)%2
          }
          break
      }
    })
  }
  stop(){
    if (this.animation) {
      window.cancelAnimationFrame(this.animation)
      this.animation = null
    }
  }
  /**
   * 
   * @param {*} value 
   * @returns 
   */
  set(key,value){
    this.params[key] = value
  }
  get(key){
    return this.params[key]
  }
  /**
   * 
   * @param {添加子模型} value 
   * @returns 返回模型节点
   */
  add(value){
    const node = new ModelNode({
      parentName:this.name,
      name:value.name||Utils.randomName(12,1),
      model:value
    })
    const idx = this.options.children.findIndex(ele => ele.name === value.name)
    if(idx > -1) {
      Utils.warn("已经存在命名【】的子模型，请修改模型name字段属性。")
      return null
    }
    this.options.children.push(node)
    this.model.add(value)
    return node
  }
  /**
   * 
   * @param {动画描述} options 
   */
  addAnimation(options){
    const speed = (options && options.speed) ? options.speed : options.pos && options.time ? options.pos.map(ele => ele / options.time) : [0.1,0.1,0.1]
    let type = options ? Utils.toNumber(options.type,TDMotion.ONECE) : TDMotion.ONECE
    const pos = options ? options.pos : undefined
    const time = options ? options.time : 0
    const manners = options ? options.manners : 'translate'
    const id = options.id || Utils.randomName(5,4)
    if (!options.type && !options.time && !options.pos) {
      type = TDMotion.ROUND
    }
    let startPos
    if(manners === 'rotate'){
      startPos = [this.quaternion.x,this.quaternion.y,this.quaternion.z]
    } else if(manners === 'translate'){
      startPos = [this.position.x,this.position.y,this.position.z]
    }
    const option = {
      id,
      manners,
      type,
      speed,
      pos,
      time,
      startPos,
      over:false,
      direction:0
    }
    const item = this.motions.find(ele => ele.id === id)
    if(item) {
      for(let key in option){
        if(key === 'id') continue
        item[key] = option[key]
      }
    } else {
      this.motions.push(option)
    }
    console.log("motion:", this.motions)
    if(!this.animation){
      this._render()
    }
    return option
  }
  deleteById(id){
    const index = this.motions.findIndex(ele => ele.id === id)
    if(index > -1) {
      this.motions.splice(index,1)
    }
    return index
  }
  /**
   * 
   * @param {旋转动画} options 
   */
  rotateTo(options){
    //换算度到弧度
    if(options.speed) options.speed = options.speed.map(ele => ele*Math.PI/180)
    if(options.pos) options.pos = options.pos.map(ele => ele*Math.PI/180)
    return this.addAnimation(Object.assign(options,{manners:'rotate'}))
  }
  rotate(x,y,z){
    this.rotateX(x)
    this.rotateY(y)
    this.rotateZ(z)
  }
  /**
   * 
   * @param {X轴旋转角度} value 
   */
  rotateX(value){
    this.model.rotateX(value*Math.PI/180)
  }
  /**
   * 
   * @param {Y轴旋转角度} value 
   */
  rotateY(value){
    this.model.rotateY(value*Math.PI/180)
  }
  /**
   * 
   * @param {Z轴旋转角度} value 
   */
  rotateZ(value){
    this.model.rotateZ(value*Math.PI/180)
  }
  /**
   * 
   * @param {平移动画参数配置} options 
   */
  translateTo(options) {
    //speed 速度，path 路径 Array[[x,y,z]]
    //计算出每个点的运动时间

    this.addAnimation(Object.assign(options,{manners:'translate'}))
  }
  translate(x,y,z){
    this.translateX(x)
    this.translateY(y)
    this.translateZ(z)
  }
  /**
   * 
   * @param {X轴平移距离} value 
   */
  translateX(value){
    this.model.translateX(value)
  }
  /**
   * 
   * @param {Y轴平移距离} value 
   */
  translateY(value){
    this.model.translateY(value)
  }
  /**
   * 
   * @param {Z轴平移距离} value 
   */
  translateZ(value){
    this.model.translateZ(value)
  }
  /**
   * 
   * @param {缩放参数} value 
   */
  scale(value){
    if(value instanceof Array) {
      this.model.scale.set(Utils.toNumber(value[0],1),Utils.toNumber(value[1],1),Utils.toNumber(value[2],1))
    } else {
      value = Utils.toNumber(value,1)
      this.model.scale.set(value,value,value)
    }
  }
  setCenterX(value){
    this.setCenter({x:value})
  }
  setCenterY(value){
    this.setCenter({y:value})
  }
  setCenterZ(value){
    this.setCenter({z:value})
  }
  setCenter(options){
    const {model,position} = this
    const { geometry} = model
    if (geometry) {
      const x = options.x||0
      const y = options.y||0
      const z = options.z||0
      const v3 = new THREE.Vector3(x,y,z)
      const m4 = new THREE.Matrix4()
      m4.makeTranslation(x,y,z)
      geometry.applyMatrix4(m4)
      ///geo变换以后，位置修改
      model.position.sub(v3)
    }
  }
    /**
   * 场景居中
   */
  center(type){
    const {model} = this
    let pos = model.position.clone()
    let size,min,max
    if(model.type === 'Mesh'){
      size = Utils.getSize(model)
      min = size[0].clone().add(pos)
      max = size[1].clone().add(pos)
    }
    let i = model.children.length,tmin,tmax
    while(i--){
      pos = model.children[i].position.clone()
      size = Utils.getSize(model.children[i])
      if (!min) {
        min = size[0].clone().add(pos)
        max = size[1].clone().add(pos)
        continue
      }
      tmin = size[0].clone().add(pos)
      tmax = size[1].clone().add(pos)
      min.x =  Math.min(tmin.x,min.x)
      min.y =  Math.min(tmin.y,min.y)
      min.z =  Math.min(tmin.z,min.z)
      max.x =  Math.max(tmax.x,max.x)
      max.y =  Math.max(tmax.y,max.y)
      max.z =  Math.max(tmax.z,max.z)
    }
    if(!type) type = 7
    if(type&1){
      Utils.info(model,min,max,type)
      this.position.setX(-(min.x + max.x)/2)
      Utils.info(model.position.clone())
    }
    if(type&2){
      this.position.setY(-(min.y + max.y)/2)
    }
    if(type&4){
      this.position.setZ(-(min.z + max.z)/2)
    }
    model.updateMatrixWorld(true)
  }
  getByName(name){
    return this.children.find(ele => ele.name === name)
  }
  get quaternion(){
    return this.model.quaternion
  }
  set quaternion(value){
    this.model.quaternion.set(value.x,value.y,value.z,value.w)
  }
  get position(){
    return this.model.position
  }
  set position(value){
    this.model.position.set(value.x,value.y,value.z)
  }
  get scale(){
    return this.model.scale
  }
  get rotation(){
    return this.model.rotation
  }
  set rotation(value){
    this.model.rotation.set(value.x,value.y,value.z)
  }
  /**
   * 模型节点Id
   */
  get id(){
    return this.options.id
  }
  /**
   * 设置模型节点名字
   */
  set name(value){
    this.options.name = value
  }
  /**
   * 获取模型节点名字
   */
  get name(){
    return this.options.name
  }
  get parentName(){
    return this.options.parentName
  }
  /**
   * 为节点设置模型
   */
  set model(value){
    this.options.model = value
    if(value.children.length){
      value.children.forEach(ele => {
        this.options.children.push(new ModelNode({
            parentName:this.name,
            name:ele.name||Utils.randomName(12,1),
            model:ele
          }))
      })
    }
  }
  /**
   * 获取模型
   */
  get model(){
    return this.options.model
  }
  /**
   * 获取子对象
   */
  get children(){
    return this.options.children
  }
}