const DEFAULT_CONFIG={
    locale:"es-MX",
    currency:"MXN",
    money:{
        digits:2
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