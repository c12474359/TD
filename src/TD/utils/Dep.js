import { Utils } from "./strings";

export default class Dep{
    constructor(){
        if(Dep.instance){
            throw new Error(`This is a singlon.please use "getInstance" to get.`);
        }
        this.events = {}
    }
    static getInstance(){
        if(!Dep.instance){
            Dep.instance =  new Dep();
        }
        return Dep.instance;
    }
    /**
     * 添加事件
     * @param {String} event 事件名称
     * @param {function} fn 事件处理函数
     */
    on(event,fn){
        if(!!!this.events[event]){//如果不存在
            this.events[event] = [];
        }
        //检查是不是存在该事件
        const fns = this.events[event].filter(value=>{
            return value === fn;
        })
        if(fns.length>0){
            Utils.warn(`Dep::on->注册事件已经存在`);
            return;
        }
        // this.log.trace(`Dep::on->注册新事件[${event}]`);
        this.events[event].push(fn);
    }
    /**
     * 关闭事件
     * @param {*} event 事件名称 
     * @param {*} fn 事件处理函数
     */
    off(event,fn){
        if(!!!this.events[event]){
            Utils.warn(`Dep::off->事件[${event}]不存在`);
            return
        }
        if(!!!fn){
            Utils.warn(`Dep::off->事件[${event}]清空`);
            this.events[event] = [];
            delete this.events[event];
            return;
        }
        const pos = this.events[event].indexOf(fn);
        return this.events[event].splice(pos,1);
    }
    /**
     * 触发事件
     * @param {*} event 事件名称
     */
    emit(event){
        const args = [].slice.call(arguments,1);
        const fns = this.events[event];
        if(!!!fns){
            Utils.info(`Dep::emit->事件[${event}]不存在监听者`);
            return;
        }
        //this.log.info(`Dep::emit->事件[${event}]`,Dep.target);
        fns.forEach(fn => {
            fn.apply(Dep.target?Dep.target:this,args);
        });
    }
}
Dep.target = null;