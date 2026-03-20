import Config from "./Config.js";
import Util from "./Util.js";

export default class TaskQueue{
    
    static INSTNACE=null;

    static singleton(){
        if(!this.INSTNACE){
            this.INSTNACE=new TaskQueue();
        }
        return this.INSTNACE;
    }

    constructor(){
        this.queues=new Map();
    }

    // Crear una nueva tarea
    loadTask(id,title,callback,options={}){
        if(typeof options!=='object'){
            options={close:options};
        }
    }

}

class TaskQueueItem{

    constructor(id,title,callback,options){
        this.id=id;
        this.callback=callback;
        options={...Config.get("task_queue"),...options};
        const {
            title,
            close,
            message
        }=options;
        this.title=title;
        this.message_element=options.message instanceof HTMLElement?options.message:document.querySelector("#"+options.message);
        this.resolve_callback=null;
        this.reject_callback=null;
        this.finalize=false;
        this.status="pending";
        Util.modal(this.message_element,this.title,);
    }

}