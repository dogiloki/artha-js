const EVENT_BUS=new EventTarget();

export default class EventBus{
    
    // Emitir evento
    static emit(name,data){
        EVENT_BUS.dispatchEvent(new CustomEvent(name,{detail:data}));
    }

    // Escuchar evento
    static on(name,callback){
        const handler=(evt)=>{
            callback(evt.detail);
        };
        EVENT_BUS.addEventListener(name,callback);
        return ()=>EVENT_BUS.removeEventListener(name,handler);
    }

    // Escucha una sola vez
    static once(name,callback){
        const handler=(evt)=>{
            callback(evt.detail);
            EVENT_BUS.removeEventListener(name,handler);
        };
        EVENT_BUS.addEventListener(name,callback);
    }

    // Remover listener manualmente
    static off(name,callback){
        EVENT_BUS.removeEventListener(name,callback);
    }

}