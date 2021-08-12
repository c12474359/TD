import { Utils } from './utils/strings'
import { Loaders } from './utils/loader'
import { ModelNode } from './model/ModelNode'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GridHelper, Loader, Mesh, Object3D, Vector3 } from 'three'
import Dep from './utils/Dep'
import { TDGeometry } from './utils/constant'
import { CSS3DObject,CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer'
/**
 * 初始化参数配置
 */
export class TD{
  constructor(options){
    const webgl = Utils.webgl()
    this.options = {
      ele:null,//渲染容器
      webgl,//webgl渲染方式，默认自动，可以自定义
      render:{
      },
      src:null,
      scene:{//场景设置
        shadowMap:false,
        background:{//背景设置
          show:false,
          type:0,//0,默认，1增加地面纹理
          color:'#ffffff',
          width:0,
          height:0,
          widthSegments:20,
          heightSegments:20,
          receiveShadow:true
        },
        grid:{//地面网格
          type:1,//默认 1参数配置，2:helpgrid
          show:true,//是否显示网格，默认显示
          value:null,//helperGrid
          params:{//gird配置参数
            size:"auto",
            divisions:'auto',
            colorCenterLine:0x444444,
            colorGrid:0x888888
          }
        }
      },
      camera:{
        type:0,//0透视，1启用参数
        params:{
          fov:45,
          aspect:0,
          near:0,
          far:10000
        }
      },
      control:{
        autoRotate:false,//自动围绕目标旋转
        autoRotateSpeed:2.0,//旋转速度
        dampingFactor:0.0,//阻尼
        enableDamping:false,//是否启用阻尼
        enableKeys:true,//键盘控制
        enablePan:true,//启用摄像机平移
        enableRotate:true,//摄像机水平或者垂直旋转启用
        enableZoom:true,//是否用缩放
        keyPanSpeed:7.0,//键盘控制摄像机平移速度
        keys:{
          LEFT: 37, //left arrow
	        UP: 38, // up arrow
	        RIGHT: 39, // right arrow
	        BOTTOM: 40 // 
        },
        maxAzimuthAngle:Infinity,//水平旋转上线
        maxDistance:Infinity,//你能够将相机向外移动多少
        maxPolarAngle:Math.PI,//垂直旋转的角度的上限，范围是0到Math.PI，其默认值为Math.PI
        maxZoom:Infinity,//你能够将相机缩小多少( 仅适用于OrthographicCamera only )
        minAzimuthAngle:-Infinity,//水平旋转的角度的下限，范围是-Math.PI到Math.PI
        minDistance:0,//相机向内移动多少（仅适用于PerspectiveCamera）
        minPolarAngle:0,//能够垂直旋转的角度的下限，范围是0到Math.PI
        minZoom:0,//能够将相机放大多少( 仅适用于OrthographicCamera )
        mouseButtons:{
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.PAN
        },
        panSpeed:1,//位移速度
        rotateSpeed:1,//旋转速度
        zoomSpeed:1,//缩放速度
        screenSpacePanning:false,//摄像机平移方式
      },
      lights:[
        {
          type:0,
          name:"环境光",
          params:{
            color:0x404040,
            intensity:1
          }
        },
        {
          type:1,
          name:"半球光",
          params:{
            skyColor:0xffffff,
            groundColor:0x040404
          }
        },
        {
          type:2,
          name:"太阳光",
          params:{
            color:0xffffff,
            castShadow:true
          }
        }
      ]
    }
    if (options) {
      this.options = Utils.merger(this.options,options,true)
      Utils.info(this.options)
    }
    this.scale = 1
    this.lights = []
    this.root = new ModelNode({
      id:0,
      name:"root"
    })
    this.dep = Dep.getInstance()
    this._events = {}
    this.camera = this._createCamera()
    this._createScene()
  }
  _createScene(){
    const { container } = this
    if (!(container instanceof HTMLElement)){
      Utils.error("ele不是一个正确的HTMLElement，您可以使用默认app或者root。也可以传入[#id]或者[.className]来指定绘制的容器。")
      return
    }
    Utils.info("创建场景...")
    const { background,grid } = this.options.scene
    // container.appendChild(canvas)
    //创建场景
    this.scene = new THREE.Scene()
    // this.cssScene = new THREE.Scene()
    this._setBackGround(background)
    this._createGrid(grid)
    //创建光源
    this.addLights(this.options.lights)
    
    //创建渲染
    this._createRender()
    //是否加载模型
    if (this.options.src ) {
      Utils.info('创建模型初始化场景')
      this._loadModel(this.options.src).then(res => {
        const size = Utils.getSize(res)
        // 通过主模型来确定视角以及缩放
        const max = size[1]
        const min = size[0]
        let centerx = 0,centery = 0,disx=0,disy=0
        if(min && max) {
          centerx = (max.x + min.x)/2
          centery = (max.y + min.y)/2
          disx = max.x - min.x
          disy = max.y - min.y
        }
        const scale = Math.min(width/4/disx,height/4/disy)//放大比例
        res.scale.set(scale,scale,scale)
        res.translateX(-centerx*scale)
        res.translateY(-centery*scale + disy*scale/2)
        //调整主场景大小来适合画布
        res.castShadow = true
        res.children.forEach(ele => {
          ele.castShadow = shadowMap ? true : false
        })
        this.scene.add(res)
        this.root.model = res
        this._bindControl()
      }).catch(err => {
        const message = typeof err === "string" ? err : err.message
        Utils.error(message)
      })
      return
    } else {
      this.scene.add(this.root.model)
    }
    setTimeout(()=>{
      this._bindControl()
    },0)
  }
  _createRender(){
    //创建cssRander
    const {shadowMap,canvas,width,height,container} = this
    const ratio = window.devicePixelRatio || 1
    this.canvasElement = canvas
    const renderParams = Object.assign(this.options.render,{canvas})
    if (this.options.webgl === 2) {
      renderParams.context = canvas.getContext('webgl2', { alpha: false })
    }
    const glRenderer = new THREE.WebGLRenderer(renderParams)
    glRenderer.shadowMap.enabled = shadowMap ? true : false//渲染阴影
    glRenderer.shadowMap.needsUpdate = true
    glRenderer.setPixelRatio(window.devicePixelRatio)
    glRenderer.setSize(width,height)
    glRenderer.domElement.style.position = 'absolute'
    glRenderer.domElement.style.zIndex = 0
    glRenderer.domElement.style.top = 0
    const cssRenderer = new CSS3DRenderer()
    cssRenderer.setSize(width,height)
    cssRenderer.domElement.style.position = 'absolute'
    cssRenderer.domElement.style.top = 0
    cssRenderer.domElement.style.zIndex = 1
    container.appendChild(glRenderer.domElement)
    container.appendChild(cssRenderer.domElement)
    this.renderer = glRenderer
    this.cssRenderer = cssRenderer
  }
  _createCamera(){
    const {width,height} = this
    const {type,params} = this.options.camera
    let camera,aspect,fov,far,near
    switch(type){
      case 0: // 透视摄像头
        fov = params.fov ? Utils.toNumber(params.fov,50) : 50
        aspect = params.aspect ? Utils.toNumber(params.aspect,width / height) : width / height
        near = params.near ? Utils.toNumber(params.near,1) : 1
        far = params.far ? Utils.toNumber(params.far,10000) : 10000
        camera = new THREE.PerspectiveCamera(fov, aspect, near, far)
        const l = height/2/Math.sin(fov*Math.PI/180)
        const dis = l > far/2 ? far/2 : l
        camera.position.set(0, dis/2,dis)
        break
      case 1:
        break
    }
    Utils.info(`创建摄像机...type(${camera.type}),aspect(${aspect}),fov(${fov}),near(${near}),far(${far})`)
    return camera
  }
  _createGrid(options){
    const {type,show,params,value} = options
    if(!show) return
    Utils.info('添加地面...',options)
    const {width,scene} = this
    let grid
    switch(type){
      case 0:
        grid = new THREE.GridHelper()
        break
      case 1:
        let size = params.size === "auto" ? width : Utils.toNumber(params.size,width)
        let divisions = params.divisions === "auto" ? Utils.toNumber(params.divisions,20) : 20
        let colorCenterLine = params.colorCenterLine ? params.colorCenterLine : 0x444444
        let colorGrid = params.colorGrid ? params.colorGrid : 0xff0000
        grid = new THREE.GridHelper(size, divisions, colorCenterLine, colorGrid)
        break
      case 2:
        grid = params.value ? (params.value instanceof GridHelper ? params.value : Utils.warn("在Grid的【type=2】参数value类型不正确，应该是GridHelper类型的实例")) : Utils.warn("在Grid的【type=2】时未传入GridHelper的value")
        break
    }
    grid ? scene.add(grid) :undefined
  }
  _bindControl(){
    const {camera,renderer,cssRenderer} = this
    if(!camera) return
    if (cssRenderer){
      Utils.info('绑定控制器...')
      const controlOptions = this.options.control
      const controls = new OrbitControls(camera, cssRenderer.domElement)
      const controls2 = new OrbitControls(camera, renderer.domElement)
      const params = Object.entries(controlOptions)
      for(const [key,value] of params){
        controls[key] = value
      }
    }
    this.dep.emit('onLoad')
    this._render3D()
  }
  _setBackGround(background){
    const {scene} = this
    let {show,type,color,image,receiveShadow} = background
    if(!show) return
    Utils.info('设置背景...')
    let width = background.width ? Utils.toNumber(background.width,this.width) : this.width
    let height = background.height ? Utils.toNumber(background.height,this.height) : this.height
    // if(typeof color === "string") {
    //   scene.background = new THREE.Color(color)
    // } else if(color instanceof Array && color.length >= 3){
    //   scene.background = new THREE.Color(color[0],color[1],color[2])
    // }else if(color instanceof THREE.Color){
    //   scene.background = color
    // } else {
    //   Utils.warn("创建TD时传入的场景参数background在type=1时，颜色值必须是string、[r,g,b]或者THREE.Color中的一种!")
    // }
    let ground,material,geometry
    switch(type){
      case 0:
        console.log(width,height)
        geometry = new THREE.PlaneGeometry(width,height,20,20)
        material = new THREE.MeshStandardMaterial( {color: 'white'} )
        geometry.rotateX(-0.5 * Math.PI)
        ground = new THREE.Mesh(geometry,material)
        ground.name = "ground"
        ground.receiveShadow = true
        scene.add(ground)
        break;
      case 1:
        const ws = background.widthSegments ? background.widthSegments :20
        const hs = background.widthSegments ? background.widthSegments :20
        geometry = new THREE.PlaneGeometry(width,height,ws,hs)
        geometry.rotateX(-0.5 * Math.PI)
        if(!image || image instanceof HTMLCanvasElement) {
          Utils.info("添加默认地面纹理")
          image = this._getCanvas(ws,hs)
          const texture = new THREE.CanvasTexture(image)
          material = new THREE.MeshStandardMaterial( {map: texture} )
          ground = new THREE.Mesh(geometry,material)
          ground.name = "ground"
          ground.receiveShadow = true
          scene.add(ground)
        } else {
          switch(typeof image){
            case "string":
              const loader = new THREE.TextureLoader()
              loader.load(image,(texture) => {
                Utils.info(`加载背景图片成功!接受阴影（${receiveShadow}）`)
                material = new THREE.MeshStandardMaterial({map:texture})
                ground = new THREE.Mesh(geometry,material)
                ground.name = "ground"
                ground.receiveShadow = receiveShadow ? true : false
                scene.add(ground)
              },undefined,(err) => {
                Utils.error("加载背景图片失败，原因：",err.toString())
              })
              break
            default:
              Utils.warn("背景纹理image设置不正确，请取消或者设置成canvas或者图片地址。")
              break
          }
        }
        break
    }
  }
  _getCanvas(ws,hs){
      const colors = ["black","white"]
      const size = 20
      const imageCanvas = document.createElement("canvas");
      imageCanvas.width = size*ws;
      imageCanvas.height = size*hs;
      var ctx = imageCanvas.getContext("2d");
      let color
      for(let i=0;i<ws;i++){
        for(let j=0;j<hs;j++){
          if(j===0){
            color = colors[i%2]
          } else {
            color = colors.find(ele => ele !== color)
          }
          ctx.beginPath()
          ctx.fillStyle = color 
          ctx.rect(size*i,j*size,size,size);
          ctx.fill()
        }
      }
      return imageCanvas
  }
  _loadModel(src,type='auto'){
    Utils.info("加载主场景模型...")
    return new Promise((resolve,reject) => {
      if (type === "auto") type = Utils.getFileType(src)
      if (!type) {
        reject("输入的model参数中的src文件格式不识别，请确认是否正确。或者使用type参数指定格式类型。TD支持的文件格式包括:obj、stl")
      }
      const onProgress = ( xhr ) => {
        if ( xhr.lengthComputable ) {
          const percentComplete = xhr.loaded / xhr.total * 100;
          Utils.info( Math.round( percentComplete, 2 ) + '% downloaded' )
        }
			}
      const onError = () => {
        reject()
      }
      switch(type){
        case "obj":
          //首先加载物料
          Loaders.loadMtl(src.replace(/\.obj$/,'.mtl'),materials => {
            materials.preload()
            Loaders.loadObj(src,obj => {
              // 计算模型位置，处理obj->position 000 的问题
              this._updateMatrix(obj)
              resolve(obj)
            },onProgress,onError,materials)
          },onProgress,() => { // mtl加载失败，继续加载obj
            Loaders.loadObj(src,obj => {
              resolve(obj)
            },onProgress,onError)
          })
          break
        case 'max':
          Loaders.load3DM(src,res => {
            console.log(src)
          },onProgress,onError)
          break
        case 'fbx':
          Loaders.loadFbx(src,res=>{
            resolve(res)
          },onProgress,onError)
          break
        case 1:
          break
        case 2:
          break
      }
    })
  }
  _updateMatrix(value){
    const {type} = value
    if (type === 'Group'){
      value.children.forEach(ele => {
        this._updateMatrix(ele)
      })
      return
    }
    const {geometry} = value
    if(geometry && !geometry.boundingBox){
      geometry.computeBoundingBox()
      const centroid = new THREE.Vector3()
      centroid.addVectors( geometry.boundingBox.min, geometry.boundingBox.max )
      centroid.multiplyScalar( 0.5 )
      centroid.applyMatrix4(value.matrixWorld)
      value.geometry.center()
      value.position.set(centroid.x, centroid.y, centroid.z)
    }
  }
  _loadFont(src){
    return new Promise((resolve,reject) => {
      const loader = new THREE.FontLoader()
      loader.load(src,font => {
        resolve(font)
      },null,err=>{
        reject(err)
      })
    })
  }
  _render3D(){
    window.requestAnimationFrame(()=>{this._render3D()})
    const {scene,camera,renderer,cssRenderer} = this
    renderer.render(scene, camera)
    cssRenderer.render(scene, camera)
  }
  addLights(optionsArr){
    optionsArr.forEach(ele => {
      this.addLight(ele)
    })
  }
  addLight(options) {
    const {scene,width,height} = this
    if(!scene) {
      Utils.warn("添加灯光方法【addLight】必须在场景创建完成后！")
      return
    }
    const {type,params} = options
    Utils.info("添加默认灯光...",params)
    const name = options.name ? options.name : Utils.randomName()
    const idx = this.lights.findIndex(ele => ele.name === name)
    if (idx > -1) {
      Utils.warn("命名【${name}】的光源已经存在，请给光源换一个名字")
      return
    }
    let light,intensity,color,position
    switch(type){
      case 0://环境光
        intensity = params.intensity ? Utils.toNumber(params.intensity,1) : 1
        color = params.color ? Utils.toNumber(params.color,0x404040) : 0x404040
        light = new THREE.AmbientLight(color, intensity)
        break
      case 1:
        intensity = params.intensity ? Utils.toNumber(params.intensity,1) : 1
        const skyColor = params.skyColor ? Utils.toNumber(params.skyColor,0xffffff) : 0xffffff
        const groundColor = params.groundColor ? Utils.toNumber(params.groundColor,0xffffff) : 0xffffff
        position = params.position ? Utils.toPosition(params.position,[0,10,1]) : [0,10,1]
        light = new THREE.HemisphereLight(skyColor,groundColor,intensity)
        light.position.set(position[0], position[1], position[2])
        break
      case 2:
        intensity = params.intensity ? Utils.toNumber(params.intensity,1) : 1
        color = params.color ? Utils.toNumber(params.color,0xffffff) : 0xffffff
        position = params.position ? params.position : [-width/2,width/2,0]
        const castShadow = params.castShadow ? params.castShadow : false
        light = new THREE.DirectionalLight( color, intensity )
        light.castShadow = castShadow
        light.shadow.mapSize.width = width;  // default
        light.shadow.mapSize.height = height; // default
        light.shadow.camera.near = 0;    // default
        light.shadow.camera.far = 2*width
        light.shadow.camera.left = -width;
        light.shadow.camera.right = width;
        light.shadow.camera.top = height;
        light.shadow.camera.bottom = -height;;
        light.distance = 100
        light.position.set(position[0],position[1],position[2])
        break
      default:
        Utils.warn(`您要添加的光源类型【type=${type}】不正确，请检查。注：（0：环境光；1：半球光；2：点光源）`)
        break
    }
    if(light){
      scene.add(light) // 环境光对象添加到scene场景中
      this.lights.push({
        type,
        name,
        light
      })
      Utils.info(`添加光源【${name}】成功`)
      return light
    }
    return null
  }
  addModel(options){
    //参数分类
    const params = Utils.paramsClassify(options)
    return new Promise((resolve,reject) => {
      const geometryParams = params.geometry
      const materialParams = params.material
      const type = params.type || (Utils.getFileType(params.src) === 'json' ? TDGeometry.TEXT : TDGeometry.MODEL)
      const materialType = params.materialType || 'MeshBasic'
      let mesh,geometry,material
      switch(type){
        case TDGeometry.MODEL://默认,加载外部模型
          this._loadModel(params.src,params.fileType || 'auto').then(obj => {
            obj.name = params.name || obj.name
            resolve(obj)
          }).catch(err => {
            reject(err)
          })
          break
        case TDGeometry.TEXT:
          const { text } = geometryParams
          const src = params.src || 'fonts/gentilis_bold.typeface.json'
          this._loadFont(params.src).then(font => {
            geometryParams.font = font
            geometry = new THREE.TextBufferGeometry(text||'没有内容', geometryParams)
            material = new THREE[`${materialType}Material`](Object.assign({color:0x00ff00},materialParams))
            mesh = new THREE.Mesh(geometry,material)
            mesh.name = params.name || mesh.name
            resolve(mesh)
          }).catch(err => {
            const message = typeof err === "string" ? err : err.message
            Utils.error(message)
          })
          break
        case TDGeometry.CUBE://box
          const { width,height,depth,widthSegments,heightSegments,depthSegments} = geometryParams
          geometry = new THREE.BoxBufferGeometry(width||1,height||1,depth||1,widthSegments||1,heightSegments||1,depthSegments||1)
          material = new THREE[`${materialType}Material`](Object.assign({color:0x00ff00},materialParams))
          mesh = new THREE.Mesh(geometry,material)
          mesh.name = params.name || mesh.name
          resolve(mesh)
          break
        case TDGeometry.CIRCLE:
          const { radius,segments,thetaStart,thetaLength} = geometryParams
          geometry = new THREE.CircleBufferGeometry(radius||1,segments||8,thetaStart||0,thetaLength||2*Math.PI)
          material = new THREE[`${materialType}Material`](Object.assign({color:0x00ff00},materialParams))
          mesh = new THREE.Mesh(geometry,material)
          mesh.name = params.name || mesh.name
          resolve(mesh)
          break
      }
    })
  }
  addView(options){
    Utils.info('add webview')
    const {url,width,height} = options
    const iframe = document.createElement('iframe')
    iframe.width = width
    iframe.height = height
    iframe.style.backgroundColor = 'red'
    iframe.src = url
    const model = new CSS3DObject(iframe)
    model.position.set(0,0,-800)
    this.scene.add(model)
  }
  addPannel(options){
  }
  getByName(name){
    return this.root.getByName(name)
  }
  center(type){
    this.root.center(type)
  }
  add(value){
    return this.root.add(value)
  }
  on(type,fn){
    this.dep.on(type,fn)
  }
  get width(){
    const {container} = this
    return container ? container.clientWidth : 400
  }
  get height(){
    const {container} = this
    return container ? container.clientHeight : 300
  }
  get canvas(){
    if (this.canvasElement) return this.canvasElement
    const canvas = document.createElement('canvas')
    canvas.style.width = "100%"
    canvas.style.height = "100%"
    return canvas
  }
  get container(){
    const { ele } = this.options
    if (!!!ele) return document.querySelector('#app') || document.querySelector('#root')
    if (typeof ele === "string") return document.querySelector(ele)
    return ele
  }
}