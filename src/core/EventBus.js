const EVENT_BUS=new EventTarget();

export default class EventBus{

    static debug=false;
    static listeners=new Map();
    static any_listeners=new Set();
    
    // Emitir evento
    static emit(name,data=null){
        if(this.debug){
            try{
                console.log(`[EventBus] emit -> ${name}`,structuredClone(data));
            }catch(ex){
                console.log(`[EventBus] emit -> ${name}`,data);
            }
        }
        this.any_listeners.forEach(cb=>{
            try{
                cb(name,data);
            }catch(ex){
                console.error(`[EventBus error] ${name}`,ex);
            }
        });
        EVENT_BUS.dispatchEvent(new CustomEvent(name,{detail:data}));
    }

    // Emitir y esperar promesa (async listeners)
    static emitAsync(name,data=null){
        this.any_listeners.forEach(cb=>{
            try{
                cb(name,data);
            }catch(ex){
                console.error(`[EventBus error] ${name}`,ex);
            }
        });
        const listeners=this.listeners.get(name)||[];
        const results=listeners.map(async({callback})=>{
            try{
                return await callback(data);
            }catch(ex){
                console.error(`[EventBus error] ${name}`,ex);
                return null;
            }
        });
        return Promise.all(results);
    }

    // Escuchar evento
    static on(name,callback){
        const handler=(evt)=>{
            callback(evt.detail);
        };
        EVENT_BUS.addEventListener(name,handler);
        if(!this.listeners.has(name)){
            this.listeners.set(name,[]);
        }
        this.listeners.get(name).push({callback,handler});
        return ()=>this.off(name,callback);
    }

    // Escucha una sola vez
    static once(name,callback){
        const handler=(evt)=>{
            callback(evt.detail);
            this.off(name,callback);
        };
        EVENT_BUS.addEventListener(name,handler,{once:true});
        // Guardar referencia
        if(!this.listeners.has(name)){
            this.listeners.set(name,[]);
        }
        this.listeners.get(name).push({callback,handler});
    }

    // Escuchar todos los eventos
    static onAny(callback){
        this.any_listeners.add(callback);
        return ()=>this.any_listeners.delete(callback);
    }

    // Remover listener manualmente
    static off(name,callback){
        if(!this.listeners.has(name)) return;
        const arr=this.listeners.get(name);
        const filtered=arr.filter(item=>{
            if(item.callback===callback){
                EVENT_BUS.removeEventListener(name,item.handler);
                return false;
            }
            return true;
        });
        if(filtered.length!==arr.length){
            this.listeners.set(name,filtered);
        }
        if(filtered.length===0){
            this.listeners.delete(name);
        }
    }

    // Limpiar todos los listeners de un evento
    static clean(name){
        if(!this.listeners.has(name)) return;
        const arr=this.listeners.get(name);
        arr.forEach(({handler})=>{
            EVENT_BUS.removeEventListener(name,handler);
        });
        this.listeners.delete(name);
    }

    // Limpiar todo
    static clearAll(){
        this.listeners.forEach((arr,name)=>{
            arr.forEach(({handler})=>{
                EVENT_BUS.removeEventListener(name,handler);
            });
        });
        this.listeners.clear();
        this.any_listeners.clear();
    }

}