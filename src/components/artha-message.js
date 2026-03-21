import Config from "../core/Config.js";
import Util from "../core/Util.js";

export default class ArthaMessage extends HTMLElement{

    static TYPE=Object.freeze({
        ERROR:{
            code:-1,
            name:"error"
        },
        INFO:{
            code:0,
            name:"info"
        },
        SUCCESS:{
            code:1,
            name:"suscess"
        },
        WARNING:{
            code:2,
            name:"warning"
        },
        
    });

    constructor(){
        super();
    }

    connectedCallback(){
        this.type=this.getAttribute("type")||"info";
        this.hidden();
    }

    error(message=null){
        this.show(message,ArthaMessage.TYPE.ERROR);
    }

    info(message=null){
        this.show(message,ArthaMessage.TYPE.INFO);
    }

    success(message=null){
        this.show(message,ArthaMessage.TYPE.SUCCESS);
    }

    warning(message=null){
        this.show(message,ArthaMessage.TYPE.WARNING);
    }

    show(message=null,type=null){
        if(type) this.setAttribute("type",(typeof type==="string"?type:type.name)||"info");
        if(message) this.innerHTML=message;
        Util.modal(this,true);
    }

    hidden(){
        Util.modal(this,false);
    }

}