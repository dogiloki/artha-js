const DEFAULT_CONFIG={
    locale:"es-MX",
    currency:"MXN",
    money:{
        digits:2
    },
    xhr:{
        method:"GET",
        url:null,
        uri:"",
        headers:{},
        data:{},
        query:{},
        files:{},
        response_type:"json",
        with_credentials:true,
        timeout:0,
        retry:false,
        retry_delay:5000,
        onLoad:()=>{},
        onData:()=>{},
        onError:()=>{},
        onTimeout:()=>{},
        onProgress:()=>{},
        onAbort:()=>{},
        onAction:()=>{},
    },
    task_queue:{
        title:"Petición en proceso...",
        close:false,
        message:null
    },
    message:{
        error:{
            code:-1,
            class:'message-error'
        },
        info:{
            code:0,
            class:'message-info'
        },
        success:{
            code:1,
            class:'message-success'
        },
        warning:{
            code:2,
            class:'message-warning'
        }
    }
};

export default class Config{

    static SETTINGS={...DEFAULT_CONFIG};

    static set(options){
        this.SETTINGS={...this.SETTINGS,...options};
    }

    static get(path,def=null){
        return path.split(".").reduce((o,p)=>o?o[p]:def,this.SETTINGS);
    }

}