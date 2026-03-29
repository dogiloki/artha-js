import Util from "./Util.js";
import ArthaMessage from "../components/artha-message.js";
import XHR from "./XHR.js";

export default class TaskQueue{
    
    static defaults={
        title:"Petición en proceso...",
        close:false,
        message:null
    };
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
        if(this.queues.has(id)){
            alert("La petición ya está en proceso... Por favor espere.");
            return null;
        }
        if(title) options.title=title;
        const task=new TaskQueueItem(id,callback,options);
        task.onFinalize=(remove=false)=>{
            if(remove && !task.finalized){
                task.message_element.warning(task.options.title);
                return;
            }
            task.finalized=true;
            this.queues.delete(id);
            if(task.options.close || remove){
                setTimeout(()=>task.removeElement(),task.options.close?2500:0);
            }
        };
        this.queues.set(id,task);
        return task;
    }

}

class TaskQueueItem{

    constructor(id,callback,options){
        this.id=id;
        this.callback=callback;
        options={...TaskQueue.defaults,...options};
        const {
            title,
            close,
            message
        }=options;
        this.options=options;
        this.message_element=options.message instanceof ArthaMessage?options.message:document.querySelector("#"+options.message)??null;
        this.resolve_callback=null;
        this.reject_callback=null;
        this.finalized=false;
        this.status="pending";
        this.message_element?.warning(options.title);
        this.onFinalize=()=>{};

        // Promesa
        this.promise=new Promise((resolve,reject)=>{
            this._resolve=resolve;
            this._reject=reject;
        });

        // Ejecutar callback
        callback(this);

        // Resolver
        this.promise.then((data)=>{
            this.handleResponse(data);
        });

        // Error
        this.promise.catch((error)=>{
            this.message_element?.error(error?.message||String(error));
            this.status="error";
            this.reject_callback?.(error);
            this.onFinalize();
        });
    }

    // Procesar respuesta
    handleResponse(data){
        if(!data){
            this.message_element?.error("Error en la respuesta del servidor");
            this.status="error";
            this.onFinalize();
            return;
        }
        let response;
        try{
            response=XHR.defaults.transformResponse(data);
        }catch(err){
            response=data;
        }
        response.status??=Util.withinRange(data.status,200,299)?"success":"error";

        // Blob para descargar
        if(response instanceof Blob){
            this.status="success";
            this.resolve_callback?.(response);
            this.onFinalize();
            return;
        }
        let json;
        try{
            json=(typeof response==='string')?JSON.parse(response):response;
            if(!json || typeof json!=='object'){
                throw new Error("Respuesta inválida del servidor");
            }
        }catch(ex){
            this.message_element?.error(ex.message||String(ex));
            this.status="error";
            this.onFinalize();
            return;
        }
        // Obtener mensaje
        let message=null;
        if(json.errors && typeof json.errors==='object'){
            const values=Object.values(json.errors);
            if(values.length>0){
                const first=values[0];
                message=Array.isArray(first)?first[0]:first;
            }
        }
        message=message||json.message||"Operación completada";
        // Validar respuesta http
        if(Util.withinRange(data.status,200,299)){
            if(message){
                this.message_element?.show(message,json?.status??null);
            }else{
                this.message_element?.success("Operación completada");
            }
            this.status=json?.status||"success";
        }else{
            if(message){
                this.message_element?.show(message,json?.status??null);
            }else{
                this.message_element?.error("Error en la respuesta del servidor");
            }
            this.status=json?.status||"error";
            this.onFinalize();
            return;
        }
        this.resolve_callback?.(json);
        this.onFinalize();
    }

    // Resolver manualmente
    resolve(data,callback){
        this.resolve_callback=callback;
        this._resolve(data);
    }

    // Recahzar manualmente
    reject(error){
        this._reject(error);
    }

    removeElement(){

    }

}