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
            name:"success"
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
        this.dispatchEvent(new CustomEvent('init',{
            detail:this,
            bubbles:true
        }));
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