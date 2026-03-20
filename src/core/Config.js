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
    }
};

export default class Config{

    static settings=structuredClone(DEFAULT_CONFIG);

    static set(options){
        this.settings={...this.settings,...options};
    }

    static get(path,def=null){
        return path.split(".").reduce((o,p)=>o?o[p]:def,this.settings);
    }

}