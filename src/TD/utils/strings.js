import { WEBGL } from 'three/examples/jsm/WebGL.js'
const LEVEL = {
    INFO:4,
    WARN:2,
    ERROR:1
}
const baseParams = ['name','type','src','fileType']
const geometryParams = ['width','text','height','depth','widthSegments','heightSegments','depthSegments','font','size','curveSegments','bevelEnabled','bevelThickness','bevelSize','bevelSegments','radius','segments','thetaStart','thetaLength']
const materialParams = ['color','isLineBasicMaterial','linewidth','linecap','linejoin','dashSize','gapSize','isLineDashedMaterial','scale','alphaMap','aoMap','aoMapIntensity','combine','envMap','lightMap','lightMapIntensity','map','morphTargets','reflectivity','refractionRatio','skinning','specular','specularMap','wireframe','wireframeLinecap','wireframeLinejoin','wireframeLinewidth','depthPacking','displacementMap','displacementScale','displacementBias','fog','farDistance','nearDistance','referencePosition','emissive','emissiveMap','emissiveIntensity','bumpMap','bumpScale','matcap','morphNormals','normalMap','normalMapType','normalScale','shininess','clearcoat','roughness','clearcoatRoughness','roughnessMap','defines','metalness','metalnessMap','gradientMap','clipping','defaultAttributeValues','extensions','fragmentShader','index0AttributeName','flatShading','uniforms','vertexColors','vertexShader','transparent','rotation','sizeAttenuation']
export const Utils = {
  LEVEL:7,
  merger:(target,value,recurse=false) => {
    if(typeof target !== 'object' || typeof value !== 'object') {
      throw(new Error("您输入的target或者value不是一个对象！"))
      return null
    }
    if (recurse) {//递归
      const keys = Object.keys(value)
      let key
      for(let i=0;i<keys.length;i++){
        key = keys[i]
        const type = typeof value[key]
        switch(type){
          case 'number':
          case 'string':
          case 'boolean':
          case 'undefined':
            target[key] = value[key]
            break
          case 'object':
            if(value[key] !== null){
              if(target[key] === null) {
                target[key] = value[key]
              } else if(target[key] instanceof Array) {
                target[key] = value[key]
              } else if(target[key] instanceof Object){
                target[key] = Utils.merger(target[key],value[key],recurse)
              } else if(target[key] instanceof Function){
                target[key] = value[key] instanceof Function ? value[key] : target[key]
              }
            }
            break
        }
      }
    } else {
      target = Object.assign(target,value)
    }
    return target
  },
  webgl:() => {
    if (WEBGL.isWebGL2Available()) return 2
    if (WEBGL.isWebGLAvailable()) return 1
    return 0
  },
  getFileType:(value) => {
    const reg = /(?<=\.)\w+$/
    const result = value.match(reg)
    return result ? result[0].toLocaleLowerCase() : null
  },
  toNumber:(value,defaultValue) => {
    if (typeof value === "number") return value
    const reg = /^0/
    if (/^[1-9]\d+$/.test(value)) return parseInt(value)
    if (/^0\d+$/.test(value)) return parseInt(value,8)
    if (/^0b\d+$/.test(value)) return parseInt(value,2)
    if (/^0x\d+$/.test(value)) return parseInt(value,16)
    return defaultValue
  },
  toPosition:(value,defaultValue) => {
    if (value instanceof Array) {
      defaultValue[0] = value[0] ? Utils.toNumber(value[0],defaultValue[0]) : defaultValue[0]
      defaultValue[1] = value[1] ? Utils.toNumber(value[1],defaultValue[1]) : defaultValue[1]
      defaultValue[2] = value[2] ? Utils.toNumber(value[2],defaultValue[2]) : defaultValue[2]
    }
    return defaultValue
  },
  randomName:(len=6,num=3) => {
    const useStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    const strs = ['L']
    for(let i=0;i<num;i++){
      let str = "",rand
      for(let j=0;j<len;j++){
        rand = Math.floor(Math.random()*useStr.length)
        str+=useStr[rand]
      }
      strs.push(str)
    }
    return strs.join("-")
  },
  getSize:(obj) => { //获取模型的尺寸
    let box,min,max
    if(obj.type === "Mesh") { // 获取 size
      obj.geometry.computeBoundingBox()
      const box = obj.geometry.boundingBox
      min = box.min.clone()
      max = box.max.clone()
    }
    if(obj.children.length > 0) {
      let tmp,x,y,z
      for(let i=0;i<obj.children.length;i++){
        tmp = Utils.getSize(obj.children[i])
        if (!min) {
          min = tmp[0]
          max = tmp[1]
          continue
        }
        min.x =  Math.min(tmp[0].x,min.x)
        min.y =  Math.min(tmp[0].y,min.y)
        min.z =  Math.min(tmp[0].z,min.z)
        max.x =  Math.max(tmp[1].x,max.x)
        max.y =  Math.max(tmp[1].y,max.y)
        max.z =  Math.max(tmp[1].z,max.z)
      }
    }
    return [min,max]
  },
  trace:(...rest) => {
    if((Utils.LEVEL & LEVEL.TRACE) >> 3 === 1){
        console.trace(...rest)
    }
  },
  info:(...rest) => {
    if((Utils.LEVEL & LEVEL.INFO) >> 2 === 1){
        console.info(...rest)
    }
  },
  warn:(...rest) => {
    if((Utils.LEVEL & LEVEL.WARN) >> 1 === 1){
        console.warn(...rest)
    }
  },
  error:(...rest) => {
    if((Utils.LEVEL & LEVEL.ERROR) === 1){
        console.error(...rest)
    }
  },
  paramsClassify(options){
    const newOptions = {}
    const geometry = {}
    const material = {}
    const keys = Object.keys(options)
    keys.filter(key => geometryParams.includes(key)).forEach(key => {
      geometry[key] = options[key]
    })
    keys.filter(key => materialParams.includes(key)).forEach(key => {
      material[key] = options[key]
    })
    keys.filter(key => baseParams.includes(key)).forEach(key => {
      newOptions[key] = options[key]
    })
    return Object.assign(newOptions,{geometry,material})
  }
}